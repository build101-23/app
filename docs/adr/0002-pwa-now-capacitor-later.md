# 0002. Installable web app now, Capacitor later

- Status: Accepted
- Date: 2026-10-17

## Context
The product is a phone app, and the first test has 10 to 15 people on both Android and iOS. It needs voice dictation, photo and file access, and sharing to WhatsApp. Options considered:
- Native apps for each platform: two codebases, too slow for a first test.
- One web app wrapped as native apps with Capacitor (the phone equivalent of Electron): one codebase, but app store or TestFlight setup and review before anyone can try it.
- An installable web app (PWA): one codebase, testers install it from a link, no review. Mobile browsers support the microphone, camera, file picker and share sheet we need.

## Decision
Build one web app and ship it as a PWA for the first version. When we need the app stores or a native feature the browser lacks, wrap the same code with Capacitor.

## Consequences
- Testers get updates instantly, with no store review.
- The web code must stay Capacitor-friendly: no server-rendered-only pages the wrapper can't load.
- Some things are weaker in a PWA, especially on iOS: push notifications and background tasks. Neither is needed for the first version.
