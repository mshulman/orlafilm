#!/usr/bin/env python3
"""
test_images.py - Verify all image sources in HTML via curl

Extracts all image sources (img src, img srcset, source srcset) from HTML files,
resolves relative URLs against a local or remote server, and uses `curl` to verify
that every single image exists, is reachable, and returns HTTP 200 with content.

Usage:
    python3 test_images.py [options] [html_files...]

Examples:
    python3 test_images.py                     # Test images in index.html against http://localhost:8085
    python3 test_images.py --all               # Test all HTML files in repository
    python3 test_images.py --file admin.html   # Test a specific HTML file
    python3 test_images.py -u http://127.0.0.1:8000
    ./test_images.sh                           # Run via shell script
"""

import argparse
import http.server
import json
import os
import re
import socket
import socketserver
import subprocess
import sys
import threading
import time
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs, unquote

# ANSI Color Codes
COLOR_GREEN = "\033[92m"
COLOR_RED = "\033[91m"
COLOR_YELLOW = "\033[93m"
COLOR_CYAN = "\033[96m"
COLOR_BOLD = "\033[1m"
COLOR_DIM = "\033[2m"
COLOR_RESET = "\033[0m"


class ImgSourceExtractor(HTMLParser):
    """Parses HTML and extracts image sources with tag names and line numbers."""

    def __init__(self):
        super().__init__()
        self.sources = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        line, col = self.getpos()

        if tag == "img":
            if "src" in attr_dict and attr_dict["src"].strip():
                self.sources.append({
                    "tag": tag,
                    "attr": "src",
                    "raw": attr_dict["src"].strip(),
                    "line": line,
                    "alt": attr_dict.get("alt", "")
                })
            if "srcset" in attr_dict and attr_dict["srcset"].strip():
                for candidate in self._parse_srcset(attr_dict["srcset"]):
                    self.sources.append({
                        "tag": tag,
                        "attr": "srcset",
                        "raw": candidate,
                        "line": line,
                        "alt": attr_dict.get("alt", "")
                    })

        elif tag == "source":
            if "srcset" in attr_dict and attr_dict["srcset"].strip():
                for candidate in self._parse_srcset(attr_dict["srcset"]):
                    self.sources.append({
                        "tag": tag,
                        "attr": "srcset",
                        "raw": candidate,
                        "line": line,
                        "alt": ""
                    })
            if "src" in attr_dict and attr_dict["src"].strip():
                self.sources.append({
                    "tag": tag,
                    "attr": "src",
                    "raw": attr_dict["src"].strip(),
                    "line": line,
                    "alt": ""
                })

        elif tag == "link":
            rel = attr_dict.get("rel", "").lower()
            if rel in ["icon", "shortcut icon", "apple-touch-icon"] and "href" in attr_dict:
                self.sources.append({
                    "tag": tag,
                    "attr": f"rel={rel}",
                    "raw": attr_dict["href"].strip(),
                    "line": line,
                    "alt": ""
                })

    def _parse_srcset(self, srcset_value):
        """Extract URLs from a srcset string (stripping pixel density / width descriptors)."""
        urls = []
        entries = re.split(r",\s+", srcset_value.strip())
        for entry in entries:
            parts = entry.strip().split()
            if parts:
                urls.append(parts[0])
        return urls


def is_server_listening(host, port, timeout=0.5):
    """Check if a TCP socket is listening at host:port."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def find_free_port():
    """Find an available port on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


class EphemeralServer:
    """Spins up a temporary HTTP server serving the target directory in a background thread."""

    def __init__(self, directory, port=None):
        self.directory = directory
        self.port = port or find_free_port()
        self.httpd = None
        self.thread = None

    def start(self):
        directory = self.directory

        class Handler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=directory, **kwargs)

            def log_message(self, format, *args):
                pass  # Suppress request logging during test

        # Allow immediate reuse of address
        socketserver.TCPServer.allow_reuse_address = True
        self.httpd = socketserver.TCPServer(("127.0.0.1", self.port), Handler)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        time.sleep(0.1)

    def stop(self):
        if self.httpd:
            self.httpd.shutdown()
            self.httpd.server_close()
            self.httpd = None


def format_bytes(num_bytes):
    """Human-readable byte size."""
    try:
        n = float(num_bytes)
    except (ValueError, TypeError):
        return "0 B"
    for unit in ["B", "KB", "MB", "GB"]:
        if abs(n) < 1024.0:
            return f"{n:3.1f} {unit}" if unit != "B" else f"{int(n)} B"
        n /= 1024.0
    return f"{n:.1f} TB"


