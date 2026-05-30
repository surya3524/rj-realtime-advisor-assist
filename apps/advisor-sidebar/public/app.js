const transcriptEl = document.querySelector("#transcript");
const suggestionsEl = document.querySelector("#suggestions");
const knowledgeEl = document.querySelector("#knowledge");
const statusText = document.querySelector("#statusText");
const connectionDot = document.querySelector("#connectionDot");
const currentCardEl = document.querySelector("#currentCard");
const groundingStatusEl = document.querySelector("#groundingStatus");
const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");
const assistBtn = document.querySelector("#assistBtn");
const assistOptionsEl = document.querySelector("#assistOptions");
const customQuestionEl = document.querySelector("#customQuestion");

let knowledgeBase = [];
let demoScript = [];
let crmProfile = {};
let activeTimers = [];
let conversationEvents = [];

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

function findKnowledgeById(id) {
  return knowledgeBase.find((source) => source.id === id);
}

function transcriptIncludes(...phrases) {
  const text = normalize(conversationEvents.map((event) => event.text).join(" "));
  return phrases.some((phrase) => text.includes(normalize(phrase)));
}

function sourceRef(source) {
  return source ? `${source.id}: ${source.title}` : "No approved source.";
}

function buildNextQuestionAnswer() {
  const liquidity = findKnowledgeById("RJ-DEMO-LIQUIDITY-007");
  const suitability = findKnowledgeById("RJ-DEMO-SUITABILITY-005");
  const reasons = [];

  if (transcriptIncludes("spouse may stop working next year")) {
    reasons.push("Client mentioned spouse may stop working next year.");
  }
  if (transcriptIncludes("unexpected expenses", "cash available")) {
    reasons.push("Client mentioned cash needs and possible unexpected expenses.");
  }
  if (crmProfile.liquidityPreference) {
    reasons.push(`RJ CRM liquidity note: ${crmProfile.liquidityPreference}.`);
  }

  return {
    label: "Advisor asked: What should I ask next?",
    title: "Suggested next question",
    answer: "Before we discuss products, can we review how much cash you need available in the next 12-24 months?",
    why: reasons,
    sources: [sourceRef(liquidity), sourceRef(suitability)]
  };
}

function buildSummaryAnswer() {
  return {
    label: "Advisor asked: Summarize client concerns",
    title: "Client concern summary",
    answer: "The client is trying to understand retirement income readiness, concentration risk, product suitability, liquidity needs, market downside risk, fees, and tax or estate boundaries.",
    why: [
      "Client wants to retire around 65 and cover about $8,000 per month.",
      "Client has a large employer-stock concentration.",
      "Client asked about annuity suitability, guarantees, recession risk, fees, and tax-related estate questions."
    ],
    sources: [
      sourceRef(findKnowledgeById("RJ-DEMO-RETIREMENT-003")),
      sourceRef(findKnowledgeById("RJ-DEMO-DIVERSIFY-002")),
      "RJ CRM: last meeting notes and open planning tasks"
    ]
  };
}

function buildRiskAnswer() {
  return {
    label: "Advisor asked: Check risk or compliance issue",
    title: "Highest-priority guardrails",
    answer: "Avoid guarantee language, avoid tax or legal advice, and pause before discussing any product recommendation until suitability context is gathered.",
    why: [
      "Client asked whether losses can be guaranteed away.",
      "Client asked whether they should buy an annuity.",
      "Client asked how to structure a will for tax reasons."
    ],
    sources: [
      sourceRef(findKnowledgeById("RJ-DEMO-RISK-001")),
      sourceRef(findKnowledgeById("RJ-DEMO-SUITABILITY-005")),
      sourceRef(findKnowledgeById("RJ-DEMO-COMPLIANCE-004"))
    ]
  };
}

