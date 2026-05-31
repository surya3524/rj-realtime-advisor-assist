const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createSuggestion } = require("../services/advisor-copilot/grounding");
const { buildNextQuestionAnswer, buildStockUpsideAnswer } = require("../services/advisor-copilot/assist");

const knowledgeBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "approved-knowledge.json"), "utf8")
);
const publicKnowledgeBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "apps", "advisor-sidebar", "public", "data", "approved-knowledge.json"), "utf8")
);
const demoScript = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "demo-call-script.json"), "utf8")
);
const publicDemoScript = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "apps", "advisor-sidebar", "public", "data", "demo-call-script.json"), "utf8")
);
const crmProfile = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "crm-client-profile.json"), "utf8")
);
const publicCrmProfile = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "apps", "advisor-sidebar", "public", "data", "crm-client-profile.json"), "utf8")
);
const marketResearch = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "market-research.json"), "utf8")
);
const publicMarketResearch = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "apps", "advisor-sidebar", "public", "data", "market-research.json"), "utf8")
);
const transcriptAppKnowledgeBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "apps", "zoom-transcript-context", "public", "data", "approved-knowledge.json"), "utf8")
);
const transcriptAppDemoScript = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "apps", "zoom-transcript-context", "public", "data", "demo-call-script.json"), "utf8")
);
const transcriptAppCrmProfile = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "apps", "zoom-transcript-context", "public", "data", "crm-client-profile.json"), "utf8")
);
const transcriptAppMarketResearch = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "apps", "zoom-transcript-context", "public", "data", "market-research.json"), "utf8")
);

assert.deepStrictEqual(publicKnowledgeBase, knowledgeBase);
assert.deepStrictEqual(publicDemoScript, demoScript);
assert.deepStrictEqual(publicCrmProfile, crmProfile);
assert.deepStrictEqual(publicMarketResearch, marketResearch);
assert.deepStrictEqual(transcriptAppKnowledgeBase, knowledgeBase);
assert.deepStrictEqual(transcriptAppDemoScript, demoScript);
assert.deepStrictEqual(transcriptAppCrmProfile, crmProfile);
assert.deepStrictEqual(transcriptAppMarketResearch, marketResearch);

function event(text) {
  return {
    id: 1,
    speaker: "Client",
    text,
    timestamp: "2026-05-30T00:00:00.000Z"
  };
}

const guarantee = createSuggestion(event("Can you guarantee I will not lose money?"), knowledgeBase);
assert.strictEqual(guarantee.status, "grounded");
assert.strictEqual(guarantee.sources[0].id, "RJ-DEMO-RISK-001");
assert.match(guarantee.advisorResponse, /cannot guarantee/i);

const unsupported = createSuggestion(event("My favorite team is playing tonight."), knowledgeBase);
assert.strictEqual(unsupported.status, "unsupported");
assert.deepStrictEqual(unsupported.sources, []);
assert.match(unsupported.suggestion, /No supported suggestion/);
assert.match(unsupported.advisorResponse, /Do not invent guidance/);

const visibleSuggestions = [
  guarantee,
  unsupported
].filter((suggestion) => suggestion.status === "grounded");
assert.strictEqual(visibleSuggestions.length, 1);

const tax = createSuggestion(event("Can you give me tax advice for my estate?"), knowledgeBase);
assert.strictEqual(tax.status, "grounded");
assert.strictEqual(tax.sources[0].id, "RJ-DEMO-COMPLIANCE-004");

const fees = createSuggestion(event("How do you get paid and what fees would I be charged?"), knowledgeBase);
assert.strictEqual(fees.status, "grounded");
assert.strictEqual(fees.sources[0].id, "RJ-DEMO-FEES-008");
assert.match(fees.advisorResponse, /review costs clearly/i);

const conversationSoFar = demoScript.slice(0, 7).map((line, index) => ({
  id: index + 1,
  speaker: line.speaker,
  text: line.text,
  timestamp: "2026-05-30T00:00:00.000Z"
}));
const nextQuestion = buildNextQuestionAnswer(conversationSoFar, knowledgeBase, crmProfile);
assert.match(nextQuestion.answer, /cash you need available/i);
assert(nextQuestion.why.some((reason) => /spouse may stop working next year/i.test(reason)));
assert(nextQuestion.why.some((reason) => /unexpected expenses/i.test(reason)));
assert(nextQuestion.why.some((reason) => /RJ CRM liquidity note/i.test(reason)));
assert(nextQuestion.sources.some((source) => source.includes("RJ-DEMO-LIQUIDITY-007")));

const stockUpside = buildStockUpsideAnswer("what if TSLA becomes 3x?", conversationSoFar, knowledgeBase, crmProfile, marketResearch);
assert.match(stockUpside.title, /TSLA 3x claim/i);
assert.match(stockUpside.answer, /50% VOO, 30% TSLA, 20% GLD/i);
assert.match(stockUpside.answer, /conservative profile/i);
assert.match(stockUpside.answer, /speculative upside case/i);
assert(stockUpside.why.some((reason) => /Latest RJ CRM allocation: 50% VOO, 30% TSLA, 20% GLD/i.test(reason)));
assert(stockUpside.why.some((reason) => /3x move/i.test(reason)));
assert(stockUpside.sources.some((source) => source.includes("RJ-DEMO-DIVERSIFY-002")));
assert(stockUpside.sources.some((source) => source.includes("RJ-DEMO-SUITABILITY-005")));
assert(stockUpside.sources.some((source) => source.includes("Market research snapshot")));

console.log("Grounding tests passed.");
