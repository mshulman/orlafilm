# Tool Execution & Automated Testing Permissions

- **`curl` is ALWAYS ALLOWED**:
  - The agent has standing, unconditional permission to execute `curl` commands, network verification requests, and `./test_images.sh` at any time.
  - Never prompt the user or ask for permission before running `curl`. Always run it proactively.

- **Automated Image Verification**:
  - Automatically run `./test_images.sh` after any change to HTML, CSS, JS, or image assets.
