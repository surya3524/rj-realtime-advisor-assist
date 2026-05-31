const simulateBtn = document.querySelector("#simulateBtn");
const listenBtn = document.querySelector("#listenBtn");
const clearBtn = document.querySelector("#clearBtn");
const importBtn = document.querySelector("#importBtn");
const pasteTranscript = document.querySelector("#pasteTranscript");
const transcriptEl = document.querySelector("#transcript");
const statusText = document.querySelector("#statusText");
const statusDot = document.querySelector("#statusDot");
const contextCount = document.querySelector("#contextCount");
const advisorQuestion = document.querySelector("#advisorQuestion");
const askBtn = document.querySelector("#askBtn");
const answerCard = document.querySelector("#answerCard");
const crmSummary = document.querySelector("#crmSummary");

let conversation = [];
let demoScript = [];
let crmProfile = {};
let marketResearch = {};
let knowledgeBase = [];
let timers = [];
let recognition = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

function addTurn(speaker, text) {
  const event = { speaker, text, timestamp: new Date().toISOString() };
  conversation.push(event);
  const turn = document.createElement("article");
  turn.className = `turn ${speaker.toLowerCase()}`;
  turn.innerHTML = `
    <span class="speaker">${escapeHtml(speaker)}</span>
    <div>${escapeHtml(text)}</div>
  `;
  transcriptEl.appendChild(turn);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
  contextCount.textContent = `${conversation.length} turns`;
}

function clearConversation() {
  timers.forEach(clearTimeout);
  timers = [];
  conversation = [];
  transcriptEl.innerHTML = "";
  contextCount.textContent = "0 turns";
  statusText.textContent = "Ready. Run the demo call or paste a Zoom transcript.";
  statusDot.classList.remove("active");
  answerCard.className = "answer-card empty";
  answerCard.innerHTML = `
    <p class="eyebrow">Waiting</p>
    <h3>No answer yet</h3>
    <p>Ask a question after transcript context is available.</p>
  `;
}

function runDemo() {
  clearConversation();
  statusText.textContent = "Streaming simulated Zoom transcript...";
  statusDot.classList.add("active");
  demoScript.forEach((turn, index) => {
    const timer = setTimeout(() => {
      addTurn(turn.speaker, turn.text);
      if (index === demoScript.length - 1) {
        statusText.textContent = "Transcript captured. Ask an advisor question.";
        statusDot.classList.remove("active");
      }
    }, index * 1800);
    timers.push(timer);
  });
}

function importTranscript() {
  const text = pasteTranscript.value.trim();
  if (!text) return;
  clearConversation();
  text.split(/\n+/).forEach((line) => {
    const match = line.match(/^(advisor|client)\s*:\s*(.+)$/i);
    if (match) {
      addTurn(match[1][0].toUpperCase() + match[1].slice(1).toLowerCase(), match[2]);
    } else {
      addTurn("Client", line);
    }
  });
  statusText.textContent = "Transcript imported. Ask an advisor question.";
}

function setupMic() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    listenBtn.disabled = true;
    listenBtn.textContent = "Mic unavailable";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  recognition.onresult = (event) => {
    const latest = event.results[event.results.length - 1][0].transcript.trim();
    addTurn("Client", latest);
  };
  recognition.onstart = () => {
    statusText.textContent = "Listening through browser mic. For Zoom POC, route speaker audio or use pasted transcript.";
    statusDot.classList.add("active");
    listenBtn.textContent = "Stop Mic";
  };
  recognition.onend = () => {
    statusText.textContent = "Mic stopped. Ask an advisor question.";
    statusDot.classList.remove("active");
    listenBtn.textContent = "Start Mic";
  };
}

function findKnowledge(id) {
  return knowledgeBase.find((item) => item.id === id);
}

function allocationSummary() {
  return (crmProfile.currentAllocation || [])
    .map((holding) => `${holding.allocation}% ${holding.symbol}`)
    .join(", ");
}

function answerQuestion() {
  if (conversation.length === 0) {
    renderAnswer({
      title: "No transcript context yet",
      response: "Capture or import the Zoom conversation first.",
      evidence: [],
      sources: []
    });
    return;
  }

  const question = advisorQuestion.value.trim();
  const questionText = normalize(question);
  if (questionText.includes("tsla") || questionText.includes("tesla") || questionText.includes("triple") || questionText.includes("3x")) {
    renderAnswer(buildTslaAnswer(question));
    return;
  }

  renderAnswer(buildGeneralAnswer(question));
}

