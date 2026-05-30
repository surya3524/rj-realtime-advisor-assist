const NORMALIZE_PATTERN = /[^a-z0-9\s]/g;

function normalize(text) {
  return text.toLowerCase().replace(NORMALIZE_PATTERN, " ").replace(/\s+/g, " ").trim();
}

function findMatches(transcriptText, knowledgeBase) {
  const normalizedText = normalize(transcriptText);

  return knowledgeBase
    .map((source) => {
      const matchedTags = source.tags.filter((tag) => normalizedText.includes(normalize(tag)));
      return {
        source,
        matchedTags,
        score: matchedTags.length
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id));
}

function createSuggestion(transcriptEvent, knowledgeBase) {
  const matches = findMatches(transcriptEvent.text, knowledgeBase);

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
    sources: [
      {
        id: best.source.id,
        title: best.source.title
      }
    ],
    matchedTags: best.matchedTags
  };
}

module.exports = {
  createSuggestion,
  findMatches,
  normalize
};
