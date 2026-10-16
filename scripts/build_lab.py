#!/usr/bin/env python3
"""Write the static Zoom, Talkdesk, and Avaya study lab."""
import html
import json
import zipfile
from pathlib import Path

from facts import ROOMS, SOURCES, TRACKS

ROOT = Path(__file__).resolve().parents[1]
BRAND = "https://cyphermonkeylabs.com"
REPO = "https://github.com/CypherMonkeyLabs"
TREE = "https://linktr.ee/cypherMonkey"

NAV = [
    ("index.html", "Home", "12 tracks. Start here if you are new.", "home"),
    ("start.html", "Learn", "Ten minutes, or the full course.", "learn"),
    ("diagrams.html", "Diagrams", "Still drawings you can export.", "diagrams"),
    ("flows.html", "Flows", "Ladders with a moving packet.", "flows"),
    ("play.html", "Play", "A short drill in this browser.", "play"),
    ("listen.html", "Listen", "Read-along notes for the guide.", "listen"),
    ("downloads.html", "Downloads", "Sheets, cards, and one zip.", "downloads"),
    ("ecosystem.html", "Ecosystem", "Glossary, bridges, and sister labs.", "eco"),
    ("help.html", "Help", "How the menu, course, and bot work.", "help"),
]

ICONS = {
    "home": '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
    "learn": '<path d="M4 6h16v12H4z"/><path d="M8 10h8M8 14h5"/>',
    "diagrams": '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="m7 15 3-3 2 2 3-4"/>',
    "flows": '<path d="M4 7h16M4 12h16M4 17h10"/>',
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "play": '<path d="M8 5v14l11-7z"/>',
    "listen": '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="1"/><rect x="17" y="13" width="4" height="6" rx="1"/>',
    "downloads": '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
    "eco": '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2 2.4 3 5 3 8s-1 5.6-3 8c-2-2.4-3-5-3-8s1-5.6 3-8z"/>',
    "help": '<circle cx="12" cy="12" r="8"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7V14"/><path d="M12 17h.01"/>',
    "track": '<path d="M4 6h16v12H4z"/><path d="M8 10h8M8 14h5"/>',
}


def e(text):
    return html.escape(str(text), quote=True)


def svg_icon(name):
    body = ICONS.get(name, ICONS["track"])
    return (
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + body + "</svg>"
    )


def prefix(depth):
    return "../" * depth


def rooms_for(track):
    return [r for r in ROOMS if r["track"] == track]


def track_by_id(tid):
    for t in TRACKS:
        if t[0] == tid:
            return t
    raise KeyError(tid)


def source_rows(keys, confirms):
    rows = []
    for key in keys:
        kind, title, url = SOURCES[key]
        rows.append((kind, title, url, ""))
    for note in confirms:
        rows.append(("Confirm", note, None, ""))
    return rows


def go_deeper(rows, json_href, md_href=None):
    items = []
    for kind, title, url, _note in rows:
        if url:
            items.append(
                f"<li><strong>{e(kind)}.</strong> <a href=\"{e(url)}\" style=\"color:#134e4a\">{e(title)}</a> "
                f"<span style=\"white-space:nowrap\">last checked 2026-10</span></li>"
            )
        else:
            items.append(
                f"<li><strong>{e(kind)}.</strong> {e(title)} "
                f"<span style=\"white-space:nowrap\">last checked 2026-10</span></li>"
            )
    extra = f' <a href="{e(md_href)}">Markdown</a>' if md_href else ""
    return (
        '<section class="go-deeper" style="margin:28px 0;padding:16px 18px;border:2px solid #0f766e;'
        'border-radius:16px;background:#f0fdfa;color:#042f2e"><h2>Sources and go deeper</h2>'
        "<p>Opened 2026-10. A row marked confirm has no link, because that page was not verified.</p><ul>"
        + "".join(items)
        + f"</ul><p><a href=\"{e(json_href)}\">sources.json</a>{extra}</p></section>"
    )


