#!/usr/bin/env python3
"""Simule Identity (8081), Doctor Directory (8083) et Audit (8086).

Affiche chaque requête reçue et les mémorise (consultables via GET /__events sur n'importe quel port).
Comportement selon l'UUID de la ressource dans l'URL :
  - commence par 00000000 -> 404 (ressource inconnue)
  - commence par 99999999 -> 500 (panne du service)
  - sinon                 -> 200 (201 pour l'audit)
"""
import json, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

SERVICES = {8081: "IDENTITY", 8083: "DOCTOR-DIRECTORY", 8086: "AUDIT", 9099: "CONTROL"}
EVENTS = []
LOCK = threading.Lock()

def make_handler(name):
    class H(BaseHTTPRequestHandler):
        def _send(self, status, payload):
            data = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _read_body(self):
            if "chunked" in (self.headers.get("Transfer-Encoding") or "").lower():
                data = b""
                while True:
                    size = int(self.rfile.readline().strip().split(b";")[0] or b"0", 16)
                    if size == 0:
                        self.rfile.readline()
                        break
                    data += self.rfile.read(size)
                    self.rfile.readline()
                return data.decode()
            length = int(self.headers.get("Content-Length") or 0)
            return self.rfile.read(length).decode() if length else ""

        def _handle(self):
            if self.command == "GET" and self.path == "/__events":
                with LOCK:
                    return self._send(200, list(EVENTS))
            body = self._read_body()
            key = self.headers.get("X-Internal-Api-Key")
            with LOCK:
                EVENTS.append({"service": name, "method": self.command, "path": self.path,
                               "api_key": key, "body": body})
            print(f"[{name}] {self.command} {self.path} | key={key!r} | body={body}", flush=True)
            status = 201 if name == "AUDIT" else 200
            parts = self.path.split("/")
            if any(p.startswith("00000000") for p in parts):
                status = 404
            elif any(p.startswith("99999999") for p in parts):
                status = 500
            self._send(status, {"mock": name, "status": status})
        do_POST = do_PATCH = do_PUT = do_GET = _handle
        def log_message(self, *args):
            pass
    return H

if __name__ == "__main__":
    for port, name in SERVICES.items():
        s = ThreadingHTTPServer(("0.0.0.0", port), make_handler(name))
        threading.Thread(target=s.serve_forever, daemon=True).start()
        print(f"Mock {name} sur http://localhost:{port}")
    print("Ctrl+C pour arrêter.")
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        pass