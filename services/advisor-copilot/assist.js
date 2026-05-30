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

module.exports = {
  buildNextQuestionAnswer,
  transcriptIncludes
};
