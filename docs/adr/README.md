# Architecture Decision Records

One file per decision: `NNNN-short-title.md`. ADRs are append-only: never rewrite an accepted ADR. To change a decision, write a new ADR and set the old one's status to `Superseded by NNNN`.

| #    | Title                                                         | Status   | Date       |
|------|---------------------------------------------------------------|----------|------------|
| 0001 | [Record architecture decisions](0001-record-architecture-decisions.md) | Accepted | 2026-10-17 |
| 0002 | [Installable web app now, Capacitor later](0002-pwa-now-capacitor-later.md) | Accepted | 2026-10-17 |
| 0003 | [Prices from supermarket websites and SIPC](0003-price-sources.md) | Accepted | 2026-10-17 |
| 0004 | [Vite React, Supabase and Claude](0004-vite-react-supabase-claude.md) | Accepted (model superseded by 0007) | 2026-10-17 |
| 0005 | [Host the web app on Cloudflare Workers](0005-cloudflare-workers.md) | Accepted | 2026-10-17 |
| 0006 | [Spanish UI, English everything else](0006-spanish-ui.md) | Accepted | 2026-10-17 |
| 0007 | [Claude Sonnet 5.5 at medium effort for the chat](0007-sonnet-for-chat.md) | Accepted | 2026-10-17 |
| 0008 | [VIVERI identity and a token-based UI system](0008-viveri-identity-and-ui-system.md) | Proposed (navigation and depth amended by 0009) | 2026-10-17 |
| 0009 | [Glass navigation layer](0009-glass-navigation-layer.md) | Proposed | 2026-10-17 |

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
What forces us to decide, and what options we considered.

## Decision
What we chose.

## Consequences
What gets easier, what gets harder.
```
