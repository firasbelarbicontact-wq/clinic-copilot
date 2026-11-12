#!/usr/bin/env python3
"""Test de bout en bout du Medical Records Service (sur :8091) avec le mock d'audit.

Prérequis : python scripts\\mock_services.py actif, et le service démarré (docker compose up --build).
"""
import json, os, sys, urllib.request, urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_jwt import make_token

BASE = os.environ.get("RECORDS_URL", "http://localhost:8091")
MOCK = "http://127.0.0.1:9099"
D1 = "d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1"
D2 = "d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2"
P1 = "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"
P2 = "a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2"
ADM = "11111111-1111-1111-1111-111111111111"
T_D1, T_D2 = make_token(D1, "DOCTOR"), make_token(D2, "DOCTOR")
T_P1, T_P2 = make_token(P1, "PATIENT"), make_token(P2, "PATIENT")
T_ADMIN = make_token(ADM, "ADMIN")
SECRET_NOTE = "NOTE_SECRETE_XYZ"
results = []


def call(method, path, token=None, body=None, base=BASE):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def check(name, cond, detail=""):
    results.append(bool(cond))
    print(f"  [{'OK' if cond else 'KO'}] {name}" + ("" if cond else f"   -> {detail}"))


def events():
    st, data = call("GET", "/__events", base=MOCK)
    if st != 200 or not isinstance(data, list):
        raise RuntimeError(f"/__events inattendu (HTTP {st})")
    return data


def audits(since=0):
    out = []
    for e in events()[since:]:
        if e["service"] == "AUDIT":
            try:
                out.append(json.loads(e["body"]))
            except Exception:
                pass
    return out


def has(aud, action, result, actor=None):
    return any(a.get("action") == action and a.get("result") == result
               and (actor is None or a.get("actorId") == actor) for a in aud)


