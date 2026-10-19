/* Install prompt and splash preview. No network. */
(function () {
  var deferred = null;

  function installed() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function openSplash() {
    var dlg = document.getElementById("pwa-install-modal");
    if (!dlg) {
      dlg = document.createElement("div");
      dlg.id = "pwa-install-modal";
      dlg.style.cssText = "position:fixed;inset:0;z-index:120;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:16px;";
      dlg.innerHTML = '<section role="dialog" aria-modal="true" aria-labelledby="pwa-dlg-title" tabindex="-1" style="max-width:520px;width:100%;background:#fff;color:#042f2e;border-radius:18px;padding:16px;border:3px solid #0f766e">' +
        '<h2 id="pwa-dlg-title" style="margin:0 0 8px">Install ZTA Lab</h2>' +
        '<p style="margin:0 0 8px">Offline-ready study notes. Cypher Monkey, a lifelong student and AI builder, keeps this as a free learning project.</p>' +
        '<img src="" data-splash alt="ZTA Lab splash with a teal study mark" width="640" height="360" style="width:100%;height:auto;border-radius:12px">' +
        '<p>On a phone, use the browser share menu and choose Add to Home Screen. This does not call a vendor.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-go style="min-height:44px">Install</button><button type="button" data-close style="min-height:44px">Close</button></div>' +
        '<p data-status></p></section>';
      document.body.appendChild(dlg);
      var img = dlg.querySelector("[data-splash]");
      img.src = (window.UC_FRAME && window.UC_FRAME.fromRoot ? window.UC_FRAME.fromRoot("assets/icons/splash.png") : "assets/icons/splash.png");
      dlg.addEventListener("click", function (event) {
        if (event.target === dlg || event.target.closest("[data-close]")) dlg.hidden = true;
        else if (event.target.closest("[data-go]")) {
          var status = dlg.querySelector("[data-status]");
          if (deferred) {
            deferred.prompt();
            deferred.userChoice.then(function (choice) {
              status.textContent = "Install prompt: " + choice.outcome;
              deferred = null;
            }).catch(function () { status.textContent = "Use the browser menu to install."; });
          } else status.textContent = "Use the browser menu or Add to Home Screen.";
        }
      });
      dlg.addEventListener("keydown", function (event) {
        if (event.key === "Escape") dlg.hidden = true;
      });
    }
    dlg.hidden = false;
    var go = dlg.querySelector("[data-go]");
    if (go) go.focus();
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferred = event;
    var btn = document.getElementById("pwa-install-btn");
    if (btn) btn.hidden = false;
  });

  function mount() {
    if (document.getElementById("pwa-install-btn")) return;
    var bar = document.querySelector(".bar-inner");
    if (!bar) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "pwa-install-btn";
    btn.textContent = "Install";
    btn.setAttribute("aria-label", "Install this lab for offline use");
    btn.style.minHeight = "44px";
    btn.addEventListener("click", openSplash);
    bar.appendChild(btn);
    if (installed()) document.documentElement.setAttribute("data-app-mode", "standalone");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
