/* 390x844 first-visit check. Skip and Next must be tappable above the dock. */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = 8767;
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore",
});

function fail(message) {
  const err = new Error(message);
  err.tour = true;
  throw err;
}

try {
  await new Promise((r) => setTimeout(r, 300));
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://127.0.0.1:" + port + "/index.html", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".tour-card:visible", { timeout: 4000 });

  for (let step = 0; step < 6; step += 1) {
    const box = await page.evaluate(() => {
      const card = document.querySelector(".tour-card");
      const next = card.querySelector("[data-next]");
      const skip = card.querySelector("[data-skip]");
      const phone = document.querySelector(".phone-bar");
      const monkey = document.querySelector(".monkey-btn");
      const h1 = document.querySelector("main h1");
      const lede = document.querySelector("main .lede");
      function rect(el) {
        const r = el.getBoundingClientRect();
        return { t: r.top, b: r.bottom, l: r.left, r: r.right, h: r.height };
      }
      function overlaps(a, b) {
        if (!a || !b) return false;
        return !(a.r < b.l + 1 || a.l > b.r - 1 || a.b < b.t + 1 || a.t > b.b - 1);
      }
      function tappable(el) {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const top = document.elementFromPoint(x, y);
        return !!(top && (top === el || el.contains(top)));
      }
      const c = rect(card);
      const p = rect(phone);
      const m = rect(monkey);
      return {
        step: card.querySelector("[data-step]").textContent,
        cardH: Math.round(c.h),
        scroll: card.scrollHeight,
        client: card.clientHeight,
        fits: card.scrollHeight <= card.clientHeight + 1,
        nextTap: tappable(next),
        skipTap: tappable(skip),
        nextAbove: rect(next).b <= p.t + 1 && rect(next).b <= m.t + 1,
        skipAbove: rect(skip).b <= p.t + 1 && rect(skip).b <= m.t + 1,
        coversDock: overlaps(c, p) || overlaps(c, m),
        coversTitle: overlaps(c, rect(h1)) || overlaps(c, rect(lede)),
      };
    });
    console.log(JSON.stringify(box));
    if (!box.fits) fail("step " + step + " card scrolls: " + box.scroll + " > " + box.client);
    if (!box.nextTap || !box.skipTap) fail("step " + step + " buttons are not tappable");
    if (!box.nextAbove || !box.skipAbove || box.coversDock) fail("step " + step + " buttons meet the dock or mascot");
    if (box.coversTitle) fail("step " + step + " covers the title or lede");
    if (step < 5) await page.locator(".tour-card [data-next]").click();
  }
  await page.locator(".tour-card [data-skip]").click();
  await page.waitForSelector(".tour-layer", { state: "hidden" });
  await browser.close();
  console.log("tour phone ok");
} catch (err) {
  console.error(err && err.tour ? err.message : (err && err.stack ? err.stack : String(err)));
  process.exitCode = 1;
} finally {
  server.kill();
}
