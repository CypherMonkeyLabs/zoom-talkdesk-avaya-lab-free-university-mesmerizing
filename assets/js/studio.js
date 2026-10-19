/* Study scenes and an aurora layer. CSS only, no library. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = document.querySelector(".hero-band");
  if (hero && !hero.querySelector(".aurora")) {
    var aurora = document.createElement("div");
    aurora.className = "aurora";
    aurora.setAttribute("aria-hidden", "true");
    hero.prepend(aurora);
    if (reduce) aurora.classList.add("is-still");
  }

  var home = /(^|\/)index\.html$/.test(location.pathname) || location.pathname.endsWith("/");
  if (!home || document.getElementById("worlds")) return;
  var host = document.querySelector(".track-map");
  if (!host || !host.parentElement) return;
  var section = document.createElement("section");
  section.className = "wrap study-worlds";
  section.id = "worlds";
  section.innerHTML = '<h2>Study scenes</h2><p class="lede">Twelve themes for the tracks. A scene is a study label, not a vendor product and not a place you can call.</p><div class="world-row" data-worlds></div>';
  var scenes = [
    ["Switchboard meadow", "Zoom Workplace", "tracks/T1.html"],
    ["Queue atrium", "Zoom Contact Center", "tracks/T2.html"],
    ["Cloud desk", "Talkdesk", "tracks/T3.html"],
    ["Aura hall", "Avaya Aura", "tracks/T4.html"],
    ["Infinity court", "Avaya Infinity", "tracks/T5.html"],
    ["Signal pier", "SIP and media", "tracks/T6.html"],
    ["Ladder yard", "Call flows", "tracks/T7.html"],
    ["Roster loft", "WFM and recording", "tracks/T8.html"],
    ["Beacon room", "E911 and analytics", "tracks/T9.html"],
    ["Bridge gallery", "CRM and AI", "tracks/T10.html"],
    ["Cutover path", "Migration", "tracks/T11.html"],
    ["Ledger gate", "Licensing", "tracks/T12.html"],
  ];
  var row = section.querySelector("[data-worlds]");
  scenes.forEach(function (scene) {
    var link = document.createElement("a");
    link.className = "world-card";
    link.href = scene[2];
    link.innerHTML = "<strong></strong><span></span>";
    link.querySelector("strong").textContent = scene[0];
    link.querySelector("span").textContent = scene[1];
    row.appendChild(link);
  });
  host.parentElement.insertAdjacentElement("afterend", section);
})();
