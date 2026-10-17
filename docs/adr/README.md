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
| 0008 | [How we read supermarket sites](0008-how-we-read-supermarket-sites.md) | Accepted | 2026-10-17 |
| 0009 | [The AI nutritionist uses judgment, not gatekeeping](0009-judgment-not-gatekeeping.md) | Accepted | 2026-10-17 |
| 0010 | [Voice dictation with the browser's speech recognition](0010-browser-speech-recognition.md) | Accepted | 2026-10-17 |
| 0011 | [The saved profile travels into each chat](0011-profile-in-each-chat.md) | Accepted | 2026-10-17 |
| 0012 | [Fill supermarket carts from the user's computer](0012-fill-carts-from-the-users-computer.md) | Accepted | 2026-10-17 |
| 0013 | [Weekly menu saved by a chat tool, keyed to a fixed food catalog](0013-menu-saved-by-a-chat-tool.md) | Accepted (confirm step removed by 0022) | 2026-10-17 |
| 0014 | [The client only reads; the chat function writes, under a daily cap](0014-client-reads-chat-function-writes.md) | Accepted (`menus.confirmed_at` write gone with 0022) | 2026-10-17 |
| 0015 | [The price scraper is a Python job with a time budget](0015-price-scraper-python-job-with-time-budget.md) | Accepted (coverage and write path superseded by 0018) | 2026-10-17 |
| 0016 | [Price catalog: one row per product per chain](0016-price-catalog-one-row-per-product-per-chain.md) | Accepted | 2026-10-17 |
| 0017 | [The shopping list is derived in the browser; only what you have is stored](0017-shopping-list-derived-in-the-browser.md) | Accepted (marks reach the chat model as numbers: 0022) | 2026-10-17 |
| 0018 | [The scraper reads GDU through listings and a few food pages](0018-gdu-listings-and-food-pages.md) | Accepted | 2026-10-17 |
| 0019 | [Example prices bundled with the app until real prices are matched](0019-example-prices-until-matched.md) | Accepted | 2026-10-17 |
| 0020 | [CI on Tenki runners](0020-ci-on-tenki-runners.md) | Accepted | 2026-10-17 |
| 0021 | [The numbers switch lives in the profile; macros come from a fixed table](0021-numbers-switch-in-the-profile.md) | Accepted | 2026-10-17 |
| 0022 | [The shopping list follows the menu, and shows in the chat](0022-list-follows-the-menu.md) | Accepted | 2026-10-17 |

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
