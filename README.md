# RJ Realtime Advisor Assist

Enterprise-grade realtime assistant for financial advisors on Zoom calls.

The system captures authorized Zoom meeting media, transcribes it in near real time,
detects client intent and risk signals, and shows grounded advisor suggestions in a
secure sidebar. It is designed for financial-services review standards: consent,
auditability, data minimization, retrieval-grounded output, and human-in-the-loop use.

## Challenge Goal

Build a Raymond James engineering challenge prototype that demonstrates:

- Authorized realtime Zoom audio ingestion between clients and advisors.
- Low-latency transcription and speaker-aware conversation state.
- A sidebar for advisors with suggestions, objections, next-best questions, and compliance reminders.
- A no-hallucination posture: every suggestion must be grounded in approved knowledge, call context, or marked unavailable.
- Enterprise controls suitable for financial services.

## Recommended Architecture

```mermaid
flowchart LR
  Zoom[Zoom Meeting] --> Capture[Authorized Media Capture]
  Capture --> Stream[Realtime Media Gateway]
  Stream --> ASR[Realtime Transcription]
  ASR --> Redact[PII/PCI Redaction + Policy Filters]
  Redact --> State[Conversation State Store]
  State --> RAG[Approved Knowledge Retrieval]
  RAG --> Guardrails[Grounded Suggestion Engine]
  Guardrails --> Sidebar[Advisor Sidebar]
  Guardrails --> Audit[Immutable Audit Events]
```

## Implementation Plan

1. Prove capture path with Zoom using the approved permission model.
   - Preferred for continuous media capture: Zoom Realtime Media Streams (RTMS).
   - Alternative for embedded/native SDK demos: Meeting SDK raw audio on supported platforms.

2. Build a realtime ingestion service.
   - Validate Zoom webhooks/events and stream signatures.
   - Normalize audio to the transcription provider format.
   - Emit ordered call events to a durable stream.

3. Add transcription and conversation state.
   - Use realtime transcription for low latency.
   - Preserve segment IDs, timestamps, speaker labels when available, and confidence.
   - Never rely on generated summaries as the only source of truth.

4. Build a grounded suggestion service.
   - Retrieve only from approved Raymond James policy/product/FAQ material.
   - Require citations or internal evidence IDs for every suggestion.
   - If confidence or grounding is insufficient, return "No supported suggestion."

5. Build the advisor sidebar.
   - Display live transcript, suggested prompts, next-best actions, risk alerts, and citations.
   - Keep advisor in control; no automatic client-facing advice.

6. Add enterprise controls from day one.
   - Consent capture and visible recording/AI disclosure.
   - Tenant isolation, least-privilege service accounts, encryption in transit and at rest.
   - Audit logs, retention policies, redaction, monitoring, and incident runbooks.

## No-Hallucination Strategy

The product cannot promise mathematical zero hallucination from an LLM. The engineering
standard is to prevent unsupported claims from reaching the advisor:

- Retrieval-required generation: no retrieved source, no advice.
- Structured outputs with evidence IDs, confidence, and policy classification.
- Deterministic validators after model output.
- Restricted financial language: suggestions are phrased as advisor prompts, not final advice.
- Human approval: sidebar assists the advisor; it does not speak to the client.
- Full audit trail: transcript segment, source IDs, model version, prompt version, and validation result.

## Initial Tech Stack

- Backend: TypeScript or Python services, depending on the chosen Zoom SDK path.
- Eventing: Kafka, Redpanda, or AWS Kinesis for ordered call events.
- Realtime transport to sidebar: WebSocket or Server-Sent Events.
- Storage: Postgres for metadata, object storage for encrypted artifacts, vector index for approved knowledge.
- Observability: OpenTelemetry traces, structured logs, metrics, and security audit events.
- Deployment: containerized services with IaC, secrets manager, CI policy gates, and SBOM generation.

## References

- Zoom Meeting SDK: https://developers.zoom.us/docs/meeting-sdk/
- Zoom Realtime Media Streams: https://developers.zoom.us/docs/rtms/
- Zoom RTMS SDKs: https://developers.zoom.us/docs/rtms/sdk/
- OpenAI Realtime transcription: https://platform.openai.com/docs/guides/realtime-transcription
