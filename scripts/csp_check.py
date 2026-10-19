#!/usr/bin/env python3
"""Report off-origin loads. Anchor links to other sites are not loads.

Exit 1 when a script, stylesheet, image, font, fetch, or import uses http(s) off this origin.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SKIP = {".git", "node_modules", "docs/screenshots", "scripts", "tests", "pipeline"}
LOADS = [
    (r"<(?:script|img|iframe|source|video|audio)[^>]+\bsrc=\"(https?://[^\"]+)\"", "html src"),
    (r"<link[^>]+href=\"(https?://[^\"]+)\"", "html link"),
    (r"url\(\s*[\"']?(https?://[^)\"']+)", "css url()"),
    (r"@import\s+[\"'](https?://[^\"']+)", "css @import"),
    (r"\bimport\s*(?:\(|[^;]*from\s*)[\"'](https?://[^\"']+)", "js import"),
    (r"\bfetch\(\s*[\"'`](https?://[^\"'`]+)", "js fetch"),
    (r"new (?:Worker|WebSocket|EventSource)\(\s*[\"'`](https?://[^\"'`]+)", "js net"),
]


def files():
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        if any(rel == skip or rel.startswith(skip + "/") for skip in SKIP):
            continue
        if path.suffix.lower() in {".html", ".css", ".js", ".mjs", ".svg"}:
            yield path


def main():
    fail = []
    for path in files():
        text = path.read_text(errors="replace")
        for pattern, kind in LOADS:
            for match in re.finditer(pattern, text):
                fail.append(f"{path.relative_to(ROOT)}: off-origin {kind}: {match.group(1)}")
    for item in fail:
        print("FAIL", item)
    print("csp_check:", len(fail), "off-origin loads")
    return 1 if fail else 0


sys.exit(main())
