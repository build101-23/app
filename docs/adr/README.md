# Architecture Decision Records

One file per decision: `NNNN-short-title.md`. ADRs are append-only: never rewrite an accepted ADR. To change a decision, write a new ADR and set the old one's status to `Superseded by NNNN`.

| #    | Title                                                         | Status   | Date       |
|------|---------------------------------------------------------------|----------|------------|
| 0001 | [Record architecture decisions](0001-record-architecture-decisions.md) | Accepted | 2026-10-17 |

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
