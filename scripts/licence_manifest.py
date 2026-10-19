#!/usr/bin/env python3
"""Check THIRD_PARTY_MANIFEST.json hashes and that notices contain no unresolved 'verify'.

  python3 scripts/licence_manifest.py
  python3 scripts/licence_manifest.py --write
"""
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MAN = ROOT / "THIRD_PARTY_MANIFEST.json"
SCAN = ["vendor", "assets/fonts", "shared/pybot-chat"]


def sha(path):
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def main():
    data = json.loads(MAN.read_text())
    files = {item["path"]: item for component in data["components"] for item in component["files"]}
    problems = []
    if "--write" in sys.argv:
        for rel, item in files.items():
            item["sha256"] = sha(ROOT / rel)
        MAN.write_text(json.dumps(data, indent=2) + "\n")
        print("rewrote", MAN)
        return 0
    for rel, item in files.items():
        path = ROOT / rel
        if not path.is_file():
            problems.append(f"listed but missing: {rel}")
        elif sha(path) != item["sha256"]:
            problems.append(f"hash mismatch: {rel}")
    for directory in SCAN:
        base = ROOT / directory
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if path.is_file() and path.relative_to(ROOT).as_posix() not in files:
                problems.append(f"vendored file not in manifest: {path.relative_to(ROOT)}")
    for component in data["components"]:
        for key in ("name", "version", "licence", "url", "licence_file"):
            if not component.get(key):
                problems.append(f"{component.get('name')}: missing {key}")
        licence = component.get("licence_file") or ""
        if licence and not licence.startswith("(") and not (ROOT / licence).is_file():
            problems.append(f"{component['name']}: licence file missing {licence}")
    notices = (ROOT / "THIRD_PARTY_NOTICES.md").read_text()
    if re.search(r"\bverify\b", notices, re.I):
        problems.append("THIRD_PARTY_NOTICES.md still contains 'verify'")
    for problem in problems:
        print("FAIL", problem)
    print("manifest:", len(files), "files,", len(data["components"]), "components,", len(problems), "problems")
    return 1 if problems else 0


sys.exit(main())
