# POC Validation Notes

## What This POC Proves

- A live transcript stream can build conversation context quietly.
- The advisor can request assistance only when needed.
- The assist answer can use conversation-so-far, approved knowledge, and mocked CRM context.
- Unsupported or irrelevant transcript events do not create visible sidebar output.
- The frontend can display an advisor-requested answer with rationale and source IDs.

## What This POC Does Not Prove Yet

- Real Zoom RTMS connectivity.
- Real audio transcription quality.
- Speaker diarization accuracy.
- Enterprise authentication, authorization, retention, or audit storage.
- LLM quality or model-risk behavior.

## No-Hallucination Control Used Here

The first POC does not generate free-form suggestions from a model. Instead, it uses
pre-approved guidance from `data/approved-knowledge.json` and mocked client context
from `data/crm-client-profile.json`.

That means the app only answers when the advisor asks and the answer can be tied to
approved demo context. When no source matches, the sidebar stays silent:

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
4. Wait until the client mentions cash needs, spouse stopping work, and unexpected expenses.
5. Click **Ask Assist**.
6. Choose **What should I ask next?**.
7. Confirm the answer asks about 12-24 month cash needs and cites conversation context, CRM liquidity notes, and `RJ-DEMO-LIQUIDITY-007`.

## Next Validation Before Zoom

- Add a transcript event replay test.
- Add source coverage checks for every grounded suggestion.
- Add a simple audit event log.
- Add a feature flag for real Zoom RTMS ingestion.
