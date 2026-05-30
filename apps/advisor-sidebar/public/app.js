const transcriptEl = document.querySelector("#transcript");
const suggestionsEl = document.querySelector("#suggestions");
const knowledgeEl = document.querySelector("#knowledge");
const statusText = document.querySelector("#statusText");
const connectionDot = document.querySelector("#connectionDot");
const currentCardEl = document.querySelector("#currentCard");
const groundingStatusEl = document.querySelector("#groundingStatus");
const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");
let knowledgeBase = [];
let demoScript = [];
let activeTimers = [];

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

  const tags = renderTags(event.matchedTags);

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
  updateCurrentCard(event, sourceText, tags);
}

function renderTags(tags) {
  return tags.length
    ? tags.slice(0, 4).map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")
    : "<span class=\"badge\">no match</span>";
}

function updateCurrentCard(event, sourceText, tags) {
  currentCardEl.className = `current-card ${event.status}`;
  groundingStatusEl.textContent = event.status === "grounded" ? "Grounded" : "No source";
  groundingStatusEl.className = `trust-chip ${event.status}`;
  currentCardEl.innerHTML = `
    <div class="badge-row">
      <span class="badge">${escapeHtml(event.status)}</span>
      <span class="badge ${escapeHtml(event.severity)}">${escapeHtml(event.severity)}</span>
      ${tags}
    </div>
    <h3>${escapeHtml(event.suggestion)}</h3>
    <div class="advisor-response primary-response">
      <span>Advisor could say</span>
      <p>${escapeHtml(event.advisorResponse)}</p>
    </div>
    <p>${escapeHtml(event.rationale)}</p>
    <div class="source">${escapeHtml(sourceText)}</div>
  `;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function createSuggestion(transcriptEvent) {
  const normalizedText = normalize(transcriptEvent.text);
  const matches = knowledgeBase
    .map((source) => {
      const matchedTags = source.tags.filter((tag) => normalizedText.includes(normalize(tag)));
      return { source, matchedTags, score: matchedTags.length };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id));

  if (matches.length === 0) {
    return {
      id: `suggestion-${transcriptEvent.id}`,
      transcriptEventId: transcriptEvent.id,
      status: "unsupported",
      severity: "none",
      suggestion: "No supported suggestion available from approved materials.",
      advisorResponse: "Stay with discovery or ask a neutral clarifying question. Do not invent guidance.",
      rationale: "The transcript did not match any approved demo knowledge source.",
      sources: [],
      matchedTags: []
    };
  }

  const best = matches[0];
  return {
    id: `suggestion-${transcriptEvent.id}`,
    transcriptEventId: transcriptEvent.id,
    status: "grounded",
    severity: best.source.id.includes("COMPLIANCE") || best.source.id.includes("RISK") ? "high" : "medium",
    suggestion: best.source.suggestion,
    advisorResponse: best.source.advisorResponse,
    rationale: best.source.guidance,
    sources: [{ id: best.source.id, title: best.source.title }],
    matchedTags: best.matchedTags
  };
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  return response.json();
}

async function loadKnowledge() {
  knowledgeBase = await loadJson("data/approved-knowledge.json");
  demoScript = await loadJson("data/demo-call-script.json");
  knowledgeEl.innerHTML = knowledgeBase.map((item) => `
    <article class="knowledge-item">
      <strong>${escapeHtml(item.id)}: ${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.guidance)}</p>
    </article>
  `).join("");
}

function stopDemo() {
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
  statusText.textContent = "Simulated Zoom transcript stopped.";
  startBtn.disabled = false;
}

function startDemo() {
  stopDemo();
  transcriptEl.innerHTML = "";
  suggestionsEl.innerHTML = "";
  statusText.textContent = "Simulated Zoom transcript started.";
  startBtn.disabled = true;
  groundingStatusEl.textContent = "Listening";
  groundingStatusEl.className = "trust-chip listening";
  currentCardEl.className = "current-card empty";
  currentCardEl.innerHTML = `
    <p class="eyebrow">Current Moment</p>
    <h3>Listening for client signal</h3>
    <p>The sidebar will update when a client statement matches approved guidance.</p>
  `;

  demoScript.forEach((line, index) => {
    const timer = setTimeout(() => {
      const transcriptEvent = {
        id: index + 1,
        speaker: line.speaker,
        text: line.text,
        timestamp: new Date().toISOString()
      };

      appendTranscript(transcriptEvent);

      if (transcriptEvent.speaker === "Client") {
        appendSuggestion(createSuggestion(transcriptEvent));
      }

      if (index === demoScript.length - 1) {
        statusText.textContent = "Simulated Zoom transcript completed.";
        activeTimers = [];
        startBtn.disabled = false;
      }
    }, index * 2200);

    activeTimers.push(timer);
  });
}

startBtn.addEventListener("click", () => {
  startDemo();
});

stopBtn.addEventListener("click", () => {
  stopDemo();
});

loadKnowledge()
  .then(() => {
    connectionDot.classList.add("connected");
    statusText.textContent = "Demo ready. Start the simulated Zoom transcript when ready.";
  })
  .catch(() => {
    statusText.textContent = "Demo data could not be loaded.";
  });
