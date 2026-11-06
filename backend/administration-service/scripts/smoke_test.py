#!/usr/bin/env python3
"""Test automatique de bout en bout (service sur :8087 + mocks lancés).

Usage : python scripts/smoke_test.py
Prérequis : python scripts/mock_services.py actif, et le service démarré (docker compose up).
"""
import json, os, sys, urllib.request, urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_jwt import make_token, ADMIN_ID

BASE = os.environ.get("ADMIN_URL", "http://localhost:8087")
MOCK = "http://127.0.0.1:9099"
API_KEY = os.environ.get("INTERNAL_API_KEY", "CHANGE_ME_DEV_ONLY_internal_api_key")
ADMIN = make_token()
PATIENT = make_token(role="PATIENT")
USER_OK = "22222222-2222-2222-2222-222222222222"
DOC_OK = "33333333-3333-3333-3333-333333333333"
USER_404 = "00000000-0000-0000-0000-000000000001"
USER_500 = "99999999-0000-0000-0000-000000000001"

results = []

def call(method, path, token=None, key=None, body=None, base=BASE):
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    if key: headers["X-Internal-Api-Key"] = key
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, raw

def check(name, cond, detail=""):
    results.append(bool(cond))
    print(f"  [{'OK' if cond else 'KO'}] {name}" + ("" if cond else f"   -> {detail}"))

def events():
    st, data = call("GET", "/__events", base=MOCK)
    if st != 200 or not isinstance(data, list):
        raise RuntimeError(f"/__events inattendu (HTTP {st}) : {str(data)[:200]}")
    return data

def audit_body(ev):
    return json.loads(ev["body"])

