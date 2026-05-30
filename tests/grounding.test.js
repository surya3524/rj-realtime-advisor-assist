const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createSuggestion } = require("../services/advisor-copilot/grounding");

const knowledgeBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "approved-knowledge.json"), "utf8")
);

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

const unsupported = createSuggestion(event("My favorite team is playing tonight."), knowledgeBase);
assert.strictEqual(unsupported.status, "unsupported");
assert.deepStrictEqual(unsupported.sources, []);
assert.match(unsupported.suggestion, /No supported suggestion/);

const tax = createSuggestion(event("Can you give me tax advice for my estate?"), knowledgeBase);
assert.strictEqual(tax.status, "grounded");
assert.strictEqual(tax.sources[0].id, "RJ-DEMO-COMPLIANCE-004");

console.log("Grounding tests passed.");
