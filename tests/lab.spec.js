import { test, expect } from "@playwright/test";
import path from "node:path";

const shotDir = path.join(process.cwd(), "docs", "screenshots");

async function quiet(page) {
  await page.addInitScript(() => {
    localStorage.setItem("zta-guide-v1", JSON.stringify({ tour: 1, greeted: 1, stopIdle: 1 }));
  });
}

test("home, lesson, chat, and offline", async ({ page }, info) => {
  await quiet(page);
  await page.goto("/index.html");
  await expect(page.locator("h1")).toContainText("Zoom, Talkdesk, and Avaya");
  const wide = info.project.name === "desktop";
  await page.screenshot({ path: path.join(shotDir, wide ? "home-1440.png" : "home-390.png"), fullPage: false });
  await page.locator(".monkey-btn").click();
  await expect(page.locator(".py-chat-log")).toBeVisible();
  await page.locator("#py-chat-input").fill("what is SIP for");
  await page.locator("#py-chat-input").press("Enter");
  await expect(page.locator(".py-msg-bot").last()).toContainText(/SIP|don't have that yet/i, { timeout: 10000 });
  await page.screenshot({ path: path.join(shotDir, wide ? "bot-1440.png" : "bot-390.png") });

  await page.goto("/rooms/sip-jobs.html");
  await expect(page.locator("h1")).toContainText("What SIP is for");
  await page.screenshot({ path: path.join(shotDir, wide ? "lesson-1440.png" : "lesson-390.png") });

  await page.goto("/play.html");
  await page.locator("#sim-run").click();
  await expect(page.locator("#sim-out")).toContainText("Simulation only");
  await expect(page.locator("#sim-out")).toContainText("Not run on a network");

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
  await page.locator("#py-chat-input").fill("what is SIP for");
  await page.locator("#py-chat-input").press("Enter");
  await expect(page.locator(".py-msg-bot").last()).toContainText(/SIP|don't have that yet/i, { timeout: 10000 });
  await page.context().setOffline(false);
});