def curl_image(target_url, timeout=10):
    """
    Executes curl against target_url and parses:
    http_code, content_type, size_download, time_total.
    Returns (success, http_code, content_type, size_bytes, duration, error_msg).
    """
    # -4 forces IPv4 to eliminate 30s IPv6 timeouts on macOS networks without native IPv6 routing
    cmd = [
        "curl",
        "-4",
        "-s",
        "-S",
        "-L",
        "--max-time", str(timeout),
        "-o", "/dev/null",
        "-w", "%{http_code}|%{content_type}|%{size_download}|%{time_total}",
        target_url
    ]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 2)
        if proc.returncode != 0:
            err = proc.stderr.strip() or f"curl exited with code {proc.returncode}"
            return False, "ERR", "", 0, 0.0, err

        output = proc.stdout.strip()
        parts = output.split("|")
        if len(parts) >= 4:
            http_code = parts[0]
            content_type = parts[1]
            try:
                size_bytes = int(float(parts[2]))
            except ValueError:
                size_bytes = 0
            try:
                duration = float(parts[3])
            except ValueError:
                duration = 0.0

            success = (http_code == "200" and size_bytes > 0)
            err = "" if success else f"HTTP status {http_code}" + (" (empty body)" if size_bytes == 0 and http_code == "200" else "")
            return success, http_code, content_type, size_bytes, duration, err
        else:
            return False, "ERR", "", 0, 0.0, f"Unexpected curl output: {output}"

    except subprocess.TimeoutExpired:
        return False, "TIMEOUT", "", 0, float(timeout), f"curl timed out after {timeout}s"
    except Exception as ex:
        return False, "EXCEPT", "", 0, 0.0, str(ex)


