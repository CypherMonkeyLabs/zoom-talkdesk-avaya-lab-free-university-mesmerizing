(function () {
  var run = document.getElementById("sim-run");
  if (!run) return;
  var node = "ivr";
  document.querySelectorAll("[data-node]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      node = btn.getAttribute("data-node");
      document.querySelectorAll("[data-node]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === btn ? "true" : "false");
      });
    });
  });
  run.addEventListener("click", function () {
    var digits = (document.getElementById("sim-digits").value || "").replace(/\D/g, "").slice(0, 4) || "(none)";
    var line = "Simulation only. Not run on a network.\nINVITE sip:" + node + "@lab.invalid SIP/2.0\n";
    if (node === "ivr" && digits === "1") line += "200 OK. Digit 1 stays on the IVR branch in this sketch.\n";
    else if (node === "ivr") line += "200 OK. Digits " + digits + " leave the IVR branch in this sketch.\n";
    else if (node === "queue") line += "180 Ringing. The queue sketch holds the caller. No agent was reserved.\n";
    else line += "200 OK. A study agent answers. No real extension was registered.\n";
    line += "RTP is not started by this page.";
    document.getElementById("sim-out").textContent = line;
  });
})();
