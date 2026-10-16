import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const broken = [];

const allowedBrand = [
  /^https:\/\/cyphermonkeylabs\.com(\/|$|#)/,
  /^https:\/\/github\.com\/CypherMonkeyLabs(\/|$)/,
  /^https:\/\/linktr\.ee\/cypherMonkey$/,
];
const citationHosts = new Set([
  "www.rfc-editor.org",
  "www.zoom.com",
  "support.zoom.com",
  "developers.zoom.us",
  "www.talkdesk.com",
  "docs.talkdesk.com",
  "www.avaya.com",
  "documentation.avaya.com",
  "en.wikipedia.org",
  "www.iana.org",
  "www.itu.int",
]);
const banned = /(?:^|[^a-z0-9.])(?:x\.com|linkedin\.com|huggingface\.co)|mailto:|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/i;

function walk(dir, out, ext) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, out, ext);
    else if (!ext || name.endsWith(ext)) out.push(path);
  }
  return out;
}

const css = readFileSync(join(root, "assets/css/shell.css"), "utf8");
const face = css.matchAll(/url\("([^"]+\.woff2)"\)/g);
for (const match of face) {
  const file = resolve(join(root, "assets/css"), match[1]);
  if (!existsSync(file)) broken.push("missing font " + match[1]);
}
if (/fonts\.googleapis\.com|fonts\.gstatic\.com|https?:\/\/[^)"']*cdn\./i.test(css)) broken.push("css uses a remote font");
const htmlFiles = walk(root, [], ".html");
const hrefRe = /(?:href|src)="([^"]+)"/g;
for (const file of htmlFiles) {
  const text = readFileSync(file, "utf8");
  const rel = file.slice(root.length + 1);
  if (banned.test(text.replace(/sources\.json/g, ""))) {
    if (banned.test(text)) broken.push(rel + " banned or email-shaped text");
  }
  if (!text.includes("Sources and go deeper") || !text.includes("last checked 2026-10")) {
    broken.push(rel + " missing sources block");
  }
  if (!text.includes("learning-only student project") || !text.includes("linktr.ee/cypherMonkey")) {
    broken.push(rel + " missing disclaimer or brand");
  }
  if (!text.includes("not vendor documentation") && !text.includes("not legal advice")) {
    broken.push(rel + " missing study-note disclaimer");
  }
  let match;
  hrefRe.lastIndex = 0;
  while ((match = hrefRe.exec(text))) {
    const href = match[1];
    if (!href || href.startsWith("#") || href.startsWith("data:") || href.startsWith("mailto:")) continue;
    if (href.startsWith("http:") || href.startsWith("https:")) {
      let host = "";
      try { host = new URL(href).host; } catch (err) { broken.push(rel + " bad url " + href); continue; }
      const brandOk = allowedBrand.some((re) => re.test(href));
      if (!brandOk && !citationHosts.has(host)) broken.push(rel + " host " + host);
      continue;
    }
    const clean = href.split("#")[0].split("?")[0];
    if (!clean) continue;
    const target = resolve(dirname(file), clean);
    if (!existsSync(target)) broken.push(rel + " -> " + href);
  }
}

function startChrome(port) {
  return spawn("google-chrome", [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=" + port,
    "--user-data-dir=/tmp/zta-chrome",
    "--window-size=1440,900",
    "about:blank",
  ], { stdio: "ignore" });
}

async function cdp() {
  const port = 9222;
  const chrome = startChrome(port);
  const deadline = Date.now() + 15000;
  let targets;
  while (Date.now() < deadline) {
    try {
      const res = await fetch("http://127.0.0.1:" + port + "/json/version");
      if (res.ok) { targets = await (await fetch("http://127.0.0.1:" + port + "/json")).json(); break; }
    } catch (err) { /* booting */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!targets) {
    chrome.kill();
    throw new Error("chrome did not start");
  }
  const page = targets.find((t) => t.type === "page") || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
  });
  function send(method, params) {
    const msgId = ++id;
    return new Promise((resolve) => {
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  await send("Page.enable");
  await send("Runtime.enable");
  return { chrome, ws, send };
}

async function shot(send, url, width, height, file) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 1200));
  const evaled = await send("Runtime.evaluate", {
    expression: `(() => {
      const h1 = document.querySelector("main h1");
      const lede = document.querySelector("main .lede");
      const guards = [h1, lede].filter(Boolean);
      function hits(sel) {
        const nodes = document.querySelectorAll(sel);
        for (const node of nodes) {
          const style = getComputedStyle(node);
          if (style.display === "none" || style.visibility === "hidden" || node.hidden) continue;
          const a = node.getBoundingClientRect();
          if (a.width < 2 || a.height < 2) continue;
          for (const guard of guards) {
            const b = guard.getBoundingClientRect();
            const clear = a.right < b.left + 1 || a.left > b.right - 1 || a.bottom < b.top + 1 || a.top > b.bottom - 1;
            if (!clear) return sel;
          }
        }
        return "";
      }
      const doc = document.documentElement;
      return {
        overflow: doc.scrollWidth - doc.clientWidth,
        cover: hits(".bot-dock, .tour-card, .greet-card, .phone-bar, .idle-note"),
        font: h1 ? getComputedStyle(h1).fontFamily : "",
        title: document.title
      };
    })()`,
    returnByValue: true,
  });
  const value = evaled.result && evaled.result.result && evaled.result.result.value;
  if (!value) broken.push("no layout " + url);
  else {
    if (value.overflow > 1) broken.push("overflow " + width + " " + url + " " + value.overflow);
    if (value.cover) broken.push("covers title " + width + " " + url + " " + value.cover);
    if (value.font && !/Canon Sans|system-ui|sans-serif/i.test(value.font)) broken.push("font " + value.font);
  }
  const image = await send("Page.captureScreenshot", { format: "png" });
  const data = image.result && image.result.data;
  if (data) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(data, "base64"));
  }
}

const server = spawn("python3", ["-m", "http.server", "8765", "--bind", "127.0.0.1"], { cwd: root, stdio: "ignore" });
let session;
try {
  await new Promise((r) => setTimeout(r, 300));
  session = await cdp();
  const base = "http://127.0.0.1:8765/";
  await shot(session.send, base + "index.html", 390, 844, join(root, "docs/screenshots/home-390.png"));
  await shot(session.send, base + "index.html", 1440, 900, join(root, "docs/screenshots/home-1440.png"));
  await shot(session.send, base + "rooms/sip-jobs.html", 390, 844, join(root, "docs/screenshots/lesson-390.png"));
  await shot(session.send, base + "ecosystem.html", 1440, 900, join(root, "docs/screenshots/ecosystem-1440.png"));
} catch (err) {
  broken.push("browser " + err.message);
} finally {
  if (session) { session.ws.close(); session.chrome.kill(); }
  server.kill();
}

if (broken.length) {
  console.error(broken.slice(0, 40).join("\n"));
  console.error("broken", broken.length);
  process.exit(1);
}
console.log("ok", htmlFiles.length, "html");
