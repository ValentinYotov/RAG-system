const chat = document.getElementById("chat");
const welcome = document.getElementById("welcome");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

let messagesEl = null;
let isSending = false;

function ensureMessagesContainer() {
  if (messagesEl) return messagesEl;
  welcome.style.display = "none";
  messagesEl = document.createElement("div");
  messagesEl.className = "messages";
  chat.appendChild(messagesEl);
  return messagesEl;
}

function createMessage(role, text) {
  const container = ensureMessagesContainer();
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : "Assistant";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  message.append(label, bubble);
  container.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
  return message;
}

function createTypingIndicator() {
  const container = ensureMessagesContainer();
  const message = document.createElement("article");
  message.className = "message assistant";
  message.id = "typing";

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = "Assistant";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing";
  bubble.innerHTML = "<span></span><span></span><span></span>";

  message.append(label, bubble);
  container.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById("typing")?.remove();
}

function attachSources(messageEl, sources) {
  if (!sources?.length) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "sources-toggle";
  toggle.textContent = `View ${sources.length} source review${sources.length > 1 ? "s" : ""}`;

  const list = document.createElement("div");
  list.className = "source-list";

  sources.forEach((source) => {
    const card = document.createElement("div");
    card.className = "source-card";

    const meta = document.createElement("div");
    meta.className = "source-meta";
    if (source.source === "menu") {
      meta.textContent = "Menu item";
    } else if (source.source === "restaurant") {
      meta.textContent = "Restaurant info";
    } else if (source.rating != null) {
      meta.textContent = `★ ${source.rating}/5 · ${source.date || "Review"}`;
    } else {
      meta.textContent = source.source || "Source";
    }

    const content = document.createElement("div");
    content.textContent = source.content;

    card.append(meta, content);
    list.appendChild(card);
  });

  toggle.addEventListener("click", () => {
    const open = list.classList.toggle("open");
    toggle.textContent = open
      ? "Hide source reviews"
      : `View ${sources.length} source review${sources.length > 1 ? "s" : ""}`;
  });

  const wrapper = document.createElement("div");
  wrapper.className = "sources";
  wrapper.append(toggle, list);
  messageEl.appendChild(wrapper);
}

const CHAT_TIMEOUT_MS = 120000;

async function sendMessage(text) {
  const message = text.trim();
  if (!message || isSending) return;

  isSending = true;
  sendBtn.disabled = true;
  createMessage("user", message);
  input.value = "";
  input.style.height = "auto";
  createTypingIndicator();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || "Request failed");
    }

    removeTypingIndicator();
    const assistantMessage = createMessage("assistant", data.answer);
    attachSources(assistantMessage, data.sources);
  } catch (error) {
    removeTypingIndicator();
    const isTimeout = error.name === "AbortError";
    createMessage(
      "assistant",
      isTimeout
        ? "The request took too long. Check that Ollama is running and try again."
        : error.message ||
            "Something went wrong. Make sure Ollama is running and try again."
    );
  } finally {
    clearTimeout(timeoutId);
    isSending = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(input.value);
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.textContent));
});

clearBtn.addEventListener("click", () => {
  messagesEl?.remove();
  messagesEl = null;
  welcome.style.display = "block";
});

input.focus();
