import { test, expect } from "@playwright/test";
import path from "node:path";

const shotDir = path.join(process.cwd(), "docs", "screenshots");

async function quiet(page) {
  await page.addInitScript(() => {
    localStorage.setItem("zta-guide-v1", JSON.stringify({ tour: 1, greeted: 1, stopIdle: 1 }));
  });
}

async function ask(page, text) {
  const input = page.locator("#py-chat-input");
  await input.fill(text);
  await input.press("Enter");
}

async function pointHits(page, selector) {
  return page.locator(selector).evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const top = document.elementFromPoint(x, y);
    const viewH = window.innerHeight;
    const inView = rect.top >= 0 && rect.bottom <= viewH + 1 && rect.height > 8;
    return { inView, hit: !!(top && (top === el || el.contains(top))) };
  });
}

test("chat answer quotes the SIP lesson", async ({ page }, info) => {
  await quiet(page);
  await page.goto("/index.html");
  await expect(page.locator("h1")).toContainText("Zoom, Talkdesk, and Avaya");
  const wide = info.project.name === "desktop";
  const short = info.project.name === "short";
  if (!short) {
    await page.screenshot({ path: path.join(shotDir, wide ? "home-1440.png" : "home-390.png"), fullPage: false });
  }
  await page.locator(".monkey-btn").click();
  await expect(page.locator("#py-chat-input")).toBeVisible();
  await expect(page.locator(".py-chat-form button[type=submit]")).toBeVisible();
  const inputHit = await pointHits(page, "#py-chat-input");
  const sendHit = await pointHits(page, ".py-chat-form button[type=submit]");
  expect(inputHit.inView).toBe(true);
  expect(sendHit.inView).toBe(true);
  expect(inputHit.hit).toBe(true);
  expect(sendHit.hit).toBe(true);
  await ask(page, "what is SIP for");
  const reply = page.locator(".py-msg-bot").last();
  await expect(reply).toContainText(/SIP/, { timeout: 10000 });
  await expect(reply.locator("a")).toHaveAttribute("href", /sip-jobs\.html/);
  if (!short) {
    await page.screenshot({ path: path.join(shotDir, wide ? "bot-1440.png" : "bot-390.png") });
    await page.goto("/rooms/sip-jobs.html");
    await expect(page.locator("h1")).toContainText("What SIP is for");
    await page.screenshot({ path: path.join(shotDir, wide ? "lesson-1440.png" : "lesson-390.png") });
  }
});

test("off-topic questions fall back with no lesson link", async ({ page }) => {
  await quiet(page);
  await page.goto("/index.html");
  await page.locator(".monkey-btn").click();
  await ask(page, "Zoom meeting background");
  let reply = page.locator(".py-msg-bot").last();
  await expect(reply).toContainText(/I don't have that yet/i, { timeout: 10000 });
  await expect(reply.locator("a")).toHaveCount(0);
  await ask(page, "how does NICE CXone score a call");
  reply = page.locator(".py-msg-bot").last();
  await expect(reply).toContainText(/I don't have that yet/i, { timeout: 10000 });
  await expect(reply.locator("a")).toHaveCount(0);
});

test("offline reload still opens a lesson and the chat", async ({ page }) => {
  await quiet(page);
  await page.goto("/index.html");
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    await reg.update();
  });
  await page.reload();
  await expect(page.locator("h1")).toBeVisible();
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toContainText("Zoom, Talkdesk, and Avaya");
  await page.goto("/rooms/sip-jobs.html");
  await expect(page.locator("h1")).toContainText("What SIP is for");
  await page.locator(".monkey-btn").click();
  await ask(page, "what is SIP for");
  await expect(page.locator(".py-msg-bot").last()).toContainText(/SIP/, { timeout: 10000 });
  await page.context().setOffline(false);
});

test("SIP simulation stays labeled as a simulation", async ({ page }) => {
  await quiet(page);
  await page.goto("/play.html");
  await page.locator("#sim-run").click();
  await expect(page.locator("#sim-out")).toContainText("Simulation only");
  await expect(page.locator("#sim-out")).toContainText("Not run on a network");
  await expect(page.locator("#sim-out")).not.toContainText(/connected to Zoom|Talkdesk API|Avaya Aura session/i);
});
