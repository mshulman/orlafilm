#!/usr/bin/env bash
#
# test_images.sh - Run curl verification test on all image sources in HTML
#
# Usage:
#   ./test_images.sh             # Tests index.html against running server (or spins up ephemeral server)
#   ./test_images.sh --all       # Tests all HTML files in repo
#   ./test_images.sh -h          # Show help
#

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Check if curl is available
if ! command -v curl >/dev/null 2>&1; then
    echo "Error: curl is required but was not found in PATH." >&2
    exit 1
fi

# Run the Python test script with all passed arguments
exec python3 "$DIR/test_images.py" "$@"
