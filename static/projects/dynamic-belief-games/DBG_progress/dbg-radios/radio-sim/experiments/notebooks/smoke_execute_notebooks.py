#!/usr/bin/env python3
"""Notebook smoke checks for tutorial notebooks."""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
from pathlib import Path
from typing import Iterable


def iter_notebooks(root: Path) -> Iterable[Path]:
    names = [
        "tutorial_csma_voice_video.ipynb",
        "tutorial_tdma_voice_video.ipynb",
    ]
    for name in names:
        path = root / name
        if not path.exists():
            raise FileNotFoundError(f"Missing notebook: {path}")
        yield path


def parse_notebook(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _strip_line_magics(source: str) -> str:
    lines = []
    for line in source.splitlines():
        if re.match(r"^\s*%", line):
            continue
        lines.append(line)
    return "\n".join(lines)


def execute_notebook_lightweight(path: Path) -> None:
    """Execute code cells sequentially without nbclient dependencies."""
    notebook = parse_notebook(path)
    namespace: dict = {"__name__": "__main__"}
    for idx, cell in enumerate(notebook.get("cells", [])):
        if cell.get("cell_type") != "code":
            continue
        source = "".join(cell.get("source", []))
        source = _strip_line_magics(source)
        if not source.strip():
            continue
        code = compile(source, f"{path.name}::cell{idx}", "exec")
        exec(code, namespace, namespace)


def execute_notebook(path: Path, timeout_s: int) -> None:
    try:
        import nbformat
        from nbclient import NotebookClient
    except ModuleNotFoundError:
        execute_notebook_lightweight(path)
        return

    nb = nbformat.read(path, as_version=4)
    client = NotebookClient(nb, timeout=timeout_s, kernel_name="python3")
    try:
        client.execute()
    except PermissionError:
        # Some restricted environments disallow local kernel socket binding.
        execute_notebook_lightweight(path)


def radio_sim_available() -> bool:
    return importlib.util.find_spec("radio_sim") is not None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true", help="Execute notebooks after parsing")
    parser.add_argument("--timeout-s", type=int, default=1200, help="Execution timeout per notebook")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    notebooks = list(iter_notebooks(root))

    for notebook in notebooks:
        obj = parse_notebook(notebook)
        cells = obj.get("cells", [])
        print(f"[ok] parsed {notebook.name}: {len(cells)} cells")

    if not args.execute:
        return 0

    if not radio_sim_available():
        print("[skip] radio_sim module is unavailable. Build bindings first with maturin.")
        return 0

    for notebook in notebooks:
        print(f"[run] executing {notebook.name}")
        execute_notebook(notebook, timeout_s=args.timeout_s)
        print(f"[ok] executed {notebook.name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
