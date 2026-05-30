# Repo Roadmap

## Phase 0: Challenge Framing

- Confirm Zoom capture route: RTMS or Meeting SDK raw audio.
- Confirm target sidebar host: browser extension, embedded web app, or advisor desktop app.
- Collect approved demo knowledge base.
- Define demo compliance constraints.

## Phase 1: Skeleton

- Monorepo with apps and services.
- Local mocked Zoom stream.
- Realtime transcript simulator.
- Sidebar UI with live transcript and grounded suggestions.

## Phase 2: Zoom Integration

- Implement authorized media capture.
- Validate stream/webhook signatures.
- Add consent gate and audit events.
- Add replayable integration tests with synthetic audio.

## Phase 3: Suggestion Quality

- Add retrieval over approved documents.
- Add structured suggestion schema.
- Add validators for grounding, prohibited claims, and missing confidence.
- Add golden evaluation set for hallucination suppression.

## Phase 4: Enterprise Hardening

- Add observability.
- Add threat model.
- Add retention and deletion workflows.
- Add CI security gates.
- Add deployment templates.

## Phase 5: Demo Polish

- Build realistic advisor sidebar.
- Add demo call scripts.
- Show audit trail and failure handling.
- Prepare architecture deck and reviewer walkthrough.
