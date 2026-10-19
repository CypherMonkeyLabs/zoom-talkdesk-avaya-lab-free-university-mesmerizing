/* Scope is the directory that contains this file.
   The page registers it with a scope of that same directory, so on
   https://cyphermonkeylabs.com/zoom-talkdesk-avaya-lab-free-university-mesmerizing/
   the worker covers that folder only. */
const CACHE_NAME = "zta-lab-pwa-v5";
const CACHE_BUDGET_NOTE = "Precache stays under 3.5 MB. The chat engine and index are included. The notes zip is not.";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./start.html",
  "./play.html",
  "./help.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./js/content/ztabot-index.json",
  "./shared/pybot-chat/engine.js",
  "./shared/pybot-chat/ui.js",
  "./shared/pybot-chat/chat.css",
  "./guide/guide.js",
  "./guide/guide.css",
  "./guide/dragbot.js",
  "./guide/chat-host.js",
  "./assets/js/frame.js",
  "./assets/js/theme-boot.js",
  "./assets/js/play-drill.js",
  "./assets/js/play-sim.js",
  "./assets/js/university.js",
  "./assets/js/pwa.js",
  "./assets/js/studio.js",
  "./assets/js/tryit.js",
  "./assets/fonts/outfit-latin.woff2",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/splash.png",
  "./rooms/sip-jobs.html",
  "./tracks/T6.html",
  "./assets/css/canon.css",
  "./assets/css/footer.css",
  "./assets/css/frame.css",
  "./assets/css/polish.css",
  "./assets/css/shell.css",
  "./assets/css/studio.css",
  "./assets/css/uc.css",
  "./assets/css/university.css",
  "./assets/css/wow.css",
  "./diagrams.html",
  "./flows.html",
  "./listen.html",
  "./downloads.html",
  "./quizzes.html",
  "./ecosystem.html",
  "./legal.html",
  "./flashcards.html",
  "./charts.html",
  "./tracks/T1.html",
  "./tracks/T10.html",
  "./tracks/T11.html",
  "./tracks/T12.html",
  "./tracks/T2.html",
  "./tracks/T3.html",
  "./tracks/T4.html",
  "./tracks/T5.html",
  "./tracks/T7.html",
  "./tracks/T8.html",
  "./tracks/T9.html",
  "./rooms/ai-agents.html",
  "./rooms/analytics-names.html",
  "./rooms/aura-docs.html",
  "./rooms/aura-named.html",
  "./rooms/aura-versus-infinity.html",
  "./rooms/avaya-ai-hooks.html",
  "./rooms/cc-agents.html",
  "./rooms/cc-embed.html",
  "./rooms/certifications-confirm.html",
  "./rooms/crm-talkdesk.html",
  "./rooms/crm-zoom.html",
  "./rooms/cucm-ucce-gap.html",
  "./rooms/e911-words.html",
  "./rooms/experience-platform-name.html",
  "./rooms/from-avaya.html",
  "./rooms/infinity-lines.html",
  "./rooms/ladder-sketch.html",
  "./rooms/licenses-named.html",
  "./rooms/migration-habit.html",
  "./rooms/numbers-confirm.html",
  "./rooms/offer-answer.html",
  "./rooms/roadmap-confirm.html",
  "./rooms/routing-words.html",
  "./rooms/rtp-and-srtp.html",
  "./rooms/siprec-qm.html",
  "./rooms/talkdesk-cloud.html",
  "./rooms/talkdesk-oauth.html",
  "./rooms/talkdesk-sync.html",
  "./rooms/talkdesk-wfm-api.html",
  "./rooms/transfer-confirm.html",
  "./rooms/virtual-agent.html",
  "./rooms/wfm-word.html",
  "./rooms/zoom-api-hour.html",
  "./rooms/zoom-phone-dev.html",
  "./rooms/zoom-workplace.html",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("./offline.html") : Promise.resolve())))
  );
});
