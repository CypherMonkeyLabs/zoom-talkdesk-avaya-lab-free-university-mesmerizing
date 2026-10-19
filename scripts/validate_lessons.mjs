/* Validate data/lesson-map.json against the catalog, room titles, and source ids.
   Exit 1 on any problem. */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(path.join(root, "assets/data/catalog.json"), "utf8"));
const map = JSON.parse(readFileSync(path.join(root, "data/lesson-map.json"), "utf8"));
const schema = JSON.parse(readFileSync(path.join(root, "data/lesson-schema.json"), "utf8"));
const problems = [];
const rooms = catalog.pages.filter((page) => page.href.startsWith("rooms/"));
const mapped = new Map(map.lessons.map((lesson) => [lesson.key, lesson]));
const seen = new Set();

function plain(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

for (const page of rooms) {
  const slug = page.href.slice("rooms/".length, -".html".length);
  const track = Number((page.blurb || "").match(/T(\d+)/)?.[1] || 0);
  const key = `T${track}/${slug}`;
  seen.add(key);
  const lesson = mapped.get(key);
  if (!lesson) {
    problems.push(`${key}: not in lesson-map.json`);
    continue;
  }
  for (const field of schema.required) {
    if (!(field in lesson)) problems.push(`${key}: missing field ${field}`);
  }
  if (!Number.isInteger(lesson.level) || lesson.level < 0 || lesson.level > 10) problems.push(`${key}: level must be 0-10`);
  if (!Array.isArray(lesson.outcomes) || lesson.outcomes.length < 1 || lesson.outcomes.some((item) => typeof item !== "string" || item.length < 8)) {
    problems.push(`${key}: needs at least one outcome`);
  }
  if (!Array.isArray(lesson.sources) || lesson.sources.length < 1) problems.push(`${key}: needs at least one source`);
  const htmlPath = path.join(root, page.href);
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
  const h1 = plain((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1]);
  if (lesson.title !== page.title) problems.push(`${key}: title differs from the catalog`);
  if (h1 && lesson.title !== h1) problems.push(`${key}: title differs from the h1 (${h1})`);
  if (lesson.last_verified !== null && !/^\d{4}-\d{2}-\d{2}$/.test(lesson.last_verified)) {
    problems.push(`${key}: last_verified must be null or YYYY-MM-DD`);
  }
  const sourcesPath = path.join(root, "rooms/sources", slug, "sources.json");
  if (!existsSync(sourcesPath)) {
    problems.push(`${key}: missing sources file`);
    continue;
  }
  const file = JSON.parse(readFileSync(sourcesPath, "utf8"));
  const ids = new Set((file.sources || []).map((_, index) => `${slug}:${index}`));
  for (const id of lesson.sources || []) {
    if (!ids.has(id)) problems.push(`${key}: unknown source id ${id}`);
  }
}

for (const key of mapped.keys()) {
  if (!seen.has(key)) problems.push(`${key}: in lesson-map.json but no such lesson`);
}

const perLevel = {};
for (const lesson of map.lessons) perLevel[lesson.level] = (perLevel[lesson.level] || 0) + 1;
for (const problem of problems) console.log("FAIL", problem);
console.log("lessons:", seen.size, "mapped:", mapped.size, "per level:", JSON.stringify(perLevel));
console.log("validate_lessons:", problems.length, "problems");
process.exit(problems.length ? 1 : 0);
