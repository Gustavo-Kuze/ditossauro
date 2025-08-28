#!/usr/bin/env python3
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.check_call(cmd)


def main() -> int:
    # Setup venv and install backend deps
    venv_dir = ROOT / ".venv"
    if not venv_dir.exists():
        run([sys.executable, "-m", "venv", str(venv_dir)])
    if sys.platform.startswith("win"):
        pip = str(venv_dir / "Scripts" / "pip")
    else:
        pip = str(venv_dir / "bin" / "pip")
    run([pip, "install", "-r", str(ROOT / "backend" / "requirements.txt")])

    # Install frontend deps
    run(["npm", "install", "--prefix", str(ROOT / "frontend")])

    # Build tauri
    run(["npm", "run", "tauri:build", "--prefix", str(ROOT)])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

