import sys
from pathlib import Path

# Add project root and backend directory to sys.path so tests can import app.*, data.*, and ml.*
root_dir = Path(__file__).resolve().parent.parent.parent
backend_dir = root_dir / "backend"

for path in [str(root_dir), str(backend_dir)]:
    if path not in sys.path:
        sys.path.insert(0, path)
