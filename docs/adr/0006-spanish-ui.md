# 0006. Spanish UI, English everything else

- Status: Accepted
- Date: 2026-10-17

## Context
The first users are in Montevideo. [AGENTS.md](../../AGENTS.md) said "English only, everywhere", which would have meant an English interface for Spanish-speaking testers.

## Decision
- All user-facing text is Rioplatense Spanish, in one file: `src/strings.ts`.
- Code, comments, docs, commit messages and the AI's system prompt stay in English.
- The AI nutritionist replies in the user's language, defaulting to Rioplatense Spanish.

## Consequences
- Testers get an app in their own language from the first milestone.
- Adding English later means adding a second strings object, not hunting through components.
- Contributors must not hardcode UI text in components.
