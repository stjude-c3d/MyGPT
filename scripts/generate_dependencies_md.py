#!/usr/bin/env python3
"""Generate dependencies.md from project manifests.

Sources:
- backend/requirements.txt
- MCP-server/pyproject.toml
- frontend/package.json
"""

from __future__ import annotations

import json
import re
from pathlib import Path

try:
    import tomllib  # Python 3.11+
except ModuleNotFoundError:  # pragma: no cover
    tomllib = None


ROOT = Path(__file__).resolve().parent.parent
REQ_FILE = ROOT / "backend" / "requirements.txt"
MCP_PYPROJECT = ROOT / "MCP-server" / "pyproject.toml"
FRONTEND_PACKAGE = ROOT / "frontend" / "package.json"
OUTPUT = ROOT / "dependencies.md"


def _normalize_for_sort(dep_line: str) -> str:
    line = dep_line.strip()
    if not line:
        return ""
    no_comment = line.split("#", 1)[0].strip()
    m = re.match(r"^[A-Za-z0-9_.\-\[\]/@]+", no_comment)
    key = m.group(0) if m else no_comment
    return key.lower()


def read_backend_requirements() -> list[str]:
    deps: list[str] = []
    seen: set[str] = set()
    for raw in REQ_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line in seen:
            continue
        seen.add(line)
        deps.append(line)
    return sorted(deps, key=_normalize_for_sort)


def read_mcp_dependencies() -> list[str]:
    content = MCP_PYPROJECT.read_text(encoding="utf-8")

    if tomllib is not None:
        parsed = tomllib.loads(content)
        deps = parsed.get("project", {}).get("dependencies", [])
        deps = [str(dep).strip() for dep in deps if str(dep).strip()]
        return sorted(deps, key=_normalize_for_sort)

    # Fallback for Python < 3.11: parse project.dependencies array line-by-line.
    deps: list[str] = []
    in_deps_block = False
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not in_deps_block and line.startswith("dependencies") and "=" in line and "[" in line:
            in_deps_block = True
            continue

        if in_deps_block:
            if line.startswith("]"):
                break
            m = re.search(r'"([^"]+)"', line)
            if m:
                dep = m.group(1).strip()
                if dep:
                    deps.append(dep)

    return sorted(deps, key=_normalize_for_sort)


def read_frontend_dependencies() -> tuple[list[str], list[str]]:
    pkg = json.loads(FRONTEND_PACKAGE.read_text(encoding="utf-8"))
    runtime = pkg.get("dependencies", {})
    dev = pkg.get("devDependencies", {})

    runtime_lines = [f"{name}@{version}" for name, version in runtime.items()]
    dev_lines = [f"{name}@{version}" for name, version in dev.items()]

    runtime_lines.sort(key=lambda x: x.split("@", 1)[0].lower() if not x.startswith("@") else x.lower())
    dev_lines.sort(key=lambda x: x.split("@", 1)[0].lower() if not x.startswith("@") else x.lower())
    return runtime_lines, dev_lines


def bulletize(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def generate_markdown() -> str:
    backend = read_backend_requirements()
    mcp = read_mcp_dependencies()
    frontend_runtime, frontend_dev = read_frontend_dependencies()

    return f"""# Dependencies

This document is auto-generated from source manifests.

Regenerate with:

```bash
python3 scripts/generate_dependencies_md.py
```

## Backend Dependencies

Source: `backend/requirements.txt`

{bulletize(backend)}

## MCP Server Dependencies

Source: `MCP-server/pyproject.toml`

{bulletize(mcp)}

## Frontend Dependencies

Source: `frontend/package.json`

### Runtime Dependencies (`dependencies`)

{bulletize(frontend_runtime)}

### Development Dependencies (`devDependencies`)

{bulletize(frontend_dev)}

## Environment-Specific Dependencies and Setup

For OS, VM/server, and cloud-specific prerequisites (for example, Docker, GPU/CUDA, and Ollama installation differences), use the installation guides:

- Mac: `installation/macOS/README.md`
- Linux: `installation/linux/README.md`
- Windows: `installation/windows/README.md`
- VM/Server: `installation/vm/README.md`
- Cloud (Azure): `installation/azure/README.md`
"""


def main() -> None:
    OUTPUT.write_text(generate_markdown(), encoding="utf-8")


if __name__ == "__main__":
    main()
