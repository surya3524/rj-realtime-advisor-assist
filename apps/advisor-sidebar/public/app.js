const transcriptEl = document.querySelector("#transcript");
const suggestionsEl = document.querySelector("#suggestions");
const knowledgeEl = document.querySelector("#knowledge");
const statusText = document.querySelector("#statusText");
const connectionDot = document.querySelector("#connectionDot");
const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function appendTranscript(event) {
  const item = document.createElement("article");
  item.className = `utterance ${event.speaker.toLowerCase()}`;
  item.innerHTML = `
    <span class="speaker">${escapeHtml(event.speaker)}</span>
    <div>${escapeHtml(event.text)}</div>
  `;
  transcriptEl.appendChild(item);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function appendSuggestion(event) {
  const item = document.createElement("article");
  item.className = `suggestion ${event.status}`;

  const sourceText = event.sources.length
    ? event.sources.map((source) => `${source.id}: ${source.title}`).join(", ")
    : "No approved source matched.";

  const tags = event.matchedTags.length
    ? event.matchedTags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")
    : "<span class=\"badge\">no match</span>";

  item.innerHTML = `
    <div class="badge-row">
      <span class="badge">${escapeHtml(event.status)}</span>
      <span class="badge ${escapeHtml(event.severity)}">${escapeHtml(event.severity)}</span>
      ${tags}
    </div>
    <strong>${escapeHtml(event.suggestion)}</strong>
    <div class="advisor-response">
      <span>Advisor could say</span>
      <p>${escapeHtml(event.advisorResponse)}</p>
    </div>
    <p>${escapeHtml(event.rationale)}</p>
    <div class="source">${escapeHtml(sourceText)}</div>
  `;

  suggestionsEl.prepend(item);
}

async function postJson(url) {
  await fetch(url, { method: "POST" });
}

async function loadKnowledge() {
  const response = await fetch("/api/knowledge");
  const knowledge = await response.json();
  knowledgeEl.innerHTML = knowledge.map((item) => `
    <article class="knowledge-item">
      <strong>${escapeHtml(item.id)}: ${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.guidance)}</p>
    </article>
  `).join("");
}

function connectEvents() {
  const events = new EventSource("/events");

  events.addEventListener("connected", () => {
    connectionDot.classList.add("connected");
    statusText.textContent = "Connected. Start the simulated Zoom transcript when ready.";
  });

  events.addEventListener("demo-status", (message) => {
    const event = JSON.parse(message.data);
    statusText.textContent = event.message;
  });

  events.addEventListener("transcript", (message) => {
    appendTranscript(JSON.parse(message.data));
  });

  events.addEventListener("suggestion", (message) => {
    appendSuggestion(JSON.parse(message.data));
  });

  events.onerror = () => {
    connectionDot.classList.remove("connected");
    statusText.textContent = "Event stream disconnected. Refresh after restarting the server.";
  };
}

startBtn.addEventListener("click", async () => {
  transcriptEl.innerHTML = "";
  suggestionsEl.innerHTML = "";
  await postJson("/api/demo/start");
});

stopBtn.addEventListener("click", async () => {
  await postJson("/api/demo/stop");
});

loadKnowledge();
connectEvents();
