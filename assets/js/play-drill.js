(function () {
  var jobs = ["RTP media", "SIP session setup", "Registration", "Quality score is not the file"];
  var want = ["Registration", "SIP session setup", "RTP media", "Quality score is not the file"];
  var list = document.getElementById("order");
  if (!list) return;
  jobs.forEach(function (job) {
    var li = document.createElement("li");
    li.textContent = job;
    li.draggable = true;
    li.dataset.job = job;
    li.style.padding = "8px";
    li.style.margin = "6px 0";
    li.style.border = "2px solid #0f766e";
    li.style.borderRadius = "12px";
    li.addEventListener("dragstart", function () { li.classList.add("dragging"); });
    li.addEventListener("dragend", function () { li.classList.remove("dragging"); });
    list.appendChild(li);
  });
  list.addEventListener("dragover", function (ev) {
    ev.preventDefault();
    var dragging = list.querySelector(".dragging");
    var after = [].slice.call(list.children).find(function (child) {
      var box = child.getBoundingClientRect();
      return ev.clientY < box.top + box.height / 2;
    });
    if (!dragging) return;
    if (after) list.insertBefore(dragging, after);
    else list.appendChild(dragging);
  });
  var check = document.getElementById("check-order");
  if (!check) return;
  check.addEventListener("click", function () {
    var got = [].map.call(list.children, function (li) { return li.dataset.job; });
    var ok = got.every(function (item, i) { return item === want[i]; });
    var note = document.getElementById("play-note");
    if (note) note.textContent = ok ? "That order matches the study habit." : "Not yet. Registration, then session setup, then RTP. The score is a different object.";
  });
})();