def footer():
    return f"""<footer class="site-footer lab-footer wrap" data-canon-footer><aside class="disclaimer-panel" aria-labelledby="disc-title"><span class="disclaimer-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 4.5 5.5v5.8c0 4.6 3.1 8.6 7.5 10.2 4.4-1.6 7.5-5.6 7.5-10.2V5.5z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="1.6"/><path d="M8.2 12.2 11 15l4.8-5.2" fill="none" stroke="#0f766e" stroke-width="1.8" stroke-linecap="round"/></svg></span><div><h2 id="disc-title">A note from the student behind this lab</h2><p>This is an <strong>independent, free, learning-only student project</strong>. These are study notes. They are <strong>not vendor documentation and not legal advice</strong>. Zoom, Talkdesk, Avaya, and other vendors' names are trademarks of their owners. It is <strong>not affiliated with or endorsed by</strong> any of them.</p><p>If anyone has a concern, the content will be removed or corrected promptly via the contact form at <a href="{BRAND}/#contact">{BRAND}/#contact</a>. Nothing here is sold. I am happy to volunteer for any organization.</p><p>Emergency-calling and call-recording chapters are study notes. They are not an emergency plan. Rules differ by country and by the system you run. Figures that depend on a release are marked confirm.</p></div></aside><p class="footer-brand">CypherMonkey Labs</p><nav class="brand-row brand-icons" aria-label="CypherMonkey Labs"><a class="brand-icon brand-web" href="{BRAND}" aria-label="CypherMonkey Labs website"><svg viewBox="0 0 64 64" class="monkey-icon" aria-hidden="true"><defs><radialGradient id="mh" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#ffd9a0"/><stop offset=".5" stop-color="#e8903a"/><stop offset="1" stop-color="#8a3f10"/></radialGradient></defs><circle cx="14" cy="34" r="7" fill="url(#mh)"/><circle cx="50" cy="34" r="7" fill="url(#mh)"/><circle cx="32" cy="32" r="18" fill="url(#mh)"/><ellipse cx="32" cy="38" rx="10" ry="8" fill="#fde68a"/><circle cx="26" cy="31" r="2" fill="#2a1406"/><circle cx="38" cy="31" r="2" fill="#2a1406"/><circle cx="26" cy="31" r="6" fill="#e0f2fe" opacity=".45" stroke="#fde047" stroke-width="1.6"/><circle cx="38" cy="31" r="6" fill="#e0f2fe" opacity=".45" stroke="#fde047" stroke-width="1.6"/><path d="M27 42 q5 4 10 0" fill="none" stroke="#7c2d12" stroke-width="1.6" stroke-linecap="round"/></svg></a><a class="brand-icon brand-gh" href="{REPO}" aria-label="CypherMonkey Labs on GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.22 3.38 9.65 8.07 11.22.59.12.8-.26.8-.57v-2.02c-3.28.73-3.97-1.42-3.97-1.42-.53-1.38-1.3-1.75-1.3-1.75-1.07-.75.08-.73.08-.73 1.18.08 1.8 1.24 1.8 1.24 1.05 1.84 2.76 1.31 3.43.99.1-.78.41-1.31.75-1.61-2.62-.31-5.37-1.34-5.37-5.98 0-1.32.46-2.4 1.22-3.25-.12-.3-.53-1.53.12-3.18 0 0 1-.33 3.3 1.25a11.3 11.3 0 0 1 6 0c2.3-1.58 3.3-1.25 3.3-1.25.65 1.65.24 2.88.12 3.18.76.85 1.22 1.93 1.22 3.25 0 4.65-2.76 5.66-5.39 5.96.42.38.8 1.12.8 2.26v3.35c0 .31.21.7.81.57A11.52 11.52 0 0 0 23.5 12.3 11.5 11.5 0 0 0 12 .5z"/></svg></a><a class="brand-icon brand-tree" href="{TREE}" aria-label="CypherMonkey on Linktree"><svg viewBox="0 0 64 64" aria-hidden="true"><defs><filter id="zta-tree-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><g filter="url(#zta-tree-glow)" fill="#bbf7d0"><circle cx="32" cy="10" r="7"/><rect x="29" y="14" width="6" height="12" rx="3"/><circle cx="14" cy="30" r="6.5"/><circle cx="50" cy="30" r="6.5"/><rect x="16" y="27" width="32" height="6" rx="3"/><rect x="29" y="30" width="6" height="12" rx="3"/><circle cx="12" cy="46" r="6.5"/><circle cx="52" cy="46" r="6.5"/><rect x="14" y="43" width="36" height="6" rx="3"/><rect x="27" y="46" width="10" height="14" rx="5"/></g><g fill="#f7fee7" stroke="#052e16" stroke-width="1.6" stroke-linejoin="round"><circle cx="32" cy="10" r="7"/><rect x="29" y="14" width="6" height="12" rx="3"/><circle cx="14" cy="30" r="6.5"/><circle cx="50" cy="30" r="6.5"/><rect x="16" y="27" width="32" height="6" rx="3"/><rect x="29" y="30" width="6" height="12" rx="3"/><circle cx="12" cy="46" r="6.5"/><circle cx="52" cy="46" r="6.5"/><rect x="14" y="43" width="36" height="6" rx="3"/><rect x="27" y="46" width="10" height="14" rx="5"/></g></svg></a></nav><p class="site-copy">© 2026 CypherMonkeyLabs 🐒</p></footer>"""


def phone(depth):
    p = prefix(depth)
    return (
        f'<nav class="phone-bar" aria-label="Phone"><button type="button" data-menu-open data-tour="menu">'
        f'<span class="is-menu">{svg_icon("menu")}</span>Menu</button>'
        f'<a href="{p}start.html" data-tour="learn">{svg_icon("learn")}Learn</a>'
        f'<a href="{p}diagrams.html" data-tour="diagrams">{svg_icon("diagrams")}Diagrams</a>'
        f'<a href="{p}play.html" data-tour="play">{svg_icon("play")}Play</a>'
        f'<button type="button" data-listen data-tour="listen">{svg_icon("listen")}Listen</button>'
        f'<button type="button" data-open-guide>{svg_icon("help")}Guide</button></nav>'
    )


def chrome_open(title, desc, depth, current):
    p = prefix(depth)
    chips = []
    drawer = []
    for href, label, blurb, icon in NAV:
        here = ' aria-current="page"' if href == current else ""
        chips.append(
            f'<a class="section-chip" href="{p}{href}" data-tour="{icon}"{here} title="{e(blurb)}">'
            f'<span class="chip-ico">{svg_icon(icon)}</span><span>{e(label)}</span></a>'
        )
        drawer.append(
            f'<li><a data-menu-text="{e(label.lower()+" "+blurb.lower())}" href="{p}{href}">'
            f'<span class="ico">{svg_icon(icon)}</span><span><strong>{e(label)}</strong>'
            f'<span class="desc">{e(blurb)}</span></span></a></li>'
        )
    for tid, name, blurb, _color in TRACKS:
        href = f"tracks/{tid}.html"
        here = ' aria-current="page"' if href == current else ""
        drawer.append(
            f'<li><a data-menu-text="{e(name.lower()+" "+blurb.lower())}" href="{p}{href}">'
            f'<span class="ico">{svg_icon("track")}</span><span><strong>{e(name)}</strong>'
            f'<span class="desc">{e(blurb)}</span></span></a></li>'
        )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)} · Zoom Talkdesk Avaya Lab</title>
