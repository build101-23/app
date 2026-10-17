# 0020. CI on Tenki runners

- Status: Accepted
- Date: 2026-10-17

## Context
Milestone 5 adds the first logic worth guarding on every change: the store rule and its tests ([plan](../plans/2026-10-17-prices-and-store-rule.md)). Cloudflare already builds every push ([ADR 0005](0005-cloudflare-workers.md)), but it doesn't run the tests, and nothing checks a pull request. ADR 0005 gives our Tenki credits to CI.

Tenki registers self-hosted GitHub Actions runners for the organization. The repo is public, which matters for self-hosted runners:
- GitHub runner groups serve only private repositories unless "Allow public repositories" is on.
- A pull request from a fork could run its own code on our runners and credits.

Options considered: Tenki runners, or GitHub's `ubuntu-latest`, free for public repositories.

## Decision
- `.github/workflows/ci.yml` runs on `tenki-standard-small-2c-4g`, on pushes to `main` and on pull requests, in two jobs:
  - `check`: `npm ci`, `npm run lint`, `npm run build` and `npm test`;
  - `scraper`: the scraper's Python tests on Python 3.13 ([ADR 0015](0015-price-scraper-python-job-with-time-budget.md)). They use fixtures and no network.
- Pull requests from forks are skipped by the job's `if:`. The organization also requires approval for workflows from outside collaborators.
- Node 24, Cloudflare Workers Builds' default, so CI builds like production.
- Advisory: no required check and no branch protection yet, and Cloudflare deploys `main` whatever CI says.
- `npm run lint` fails on warnings, and `npm run build` type-checks the `_shared` tests, so CI and a local run fail the same way.

## Consequences
- An organization owner installs Tenki's Runners app with access to `app`, and turns on "Allow public repositories" for the Default runner group. Without both, jobs sit "Queued" with no error.
- Jobs are also rejected when the Tenki workspace has no credit.
- If Tenki can't serve the repo, the fallback is one line: `runs-on: ubuntu-latest`.