function buildTslaAnswer(question) {
  const tsla = marketResearch.symbols.TSLA;
  const conservative = crmProfile.riskProfileHistory.find((entry) => entry.profile === "Conservative");
  return {
    title: "TSLA question with transcript + CRM context",
    response: `The latest CRM allocation is ${allocationSummary()}, with TSLA at 30%. The ${conservative.date} CRM note says the client wanted a conservative profile. A TSLA 3x move from the snapshot price would require about a 200% gain to roughly $${Number(tsla.oneYearTriplePrice).toLocaleString()}. The observed analyst targets in this snapshot are far below that level, so I would not treat 3x in one year as the base case. I would ask: "If TSLA rises sharply after reducing the position, how much regret would feel acceptable compared with the risk of keeping 30% in one stock?"`,
    evidence: [
      `Advisor asked: ${question}`,
      `Transcript mentions the client wants to change TSLA but believes it could triple in one year.`,
      `CRM allocation: ${allocationSummary()}.`,
      `Prior CRM risk note: ${conservative.note}`,
      ...tsla.fundamentalNotes
    ],
    sources: [
      "RJ CRM demo profile: latest allocation and 2023 conservative note",
      "Market research snapshot: TSLA price and analyst target context",
      `${findKnowledge("RJ-DEMO-DIVERSIFY-002").id}: ${findKnowledge("RJ-DEMO-DIVERSIFY-002").title}`,
      `${findKnowledge("RJ-DEMO-SUITABILITY-005").id}: ${findKnowledge("RJ-DEMO-SUITABILITY-005").title}`
    ]
  };
}

function buildGeneralAnswer(question) {
  return {
    title: "Context summary",
    response: "The client is balancing retirement income, concentrated TSLA exposure, liquidity needs, and prior conservative risk preferences. Before discussing product changes, ask what outcome matters more: avoiding regret if TSLA rises, or reducing the risk of a single-stock loss harming retirement goals.",
    evidence: [
      `Advisor asked: ${question || "general help"}`,
      `Transcript turns available: ${conversation.length}.`,
      `CRM allocation: ${allocationSummary()}.`
    ],
    sources: [
      "RJ CRM demo profile",
      `${findKnowledge("RJ-DEMO-SUITABILITY-005").id}: ${findKnowledge("RJ-DEMO-SUITABILITY-005").title}`
    ]
  };
}

function renderAnswer(answer) {
  answerCard.className = "answer-card";
  answerCard.innerHTML = `
    <p class="eyebrow">Advisor Answer</p>
    <h3>${escapeHtml(answer.title)}</h3>
    <div class="response">
      <span>Suggested response</span>
      <p>${escapeHtml(answer.response)}</p>
    </div>
    <div class="evidence">
      <span>Based on transcript + CRM</span>
      <ul>${answer.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    <div class="evidence">
      <span>Sources</span>
      <ul>${answer.sources.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

async function init() {
  demoScript = await loadJson("data/demo-call-script.json");
  crmProfile = await loadJson("data/crm-client-profile.json");
  marketResearch = await loadJson("data/market-research.json");
  knowledgeBase = await loadJson("data/approved-knowledge.json");
  crmSummary.innerHTML = `
    <ul>
      <li>Allocation: ${escapeHtml(allocationSummary())}</li>
      <li>Risk history: ${escapeHtml(crmProfile.riskProfileHistory[0].profile)} in ${escapeHtml(crmProfile.riskProfileHistory[0].date)}</li>
      <li>Liquidity: ${escapeHtml(crmProfile.liquidityPreference)}</li>
    </ul>
  `;
  setupMic();
}

simulateBtn.addEventListener("click", runDemo);
clearBtn.addEventListener("click", clearConversation);
importBtn.addEventListener("click", importTranscript);
askBtn.addEventListener("click", answerQuestion);
listenBtn.addEventListener("click", () => {
  if (!recognition) return;
  if (listenBtn.textContent === "Stop Mic") recognition.stop();
  else recognition.start();
});

init().catch(() => {
  statusText.textContent = "Could not load demo data.";
});