def test_html_file(html_path, base_url, root_dir, timeout=10, use_colors=True, check_disk=True, quiet=False):
    """
    Tests all image sources in a single HTML file using curl.
    Returns list of result dicts.
    """
    if not os.path.exists(html_path):
        if not quiet:
            print(f"Error: File '{html_path}' not found.", file=sys.stderr)
        return []

    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    parser = ImgSourceExtractor()
    parser.feed(html_content)

    sources = parser.sources
    c_green = COLOR_GREEN if use_colors else ""
    c_red = COLOR_RED if use_colors else ""
    c_yellow = COLOR_YELLOW if use_colors else ""
    c_cyan = COLOR_CYAN if use_colors else ""
    c_bold = COLOR_BOLD if use_colors else ""
    c_dim = COLOR_DIM if use_colors else ""
    c_reset = COLOR_RESET if use_colors else ""

    if not quiet:
        print(f"\n{c_bold}Testing image sources in:{c_reset} {c_cyan}{html_path}{c_reset} ({len(sources)} found)")
        print(f"{c_dim}{'=' * 95}{c_reset}")
        header = f"{'#':<4} {'STATUS':<7} {'CODE':<5} {'SIZE':>9}  {'TIME':>7}  {'LINE':<6}  {'SOURCE'}"
        print(f"{c_bold}{header}{c_reset}")
        print(f"{c_dim}{'-' * 95}{c_reset}")

    results = []

    for idx, item in enumerate(sources, 1):
        raw_src = item["raw"]
        line = item["line"]
        tag = item["tag"]

        # Determine target curl URL
        if raw_src.startswith("http://") or raw_src.startswith("https://"):
            target_url = raw_src
            is_remote = True
        else:
            clean_rel = raw_src.lstrip("/")
            target_url = f"{base_url.rstrip('/')}/{clean_rel}"
            is_remote = False

        # Curl the image
        success, code, content_type, size, duration, err = curl_image(target_url, timeout=timeout)

        # Check local file existence on disk as well
        disk_exists = True
        disk_path = None
        if check_disk and not is_remote:
            rel_file = raw_src.split("?")[0].lstrip("/")
            disk_path = os.path.join(root_dir, rel_file)
            disk_exists = os.path.exists(disk_path)
            if not disk_exists:
                success = False
                err = f"Local file not found on disk: {disk_path}"

        if not quiet:
            status_str = f"{c_green}PASS{c_reset}" if success else f"{c_red}FAIL{c_reset}"
            code_str = f"{c_green}{code}{c_reset}" if code == "200" else f"{c_red}{code}{c_reset}"
            size_str = format_bytes(size)
            dur_str = f"{duration:.3f}s"

            print(f"[{idx:02d}] {status_str:<16} {code_str:<14} {size_str:>9}  {dur_str:>7}  {f'L:{line}':<6}  {raw_src}")
            if not success and err:
                print(f"     {c_red}↳ Error: {err}{c_reset} (URL: {target_url})")

        results.append({
            "index": idx,
            "html_file": html_path,
            "line": line,
            "tag": tag,
            "raw_src": raw_src,
            "target_url": target_url,
            "is_remote": is_remote,
            "success": success,
            "http_code": code,
            "content_type": content_type,
            "size_bytes": size,
            "duration_sec": duration,
            "error": err,
            "disk_exists": disk_exists
        })

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Verify all image sources in HTML via curl against a local or remote server."
    )
    parser.add_argument(
        "files",
        nargs="*",
        default=[],
        help="HTML file(s) to test (default: index.html)"
    )
    parser.add_argument(
        "--file", "-f",
        dest="single_file",
        help="Single HTML file to test"
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Test all .html files found in the directory"
    )
    parser.add_argument(
        "--base-url", "-u",
        default=os.environ.get("BASE_URL"),
        help="Base URL for relative image paths (default: http://localhost:<port>)"
    )
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=int(os.environ.get("PORT", 8085)),
        help="Port for local server (default: 8085)"
    )
    parser.add_argument(
        "--timeout", "-t",
        type=int,
        default=10,
        help="Timeout in seconds per curl request (default: 10s)"
    )
    parser.add_argument(
        "--no-auto-server",
        action="store_true",
        help="Do not start a temporary server if target server is not reachable"
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable ANSI colors in terminal output"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw test results in JSON format"
    )

    args = parser.parse_args()

    root_dir = os.path.dirname(os.path.abspath(__file__))
    use_colors = not args.no_color and sys.stdout.isatty() and not args.json

    # Determine HTML files to test
    html_files = []
    if args.all:
        for fname in sorted(os.listdir(root_dir)):
            if fname.endswith(".html") and os.path.isfile(os.path.join(root_dir, fname)):
                html_files.append(os.path.join(root_dir, fname))
    elif args.single_file:
        html_files.append(os.path.abspath(args.single_file))
    elif args.files:
        html_files = [os.path.abspath(f) for f in args.files]
    else:
        # Default to index.html
        default_index = os.path.join(root_dir, "index.html")
        if os.path.exists(default_index):
            html_files.append(default_index)
        else:
            print("Error: index.html not found in current directory.", file=sys.stderr)
            sys.exit(1)

    # Server configuration
    port = args.port
    base_url = args.base_url
    temp_server = None

    if not base_url:
        target_host = "127.0.0.1"
        is_running = is_server_listening(target_host, port)
        if is_running:
            base_url = f"http://localhost:{port}"
            if not args.json:
                print(f"Connected to active server at {base_url}")
        else:
            if args.no_auto_server:
                print(f"Error: No server listening at http://localhost:{port} and --no-auto-server specified.", file=sys.stderr)
                sys.exit(1)
            else:
                if not args.json:
                    print(f"No server on port {port}. Starting temporary server for tests...")
                temp_server = EphemeralServer(root_dir)
                temp_server.start()
                base_url = f"http://127.0.0.1:{temp_server.port}"
                if not args.json:
                    print(f"Temporary server active at {base_url}")

    all_results = []
    start_time = time.time()

    try:
        for html_file in html_files:
            rel_name = os.path.relpath(html_file, root_dir)
            file_results = test_html_file(
                html_file,
                base_url=base_url,
                root_dir=root_dir,
                timeout=args.timeout,
                use_colors=use_colors,
                check_disk=True,
                quiet=args.json
            )
            all_results.extend(file_results)
    finally:
        if temp_server:
            temp_server.stop()

    total_duration = time.time() - start_time
    total_count = len(all_results)
    passed_count = sum(1 for r in all_results if r["success"])
    failed_count = total_count - passed_count

    c_green = COLOR_GREEN if use_colors else ""
    c_red = COLOR_RED if use_colors else ""
    c_cyan = COLOR_CYAN if use_colors else ""
    c_bold = COLOR_BOLD if use_colors else ""
    c_dim = COLOR_DIM if use_colors else ""
    c_reset = COLOR_RESET if use_colors else ""

    if args.json:
        summary_payload = {
            "total_images": total_count,
            "passed": passed_count,
            "failed": failed_count,
            "duration_seconds": round(total_duration, 3),
            "base_url": base_url,
            "results": all_results
        }
        print(json.dumps(summary_payload, indent=2))
    else:
        print(f"\n{c_dim}{'=' * 95}{c_reset}")
        print(f"{c_bold}TEST SUMMARY:{c_reset}")
        print(f"  • Files Checked:     {len(html_files)}")
        print(f"  • Total Images:      {total_count}")
        print(f"  • Passed:            {c_green}{passed_count}{c_reset}")
        print(f"  • Failed:            {c_red if failed_count > 0 else c_green}{failed_count}{c_reset}")
        print(f"  • Duration:          {total_duration:.2f}s")
        print(f"  • Base Server:       {base_url}")
        print(f"{c_dim}{'=' * 95}{c_reset}")

        if failed_count == 0:
            print(f"{c_green}{c_bold}✓ ALL {total_count} IMAGES VERIFIED AND REACHABLE VIA CURL!{c_reset}\n")
        else:
            print(f"{c_red}{c_bold}✗ {failed_count} IMAGE(S) FAILED CURL VERIFICATION.{c_reset}\n")

    sys.exit(0 if failed_count == 0 else 1)


if __name__ == "__main__":
    main()
