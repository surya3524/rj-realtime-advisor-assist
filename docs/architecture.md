# Architecture

## Capture Path Decision

For an enterprise financial-advisor assistant, use Zoom Realtime Media Streams
(RTMS) as the primary capture path when the goal is continuous access to meeting
audio, video, or transcripts. Zoom's current documentation describes RTMS as a
data pipeline for live meeting media and points continuous data access or persistent
recording use cases toward RTMS.

Use Meeting SDK raw audio only when the product must embed the meeting experience
or when the challenge requires demonstrating SDK-level raw data callbacks on a
supported native platform.

## Services

### Media Gateway

Responsibilities:

- Authenticate Zoom stream/webhook events.
- Enforce meeting eligibility and consent state before processing.
- Normalize audio format for transcription.
- Publish durable events with meeting ID, participant ID, timestamp, and sequence.

### Transcription Service

Responsibilities:

- Stream audio to the transcription provider.
- Track partial and final transcript segments.
- Preserve confidence/logprob signals where available.
- Emit transcript events; do not overwrite raw evidence.

### Suggestion Service

Responsibilities:

- Maintain a short rolling context window.
- Retrieve approved policy/product/FAQ snippets.
- Generate structured advisor-only suggestions.
- Validate grounding, prohibited claims, suitability language, and source coverage.

### Advisor Sidebar

Responsibilities:

- Show realtime transcript and suggestions.
- Show why a suggestion appeared, including source IDs.
- Let advisors dismiss, pin, or mark suggestions as useful.
- Display compliance reminders without interrupting the call flow.

## Data Flow

1. Zoom meeting emits authorized media stream.
2. Media Gateway validates authorization and consent state.
3. Audio is chunked, normalized, sequenced, and streamed to transcription.
4. Transcript deltas update conversation state.
5. Suggestion Service retrieves approved evidence.
6. Model output is validated.
7. Sidebar receives only validated advisor-facing suggestions.
8. Audit event is written for every suggestion decision, including suppressed suggestions.

## Latency Budget

- Audio capture to gateway: target under 300 ms.
- Gateway to transcript partial: target 500-1500 ms.
- Transcript to sidebar suggestion: target 1000-2500 ms.
- Full path: target under 4 seconds for useful in-call coaching.

## Failure Modes

- Missing consent: stop processing and show "AI assistance unavailable."
- Low transcription confidence: ask clarifying question rather than infer.
- No approved retrieval source: suppress generated advice.
- Model/provider unavailable: show transcript-only mode.
- Policy validator failure: suppress suggestion and audit reason.
