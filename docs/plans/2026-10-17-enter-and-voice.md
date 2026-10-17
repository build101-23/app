# Enter to send + voice dictation in the chat

Status: **done**.

## Context
Two changes to make the chat faster to use: Enter sends the message, and a mic button lets you talk instead of typing. You chose transcription in the browser (Web Speech API, free, no new backend), with the text landing in the input box for you to review and send.

All changes go in `src/Chat.tsx`, plus strings and CSS.

## Steps
1. Save this plan as `docs/plans/2026-10-17-enter-and-voice.md`.
2. **Enter sends** in `src/Chat.tsx`: add an `onKeyDown` on the textarea. Enter without Shift, and not while an IME is composing (`e.nativeEvent.isComposing`), calls `preventDefault()` and `e.currentTarget.form?.requestSubmit()`. Shift+Enter still adds a new line. This reuses the existing `send` and its `busy`/empty checks.
3. **Mic button** in `src/Chat.tsx`:
   - `const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition`. The button only renders if it exists, so unsupported browsers keep using the keyboard's dictation.
   - Tapping it starts a recognition with `lang = 'es-UY'`, `interimResults = true`, `continuous = true`. The draft from before you start is saved, and the transcript goes after it, so you see the text appear live.
   - Tapping again (or `onend`) stops. `onerror` shows a short message (for example, mic permission denied). Recording is kept in a `listening` state plus a ref to the recognition, and stops if you send or leave the screen.
   - If TypeScript's `lib.dom` has no `SpeechRecognition` types, add a minimal `declare global` with only the fields used.
4. **Strings** in `src/strings.ts` → `t.chat`: `listen: 'Hablar'`, `stopListening: 'Dejar de escuchar'`, `micError: 'No pude usar el micrófono.'`. These are the button's `aria-label`s; the button shows a mic icon (emoji 🎤 / ⏹).
5. **CSS** in `src/index.css`: style the button like the send button, with a visible "listening" state.
6. **Docs**: `docs/product.md` chat section (voice uses the browser's speech recognition and needs your review before sending; Enter sends). ADR 0010 "Voice dictation with the browser's speech recognition" (why not a paid service, the iOS PWA limit). Update `docs/adr/README.md`.

## Out of scope
A paid transcription service, sending automatically when you finish talking, and live voice conversation.

## Verification
- `npm run build` and `npm run lint` pass.
- Start the dev server in the browser pane: typing + Enter sends, and Shift+Enter adds a new line (check with `read_page` that a new bubble appears).
- Mic: check that the button renders in Chromium. Real speech can't be tested headless, so you test it on your phone (Android Chrome and iPhone, in the browser and with the app installed). If the button doesn't appear on the installed iPhone app, that's the expected fallback.
