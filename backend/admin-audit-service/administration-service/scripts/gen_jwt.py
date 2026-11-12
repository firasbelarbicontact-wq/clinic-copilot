#!/usr/bin/env python3
"""Génère un JWT HS256 de test (sans dépendance externe).

Usage:
  python scripts/gen_jwt.py                 # ADMIN, secret de dev
  python scripts/gen_jwt.py --role PATIENT  # pour tester le 403
"""
import argparse, base64, hashlib, hmac, json, os, time, uuid

DEFAULT_SECRET = "CHANGE_ME_DEV_ONLY_jwt_secret_must_be_at_least_32_bytes_long"
ADMIN_ID = "11111111-1111-1111-1111-111111111111"

def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_token(sub=ADMIN_ID, role="ADMIN", secret=None, hours=24) -> str:
    secret = secret or os.environ.get("JWT_SECRET", DEFAULT_SECRET)
    uuid.UUID(sub)
    header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    now = int(time.time())
    payload = b64(json.dumps({"sub": sub, "role": role, "iat": now, "exp": now + hours * 3600}).encode())
    sig = b64(hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--sub", default=ADMIN_ID)
    p.add_argument("--role", default="ADMIN")
    p.add_argument("--hours", type=int, default=24)
    p.add_argument("--secret", default=None)
    a = p.parse_args()
    print(make_token(a.sub, a.role, a.secret, a.hours))
