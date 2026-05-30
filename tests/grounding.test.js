const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createSuggestion } = require("../services/advisor-copilot/grounding");

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

assert.deepStrictEqual(publicKnowledgeBase, knowledgeBase);
assert.deepStrictEqual(publicDemoScript, demoScript);

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

console.log("Grounding tests passed.");