function buildWordingAnswer() {
  return {
    label: "Advisor asked: Draft advisor wording",
    title: "Suggested wording",
    answer: "I do not want to recommend a product before I understand your full picture. Let us first separate near-term cash needs from long-term retirement assets, then review risk tolerance, concentration, and income goals.",
    why: [
      "Client mentioned annuity advice from a friend.",
      "Client also needs cash available and may face a household income change next year.",
      "This keeps the advisor in discovery before product discussion."
    ],
    sources: [
      sourceRef(findKnowledgeById("RJ-DEMO-SUITABILITY-005")),
      sourceRef(findKnowledgeById("RJ-DEMO-LIQUIDITY-007"))
    ]
  };
}

function buildCrmAnswer() {
  return {
    label: "Advisor asked: Pull RJ CRM context",
    title: "CRM context to keep in mind",
    answer: `${crmProfile.clientName || "Demo client"} is ${crmProfile.age}, targeting retirement around ${crmProfile.targetRetirementAge}, with a monthly spending goal of about $${Number(crmProfile.monthlySpendingGoal || 0).toLocaleString()}. Risk tolerance is listed as ${crmProfile.riskTolerance}.`,
    why: [
      ...(crmProfile.portfolioNotes || []),
      ...(crmProfile.openTasks || []).map((task) => `Open task: ${task}`)
    ],
    sources: ["RJ CRM demo profile", "RJ CRM last meeting notes"]
  };
}

function buildStockUpsideAnswer(question = "What if TSLA becomes 3x?") {
  const diversify = findKnowledgeById("RJ-DEMO-DIVERSIFY-002");
  const suitability = findKnowledgeById("RJ-DEMO-SUITABILITY-005");
  const risk = findKnowledgeById("RJ-DEMO-RISK-001");

  return {
    label: `Advisor asked: ${question}`,
    title: "Concentrated stock upside question",
    answer: "I would not frame this as trying to predict whether TSLA will triple. A better client question is: if the stock rises sharply after we reduce concentration, how much regret would feel acceptable compared with the risk of keeping too much in one company?",
    why: [
      "Client has a large concentrated stock position and is worried about reducing it.",
      "The useful advisor move is to explore upside regret, downside risk, and concentration tolerance rather than forecast a single stock.",
      "RJ CRM notes approximately 40 percent of the portfolio is employer company stock."
    ],
    sources: [
      sourceRef(diversify),
      sourceRef(suitability),
      sourceRef(risk),
      "RJ CRM demo profile: concentrated stock note"
    ]
  };
}

function buildCustomAnswer(question) {
  const lower = normalize(question);
  if (
    lower.includes("tsla") ||
    lower.includes("tesla") ||
    lower.includes("3x") ||
    lower.includes("triple") ||
    lower.includes("upside") ||
    lower.includes("stock becomes")
  ) {
    return buildStockUpsideAnswer(question);
  }
  if (lower.includes("ask") || lower.includes("next")) return buildNextQuestionAnswer();
  if (lower.includes("risk") || lower.includes("compliance")) return buildRiskAnswer();
  if (lower.includes("fee") || lower.includes("paid")) {
    return {
      label: `Advisor asked: ${question}`,
      title: "Fee discussion wording",
      answer: findKnowledgeById("RJ-DEMO-FEES-008").advisorResponse,
      why: ["Client asked how the advisor gets paid and what fees would be charged."],
      sources: [sourceRef(findKnowledgeById("RJ-DEMO-FEES-008"))]
    };
  }
  return buildSummaryAnswer();
}

function buildAssistAnswer(kind, question = "") {
  if (conversationEvents.length === 0) {
    return {
      label: "Advisor asked for help",
      title: "No conversation context yet",
      answer: "Start the demo first so the assistant can use the discussion so far.",
      why: [],
      sources: []
    };
  }

  const builders = {
    "next-question": buildNextQuestionAnswer,
    summarize: buildSummaryAnswer,
    "risk-check": buildRiskAnswer,
    wording: buildWordingAnswer,
    crm: buildCrmAnswer,
    "stock-upside": buildStockUpsideAnswer
  };

  return builders[kind] ? builders[kind]() : buildCustomAnswer(question);
}