<meta name="description" content="{e(desc)}">
<link rel="icon" href="{p}favicon.svg" type="image/svg+xml">
<link rel="manifest" href="{p}manifest.webmanifest">
<script>try{{var t=localStorage.getItem("canon-theme");if(t!=="aurora")t="bloom";document.documentElement.dataset.theme=t;var f=localStorage.getItem("canon-font");if(f==="sm"||f==="lg")document.documentElement.dataset.font=f;var ink=localStorage.getItem("canon-ink");if(ink&&/^#[0-9a-f]{{6}}$/i.test(ink))document.documentElement.style.setProperty("--ink",ink);}}catch(err){{document.documentElement.dataset.theme="bloom";}}</script>
<link rel="stylesheet" href="{p}assets/css/canon.css"><link rel="stylesheet" href="{p}assets/css/shell.css"><link rel="stylesheet" href="{p}assets/css/wow.css"><link rel="stylesheet" href="{p}assets/css/frame.css"><link rel="stylesheet" href="{p}assets/css/polish.css"><link rel="stylesheet" href="{p}assets/css/footer.css"><link rel="stylesheet" href="{p}assets/css/university.css"><link rel="stylesheet" href="{p}assets/css/uc.css">
<link rel="stylesheet" href="{p}guide/guide.css">
</head>
<body class="uc-lab">
<a class="skip" href="#main">Skip to content</a>
<header class="uc-top">
<div class="bar-inner">
<button type="button" class="menu-btn" data-menu-open data-tour="menu" aria-expanded="false" aria-controls="site-drawer">{svg_icon("menu")} Menu</button>
<a class="brand" href="{p}index.html" data-tour="home"><span>ZTA Lab<small>Free University</small></span></a>
<form class="nav-search" role="search"><input class="nav-q" data-nav-search type="search" placeholder="Search lessons" aria-label="Search lessons" autocomplete="off"><div class="search-pop" hidden></div></form>
<div class="display-control"><button type="button" class="display-btn" aria-expanded="false" aria-controls="display-panel">Display</button>
<div id="display-panel" class="display-panel" hidden>
<label>Font size</label>
<div class="a11y-font" role="group" aria-label="Font size">
<button type="button" data-font-set="sm" aria-pressed="false">A−</button>
<button type="button" data-font-set="md" aria-pressed="true">A</button>
<button type="button" data-font-set="lg" aria-pressed="false">A+</button>
</div>
<label for="ink">Font colour</label>
<input id="ink" class="ink-input" data-ink type="color" value="#16182b" aria-label="Font colour">
<label>Theme</label>
<div class="theme-row" role="group" aria-label="Theme">
<button type="button" data-set-theme="bloom" aria-pressed="true">Bright</button>
<button type="button" data-set-theme="aurora" aria-pressed="false">Dark</button>
</div>
</div></div>
</div>
</header>
<div class="canon-banner">
<button type="button" class="rail-arrow" data-rail="prev" aria-label="Scroll sections backward">‹</button>
<nav class="section-rail" aria-label="Sections">{''.join(chips)}</nav>
<button type="button" class="rail-arrow" data-rail="next" aria-label="Scroll sections forward">›</button>
</div>
<div class="drawer-backdrop"></div>
<nav id="site-drawer" class="site-drawer" aria-hidden="true" aria-label="Menu">
<div class="drawer-bar"><a class="drawer-brand" href="{p}index.html"><img src="{p}favicon.svg" width="36" height="36" alt=""> <strong>ZTA Lab</strong></a><button type="button" data-menu-open>Close</button></div>
<input class="drawer-search" data-drawer-filter type="search" placeholder="Filter" aria-label="Filter the menu">
<ul class="drawer-list">{''.join(drawer)}</ul>
</nav>
<main id="main">
"""


def chrome_close(depth):
    p = prefix(depth)
    return f"""</main>
{footer()}
{phone(depth)}
<script src="{p}assets/js/frame.js"></script>
<script src="{p}assets/js/university.js"></script>
<script src="{p}guide/guide.js"></script>
</body>
</html>
"""


def diagram_svg(slug, title, boxes, side, animate):
    colors = ["#99f6e4", "#bfdbfe", "#fde68a", "#fecdd3", "#ddd6fe", "#d9f99d"]
    gid = "g" + "".join(ch if ch.isalnum() else "" for ch in slug)[:24]
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420" role="img" aria-label="{e(title)}">',
        "<defs>",
        f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#312e81"/><stop offset="1" stop-color="#0e7490"/></linearGradient>',
        "</defs>",
        f'<rect width="720" height="420" rx="28" fill="url(#{gid})"/>',
        f'<text x="32" y="48" fill="#ffffff" font-family="system-ui,sans-serif" font-size="26" font-weight="700">{e(title)}</text>',
        f'<text x="32" y="76" fill="#e0f2fe" font-family="system-ui,sans-serif" font-size="15">{e(side)}. Teaching sketch. Confirm a live system.</text>',
    ]
    n = max(1, len(boxes))
    w = 140
    gap = 18
    total = n * w + (n - 1) * gap
    x0 = (720 - total) / 2
    path = []
    for i, label in enumerate(boxes):
        x = x0 + i * (w + gap)
        y = 150
        fill = colors[i % len(colors)]
        parts.append(f'<rect x="{x:.0f}" y="{y}" width="{w}" height="88" rx="18" fill="{fill}"/>')
        parts.append(
            f'<text x="{x + w/2:.0f}" y="{y+50}" text-anchor="middle" fill="#1e1b4b" font-family="system-ui,sans-serif" font-size="15" font-weight="700">{e(label)}</text>'
        )
        if i:
            x1 = x0 + (i - 1) * (w + gap) + w
            x2 = x
            midy = y + 44
            parts.append(f'<path d="M{x1:.0f} {midy} H{x2:.0f}" fill="none" stroke="#fde047" stroke-width="6" stroke-linecap="round"/>')
            path.append(f"M{x1:.0f} {midy} H{x2:.0f}")
    if animate and path:
        motion = " ".join(path)
        parts.append(f'<circle r="9" fill="#ffffff"><animateMotion dur="3.2s" repeatCount="indefinite" path="{motion}"/></circle>')
    parts.append('<text x="32" y="390" fill="#e0f2fe" font-family="system-ui,sans-serif" font-size="14">Names come from pages opened in 2026-10. A missing name stays confirm.</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def ladder_svg(slug, title, animate):
    gid = "L" + "".join(ch if ch.isalnum() else "" for ch in slug)[:20]
    motion = "M120 90 V320"
    anim = ""
    if animate:
        anim = f'<circle r="8" fill="#fde047"><animateMotion dur="2.8s" repeatCount="indefinite" path="{motion}"/></circle>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420" role="img" aria-label="{e(title)} ladder">
<defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#155e75"/></linearGradient></defs>
<rect width="720" height="420" rx="28" fill="url(#{gid})"/>
<text x="28" y="42" fill="#fff" font-family="system-ui,sans-serif" font-size="24" font-weight="700">{e(title)}</text>
<text x="120" y="78" text-anchor="middle" fill="#fde68a" font-family="system-ui,sans-serif" font-size="16" font-weight="700">Caller</text>
<text x="360" y="78" text-anchor="middle" fill="#99f6e4" font-family="system-ui,sans-serif" font-size="16" font-weight="700">SIP</text>
<text x="600" y="78" text-anchor="middle" fill="#fecdd3" font-family="system-ui,sans-serif" font-size="16" font-weight="700">Called</text>
<path d="M120 90 V340 M360 90 V340 M600 90 V340" stroke="#e0f2fe" stroke-width="3"/>
<path d="M120 130 H360" stroke="#fff" stroke-width="4"/>
<text x="240" y="122" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="13">session setup</text>
<path d="M360 180 H600" stroke="#fff" stroke-width="4"/>
<text x="480" y="172" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="13">session setup</text>
<path d="M120 250 H600" stroke="#fde047" stroke-width="4" stroke-dasharray="8 6"/>
<text x="360" y="242" text-anchor="middle" fill="#fde047" font-family="system-ui,sans-serif" font-size="13">RTP, not required to hairpin</text>
{anim}
<text x="28" y="390" fill="#e0f2fe" font-family="system-ui,sans-serif" font-size="14">Teaching sketch from RFC 3261 and RFC 3550. Not a packet capture.</text>
</svg>'''


def write(path, text):
    path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def page(rel, title, desc, depth, current, body):
    if "go-deeper" not in body:
        p = prefix(depth)
        rows = source_rows(
            ["rfc3261", "zoom_cc", "td_home", "av_aura"],
            ["Release-specific steps for this page. confirm."],
        )
        body += go_deeper(rows, f"{p}sources/home/sources.json")
    write(rel, chrome_open(title, desc, depth, current) + body + chrome_close(depth))


def export_links(depth, slug):
    p = prefix(depth)
    return (
        f'<div class="room-downloads" data-dl><span>Export</span>'
        f'<a class="dl-btn" href="{p}assets/diagrams/{slug}.svg" download>SVG</a>'
        f'<a class="dl-btn" href="{p}assets/diagrams/{slug}-flow.svg" download>Flow</a>'
        f'<a class="dl-btn" href="{p}downloads/sheets/{slug}.html">Sheet</a></div>'
    )


def build_rooms():
    for index, room in enumerate(ROOMS, start=1):
        tid = room["track"]
        code = f"{tid}-R{index:02d}"
        room["code"] = code
        slug = room["slug"]
        still = diagram_svg(slug, room["title"], room["boxes"], room["side"], False)
        flow = ladder_svg(slug, room["title"], True)
        write(f"assets/diagrams/{slug}.svg", still)
        write(f"assets/diagrams/{slug}-flow.svg", flow)
        rows = source_rows(room["sources"], room["confirms"])
        write(f"rooms/sources/{slug}/sources.json", json.dumps({
            "opened": "2026-10",
            "sources": [{"kind": k, "title": t, "url": u} for k, t, u, _ in rows],
        }, indent=2))
        bullets = "".join(f"<li>{e(b)}</li>" for b in room["five"])
        paras = "".join(f"<p>{e(p)}</p>" for p in room["paras"])
        quizzes = ""
        for n, (q, ans, note) in enumerate(room["quiz"], start=1):
            quizzes += (
                f'<div class="quiz" data-quiz data-answer="{e(ans)}"><p><strong>{n}.</strong> {e(q)}</p>'
                f'<button type="button" class="choice ghost" data-choice="True">True</button>'
                f'<button type="button" class="choice ghost" data-choice="False">False</button>'
                f'<p class="quiz-note" hidden>{e(note)}</p></div>'
            )
        terms = "".join(f"<li><strong>{e(n)}</strong> — {e(d)}</li>" for n, d in room["terms"])
        tname = track_by_id(tid)[1]
        body = f'''<div class="wrap">
<p class="kicker">{e(tid)} · {e(code)} · {e(tname)}</p>
<h1>{e(room["title"])}</h1>
<p class="lede">{e(room["paras"][0])}</p>
{export_links(1, slug)}
<section id="five" class="five"><h2>Learn it in 5 minutes</h2><ul>{bullets}</ul></section>
<section id="visual"><h2>Visual</h2><div class="diagram-frame">{still}</div>
<p>Count the boxes: {len(room["boxes"])}. Each label is a name from a page or a study label marked on the drawing.</p></section>
<section id="flow"><h2>Flow</h2><div class="diagram-frame">{flow}</div></section>
<section id="core"><h2>What is going on</h2>{paras}</section>
<section id="example" class="worked"><h2>Worked example</h2><p>{e(room["example"])}</p></section>
<section id="quiz"><h2>Quiz</h2>{quizzes}</section>
<section id="eco" class="eco-panel"><h2>Ecosystem</h2>
<p>Sister pieces sit on the ecosystem page: the glossary, the mind map, the integration map, and the bridges.</p>
<ul>{terms}</ul>
<p><strong>Config.</strong> {e(room["config"])}</p>
<p><strong>Troubleshooting.</strong> {e(room["trouble"])}</p>
<p><strong>Bridge.</strong> {e(room["bridge"])}</p>
<p>Mind map, sister technologies, and future hooks live on the <a href="../ecosystem.html">ecosystem page</a>.</p>
</section>
<section id="sources">{go_deeper(rows, f"sources/{slug}/sources.json", f"../downloads/rooms/{slug}.md")}</section>
</div>'''
        page(f"rooms/{slug}.html", room["title"], room["five"][0][:140], 1, "start.html", body)
        md = [f"# {room['title']}", "", "Study notes. Not vendor documentation and not legal advice.", ""]
        md += [f"- {b}" for b in room["five"]]
        md += ["", room["example"], ""]
        write(f"downloads/rooms/{slug}.md", "\n".join(md) + "\n")
        sheet = (
            "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>"
            + e(room["title"])
            + "</title><link rel=\"stylesheet\" href=\"../../assets/css/footer.css\">"
            + "<style>body{font-family:system-ui,sans-serif;margin:24px;background:#f8fafc;color:#0f172a}ul{font-size:1.05rem;line-height:1.5}</style></head><body>"
            + f"<h1>{e(room['title'])}</h1><ul>"
            + "".join(f"<li>{e(b)}</li>" for b in room["five"])
            + "</ul><p>These are study notes, not vendor documentation and not legal advice. learning-only student project. "
            + f'<a href="{BRAND}/#contact">{BRAND}/#contact</a> '
            + f'<a href="{REPO}">{REPO}</a> '
            + f'<a href="{TREE}">{TREE}</a></p>'
            + go_deeper(rows, f"../../rooms/sources/{slug}/sources.json")
            + "</body></html>"
        )
        write(f"downloads/sheets/{slug}.html", sheet)


def build_tracks():
    for tid, name, blurb, color in TRACKS:
        items = rooms_for(tid)
        cards = []
        for room in items:
            cards.append(
                f'<a class="room-card" href="../rooms/{room["slug"]}.html"><h2>{e(room["title"])}</h2>'
                f'<p>{e(room["code"])}</p><p>{e(room["five"][0][:140])}</p></a>'
            )
        rows = source_rows(["rfc3261", "wiki_sip"], ["Release-specific menus for this track. confirm. Not opened as a single checklist."])
        body = f'''<div class="wrap">
<p class="kicker">{e(tid)}</p>
<h1>{e(name)}</h1>
<p class="lede">{e(blurb)}. {len(items)} lessons. Each lesson cites the pages that were opened, and marks the rest confirm.</p>
<div class="track-map">{''.join(cards)}</div>
<section class="go-deeper-slot">{go_deeper(rows, f"sources/{tid}/sources.json")}</section>
</div>'''
        write(f"tracks/sources/{tid}/sources.json", json.dumps({"opened": "2026-10", "track": tid}, indent=2))
        page(f"tracks/{tid}.html", name, blurb, 1, f"tracks/{tid}.html", body)


def glossary():
    seen = []
    have = set()
    for room in ROOMS:
        for name, definition in room["terms"]:
            if name not in have:
                have.add(name)
                seen.append((name, definition, room["slug"]))
    return seen


def build_hubs():
    n_rooms = len(ROOMS)
    n_tracks = len(TRACKS)
    n_diagrams = n_rooms * 2 + 3
    tiles = []
    for tid, name, blurb, color in TRACKS:
        count = len(rooms_for(tid))
        tiles.append(
            f'<a class="track-tile" style="--card:{color}" href="tracks/{tid}.html"><h2>{e(name)}</h2>'
            f'<p>{e(blurb)}</p><p>{count} lessons</p></a>'
        )
    home_rows = source_rows(
        ["wiki_zoom", "wiki_avaya", "zoom_cc", "zoom_phone", "td_home", "av_infinity", "av_aura", "rfc3261", "rfc3550"],
        [
            "Zoom Phone consumer marketing URL. confirm. Several product paths returned HTTP 404.",
            "Avaya OneCloud CCaaS page. confirm. The URL returned HTTP 404.",
            "Cisco CUCM and UCCE pages. confirm. Both returned HTTP 403.",
            "FCC MLTS page. confirm. The request returned HTTP 403.",
        ],
    )
    hero = diagram_svg("hero-stack", "Three vendors, one study habit", ["Zoom", "Talkdesk", "Avaya", "SIP"], "Home", True)
    write("assets/diagrams/hero-stack.svg", hero)
    body = f'''<section class="wrap hero-band">
<div>
<p class="kicker">Zoom · Talkdesk · Avaya</p>
<h1>Zoom, Talkdesk, and Avaya study notes.</h1>
<p class="lede">A free study lab for Zoom Phone, Zoom Contact Center, and Zoom Workplace, Talkdesk, and Avaya Aura, Avaya Infinity, and the public names that redirected or did not open. Architecture, SIP and media, call flows, routing, WFM, recording, E911, analytics, CRM, AI agents, migration, licensing, and timelines. A number that was not on an opened page is marked confirm. Emergency and recording notes are not legal advice.</p>
<div class="actions">
<a class="btn" href="start.html">Start here</a>
<a class="ghost" href="diagrams.html">Diagrams</a>
<a class="ghost" href="ecosystem.html">Ecosystem</a>
<a class="ghost" href="downloads.html">Downloads</a>
</div>
</div>
<div class="diagram-frame hero-diagram">{hero}</div>
</section>
<section class="wrap">
<div class="stat-row" aria-label="Counts from this repository">
<div class="stat"><b data-count="{n_rooms}">{n_rooms}</b><span>lessons</span></div>
<div class="stat"><b data-count="{n_tracks}">{n_tracks}</b><span>tracks</span></div>
<div class="stat"><b data-count="{n_diagrams}">{n_diagrams}</b><span>drawings</span></div>
<div class="stat"><b data-count="{n_rooms}">{n_rooms}</b><span>flows</span></div>
</div>
<h2>{n_tracks} tracks</h2>
<div class="track-map">{''.join(tiles)}</div>
</section>
<section class="wrap study-primer" id="primer">
<h2>Read this before the first lesson</h2>
<p>Zoom Communications, on the Wikipedia article that opened, is a communications company in San Jose, known primarily for the videoconferencing platform Zoom. The blog and navigation that opened use the name Zoom Workplace, and they list Phone beside Meetings and Chat. Zoom Contact Center is a Zoom CX name on those same pages. Talkdesk's home title calls it contact center software. Avaya's site, opened in the same month, titles Aura as enterprise voice and unified communications, and Infinity as an enterprise customer experience platform.</p>
<p>SIP, in RFC 3261, creates, modifies, and terminates sessions and includes a registration function. RTP, in RFC 3550, carries real-time media. Those two jobs stay separate on every ladder in this lab. A vendor menu does not replace the RFC, and an RFC does not name the vendor's button.</p>
<p>Some names in the brief did not survive contact with the public web. Avaya's experience-platform path redirected to Infinity. An OneCloud CCaaS path returned HTTP 404. Several Zoom Phone marketing paths returned HTTP 404, while the developer Phone guide opened. Cisco CUCM and UCCE URLs returned HTTP 403, so those menus are confirm. The FCC MLTS page returned HTTP 403, so emergency law is cited only from the Enhanced 911 Wikipedia article that did open, and it is not legal advice.</p>
{go_deeper(home_rows, "sources/home/sources.json")}
</section>'''
    page("index.html", "Zoom Talkdesk Avaya Lab", "Free study lab for Zoom, Talkdesk, and Avaya.", 0, "index.html", body)
    write("sources/home/sources.json", json.dumps({"opened": "2026-10"}, indent=2))

    # start
    steps = []
    for tid, name, blurb, _c in TRACKS:
        first = rooms_for(tid)[0]
        steps.append(f"<li><a href=\"tracks/{tid}.html\">{e(name)}</a> — {e(blurb)}. First lesson: <a href=\"rooms/{first['slug']}.html\">{e(first['title'])}</a>.</li>")
    start_body = f'''<div class="wrap">
<h1>Start here</h1>
<p class="lede" id="ten">Ten minutes: read the home primer, open SIP and media, then open one vendor track you actually operate. Full course: the twelve tracks in order.</p>
<section id="path"><h2>Full course</h2><ol>{''.join(steps)}</ol></section>
<section><h2>Ten-minute path</h2>
<ol>
<li><a href="rooms/sip-jobs.html">What SIP is for</a></li>
<li><a href="rooms/zoom-workplace.html">What Zoom Workplace names</a></li>
<li><a href="rooms/talkdesk-cloud.html">Talkdesk as a cloud contact center</a></li>
<li><a href="rooms/aura-versus-infinity.html">Voice platform and CX platform</a></li>
<li><a href="rooms/numbers-confirm.html">Numbers you may repeat</a></li>
</ol></section>
{go_deeper(source_rows(["rfc3261","zoom_blog","td_home","av_aura"], []), "sources/start/sources.json")}
</div>'''
    write("sources/start/sources.json", json.dumps({"opened": "2026-10"}, indent=2))
    page("start.html", "Start here", "Ten minutes or the full course.", 0, "start.html", start_body)

    # diagrams and flows
    dcards = []
    fcards = []
    for room in ROOMS:
        dcards.append(f'<a class="room-card" href="rooms/{room["slug"]}.html"><h2>{e(room["title"])}</h2><p>Still drawing</p></a>')
        fcards.append(f'<a class="room-card" href="rooms/{room["slug"]}.html#flow"><h2>{e(room["title"])}</h2><p>Moving packet</p></a>')
    page("diagrams.html", "Diagrams", "Still drawings.", 0, "diagrams.html",
         f'<div class="wrap"><h1>Diagrams</h1><p class="lede">{n_rooms} still drawings, one per lesson, plus the home stack, the glossary map, and the integration map.</p><div class="track-map">{"".join(dcards)}</div></div>')
    page("flows.html", "Flows", "Ladders with a moving packet.", 0, "flows.html",
         f'<div class="wrap"><h1>Flows</h1><p class="lede">{n_rooms} ladders. Each one is a teaching sketch of session setup and RTP, not a customer capture.</p><div class="track-map">{"".join(fcards)}</div></div>')

    # play
    play = '''<div class="wrap"><h1>Play</h1>
<p class="lede">Order the jobs this lab can defend. Signaling is not media. A token is not a license.</p>
<section id="drill"><h2>Put the jobs in study order</h2>
<ol id="order"></ol>
<p id="play-note" aria-live="polite"></p>
<button type="button" class="btn" id="check-order">Check order</button>
</section>
<section><h2>What correct means</h2>
<p>The drill asks for registration and session setup before RTP, because RFC 3261 separates the registration function and the session from RTP in RFC 3550. A Zoom token hour is an API fact, not a call-flow step, so it stays off this list.</p>
</section>
<script>
(function(){
  var jobs=["RTP media","SIP session setup","Registration","Quality score is not the file"];
  var want=["Registration","SIP session setup","RTP media","Quality score is not the file"];
  var list=document.getElementById("order");
  jobs.forEach(function(job,i){
    var li=document.createElement("li");
    li.textContent=job;
    li.draggable=true;
    li.dataset.job=job;
    li.style.padding="8px";
    li.style.margin="6px 0";
    li.style.border="2px solid #0f766e";
    li.style.borderRadius="12px";
    li.addEventListener("dragstart",function(){li.classList.add("dragging");});
    li.addEventListener("dragend",function(){li.classList.remove("dragging");});
    list.appendChild(li);
  });
  list.addEventListener("dragover",function(ev){
    ev.preventDefault();
    var dragging=list.querySelector(".dragging");
    var after=[].slice.call(list.children).find(function(child){
      var box=child.getBoundingClientRect();
      return ev.clientY < box.top + box.height/2;
    });
    if(!dragging) return;
    if(after) list.insertBefore(dragging, after); else list.appendChild(dragging);
  });
  document.getElementById("check-order").addEventListener("click",function(){
    var got=[].map.call(list.children,function(li){return li.dataset.job;});
    var ok=got.every(function(item,i){return item===want[i];});
    document.getElementById("play-note").textContent=ok?"That order matches the study habit.":"Not yet. Registration, then session setup, then RTP. The score is a different object.";
  });
})();
</script>
</div>'''
    page("play.html", "Play", "A short drill in this browser.", 0, "play.html", play)

    listen = '''<div class="wrap"><h1>Listen</h1>
<p class="lede">The guide reads the words already on the page. There is no separate audio file and no cloud voice.</p>
<section id="script"><h2>Read-along script</h2>
<p>Welcome. This lab studies Zoom, Talkdesk, and Avaya from pages opened in October 2026. SIP sets up the session. RTP carries the voice. A confirm row has no link.</p>
<p>Press Listen in the bottom dock, or open the guide and choose Read along. On a phone the guide sits below the title and the first lines.</p>
</section></div>'''
    page("listen.html", "Listen", "Read-along notes.", 0, "listen.html", listen)

    # downloads
    rows_dl = []
    for room in ROOMS:
        rows_dl.append(
            f"<tr><td><a href=\"downloads/sheets/{room['slug']}.html\">{e(room['title'])}</a></td><td>HTML sheet</td><td>{e(room['code'])}</td></tr>"
        )
    dl = f'''<div class="wrap"><h1>Downloads</h1>
<p class="lede">Sheets and a zip of the lesson notes. Sizes are the files in this repository. No CDN.</p>
<p><a class="btn" href="downloads/zta-lab-notes.zip">Download the notes zip</a></p>
<h2>Headless test table</h2>
<div class="table-wrap"><table class="plain"><thead><tr><th>Sheet</th><th>Kind</th><th>Code</th></tr></thead><tbody>
{''.join(rows_dl)}
</tbody></table></div>
<p>learning-only student project. <a href="{BRAND}/#contact">{BRAND}/#contact</a></p>
</div>'''
    page("downloads.html", "Downloads", "Sheets, cards, and one zip.", 0, "downloads.html", dl)

    help_body = '''<div class="wrap"><h1>Help</h1>
<p class="lede">The top rail is the short menu. The Menu button opens every track. Display changes type size, type colour, and bright or dark.</p>
<section><h2>The guide</h2>
<p>The monkey repeats notes that are already on the page. Read along uses the browser speech API. On a phone the guide panel is placed below the title and the opening lines, and the closed monkey sits above the bottom dock.</p></section>
<section><h2>Confirm</h2>
<p>A confirm row has no URL. That page was not verified in October 2026. Do not treat it as a citation.</p></section>
<section><h2>What this is not</h2>
<p>Study notes. Not vendor documentation. Not legal advice. Not an emergency plan. Vendor names are trademarks of their owners.</p></section>
</div>'''
    page("help.html", "Help", "How the menu, course, and bot work.", 0, "help.html", help_body)

    legal = '''<div class="wrap"><h1>Legal</h1>
<p class="lede">Study notes. Not vendor documentation and not legal advice. Zoom, Talkdesk, Avaya, Cisco, and other names are trademarks of their owners. This lab is not affiliated with or endorsed by them.</p>
<section><h2>Emergency and recording</h2>
<p>Those chapters cite pages that opened, mostly Wikipedia and the SIPREC RFCs. They are not an emergency plan and not a privacy opinion. Confirm the rule where you operate.</p></section>
<section><h2>No secrets</h2>
<p>Do not paste tokens, client secrets, or customer records into these pages.</p></section>
</div>'''
    page("legal.html", "Legal", "Study notes and trademarks.", 0, "help.html", legal)

    # ecosystem
    terms = glossary()
    term_html = "".join(f"<li><strong>{e(n)}</strong> — {e(d)}</li>" for n, d, _s in terms)
    mind = diagram_svg("glossary-map", "Glossary mind map", ["SIP", "Zoom", "Talkdesk", "Avaya"], "Ecosystem", False)
    integ = diagram_svg("integration-map", "Integration map", ["CRM confirm", "SIP trunk", "WFM CSV", "Virtual Agent"], "Bridges", True)
    hooks = diagram_svg("future-hooks", "Future hooks", ["Infinity", "Tandem Care", "Retired label", "Confirm date"], "Hooks", False)
    write("assets/diagrams/glossary-map.svg", mind)
    write("assets/diagrams/integration-map.svg", integ)
    write("assets/diagrams/future-hooks.svg", hooks)
    sisters = [
        ("sib_uc", "Cisco-shaped UC course. CUCM menus in this lab stay confirm."),
        ("sib_sip", "SIP campus for the protocol rooms."),
        ("sib_wx", "Webex campus, a different vendor from Zoom."),
        ("sib_ms", "Microsoft voice campus."),
        ("sib_amz", "Amazon Connect campus."),
        ("sib_gen", "Genesys campus."),
        ("sib_f9", "Five9 campus."),
        ("sib_nice", "NICE campus. The title that opened is Contact Path · NICE CXone Lab."),
        ("sib_ai", "AI campus. Not a Zoom, Talkdesk, or Avaya feature."),
    ]
    sis = "".join(
        f'<li><a href="{e(SOURCES[k][2])}">{e(SOURCES[k][1])}</a> — {e(note)}</li>' for k, note in sisters
    )
    eco_rows = source_rows([k for k, _n in sisters] + ["av_infinity", "wiki_sip", "rfc7866"], [
        "Avaya OneCloud CCaaS. confirm. HTTP 404.",
        "Vendor roadmap dates. confirm.",
    ])
    eco = f'''<div class="wrap">
<h1>Ecosystem</h1>
<p class="lede">Words, drawings, sister labs, and the bridges this course can cite. Counts below are from this repository or from pages opened in 2026-10.</p>
<section><h2>Glossary</h2><p>{len(terms)} terms from the lessons. The same term is listed once.</p><ul>{term_html}</ul></section>
<section><h2>Mind map</h2><div class="diagram-frame">{mind}</div>
<p>SIP sits beside the three vendors. The list above is the rest of the vocabulary.</p></section>
<section><h2>Sister technologies</h2>
<p>Config habit: write the page title, the object, and the release. Troubleshooting habit: one hypothesis, then one change, and put the change back if the symptom does not move. Sister labs are separate courses.</p>
<ul>{sis}</ul>
<p><strong>Config.</strong> On Zoom, record API, Smart Embed, or Zoom App. On Talkdesk, record Client Credentials or Authorization Code. On Avaya, record Aura or Infinity before any server name.</p>
<p><strong>Troubleshooting.</strong> If signaling succeeds and audio fails, move from RFC 3261 to RFC 3550. If the pop is empty and the call is up, test the lookup key. If a name 404s, mark confirm.</p></section>
<section><h2>Integration map</h2><div class="diagram-frame">{integ}</div>
<p>CRM field maps were not opened, so that box stays confirm. SIP trunking is the Wikipedia split between a private domain and a public domain. Talkdesk WFM CSV imports were opened. Zoom Virtual Agent was opened as a chat SDK.</p></section>
<section><h2>Bridges</h2>
<p>A bridge in this lab is a cited hop: SIP between domains, a Zoom embed into a web app, a Talkdesk connection, or Avaya's sentence about integrating with existing platforms. A named customer quote was not opened. Customer story: confirm.</p></section>
<section><h2>Future hooks</h2><div class="diagram-frame">{hooks}</div>
<p>Avaya's site talks about moving workflows to Infinity, shared context between humans and AI, and orchestration. Zoom's API navigation lists AI Companion as retired. None of those lines includes a quarter. Dates stay confirm.</p></section>
{go_deeper(eco_rows, "sources/ecosystem/sources.json", "downloads/ecosystem.md")}
</div>'''
    write("sources/ecosystem/sources.json", json.dumps({"opened": "2026-10"}, indent=2))
    write("downloads/ecosystem.md", "# Ecosystem\n\nStudy notes. Not vendor documentation.\n")
    page("ecosystem.html", "Ecosystem", "Glossary, bridges, and sister labs.", 0, "ecosystem.html", eco)

    # quizzes
    blocks = []
    for room in ROOMS:
        for q, ans, note in room["quiz"]:
            blocks.append(
                f'<div class="quiz" data-quiz data-answer="{e(ans)}"><p><a href="rooms/{room["slug"]}.html">{e(room["title"])}</a>. {e(q)}</p>'
                f'<button type="button" class="choice ghost" data-choice="True">True</button>'
                f'<button type="button" class="choice ghost" data-choice="False">False</button>'
                f'<p class="quiz-note" hidden>{e(note)}</p></div>'
            )
    page("quizzes.html", "Quizzes", "Questions from the lessons.", 0, "play.html",
         f'<div class="wrap"><h1>Quizzes</h1><p class="lede">{len(blocks)} questions, two from each lesson.</p>{"".join(blocks)}</div>')

    # charts — counts only
    charts = [
        ("lessons", n_rooms, f"{n_rooms} lessons in this repository"),
        ("tracks", n_tracks, f"{n_tracks} tracks in this repository"),
        ("zoom-cx-names", 4, "Zoom CX names read on the API navigation: Contact Center, Virtual Agent, Quality Management, Workforce Management"),
        ("talkdesk-grants", 2, "OAuth grants defined in the Talkdesk authentication table that opened"),
        ("avaya-uc-names", 3, "UC names listed together: Aura, Aura Private Cloud, IP Office"),
        ("confirm-gaps", 4, "Gaps with no URL: Zoom Phone marketing 404, OneCloud 404, Cisco 403, FCC 403"),
    ]
    chart_html = []
    for cid, value, label in charts:
        width = min(100, value * 8)
        chart_html.append(
            f'<section data-chart="{cid}"><h2>{e(label)}</h2><p><b>{value}</b></p>'
            f'<div class="chart-bar" style="width:{width}%"></div></section>'
        )
    page("charts.html", "Charts", "Counts from this lab and from names that were read.", 0, "diagrams.html",
         '<div class="wrap"><h1>Charts</h1><p class="lede">These bars count lessons, tracks, or names read on a page. They are not vendor KPIs. Service level and handle time were not opened, so they are not drawn.</p>'
         + "".join(chart_html) + "</div>")

    # flashcards
    cards = []
    for name, definition, slug in terms:
        cards.append({"front": name, "back": definition, "source": f"rooms/{slug}.html"})
    # pad with source facts if under 40 — we have plenty
    write("downloads/flashcards.json", json.dumps({"cards": cards}, indent=2))
    card_html = "".join(
        f"<article><h2>{e(c['front'])}</h2><p>{e(c['back'])}</p><p>Source: {e(c['source'])}</p></article>" for c in cards
    )
    write("downloads/flashcards.html",
          "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Flashcards</title>"
          "<link rel=\"stylesheet\" href=\"../assets/css/footer.css\">"
          "<style>body{font-family:system-ui,sans-serif;margin:24px}article{border:1px solid #99f6e4;border-radius:12px;padding:12px;margin:8px 0}</style></head><body>"
          f"<h1>Flashcards</h1><p class=\"lede\">Terms from the lessons.</p>{card_html}"
          "<section class=\"go-deeper\"><h2>Sources and go deeper</h2><p>Opened 2026-10. A row marked confirm has no link, because that page was not verified.</p>"
          "<ul><li><strong>Lab.</strong> Terms are defined in the lesson pages. <span style=\"white-space:nowrap\">last checked 2026-10</span></li></ul></section>"
          "<p>These are study notes, not vendor documentation and not legal advice. learning-only student project. "
          f"<a href=\"{BRAND}/#contact\">{BRAND}/#contact</a> "
          f"<a href=\"{REPO}\">{REPO}</a> <a href=\"{TREE}\">{TREE}</a></p></body></html>")
    page("flashcards.html", "Flashcards", "Terms from the lessons.", 0, "downloads.html",
         f'<div class="wrap"><h1>Flashcards</h1><p class="lede">{len(cards)} terms. The same card is also in the JSON download.</p>'
         f'<p><a href="downloads/flashcards.json">JSON</a> · <a href="downloads/flashcards.html">Printable HTML</a></p>{card_html}</div>')

    # catalog
    pages = []
    for href, label, blurb, _i in NAV:
        pages.append({"title": label, "href": href, "blurb": blurb, "keys": [label.lower()]})
    for tid, name, blurb, _c in TRACKS:
        pages.append({"title": name, "href": f"tracks/{tid}.html", "blurb": blurb, "keys": [name.lower(), tid.lower()]})
    for room in ROOMS:
        pages.append({"title": room["title"], "href": f"rooms/{room['slug']}.html", "blurb": room["code"], "keys": [room["slug"], room["title"].lower()]})
    write("assets/data/catalog.json", json.dumps({"pages": pages}, indent=2))

    # zip of markdown
    zpath = ROOT / "downloads" / "zta-lab-notes.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
        for room in ROOMS:
            zf.write(ROOT / "downloads" / "rooms" / f"{room['slug']}.md", f"rooms/{room['slug']}.md")
        zf.writestr("README.txt", "Study notes. Not vendor documentation and not legal advice.\n")

    write("sw.js", r'''/* Cache shell for the ZTA study lab. */
var CACHE = "zta-lab-r2";
var SHELL = ["./index.html","./start.html","./assets/css/uc.css","./assets/js/frame.js","./guide/guide.js","./favicon.svg"];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(function (hit) { return hit || fetch(event.request); }));
});
''')
    write("manifest.webmanifest", json.dumps({
        "name": "Zoom Talkdesk Avaya Lab",
        "short_name": "ZTA Lab",
        "start_url": "./index.html",
        "display": "standalone",
        "background_color": "#f3f6ff",
        "theme_color": "#0f9b8e",
        "icons": [{"src": "favicon.svg", "sizes": "any", "type": "image/svg+xml"}],
    }, indent=2))
    write(".nojekyll", "")
    counts = {"tracks": n_tracks, "lessons": n_rooms, "diagrams": n_diagrams, "terms": len(terms), "quizzes": n_rooms * 2}
    write("assets/data/counts.json", json.dumps(counts, indent=2))
    print(json.dumps(counts))


if __name__ == "__main__":
    build_rooms()
    build_tracks()
    build_hubs()
