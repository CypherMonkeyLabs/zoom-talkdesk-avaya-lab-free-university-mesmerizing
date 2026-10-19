/* Offline chat inside the existing study-guide panel. No second bot, no network. */
import { createRetriever } from "../shared/pybot-chat/engine.js";
import { chatMarkup, paintChat, chatInput } from "../shared/pybot-chat/ui.js";

const TOPICS = [
  "What is SIP for?",
  "Zoom Workplace",
  "Talkdesk OAuth",
  "Avaya Aura and Infinity",
  "RTP and SRTP",
  "What can you help with?",
];

const root = new URL("../", import.meta.url);
const mount = document.querySelector("[data-ztabot]");
if (!mount) {
  /* The guide panel is created by guide.js before this module runs. */
} else {
  const oldForm = document.querySelector("#bot-panel .bot-form");
  if (oldForm) oldForm.hidden = true;
  mount.innerHTML = chatMarkup(TOPICS);
  const box = mount.querySelector("[data-py-chat]");
  const messages = [];
  let retriever = null;
  let busy = false;

  function absHref(href) {
    if (!href) return "";
    if (/^(https?:|#)/.test(href)) return href;
    return new URL(href, root).href;
  }

  function show() {
    paintChat(box, messages, busy);
    box.querySelectorAll("a[href]").forEach((link) => {
      const raw = link.getAttribute("href");
      if (raw && !/^(https?:|#)/.test(raw)) link.href = absHref(raw);
    });
  }

  function pushAnswer(answer) {
    messages.push({
      role: "bot",
      text: answer.text,
      href: answer.href || "",
      link: answer.link || "",
      example: answer.example || "",
      follow: answer.follow || "",
      followQ: answer.followQ || "",
      closest: answer.intent === "fallback" || answer.mode === "fallback" ? (answer.closest || []) : [],
    });
    show();
  }

  async function ensure() {
    if (retriever) return retriever;
    const res = await fetch(new URL("js/content/ztabot-index.json", root).href);
    if (!res.ok) throw new Error("index missing");
    retriever = createRetriever(await res.json());
    return retriever;
  }

  async function ask(text) {
    const q = String(text || "").trim();
    if (!q || busy) return;
    messages.push({ role: "user", text: q });
    busy = true;
    show();
    try {
      const engine = await ensure();
      pushAnswer(engine.ask(q, {}));
    } catch (err) {
      messages.push({
        role: "bot",
        text: "I don't have that yet. The offline index did not load. Open a lesson from the menu.",
      });
    }
    busy = false;
    show();
    const field = chatInput(box);
    if (field) field.focus();
  }

  box.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-py-ask]");
    if (chip) {
      event.preventDefault();
      ask(chip.getAttribute("data-py-ask"));
      return;
    }
    if (event.target.closest("[data-py-clear]")) {
      messages.length = 0;
      if (retriever) retriever.reset();
      show();
      return;
    }
    const read = event.target.closest("[data-py-read]");
    if (read && window.speechSynthesis) {
      const item = messages[Number(read.getAttribute("data-py-read"))];
      if (!item) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(item.text);
      window.speechSynthesis.speak(utter);
    }
  });

  box.querySelector(".py-chat-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const field = chatInput(box);
    ask(field ? field.value : "");
    if (field) field.value = "";
  });

  const mic = box.querySelector("[data-py-mic]");
  mic.addEventListener("click", () => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      messages.push({ role: "bot", text: "The mic is not available in this browser. Type the question." });
      show();
      return;
    }
    const rec = new Rec();
    rec.lang = "en-US";
    rec.onresult = (event) => {
      const said = event.results && event.results[0] && event.results[0][0] ? event.results[0][0].transcript : "";
      ask(said);
    };
    rec.onerror = () => {
      messages.push({ role: "bot", text: "The mic did not start. Type the question instead." });
      show();
    };
    try { rec.start(); } catch (err) {
      messages.push({ role: "bot", text: "The mic did not start. Type the question instead." });
      show();
    }
  });

  messages.push({
    role: "bot",
    text: "Ask about Zoom, Talkdesk, Avaya, SIP, or a call flow. I quote this lab's notes and I can be wrong.",
    follow: "What can you help with?",
    followQ: "What can you help with?",
  });
  show();
  window.ZTA_CHAT = { ask };
}
