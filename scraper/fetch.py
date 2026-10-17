"""Polite HTTP for supermarket sites (ADR 0008).

- An honest User-Agent that names us. No browser impersonation.
- One session per site, with at least a second between requests.
- Never retry on 401/403/429 or on an anti-bot challenge page: raise BlockedError and stop.
"""
from __future__ import annotations

import time

import requests

USER_AGENT = "build101-price-catalog/1.0 (+https://app.build101-23.workers.dev)"
DEFAULT_DELAY_S = 1.0
TIMEOUT_S = 30


class BlockedError(RuntimeError):
    """The site answered with a block or an anti-bot challenge. We don't try to get around it."""


class PoliteSession:
    """One site's HTTP session: a fixed pause between requests, and a request count."""

    def __init__(self, delay_s: float = DEFAULT_DELAY_S):
        self.s = requests.Session()
        self.s.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "es-UY,es;q=0.9"})
        self.delay_s = delay_s
        self._last = 0.0
        self.requests = 0

    def get(self, url: str, **kw) -> requests.Response:
        wait = self.delay_s - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        self._last = time.monotonic()
        self.requests += 1
        r = self.s.get(url, timeout=TIMEOUT_S, **kw)
        if r.status_code in (401, 403, 429) or is_challenge_page(r.text):
            raise BlockedError(f"{r.status_code} on {url} (block or anti-bot challenge; not bypassed)")
        return r


def is_challenge_page(text: str) -> bool:
    head = text[:3000]
    return "challenges.cloudflare.com" in head and "Just a moment" in head
