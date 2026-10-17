# Documentation structure for `app`

## Context
The repo is empty (no commits), so this sets the rules before docs pile up. The goal is a small, predictable set of folders where each kind of doc has exactly one home. All docs are written in English only.

## Layout
```
README.md                 very short app description (a few lines) + link to docs/
AGENTS.md                 extremely short rules for coding agents (see below)
CLAUDE.md                 one line: `@AGENTS.md` (so Claude Code loads the same rules)
docs/
  product.md              living: problem, users, scope
  architecture.md         living: components, data flow, stack (a list of what's used now, each linking to its ADR; no reasoning here)
  development.md          living: setup, commands, env, testing, deploy
  adr/
    README.md             ADR index (#, title, status, date) + template
    0001-record-architecture-decisions.md
  plans/                  LLM coding plans, one file per task: YYYY-MM-DD-slug.md
  notes/                  working docs: todos, brainstorms, ideas (free form, can be messy)
```

What goes where:
- **Living docs** (`docs/*.md`): always describe how things are *now*. They are updated in the same change as the code.
- **ADRs** (`docs/adr/`): numbered and append-only. Status is `Proposed`, `Accepted` or `Superseded by NNNN`. Only the status line of an old ADR ever changes.
- **Plans** (`docs/plans/`): every LLM coding plan is saved here before implementation, and never edited afterwards. It is a historical record.
- **Notes** (`docs/notes/`): todos, brainstorms and anything else that is half-formed. This is the only place for those.

## AGENTS.md (target content, about 10 lines)
```
# Agent rules
- English only in code, comments and docs.
- Docs map: living docs in docs/*.md, decisions in docs/adr/, plans in docs/plans/, todos/brainstorms in docs/notes/.
- Every coding plan: save it to docs/plans/YYYY-MM-DD-slug.md before implementing.
- Every plan must include a "Docs" step: update affected docs/*.md, add an ADR in docs/adr/ for any significant decision, and update docs/adr/README.md.
- One fact, one place. Link, don't copy.
- No new .md files outside these folders.
```

## Implementation steps
1. `README.md`: app name plus a 2–3 line description placeholder, and a link to `docs/`.
2. `AGENTS.md` with the rules above, and `CLAUDE.md` containing only `@AGENTS.md`.
3. `docs/product.md`, `docs/architecture.md` and `docs/development.md` with headings only.
4. `docs/adr/README.md` (index + template) and `docs/adr/0001-record-architecture-decisions.md`, which adopts this structure.
5. `docs/plans/` with this plan saved as `2026-10-17-documentation-structure.md`.
6. `docs/notes/` with a `.gitkeep` so the folder is tracked.
7. Commit: "Add documentation structure".

## Verification
- `find . -name "*.md" -not -path "./.git/*"` shows only the files above.
- `AGENTS.md` is 15 lines or fewer, and the README is 10 lines or fewer.
- No Spanish text: `grep -rniE "\b(el|la|los|para|que|usar)\b" --include=*.md .` comes back empty.
