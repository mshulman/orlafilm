#!/usr/bin/env python3
"""
tests/test_images_curl.py - Automated test suite for HTML image sources using curl.

Inherits from unittest.TestCase. Can be run via:
    python3 -m unittest tests/test_images_curl.py
    python3 tests/test_images_curl.py
"""

import os
import sys
import unittest

# Add project root to sys.path to import test_images module
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from test_images import (
    ImgSourceExtractor,
    curl_image,
    is_server_listening,
    EphemeralServer
)


class TestImageSourcesCurl(unittest.TestCase):
    """Test suite verifying all image sources in HTML files exist and return 200 via curl."""

    @classmethod
    def setUpClass(cls):
        cls.root_dir = ROOT_DIR
        cls.port = int(os.environ.get("PORT", 8085))
        cls.temp_server = None

        if is_server_listening("127.0.0.1", cls.port):
            cls.base_url = f"http://localhost:{cls.port}"
        else:
            cls.temp_server = EphemeralServer(cls.root_dir)
            cls.temp_server.start()
            cls.base_url = f"http://127.0.0.1:{cls.temp_server.port}"

    @classmethod
    def tearDownClass(cls):
        if cls.temp_server:
            cls.temp_server.stop()

    def _test_images_in_html(self, html_filename):
        html_path = os.path.join(self.root_dir, html_filename)
        self.assertTrue(os.path.exists(html_path), f"HTML file does not exist: {html_filename}")

        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()

        parser = ImgSourceExtractor()
        parser.feed(content)

        self.assertGreater(len(parser.sources), 0, f"No image sources found in {html_filename}")

        failed_images = []
        for item in parser.sources:
            raw_src = item["raw"]
            line = item["line"]

            if raw_src.startswith("http://") or raw_src.startswith("https://"):
                target_url = raw_src
            else:
                target_url = f"{self.base_url}/{raw_src.lstrip('/')}"

            success, code, ctype, size, dur, err = curl_image(target_url, timeout=10)

            if not success or code != "200" or size <= 0:
                failed_images.append({
                    "src": raw_src,
                    "line": line,
                    "code": code,
                    "size": size,
                    "url": target_url,
                    "error": err
                })

        if failed_images:
            failure_msg = f"\n{len(failed_images)} images failed verification in {html_filename}:\n"
            for f in failed_images:
                failure_msg += f"  - Line {f['line']}: {f['src']} -> HTTP {f['code']} ({f['error']})\n"
            self.fail(failure_msg)

    def test_index_html_images(self):
        """Verify all 35 images referenced in index.html return HTTP 200 via curl."""
        self._test_images_in_html("index.html")

    def test_preview_options_images(self):
        """Verify all images referenced in preview_options.html return HTTP 200 via curl."""
        self._test_images_in_html("preview_options.html")


if __name__ == "__main__":
    unittest.main()
