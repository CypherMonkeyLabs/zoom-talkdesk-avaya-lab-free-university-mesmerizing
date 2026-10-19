/* Write data/lesson-map.json from the catalog and each room's sources file.
   Levels are a study order for review, not a vendor syllabus. last_verified stays null. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(path.join(root, "assets/data/catalog.json"), "utf8"));
const lessons = [];

for (const page of catalog.pages) {
  if (!page.href.startsWith("rooms/")) continue;
  const slug = page.href.slice("rooms/".length, -".html".length);
  const track = Number((page.blurb || "").match(/T(\d+)/)?.[1] || 0);
  const level = Math.min(10, Math.max(0, track - 1));
  const sourcesPath = path.join(root, "rooms/sources", slug, "sources.json");
  if (!existsSync(sourcesPath)) {
    console.error("missing sources", sourcesPath);
    process.exit(1);
  }
  const file = JSON.parse(readFileSync(sourcesPath, "utf8"));
  const sources = (file.sources || []).map((_, index) => `${slug}:${index}`);
  if (!sources.length) {
    console.error("no sources", slug);
    process.exit(1);
  }
  lessons.push({
    key: `T${track}/${slug}`,
    title: page.title,
    level,
    minutes: 12,
    outcomes: [
      `Name the subject of “${page.title}” in this lab's own words`,
      "Leave a confirm row unconfirmed instead of filling a gap",
    ],
    sources,
    has_exercise: true,
    last_verified: null,
  });
}

const map = {
  schema: "lesson-map/1",
  note: "36 room lessons. Levels 0-10 follow track order (T1 is 0, T12 is clamped to 10). Outcomes are study aims for review. last_verified is null until a human re-checks each page.",
  levels: {
    "0": "Zoom Workplace",
    "1": "Zoom Contact Center",
    "2": "Talkdesk",
    "3": "Avaya Aura",
    "4": "Avaya Infinity",
    "5": "SIP and media",
    "6": "Call flows",
    "7": "WFM and recording",
    "8": "E911 and analytics",
    "9": "CRM and migration",
    "10": "Licensing and roadmap",
  },
  lessons,
};

writeFileSync(path.join(root, "data/lesson-map.json"), `${JSON.stringify(map, null, 2)}\n`);
console.log("lesson-map", lessons.length);
