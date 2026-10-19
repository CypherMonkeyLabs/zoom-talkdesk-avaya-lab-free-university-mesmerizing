/* Fill SHELL_ASSETS in sw.js from a priority list, under a 3.5 MB budget. */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const budget = 3_500_000;
const required = [
  "index.html",
  "offline.html",
  "start.html",
  "play.html",
  "help.html",
  "manifest.webmanifest",
  "favicon.svg",
  "js/content/ztabot-index.json",
  "shared/pybot-chat/engine.js",
  "shared/pybot-chat/ui.js",
  "shared/pybot-chat/chat.css",
  "guide/guide.js",
  "guide/guide.css",
  "guide/dragbot.js",
  "guide/chat-host.js",
  "assets/js/frame.js",
  "assets/js/university.js",
  "assets/js/pwa.js",
  "assets/js/studio.js",
  "assets/js/tryit.js",
  "assets/fonts/outfit-latin.woff2",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png",
  "assets/icons/apple-touch-icon.png",
  "assets/icons/splash.png",
  "rooms/sip-jobs.html",
  "tracks/T6.html",
];

for (const name of fs.readdirSync(path.join(root, "assets/css"))) {
  if (name.endsWith(".css")) required.push(`assets/css/${name}`);
}

const rooms = fs.readdirSync(path.join(root, "rooms")).filter((name) => name.endsWith(".html")).map((name) => `rooms/${name}`);
const tracks = fs.readdirSync(path.join(root, "tracks")).filter((name) => name.endsWith(".html")).map((name) => `tracks/${name}`);
const pages = ["diagrams.html", "flows.html", "listen.html", "downloads.html", "quizzes.html", "ecosystem.html", "legal.html", "flashcards.html", "charts.html"];

const chosen = [];
let total = 0;
function consider(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs) || chosen.includes(rel)) return;
  const size = fs.statSync(abs).size;
  if (total + size > budget) return;
  chosen.push(rel);
  total += size;
}
for (const rel of [...required, ...pages, ...tracks, ...rooms]) consider(rel);

const body = chosen.map((rel) => `  "./${rel}",`).join("\n");
const swPath = path.join(root, "sw.js");
let sw = fs.readFileSync(swPath, "utf8");
if (!sw.includes("const SHELL_ASSETS = [")) {
  console.error("sw.js missing SHELL_ASSETS");
  process.exit(1);
}
sw = sw.replace(/const SHELL_ASSETS = \[[\s\S]*?\];/, `const SHELL_ASSETS = [\n  "./",\n${body}\n];`);
sw = sw.replace(/zta-lab-pwa-v\d+/, "zta-lab-pwa-v4");
fs.writeFileSync(swPath, sw);
console.log(`precache ${chosen.length + 1} files, ${total} bytes, budget ${budget}`);
