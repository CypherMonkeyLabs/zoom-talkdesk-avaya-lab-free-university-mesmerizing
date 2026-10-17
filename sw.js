/* Cache shell for the ZTA study lab. */
var CACHE = "zta-lab-r3";
var SHELL = ["./index.html","./start.html","./assets/css/uc.css","./assets/js/frame.js","./guide/guide.js","./guide/guide.css","./guide/dragbot.js","./favicon.svg"];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(function (hit) { return hit || fetch(event.request); }));
});
