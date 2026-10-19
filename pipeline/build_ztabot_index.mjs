/* Build the offline chat index from this lab's own HTML.
   Usage: node pipeline/build_ztabot_index.mjs
   Writes js/content/ztabot-index.json. Do not edit that file by hand. */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tokens } from "../shared/pybot-chat/engine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(path.join(root, "assets/data/catalog.json"), "utf8"));

const SYN = {
  signalling: "signaling",
  licence: "license",
  licences: "license",
  realtime: "rtp",
  oauth2: "oauth",
};

const WORLDS = [
  ["0", "Switchboard meadow", "A study scene for Zoom Workplace. It is a theme, not a vendor site."],
  ["1", "Queue atrium", "A study scene for Zoom Contact Center. It is a theme, not a vendor site."],
  ["2", "Cloud desk", "A study scene for Talkdesk. It is a theme, not a vendor site."],
  ["3", "Aura hall", "A study scene for Avaya Aura. It is a theme, not a vendor site."],
  ["4", "Infinity court", "A study scene for Avaya Infinity. It is a theme, not a vendor site."],
  ["5", "Signal pier", "A study scene for SIP and media. It is a theme, not a vendor site."],
  ["6", "Ladder yard", "A study scene for call flows. It is a theme, not a vendor site."],
  ["7", "Roster loft", "A study scene for WFM and recording. It is a theme, not a vendor site."],
  ["8", "Beacon room", "A study scene for E911 and analytics. It is a theme, not a vendor site."],
  ["9", "Bridge gallery", "A study scene for CRM and AI notes. It is a theme, not a vendor site."],
  ["10", "Cutover path", "A study scene for migration notes. It is a theme, not a vendor site."],
  ["11", "Ledger gate", "A study scene for licensing and the roadmap. It is a theme, not a vendor site."],
];

function plain(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(text, max = 420) {
  const clean = plain(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  if (stop > 80) return cut.slice(0, stop + 1);
  return cut.trim();
}

function parseHtml(html) {
  const title = plain((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1]);
  const lede = plain((html.match(/<p class="lede">([\s\S]*?)<\/p>/) || [])[1]);
  const five = (html.match(/<section id="five"[\s\S]*?<ul>([\s\S]*?)<\/ul>/) || [])[1] || "";
  const bullets = [...five.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => plain(match[1]));
  return { title, lede, bullets };
}

const docs = [];

function add(doc) {
  const bodyText = [doc.ti, doc.body].filter(Boolean).join("\n");
  const row = {
    i: doc.i,
    k: doc.k,
    ti: doc.ti,
    h: doc.h,
    s: doc.s || "",
    ex: clip(doc.ex || doc.body || doc.ti),
    w: tokens(bodyText, SYN, 3),
    tw: tokens(doc.ti, SYN, 2),
  };
  if (doc.eg) row.eg = String(doc.eg).slice(0, 180);
  docs.push(row);
}

let lessonCount = 0;
for (const page of catalog.pages) {
  const html = readFileSync(path.join(root, page.href), "utf8");
  const parsed = parseHtml(html);
  const title = parsed.title || page.title;
  const lede = parsed.lede || page.blurb || "";
  const blob = `${lede} ${parsed.bullets.join(" ")}`;
  const unconfirmed = /\bconfirm\b/i.test(blob);
  const stamp = unconfirmed
    ? "Checked 2026-10. Part of this note is unconfirmed. "
    : "Checked 2026-10. ";
  const isLesson = page.href.startsWith("rooms/");
  const kind = isLesson ? "lesson" : (page.href.startsWith("tracks/") ? "section" : "page");
  if (isLesson) lessonCount += 1;
  add({
    i: `${kind}:${page.href}`,
    k: kind,
    ti: title,
    h: page.href,
    s: page.blurb || "",
    ex: `${stamp}${title}. ${lede}`,
    eg: parsed.bullets[0] || "",
    body: `${title}\n${lede}\n${parsed.bullets.join("\n")}\n${page.blurb || ""}`,
  });
}

for (const [id, title, blurb] of WORLDS) {
  add({
    i: `level:${id}`,
    k: "level",
    ti: title,
    h: "index.html#worlds",
    s: "worlds",
    ex: `Checked 2026-10. ${blurb}`,
    body: `${title} ${blurb}`,
  });
}

if (lessonCount !== 36) {
  console.error(`expected 36 lessons, found ${lessonCount}`);
  process.exit(1);
}

const SKIP = new Set("this that with from have your page note study checked part unconfirmed where what when".split(" "));

function generatedLessonSeeds() {
  const out = [];
  for (const doc of docs) {
    if (doc.k !== "lesson") continue;
    const titleTerms = tokens(doc.ti, SYN).filter((term) => term.length >= 3 && !SKIP.has(term));
    if (!titleTerms.length) continue;
    const excerptTerms = tokens(doc.ex, SYN).filter((term) => term.length >= 4 && !SKIP.has(term)).slice(0, 8);
    out.push({
      i: `seed:gen:${doc.i}`,
      h: doc.h,
      ti: doc.ti,
      k: "lesson",
      topic: titleTerms[0],
      any: titleTerms.slice(0, 3),
      allow: [...new Set([...titleTerms, ...excerptTerms])],
      rank: 0,
      how: false,
      ex: doc.ex,
      eg: doc.eg || "",
    });
  }
  return out;
}

const payload = {
  v: 2,
  note: "Generated by pipeline/build_ztabot_index.mjs from this lab's HTML. Excerpts are the page title and lede, stamped with the 2026-10 check. Seeds are one low-rank title seed per lesson. Do not edit by hand.",
  lessons: lessonCount,
  syn: SYN,
  seeds: generatedLessonSeeds(),
  docs,
};

const outPath = path.join(root, "js/content/ztabot-index.json");
writeFileSync(outPath, `${JSON.stringify(payload)}\n`);
console.log(`ztabot index: ${docs.length} docs, ${lessonCount} lessons, ${payload.seeds.length} seeds -> ${outPath}`);
