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

function buildStockUpsideAnswer(question, conversationEvents, knowledgeBase, crmProfile) {
  return {
    label: `Advisor asked: ${question}`,
    title: "Concentrated stock upside question",
    answer: "I would not frame this as trying to predict whether TSLA will triple. A better client question is: if the stock rises sharply after we reduce concentration, how much regret would feel acceptable compared with the risk of keeping too much in one company?",
    why: [
      "Client has a large concentrated stock position and is worried about reducing it.",
      "The useful advisor move is to explore upside regret, downside risk, and concentration tolerance rather than forecast a single stock.",
      ...(crmProfile.portfolioNotes || []).filter((note) => /40 percent|company stock|concentration/i.test(note))
    ],
    sources: [
      sourceRef(findKnowledgeById(knowledgeBase, "RJ-DEMO-DIVERSIFY-002")),
      sourceRef(findKnowledgeById(knowledgeBase, "RJ-DEMO-SUITABILITY-005")),
      sourceRef(findKnowledgeById(knowledgeBase, "RJ-DEMO-RISK-001")),
      "RJ CRM demo profile: concentrated stock note"
    ]
  };
}

module.exports = {
  buildNextQuestionAnswer,
  buildStockUpsideAnswer,
  transcriptIncludes
};