def main():
    print("Pre-verifications")
    try:
        st, body = call("GET", "/actuator/health")
    except Exception as e:
        print(f"  [KO] Service injoignable sur {BASE} : {e}\\n  -> lancez : docker compose up --build")
        sys.exit(2)
    check("Service UP", st == 200 and body and body.get("status") == "UP", (st, body))
    try:
        n0 = len(events())
    except Exception as e:
        print(f"  [KO] Mocks injoignables : {e}\\n  -> lancez : python scripts\\mock_services.py")
        sys.exit(2)

    print("\\nSecurite")
    check("Sans token -> 401", call("GET", f"/api/v1/patients/{P1}/consultations")[0] == 401)
    check("Admin : aucun acces clinique -> 403", call("GET", f"/api/v1/patients/{P1}/consultations", T_ADMIN)[0] == 403)

    print("\\nConsultations et notes")
    cons = {"patientId": P1, "consultedAt": "2026-11-08T10:00:00Z"}
    st, b = call("POST", "/api/v1/consultations", T_D1, cons)
    check("Medecin cree une consultation -> 201", st == 201 and b.get("doctorId") == D1, (st, b))
    cid = (b or {}).get("id")
    check("Patient ne peut pas creer -> 403", call("POST", "/api/v1/consultations", T_P1, cons)[0] == 403)
    check("Consultation invalide -> 400", call("POST", "/api/v1/consultations", T_D1, {"patientId": P1})[0] == 400)
    check("Patient lit sa consultation -> 200", call("GET", f"/api/v1/consultations/{cid}", T_P1)[0] == 200)
    check("Autre patient -> 403", call("GET", f"/api/v1/consultations/{cid}", T_P2)[0] == 403)
    check("Autre medecin -> 403", call("GET", f"/api/v1/consultations/{cid}", T_D2)[0] == 403)
    check("Consultation inconnue -> 404",
          call("GET", "/api/v1/consultations/00000000-0000-0000-0000-000000000001", T_D1)[0] == 404)

    st, b = call("POST", f"/api/v1/consultations/{cid}/notes", T_D1, {"content": SECRET_NOTE})
    check("Medecin auteur ajoute une note -> 201", st == 201 and b.get("content") == SECRET_NOTE, (st, b))
    check("Autre medecin ne peut pas ajouter de note -> 403",
          call("POST", f"/api/v1/consultations/{cid}/notes", T_D2, {"content": "x"})[0] == 403)
    check("Note vide -> 400", call("POST", f"/api/v1/consultations/{cid}/notes", T_D1, {"content": " "})[0] == 400)
    st, b = call("GET", f"/api/v1/consultations/{cid}/notes", T_P1)
    check("Patient lit les notes -> 200", st == 200 and len(b) == 1 and b[0]["content"] == SECRET_NOTE, (st, b))
    check("Autre patient ne lit pas les notes -> 403", call("GET", f"/api/v1/consultations/{cid}/notes", T_P2)[0] == 403)
    check("Medecin auteur lit les notes -> 200", call("GET", f"/api/v1/consultations/{cid}/notes", T_D1)[0] == 200)

    st, b = call("GET", f"/api/v1/patients/{P1}/consultations", T_P1)
    check("Patient liste ses consultations", st == 200 and len(b) >= 1, (st, b))
    check("Patient ne liste pas celles d'un autre -> 403", call("GET", f"/api/v1/patients/{P1}/consultations", T_P2)[0] == 403)
    st, b = call("GET", f"/api/v1/patients/{P1}/consultations", T_D2)
    check("Autre medecin : liste vide (filtree)", st == 200 and b == [], (st, b))

    print("\\nPlans de medication")
    plan_req = {"patientId": P1, "consultationId": cid, "title": "Traitement test", "startDate": "2026-11-08",
                "items": [{"name": "Medicament A", "dosage": "500 mg", "scheduleTimes": "08:00,20:00",
                           "instructions": "Apres repas"},
                          {"name": "Medicament B", "dosage": "1 comprime", "scheduleTimes": "09:00"}]}
    st, b = call("POST", "/api/v1/medication-plans", T_D1, plan_req)
    check("Medecin cree un plan -> 201", st == 201 and len(b.get("items", [])) == 2 and b.get("status") == "ACTIVE", (st, b))
    pid = (b or {}).get("id")
    item_id = ((b or {}).get("items") or [{}])[0].get("id")
    check("Patient ne peut pas creer de plan -> 403", call("POST", "/api/v1/medication-plans", T_P1, plan_req)[0] == 403)
    check("Plan sans medicament -> 400", call("POST", "/api/v1/medication-plans", T_D1, {**plan_req, "items": []})[0] == 400)
    bad_time = {**plan_req, "items": [{"name": "X", "scheduleTimes": "25:99"}]}
    check("Horaire invalide -> 400", call("POST", "/api/v1/medication-plans", T_D1, bad_time)[0] == 400)
    check("Patient lit son plan -> 200", call("GET", f"/api/v1/medication-plans/{pid}", T_P1)[0] == 200)
    check("Autre patient -> 403", call("GET", f"/api/v1/medication-plans/{pid}", T_P2)[0] == 403)
    st, b = call("GET", f"/api/v1/patients/{P1}/medication-plans", T_P1)
    check("Patient liste ses plans", st == 200 and len(b) >= 1, (st, b))
    check("Patient ne change pas le statut -> 403",
          call("PATCH", f"/api/v1/medication-plans/{pid}/status", T_P1, {"status": "COMPLETED"})[0] == 403)
    st, b = call("PATCH", f"/api/v1/medication-plans/{pid}/status", T_D1, {"status": "COMPLETED"})
    check("Medecin change le statut -> 200", st == 200 and b.get("status") == "COMPLETED", (st, b))
    check("Autre medecin ne change pas le statut -> 403",
          call("PATCH", f"/api/v1/medication-plans/{pid}/status", T_D2, {"status": "CANCELLED"})[0] == 403)

    print("\\nSuivi de prise")
    adh = {"scheduledAt": "2026-11-08T08:00:00Z", "status": "TAKEN"}
    st, b = call("POST", f"/api/v1/medication-items/{item_id}/adherence", T_P1, adh)
    check("Patient enregistre une prise -> 201", st == 201 and b.get("status") == "TAKEN" and b.get("takenAt"), (st, b))
    check("Autre patient -> 403", call("POST", f"/api/v1/medication-items/{item_id}/adherence", T_P2, adh)[0] == 403)
    check("Medecin ne peut pas enregistrer une prise -> 403",
          call("POST", f"/api/v1/medication-items/{item_id}/adherence", T_D1, adh)[0] == 403)
    st, b = call("GET", f"/api/v1/medication-items/{item_id}/adherence", T_D1)
    check("Medecin consulte le suivi -> 200", st == 200 and len(b) == 1, (st, b))

    print("\\nAudit")
    aud = audits(n0)
    check("CONSULTATION_CREATED / SUCCESS", has(aud, "CONSULTATION_CREATED", "SUCCESS", D1), aud)
    check("CLINICAL_NOTE_CREATED / SUCCESS", has(aud, "CLINICAL_NOTE_CREATED", "SUCCESS", D1))
    check("CLINICAL_NOTE_READ / SUCCESS (patient)", has(aud, "CLINICAL_NOTE_READ", "SUCCESS", P1))
    check("Refus tracé : CLINICAL_NOTE_CREATE / DENIED", has(aud, "CLINICAL_NOTE_CREATE", "DENIED", D2))
    check("Refus tracé : CLINICAL_NOTE_READ / DENIED", has(aud, "CLINICAL_NOTE_READ", "DENIED", P2))
    check("MEDICATION_PLAN_CREATED / SUCCESS", has(aud, "MEDICATION_PLAN_CREATED", "SUCCESS", D1))
    check("MEDICATION_ADHERENCE_LOGGED / SUCCESS", has(aud, "MEDICATION_ADHERENCE_LOGGED", "SUCCESS", P1))
    leak = any(SECRET_NOTE in e["body"] for e in events() if e["service"] == "AUDIT")
    check("Aucun contenu clinique dans l'audit", not leak)

    ok = sum(results)
    print(f"\\nRESULTAT : {ok}/{len(results)} OK")
    sys.exit(0 if ok == len(results) else 1)


if __name__ == "__main__":
    main()
