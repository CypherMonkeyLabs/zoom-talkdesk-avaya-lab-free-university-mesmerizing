# Zoom, Talkdesk, and Avaya Lab

Free study notes for Zoom Phone, Zoom Contact Center, Zoom Workplace, Talkdesk, and Avaya Aura and Avaya Infinity. Open [index.html](./index.html).

These are study notes. They are not vendor documentation and not legal advice. Vendor names are trademarks of their owners.

Counts are written to `assets/data/counts.json` by `scripts/build_lab.py`. A row marked confirm has no URL.

```bash
python3 scripts/build_lab.py
node scripts/verify.mjs
node scripts/check-tour-phone.mjs
```

`scripts/check-tour-phone.mjs` uses Playwright at 390×844. It needs `playwright` installed (`npm install --no-save playwright` and `npx playwright install chromium`).

Also:

```bash
node pipeline/build_lesson_map.mjs
node scripts/validate_lessons.mjs
node pipeline/build_ztabot_index.mjs
node tests/ztabot-eval.mjs
node tests/ztabot-heldout.mjs
node scripts/build_precache.mjs
python3 scripts/licence_manifest.py
python3 scripts/csp_check.py
python3 scripts/make_icons.py
```

Cypher Monkey, a lifelong student and AI builder, wrote these notes. They are not a job offer and not vendor support.

`scripts/verify.mjs` runs on Node 20 and Node 22. Node 22 uses the global WebSocket. Node 20 uses the small client in that script. `ZTA_FORCE_WS_FALLBACK=1` runs the Node 20 client even when a global WebSocket exists.
