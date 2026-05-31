# Zoom Transcript Context POC

This is a separate concept app for testing the advisor workflow:

1. Capture or import a Zoom conversation transcript.
2. Keep conversation context visible but low-noise.
3. Let the advisor ask a question.
4. Answer using the transcript so far, mocked RJ CRM context, approved knowledge, and a dated market snapshot.

## POC Inputs

- **Simulated transcript**: fastest demo path.
- **Paste transcript**: useful with a Zoom-generated transcript or copied call notes.
- **Live mic dictation**: uses browser speech recognition when available. This is a browser POC, not production Zoom capture.

Production Zoom capture should use Zoom RTMS or an approved Meeting SDK/native capture path after permissions are approved.
