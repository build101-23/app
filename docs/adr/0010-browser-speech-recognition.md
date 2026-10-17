# 0010. Voice dictation with the browser's speech recognition

- Status: Accepted
- Date: 2026-10-17

## Context
Users should be able to talk to the chat instead of typing. Options: the browser's Web Speech API, or recording audio and sending it to a paid transcription service (OpenAI, Deepgram) through a new Edge Function.

## Decision
- A mic button in the chat uses the browser's `SpeechRecognition` (`es-UY`, live results). The text lands in the input box; the user reviews it and sends.
- The button only shows where the API exists. Elsewhere the keyboard's own dictation is the fallback.

## Consequences
- Free, no new provider, key or backend.
- Not available in Firefox, and unreliable in some installed iPhone apps. If pilot users miss it, a server-side transcription service is the upgrade.
