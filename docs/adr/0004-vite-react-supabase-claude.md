# 0004. Vite React, Supabase and Claude

- Status: Accepted (model superseded by 0007)
- Date: 2026-10-17

## Context
[ADR 0002](0002-pwa-now-capacitor-later.md) settled on an installable web app. We still needed a framework, a backend, and an AI model for the nutritionist chat. Options considered:
- Client: Vite + React, Next.js, or Expo (React Native, which also builds for web). Next.js needs a static export or a remote URL to work inside Capacitor later. Expo means React Native components instead of HTML and CSS, and web is its weakest target.
- Backend: Supabase (auth, Postgres, Edge Functions in one service), or our own Node API and Postgres.
- AI: Claude or OpenAI.

## Decision
- Client: Vite + React + TypeScript, a static single-page app that Capacitor can wrap as is.
- Backend: one hosted Supabase project, used for auth (sign-in with an emailed code), Postgres with row-level security on every table, and Edge Functions for anything that needs a secret.
- AI: Claude through the Anthropic SDK, called only from an Edge Function. The model is `claude-opus-5-5`, with streaming responses and the server-side refusal fallback turned on.

## Consequences
- One codebase and one backend service to run. No servers of our own.
- The browser only holds the public Supabase key. Data is protected by row-level security, and the Anthropic key lives only in Supabase secrets.
- We depend on Supabase's free plan limits, which are enough for the pilot.
- Model cost needs watching. Tune effort per route before switching models.
