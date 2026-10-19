/* Click a label that is already on this page's drawing. No new facts. */
(function () {
  var frame = document.querySelector("main .diagram-frame svg");
  if (!frame || document.querySelector("[data-tryit]")) return;
  var labels = [];
  frame.querySelectorAll("text").forEach(function (node) {
    var text = (node.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length < 3 || text.length > 42) return;
    if (labels.indexOf(text) !== -1) return;
    labels.push(text);
  });
  labels = labels.slice(0, 6);
  if (!labels.length) return;
  var card = document.createElement("section");
  card.className = "tryit";
  card.setAttribute("data-tryit", "");
  card.innerHTML = "<h2>Try it</h2><p>Pick a label from the drawing on this page. This is a study check. It does not call a vendor.</p><div class=\"tryit-row\"></div><p class=\"tryit-note\" aria-live=\"polite\"></p>";
  var row = card.querySelector(".tryit-row");
  var note = card.querySelector(".tryit-note");
  labels.forEach(function (label) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", function () {
      note.textContent = "Selected: " + label + ". That label is on the drawing above. The drawing is a teaching sketch, not a live system.";
    });
    row.appendChild(btn);
  });
  var visual = document.getElementById("visual") || frame.closest("section") || frame.parentElement;
  if (visual && visual.parentElement) visual.insertAdjacentElement("afterend", card);
})();
