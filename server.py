import http.server
import socketserver
import json
import os
import sys
import hashlib
import string
import time
from datetime import datetime, timezone
from urllib.parse import urlparse, unquote

PORT = int(os.environ.get("PORT", 8085))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "users.json")

def load_users():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading users: {e}", file=sys.stderr)
        return []

def save_users(users):
    try:
        temp_file = DATA_FILE + ".tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        os.replace(temp_file, DATA_FILE)
        return True
    except Exception as e:
        print(f"Error saving users: {e}", file=sys.stderr)
        return False

def generate_5letter_password(name):
    # Deterministic 5-letter lowercase password from user name
    clean_name = name.strip().lower()
    hash_digest = hashlib.sha256((clean_name + "_orla_salt").encode("utf-8")).hexdigest()
    # Map first 5 byte pairs to ascii lowercase
    chars = string.ascii_lowercase
    pwd = "".join(chars[int(hash_digest[i*2:i*2+2], 16) % len(chars)] for i in range(5))
    return pwd

class OrlaRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Prevent caching for local development and API calls
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        if self.path.startswith("/api/"):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/users":
            users = load_users()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"users": users}).encode("utf-8"))
            return
        elif parsed.path == "/admin":
            # Redirect /admin to /admin.html
            self.send_response(302)
            self.send_header("Location", "/admin.html")
            self.end_headers()
            return
        
        # Standard static file serving
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            data = {}

        if parsed.path == "/api/login":
            entered_password = str(data.get("password", "")).strip().lower()
            users = load_users()
            matched_user = None
            for u in users:
                if u.get("password", "").lower() == entered_password:
                    matched_user = u
                    break
            
            if matched_user:
                now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                matched_user["last_login"] = now_iso
                save_users(users)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "name": matched_user.get("name")}).encode("utf-8"))
            else:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Invalid password"}).encode("utf-8"))
            return

        elif parsed.path == "/api/verify":
            entered_password = str(data.get("password", "")).strip().lower()
            users = load_users()
            matched = any(u.get("password", "").lower() == entered_password for u in users)
            if matched:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"valid": True}).encode("utf-8"))
            else:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"valid": False, "error": "User or password not found"}).encode("utf-8"))
            return

        elif parsed.path == "/api/users":
            name = str(data.get("name", "")).strip()
            if not name:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Name is required"}).encode("utf-8"))
                return

            password = generate_5letter_password(name)
            users = load_users()
            user_id = f"u_{int(time.time() * 1000)}"
            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            new_user = {
                "id": user_id,
                "name": name,
                "password": password,
                "created_at": now_iso,
                "last_login": None
            }
            users.append(new_user)
            save_users(users)

            self.send_response(201)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(new_user).encode("utf-8"))
            return

        elif parsed.path == "/api/delete-user":
            user_id = str(data.get("id", "")).strip()
            users = load_users()
            updated_users = [u for u in users if u.get("id") != user_id]
            if len(updated_users) < len(users):
                save_users(updated_users)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "User not found"}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/users/"):
            user_id = unquote(parsed.path[len("/api/users/"):])
            users = load_users()
            updated_users = [u for u in users if u.get("id") != user_id]
            if len(updated_users) < len(users):
                save_users(updated_users)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "User not found"}).encode("utf-8"))
            return
        
        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), OrlaRequestHandler) as httpd:
        print(f"Serving Orla Film at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
