"""Where rows go: Supabase through its REST API with a secret key (ADR 0015), or NDJSON files for a
dry run. Both take the same calls."""
from __future__ import annotations

import json
import os
import threading
import time
from collections import Counter
from pathlib import Path

import requests

from .rows import now_iso

BATCH_SIZE = 500
PAGE_SIZE = 1000
RETRY_WAITS_S = (2, 5, 15)
ENV_FILE = Path(__file__).parent / ".env.local"
APP_ENV_FILE = Path(__file__).parent.parent / ".env"


def read_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    pairs = (line.split("=", 1) for line in path.read_text().splitlines()
             if "=" in line and not line.lstrip().startswith("#"))
    return {k.strip(): v.strip().strip("'\"") for k, v in pairs}


def load_config() -> tuple[str, str]:
    """The project URL (the app's own, from .env) and the scraper's secret key (scraper/.env.local).
    Environment variables win over both files."""
    env = {**read_env_file(APP_ENV_FILE), **read_env_file(ENV_FILE), **os.environ}
    url = env.get("SUPABASE_URL") or env.get("VITE_SUPABASE_URL")
    key = env.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        raise SystemExit("Missing SUPABASE_SECRET_KEY: put the scraper's secret key in scraper/.env.local "
                         "(see docs/development.md), or use --dry-run.")
    return url.rstrip("/"), key


class Supabase:
    def __init__(self, url: str, key: str, session: requests.Session | None = None):
        self.rest = f"{url}/rest/v1"
        self.s = session or requests.Session()
        # New-style secret keys go in `apikey` only; they aren't JWTs, so no Authorization header.
        self.s.headers.update({"apikey": key, "Content-Type": "application/json"})
        self.lock = threading.Lock()  # chains run in threads; one request at a time is plenty

    def _call(self, method: str, path: str, retry: bool = True, **kw) -> requests.Response:
        """One REST call. Our own database, unlike a supermarket site, gets retried on a dropped
        connection or a 5xx: every call that retries is idempotent (the upsert included)."""
        waits = list(RETRY_WAITS_S) if retry else []
        while True:
            try:
                with self.lock:
                    r = self.s.request(method, f"{self.rest}/{path}", timeout=60, **kw)
                if r.status_code < 500 or not waits:
                    break
            except (requests.ConnectionError, requests.Timeout):
                if not waits:
                    raise
            time.sleep(waits.pop(0))
        if r.status_code >= 300:
            raise RuntimeError(f"Supabase {method} {path}: {r.status_code} {r.text[:300]}")
        return r

    def start_run(self, store_key: str) -> int:
        # Not retried: a lost response would leave a second run row behind.
        r = self._call("POST", "scrape_runs", retry=False, json={"store_key": store_key},
                       headers={"Prefer": "return=representation"})
        return r.json()[0]["id"]

    def update_run(self, run_id: int, **fields) -> None:
        self._call("PATCH", f"scrape_runs?id=eq.{run_id}", json=fields, headers={"Prefer": "return=minimal"})

    def save(self, rows: list[dict]) -> int:
        saved = 0
        for i in range(0, len(rows), BATCH_SIZE):
            saved += self._call("POST", "rpc/upsert_store_products", json={"rows": rows[i:i + BATCH_SIZE]}).json()
        return saved


    def skus(self, store_key: str) -> set[str]:
        """The ids of every product saved for a chain."""
        out: set[str] = set()
        last = 0
        while True:
            page = self._call("GET", "store_products", params={
                "select": "id,store_sku", "store_key": f"eq.{store_key}", "id": f"gt.{last}", "order": "id",
                "limit": PAGE_SIZE,
            }).json()
            if not page:
                return out
            out.update(p["store_sku"] for p in page)
            last = page[-1]["id"]

    def count(self, store_key: str) -> int:
        r = self._call("GET", "store_products", params={"select": "id", "store_key": f"eq.{store_key}", "limit": 1},
                       headers={"Prefer": "count=exact"})
        return int(r.headers["Content-Range"].rsplit("/", 1)[1])


class DryRun:
    """Stands in for Supabase: rows go to scraper/data/out/<store>.ndjson and runs to runs.json."""

    def __init__(self, out_dir: Path):
        self.out = out_dir
        self.out.mkdir(parents=True, exist_ok=True)
        for f in self.out.glob("*.ndjson"):
            f.unlink()
        self.runs: dict[int, dict] = {}
        self.counts: Counter = Counter()
        self.lock = threading.Lock()

    def start_run(self, store_key: str) -> int:
        with self.lock:
            run_id = len(self.runs) + 1
            self.runs[run_id] = {"store_key": store_key, "started_at": now_iso()}
            return run_id

    def update_run(self, run_id: int, **fields) -> None:
        with self.lock:
            self.runs[run_id].update(fields)
            (self.out / "runs.json").write_text(json.dumps(self.runs, ensure_ascii=False, indent=1))

    def save(self, rows: list[dict]) -> int:
        by_store: dict[str, list[dict]] = {}
        for row in rows:
            by_store.setdefault(row["store_key"], []).append(row)
        with self.lock:
            for store, store_rows in by_store.items():
                with (self.out / f"{store}.ndjson").open("a", encoding="utf-8") as f:
                    f.writelines(json.dumps(row, ensure_ascii=False) + "\n" for row in store_rows)
                self.counts[store] += len(store_rows)
        return len(rows)


    def skus(self, store_key: str) -> set[str]:
        return set()

    def count(self, store_key: str) -> int:
        return self.counts[store_key]
