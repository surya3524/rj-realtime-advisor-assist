function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function transcriptIncludes(conversationEvents, ...phrases) {
  const text = normalize(conversationEvents.map((event) => event.text).join(" "));
  return phrases.some((phrase) => text.includes(normalize(phrase)));
}

function findKnowledgeById(knowledgeBase, id) {
  return knowledgeBase.find((source) => source.id === id);
}

function sourceRef(source) {
  return source ? `${source.id}: ${source.title}` : "No approved source.";
}

function allocationSummary(crmProfile) {
  return (crmProfile.currentAllocation || [])
    .map((holding) => `${holding.allocation}% ${holding.symbol}`)
    .join(", ");
}

function priorConservativeNote(crmProfile) {
  return (crmProfile.riskProfileHistory || [])
    .find((entry) => entry.profile === "Conservative");
}

function buildNextQuestionAnswer(conversationEvents, knowledgeBase, crmProfile) {
  const liquidity = findKnowledgeById(knowledgeBase, "RJ-DEMO-LIQUIDITY-007");
  const suitability = findKnowledgeById(knowledgeBase, "RJ-DEMO-SUITABILITY-005");
  const reasons = [];

  if (transcriptIncludes(conversationEvents, "spouse may stop working next year")) {
    reasons.push("Client mentioned spouse may stop working next year.");
  }
  if (transcriptIncludes(conversationEvents, "unexpected expenses", "cash available")) {
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

function buildStockUpsideAnswer(question, conversationEvents, knowledgeBase, crmProfile, marketResearch = {}) {
  const tsla = marketResearch.symbols?.TSLA || {};
  const conservative = priorConservativeNote(crmProfile);

  return {
    label: `Advisor asked: ${question}`,
    title: "TSLA 3x claim vs client profile",
    answer: `Current CRM allocation is ${allocationSummary(crmProfile)}. TSLA is a 30% single-stock position, and the CRM note from ${conservative?.date || "2023"} says the client wanted a conservative profile. Based on the market snapshot, TSLA would need to reach about $${Number(tsla.oneYearTriplePrice || 0).toLocaleString()} for a 3x move from about $${Number(tsla.lastPrice || 0).toLocaleString()}. Current observed analyst targets in the snapshot are far below that level, so I would treat 3x in one year as a speculative upside case, not the planning base case.`,
    why: [
      `Latest RJ CRM allocation: ${allocationSummary(crmProfile)}.`,
      conservative ? `RJ CRM ${conservative.date} risk note: ${conservative.note}` : "RJ CRM includes prior conservative-risk context.",
      ...((tsla.fundamentalNotes || [])),
      "Suggested advisor question: If TSLA rises sharply after reducing the position, how much regret would be acceptable compared with the risk of keeping 30% in one stock?"
    ],
    sources: [
      sourceRef(findKnowledgeById(knowledgeBase, "RJ-DEMO-DIVERSIFY-002")),
      sourceRef(findKnowledgeById(knowledgeBase, "RJ-DEMO-SUITABILITY-005")),
      sourceRef(findKnowledgeById(knowledgeBase, "RJ-DEMO-RISK-001")),
      "RJ CRM demo profile: current allocation and risk history",
      `Market research snapshot as of ${marketResearch.asOf || "demo date"}: TSLA price/target context`
    ]
  };
}

module.exports = {
  buildNextQuestionAnswer,
  buildStockUpsideAnswer,
  transcriptIncludes
};
