# POC Validation Notes

## What This POC Proves

- A live transcript stream can update an advisor sidebar.
- Each transcript event can be evaluated against an approved knowledge base.
- A suggestion can be shown only when grounded in an approved source.
- Unsupported transcript events do not appear in the advisor sidebar.
- The frontend can display transcript, suggestion, rationale, matched tags, and source IDs.

## What This POC Does Not Prove Yet

- Real Zoom RTMS connectivity.
- Real audio transcription quality.
- Speaker diarization accuracy.
- Enterprise authentication, authorization, retention, or audit storage.
- LLM quality or model-risk behavior.

## No-Hallucination Control Used Here

The first POC does not generate free-form suggestions from a model. Instead, it uses
pre-approved suggestion text from `data/approved-knowledge.json`.

That means the app can only show suggestions that already exist in the approved
knowledge base. When no source matches, the sidebar stays silent:

```text
No approved source = no visible suggestion.
```

This is a deliberate first step. After the deterministic control works, a later
version can add LLM wording while keeping the same hard rule:

```text
No approved source = no advisor suggestion.
```

## Manual Demo Script

1. Start the server.
2. Open `http://localhost:4173`.
3. Click **Start Demo**.
4. Confirm retirement, guarantee, diversification, market volatility, suitability,
   and tax/legal lines generate grounded suggestions.
5. Confirm unrelated small talk produces no visible sidebar suggestion.

## Next Validation Before Zoom

- Add a transcript event replay test.
- Add source coverage checks for every grounded suggestion.
- Add a simple audit event log.
- Add a feature flag for real Zoom RTMS ingestion.
