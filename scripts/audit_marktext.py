"""Run the required MarkText parity evidence bundle with DohmBoy64Bit/repomixr."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


REPO_URL = "https://github.com/DohmBoy64Bit/repomixr"


def run(command: list[str], cwd: Path | None = None) -> None:
    """Run a subprocess and exit with its status if it fails."""
    completed = subprocess.run(command, cwd=cwd, check=False)
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


def main() -> None:
    """Ensure repomixr exists in a temp tools directory, then run the audit."""
    workspace = Path(__file__).resolve().parents[1]
    temp_root = Path(os.environ.get("TEMP") or os.environ.get("TMP") or workspace / ".cache")
    tool_root = temp_root / "markforge-tools"
    repomixr_dir = tool_root / "repomixr"
    config = workspace / "docs" / "research" / "repomixr" / "marktext-repos.json"

    tool_root.mkdir(parents=True, exist_ok=True)

    if (repomixr_dir / ".git").exists():
        run(["git", "-C", str(repomixr_dir), "pull", "--ff-only"])
    else:
        run(["git", "clone", REPO_URL, str(repomixr_dir)])

    run([sys.executable, str(repomixr_dir / "repomixr.py"), str(config)], cwd=workspace)


if __name__ == "__main__":
    main()