def main():
    print("Pré-vérifications")
    try:
        st, body = call("GET", "/actuator/health")
    except Exception as e:
        print(f"  [KO] Service injoignable sur {BASE} : {e}\n  -> lancez : docker compose up --build"); sys.exit(2)
    check("Service UP (/actuator/health)", st == 200 and body and body.get("status") == "UP", (st, body))
    try:
        events()
    except Exception as e:
        print(f"  [KO] Mocks injoignables : {e}\n  -> lancez : python scripts\\mock_services.py"); sys.exit(2)

    print("\nSécurité")
    check("Sans token -> 401", call("GET", "/api/v1/configurations")[0] == 401)
    check("Token PATIENT -> 403", call("GET", "/api/v1/configurations", token=PATIENT)[0] == 403)

    print("\nConfigurations (CRUD)")
    path = "/api/v1/configurations/smoke.test"
    st, b = call("PUT", path, ADMIN, body={"value": "v1", "description": "test"})
    check("PUT cree -> 200", st == 200 and b and b.get("value") == "v1", (st, b))
    st, b = call("PUT", path, ADMIN, body={"value": "v2"})
    check("PUT modifie -> 200, updatedBy = acteur", st == 200 and b.get("value") == "v2" and b.get("updatedBy") == ADMIN_ID, (st, b))
    st, b = call("GET", path, ADMIN)
    check("GET par cle -> 200", st == 200 and b.get("value") == "v2", (st, b))
    st, b = call("GET", "/api/v1/configurations", ADMIN)
    check("GET liste contient la cle", st == 200 and any(c["key"] == "smoke.test" for c in b), (st, b))
    check("DELETE -> 204", call("DELETE", path, ADMIN)[0] == 204)
    check("GET apres suppression -> 404", call("GET", path, ADMIN)[0] == 404)

    print("\nStatistiques")
    snap = {"metricType": "TOTAL_USERS", "periodStart": "2026-11-01T00:00:00Z",
            "periodEnd": "2026-11-07T23:59:59Z", "value": 128}
    check("POST avec cle API -> 201", call("POST", "/api/v1/dashboard/snapshots", key=API_KEY, body=snap)[0] == 201)
    check("POST avec JWT admin -> 201", call("POST", "/api/v1/dashboard/snapshots", ADMIN, body={**snap, "metricType": "ACTIVE_USERS"})[0] == 201)
    check("POST periode inversee -> 400", call("POST", "/api/v1/dashboard/snapshots", ADMIN,
          body={**snap, "periodStart": "2026-12-01T00:00:00Z"})[0] == 400)
    st, b = call("GET", "/api/v1/dashboard/snapshots?metricType=TOTAL_USERS", ADMIN)
    check("GET filtre metricType", st == 200 and b["totalElements"] >= 1 and all(x["metricType"] == "TOTAL_USERS" for x in b["content"]), (st, b))
    st, b = call("GET", "/api/v1/dashboard/snapshots?page=0&size=1", ADMIN)
    check("GET pagination (size=1)", st == 200 and len(b["content"]) == 1 and b["totalElements"] >= 2, (st, b))
    check("GET avec cle API seule -> 403", call("GET", "/api/v1/dashboard/snapshots", key=API_KEY)[0] == 403)

    print("\nActions admin + audit")
    n = len(events())
    st, b = call("PATCH", f"/api/v1/admin/users/{USER_OK}/status", ADMIN, body={"status": "DISABLED"})
    ev = events()[n:]
    check("Desactiver compte -> 200", st == 200 and b.get("action") == "ACCOUNT_STATUS_CHANGED", (st, b))
    check("Identity appele PUIS audit (ordre)", len(ev) == 2 and ev[0]["service"] == "IDENTITY" and ev[1]["service"] == "AUDIT", ev)
    if len(ev) == 2:
        a = audit_body(ev[1])
        check("Identity recoit la cle API interne", ev[0]["api_key"] == API_KEY)
        check("Audit SUCCESS, ADMIN, bon acteur, bonne ressource",
              a["result"] == "SUCCESS" and a["actorRole"] == "ADMIN" and a["actorId"] == ADMIN_ID
              and a["resourceType"] == "USER" and a["resourceId"] == USER_OK and a["action"] == "ACCOUNT_STATUS_CHANGED", a)

    n = len(events())
    st, _ = call("PATCH", f"/api/v1/admin/doctors/{DOC_OK}/verification", ADMIN, body={"status": "VERIFIED"})
    ev = events()[n:]
    check("Valider medecin -> 200", st == 200)
    check("Audit DOCTOR_VERIFIED / DOCTOR_PROFILE / SUCCESS", len(ev) == 2 and ev[1]["service"] == "AUDIT" and
          audit_body(ev[1])["action"] == "DOCTOR_VERIFIED" and audit_body(ev[1])["resourceType"] == "DOCTOR_PROFILE"
          and audit_body(ev[1])["result"] == "SUCCESS", ev)

    n = len(events())
    st, _ = call("PATCH", f"/api/v1/admin/doctors/{DOC_OK}/verification", ADMIN, body={"status": "REJECTED", "reason": "Diplome illisible"})
    ev = events()[n:]
    check("Refuser medecin -> 200", st == 200)
    check("Motif transmis au Directory", len(ev) == 2 and "illisible" in ev[0]["body"], ev)
    check("Motif ABSENT de l'audit + action DOCTOR_REJECTED", len(ev) == 2 and "illisible" not in ev[1]["body"]
          and audit_body(ev[1])["action"] == "DOCTOR_REJECTED", ev)

    print("\nCas d'echec")
    n = len(events())
    st, _ = call("PATCH", f"/api/v1/admin/users/{USER_404}/status", ADMIN, body={"status": "DISABLED"})
    ev = events()[n:]
    check("Utilisateur inconnu en amont -> 404", st == 404, st)
    check("Audit FAILURE enregistre", len(ev) == 2 and audit_body(ev[1])["result"] == "FAILURE", ev)
    n = len(events())
    st, _ = call("PATCH", f"/api/v1/admin/users/{USER_500}/status", ADMIN, body={"status": "DISABLED"})
    ev = events()[n:]
    check("Panne du service amont -> 502", st == 502, st)
    check("Audit FAILURE enregistre", len(ev) == 2 and audit_body(ev[1])["result"] == "FAILURE", ev)
    check("Statut invalide -> 400", call("PATCH", f"/api/v1/admin/users/{USER_OK}/status", ADMIN, body={"status": "BANANA"})[0] == 400)
    check("UUID invalide -> 400", call("PATCH", "/api/v1/admin/users/abc/status", ADMIN, body={"status": "ACTIVE"})[0] == 400)

    ok = sum(results)
    print(f"\nRESULTAT : {ok}/{len(results)} OK")
    sys.exit(0 if ok == len(results) else 1)

if __name__ == "__main__":
    main()
