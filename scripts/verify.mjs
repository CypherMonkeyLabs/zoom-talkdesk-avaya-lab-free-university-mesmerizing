import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { connect as connectTcp } from "node:net";
import { createHash, randomBytes } from "node:crypto";

// Chrome DevTools uses a WebSocket. Node 22+ provides global WebSocket.
// Node 20 does not, so this file includes a small client for ws:// on localhost.
// Set ZTA_FORCE_WS_FALLBACK=1 to exercise that client on a newer Node.

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

const guideJs = readFileSync(join(root, "guide/guide.js"), "utf8");
if (/eleven tracks/.test(guideJs)) broken.push("guide still says eleven tracks");
if (!guideJs.includes("realTrackCount")) broken.push("guide does not count tracks");
const homeHtml = readFileSync(join(root, "index.html"), "utf8");
if (homeHtml.includes("Phone, contact center, and the pages that opened.")) broken.push("old home headline");
if (!homeHtml.includes("Zoom, Talkdesk, and Avaya study notes.")) broken.push("home headline missing");

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

function openSocket(url) {
  const native = !process.env.ZTA_FORCE_WS_FALLBACK && typeof globalThis.WebSocket === "function";
  if (native) return new globalThis.WebSocket(url);
  return nodeWebSocket(url);
}

function nodeWebSocket(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "ws:") throw new Error("verify fallback only speaks ws://");
  const target = new EventTarget();
  const key = randomBytes(16).toString("base64");
  const socket = connectTcp({ host: parsed.hostname, port: Number(parsed.port) || 80 });
  let buf = Buffer.alloc(0);
  let open = false;
  let fragments = [];
  function fail(err) {
    const event = new Event("error");
    event.message = err && err.message ? err.message : "websocket failed";
    target.dispatchEvent(event);
  }
  function sendFrame(opcode, data) {
    const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
    const mask = randomBytes(4);
    let header;
    if (payload.length < 126) {
      header = Buffer.from([0x80 | opcode, 0x80 | payload.length]);
    } else if (payload.length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(payload.length), 2);
    }
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
    socket.write(Buffer.concat([header, mask, masked]));
  }
  function takeFrames() {
    while (buf.length >= 2) {
      const opcode = buf[0] & 0x0f;
      const fin = (buf[0] & 0x80) !== 0;
      let length = buf[1] & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (buf.length < 4) return;
        length = buf.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (buf.length < 10) return;
        const wide = buf.readBigUInt64BE(2);
        if (wide > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("websocket frame too large");
        length = Number(wide);
        offset = 10;
      }
      const masked = (buf[1] & 0x80) !== 0;
      if (buf.length < offset + (masked ? 4 : 0) + length) return;
      let data = buf.slice(offset + (masked ? 4 : 0), offset + (masked ? 4 : 0) + length);
      if (masked) {
        const mask = buf.slice(offset, offset + 4);
        data = Buffer.from(data);
        for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
      }
      buf = buf.slice(offset + (masked ? 4 : 0) + length);
      if (opcode === 0x8) {
        socket.end();
        continue;
      }
      if (opcode === 0x9) {
        sendFrame(0x0a, data);
        continue;
      }
      if (opcode === 0x1 || opcode === 0x0) {
        fragments.push(data);
        if (!fin) continue;
        const text = Buffer.concat(fragments).toString("utf8");
        fragments = [];
        const event = new Event("message");
        event.data = text;
        target.dispatchEvent(event);
      }
    }
  }
  socket.on("connect", () => {
    const path = parsed.pathname + parsed.search;
    socket.write(
      "GET " + path + " HTTP/1.1\r\n" +
      "Host: " + parsed.host + "\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      "Sec-WebSocket-Key: " + key + "\r\n" +
      "Sec-WebSocket-Version: 13\r\n\r\n"
    );
  });
  socket.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    if (!open) {
      const split = buf.indexOf("\r\n\r\n");
      if (split < 0) return;
      const head = buf.slice(0, split).toString("utf8");
      buf = buf.slice(split + 4);
      const accept = createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
      if (!head.startsWith("HTTP/1.1 101") || !head.includes(accept)) {
        fail(new Error("websocket handshake failed"));
        socket.destroy();
        return;
      }
      open = true;
      target.dispatchEvent(new Event("open"));
    }
    try { takeFrames(); } catch (err) { fail(err); socket.destroy(); }
  });
  socket.on("error", fail);
  target.send = (data) => sendFrame(0x1, data);
  target.close = () => {
    try { sendFrame(0x8, Buffer.alloc(0)); } catch (err) { /* already closed */ }
    socket.end();
  };
  return target;
}

function startChrome(port) {
  const profile = "/tmp/zta-chrome-verify";
  rmSync(profile, { recursive: true, force: true });
  mkdirSync(profile, { recursive: true });
  return spawn("google-chrome", [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profile,
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
  const ws = openSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", (event) => reject(new Error(event.message || "websocket failed")));
  });
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
  await send("Network.enable");
  await send("Network.setBypassServiceWorker", { bypass: true });
  return { chrome, ws, send };
}

async function shot(send, url, width, height, file) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 1200));
  const evaled = await send("Runtime.evaluate", {
    expression: `(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
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
    awaitPromise: true,
    returnByValue: true,
  });
  const value = evaled.result && evaled.result.result && evaled.result.result.value;
  if (!value) broken.push("no layout " + url);
  else {
    if (value.overflow > 1) broken.push("overflow " + width + " " + url + " " + value.overflow);
    if (value.cover) broken.push("covers title " + width + " " + url + " " + value.cover);
    if (value.font && !/Canon Sans|system-ui|sans-serif/i.test(value.font)) broken.push("font " + url + " " + value.font);
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