function renderAssistAnswer(answer) {
  const why = answer.why.length
    ? answer.why.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No conversation context available yet.</li>";
  const sources = answer.sources.length
    ? answer.sources.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No approved source used.</li>";

  currentCardEl.className = "current-card grounded";
  groundingStatusEl.textContent = "Answered";
  groundingStatusEl.className = "trust-chip grounded";
  currentCardEl.innerHTML = `
    <p class="eyebrow">${escapeHtml(answer.label)}</p>
    <h3>${escapeHtml(answer.title)}</h3>
    <div class="advisor-response primary-response">
      <span>Suggested response</span>
      <p>${escapeHtml(answer.answer)}</p>
    </div>
    <div class="context-block">
      <span>Based on discussion so far</span>
      <ul>${why}</ul>
    </div>
    <div class="context-block">
      <span>Grounded by</span>
      <ul>${sources}</ul>
    </div>
  `;

  const historyItem = document.createElement("article");
  historyItem.className = "suggestion grounded";
  historyItem.innerHTML = `
    <strong>${escapeHtml(answer.title)}</strong>
    <p>${escapeHtml(answer.answer)}</p>
  `;
  suggestionsEl.prepend(historyItem);
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

async function loadKnowledge() {
  knowledgeBase = await loadJson("data/approved-knowledge.json");
  demoScript = await loadJson("data/demo-call-script.json");
  crmProfile = await loadJson("data/crm-client-profile.json");
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
  assistBtn.disabled = false;
}

function resetAssistPanel() {
  suggestionsEl.innerHTML = "";
  groundingStatusEl.textContent = "Listening";
  groundingStatusEl.className = "trust-chip listening";
  currentCardEl.className = "current-card empty";
  currentCardEl.innerHTML = `
    <p class="eyebrow">Listening</p>
    <h3>Quiet until advisor asks</h3>
    <p>The assistant is collecting conversation context. Press Ask Assist for help.</p>
  `;
}

function startDemo() {
  stopDemo();
  transcriptEl.innerHTML = "";
  conversationEvents = [];
  resetAssistPanel();
  statusText.textContent = "Simulated Zoom transcript started.";
  startBtn.disabled = true;
  assistBtn.disabled = false;

  demoScript.forEach((line, index) => {
    const timer = setTimeout(() => {
      const transcriptEvent = {
        id: index + 1,
        speaker: line.speaker,
        text: line.text,
        timestamp: new Date().toISOString()
      };

      conversationEvents.push(transcriptEvent);
      appendTranscript(transcriptEvent);

      if (index === demoScript.length - 1) {
        statusText.textContent = "Simulated Zoom transcript completed. Ask Assist for grounded help.";
        activeTimers = [];
        startBtn.disabled = false;
      }
    }, index * 2200);

    activeTimers.push(timer);
  });
}

function runAssist(kind, question = "") {
  assistOptionsEl.hidden = true;
  renderAssistAnswer(buildAssistAnswer(kind, question));
}

startBtn.addEventListener("click", () => startDemo());
stopBtn.addEventListener("click", () => stopDemo());
assistBtn.addEventListener("click", () => {
  assistOptionsEl.hidden = !assistOptionsEl.hidden;
});
assistOptionsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-assist]");
  if (!button) return;
  runAssist(button.dataset.assist);
});
customQuestionEl.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || !customQuestionEl.value.trim()) return;
  runAssist("custom", customQuestionEl.value.trim());
  customQuestionEl.value = "";
});

loadKnowledge()
  .then(() => {
    connectionDot.classList.add("connected");
    statusText.textContent = "Demo ready. Start the simulated Zoom transcript when ready.";
  })
  .catch(() => {
    statusText.textContent = "Demo data could not be loaded.";
  });
