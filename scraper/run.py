"""One pass over the chains: each site in its own thread, all inside a time budget (ADR 0015).

- Ta-Ta: the whole catalog except clothing, one category at a time.
- Devoto, Géant and Disco go through three phases; each starts once all three finish the previous one:
  1. categories: the top products of every supermarket category, 12 per request;
  2. brands: the page of every brand seen in phase 1, the same list at the three chains;
  3. food: product pages for foods the listings miss, a few per food, one request every 2 seconds.
     Pages read by an earlier food phase are read again, so their prices stay current (ADR 0023).
- The three GDU sites share one platform: when one of them blocks us, the other two stop as well
  (ADR 0008).
"""
from __future__ import annotations

import threading
import time
import traceback
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

import requests

from . import gdu, tata
from .db import DryRun, Supabase, load_config
from .fetch import BlockedError, PoliteSession
from .rows import now_iso

ALL_STORES = ("devoto", "geant", "disco", "tata")
DATA_DIR = Path(__file__).parent / "data"
FLUSH_EVERY = 200
MAX_ERRORS_IN_A_ROW = 20
SIBLING_BLOCKED = "another GDU chain was blocked"
GDU_PHASES = ("categories", "brands", "food")
FOOD_PAGE_DELAY_S = 2.0  # product pages, gentler than listings: they came before Devoto's block


class Stop(Exception):
    """Stop reading a chain: the time budget ran out, the user pressed Ctrl-C, --limit was reached,
    or another GDU chain was blocked."""


class TooManyErrors(Exception):
    pass


class Budget:
    def __init__(self, minutes: float):
        self.deadline = time.monotonic() + minutes * 60
        self.interrupted = threading.Event()

    def check(self) -> None:
        if self.interrupted.is_set():
            raise Stop("interrupted")
        if time.monotonic() >= self.deadline:
            raise Stop("time budget")


class StoreRun:
    """One chain's pass: its scrape_runs row, its counters and the rows waiting to be saved."""

    def __init__(self, sink, store_key: str, budget: Budget):
        self.sink, self.store_key, self.budget = sink, store_key, budget
        self.run_id = sink.start_run(store_key)
        self.session = PoliteSession()
        self.halt: threading.Event | None = None  # set when a chain sharing this platform is blocked
        self.stats: Counter = Counter()
        self.price_context: str | None = None
        self.skus: set[str] = set()  # read in this run
        self.pending: list[dict] = []
        self.errors_in_a_row = 0
        self.error_samples: list[str] = []
        self.stopped_by: str | None = None
        self.status = "running"

    def get(self, url: str, **kw) -> requests.Response | None:
        """A polite GET inside the budget. Network and server errors are counted and give None."""
        self.budget.check()
        if self.halt is not None and self.halt.is_set():
            raise Stop(SIBLING_BLOCKED)
        try:
            r = self.session.get(url, **kw)
        except requests.RequestException as e:
            self.error(f"{url}: {e}")
            return None
        if r.status_code >= 500:
            self.error(f"{r.status_code} on {url}")
            return None
        self.errors_in_a_row = 0
        return r

    def error(self, message: str) -> None:
        self.stats["errors"] += 1
        self.errors_in_a_row += 1
        if len(self.error_samples) < 10:
            self.error_samples.append(message[:300])
        if self.errors_in_a_row >= MAX_ERRORS_IN_A_ROW:
            raise TooManyErrors(message)

    def see_context(self, context: str | None) -> None:
        if context and self.price_context is None:
            self.price_context = context
        elif context and context != self.price_context:
            self.stats["other_price_context"] += 1

    def add(self, row: dict) -> None:
        if row["store_sku"] in self.skus:
            return
        self.skus.add(row["store_sku"])
        if row["price"] is None:
            self.stats["no_price"] += 1
        self.pending.append(row)
        if len(self.pending) >= FLUSH_EVERY:
            self.flush()

    def flush(self) -> None:
        if self.pending:
            self.stats["rows_saved"] += self.sink.save(self.pending)
            self.pending = []
            print(f"  [{self.store_key}] {self.stats['rows_saved']} rows saved, {self.session.requests} requests",
                  flush=True)

    def finish(self, status: str) -> None:
        try:
            self.flush()
        except Exception as e:
            status = "failed"
            self.error_samples.append(f"saving rows: {e}"[:300])
        self.status = status
        stats = {**self.stats, "requests": self.session.requests, "stopped_by": self.stopped_by,
                 "error_samples": self.error_samples}
        self.sink.update_run(self.run_id, status=status, finished_at=now_iso(),
                             price_context=self.price_context, stats=stats)


def attempt(sr: StoreRun, work) -> bool:
    """Runs a step of one chain's work. If it stops or fails, records how the run ended and returns
    False. Rows read before that are still saved."""
    try:
        work()
        return True
    except Stop as e:
        sr.stopped_by = str(e)
        stopped_early = sr.budget.interrupted.is_set() or sr.stopped_by == SIBLING_BLOCKED
        status = "interrupted" if stopped_early else "done"
    except BlockedError as e:
        status = "blocked"
        sr.error_samples.append(str(e))
    except TooManyErrors:
        status = "failed"
    except Exception as e:  # a bug, or a page we didn't expect
        traceback.print_exc()
        status = "failed"
        sr.error_samples.append(f"{type(e).__name__}: {e}"[:300])
    sr.finish(status)
    return False


# ------------------------------------------------------------------ Ta-Ta


def run_tata(sr: StoreRun, limit: int | None) -> None:
    if attempt(sr, lambda: read_tata(sr, limit)):
        sr.finish("done")


def read_tata(sr: StoreRun, limit: int | None) -> None:
    sr.see_context(tata.PRICE_CONTEXT)
    r = sr.get(tata.TREE_URL)
    if r is None or r.status_code != 200:
        raise RuntimeError(f"no category tree ({r.status_code if r is not None else 'request failed'})")
    tree = tata.parse_tree(r.json())
    paths = tata.category_paths(tree)

    def fetch(facets: tata.Facets, after: int, first: int = tata.PAGE_SIZE) -> tuple[int, list[dict]]:
        if limit and sr.stats["search_requests"] >= limit:
            raise Stop("limit")
        sr.stats["search_requests"] += 1
        r = sr.get(tata.GRAPHQL_URL, params=tata.query_params(facets, after, first))
        if r is None:
            return 0, []
        try:
            return tata.parse_page(r.json())
        except ValueError as e:
            sr.error(f"{facets} after {after}: {e}")
            return 0, []

    sr.stats["catalog_total"], _ = fetch([], 0, first=1)
    try:
        for nodes in tata.iter_pages(fetch, tree):
            for node in nodes:
                sr.add(tata.node_row(node, paths, sr.run_id, now_iso()))
    finally:
        sr.stats["catalog_read"] = len(sr.skus)


# ------------------------------------------------------------------ Devoto, Géant, Disco


class GduPass:
    """What the three GDU chains share: the sitemap, the brands found in phase 1, and the halt
    signal for when one of them is blocked."""

    def __init__(self, sitemap: gdu.Sitemap):
        self.sitemap = sitemap
        self.brands: set[str] = set()
        self.lock = threading.Lock()
        self.halt = threading.Event()

    def add_brands(self, cards: list[dict]) -> None:
        with self.lock:
            self.brands.update(c["brand_id"] for c in cards if c["brand_id"])


def run_gdu(runs: list[StoreRun], shared: GduPass, limit: int | None, phases: tuple[str, ...] = GDU_PHASES) -> None:
    """Runs the phases for the three chains in step: each phase starts once all of them finish the
    previous one. A chain that stops or fails skips the rest."""
    readers = {"categories": read_category_pages, "brands": read_brand_pages, "food": read_food_pages}
    active = runs
    for phase in (readers[name] for name in GDU_PHASES if name in phases):
        with ThreadPoolExecutor(max_workers=len(active)) as pool:
            ok = list(pool.map(lambda sr: attempt(sr, lambda: gdu_step(sr, shared, phase, limit)), active))
        active = [sr for sr, still in zip(active, ok) if still]
    for sr in active:
        sr.finish("done")


def gdu_step(sr: StoreRun, shared: GduPass, phase, limit: int | None) -> None:
    try:
        phase(sr, shared, limit)
    except BlockedError:
        shared.halt.set()  # one platform: the other two stop at their next request
        raise


def read_category_pages(sr: StoreRun, shared: GduPass, limit: int | None) -> None:
    """Phase 1: the top products of every supermarket category."""
    base = gdu.STORES[sr.store_key]
    leaves = shared.sitemap.leaves(gdu.SUPERMARKET_DEPARTMENTS)
    for leaf in leaves[:limit] if limit else leaves:
        url = f"{base}/products/category/{shared.sitemap.categories[leaf]}/{leaf}"
        shared.add_brands(read_listing(sr, url, "category", shared.sitemap.path(leaf)))


def read_brand_pages(sr: StoreRun, shared: GduPass, limit: int | None) -> None:
    """Phase 2: every brand seen in phase 1, at every chain. A small brand comes whole."""
    brands = sorted(shared.brands, key=int)
    sr.stats["brands"] = len(brands)
    base = gdu.STORES[sr.store_key]
    for brand_id in brands[:limit] if limit else brands:
        read_listing(sr, f"{base}/products/brand/{brand_id}", "brand", None)


def read_food_pages(sr: StoreRun, shared: GduPass, limit: int | None) -> None:
    """Phase 3: product pages for foods the listings miss (gdu.FOOD_TERMS), skipping what the listings
    read, in this run or before."""
    queue = gdu.food_candidates(shared.sitemap, sr.sink.skus(sr.store_key, "category_page") | sr.skus)
    sr.stats["food_candidates"] = len(queue)
    sr.session.delay_s = FOOD_PAGE_DELAY_S
    base = gdu.STORES[sr.store_key]
    for pid in queue[:limit] if limit else queue:
        r = sr.get(f"{base}/product/{shared.sitemap.products[pid]}/{pid}")
        if r is None:
            continue
        p = gdu.parse_product_page(r.text) if r.status_code == 200 else None
        if not p or p["sku"] != pid:  # gone, not sold here, or redirected to another product
            sr.stats["food_not_found"] += 1
            continue
        sr.see_context(gdu.price_context(p["branch"]))
        sr.stats["food_pages"] += 1
        category = shared.sitemap.path(p["category_id"])
        sr.add(gdu.product_row(sr.store_key, p, urlparse(r.url).path, category, sr.run_id, now_iso()))


def read_listing(sr: StoreRun, url: str, kind: str, category: str | None) -> list[dict]:
    """Reads a category or brand page and saves its cards. A product already read in this run
    keeps its first row, so a brand page doesn't erase a category."""
    r = sr.get(url)
    if r is None:
        return []
    if r.status_code != 200:
        sr.stats[f"{kind}_not_found"] += 1
        return []
    total, cards = gdu.parse_listing_page(r.text)
    sr.see_context(gdu.price_context(gdu.page_branch(r.text)))
    sr.stats[f"{kind}_pages"] += 1
    sr.stats[f"{kind}_products_listed"] += total or 0
    for card in cards:
        sr.add(gdu.card_row(sr.store_key, card, category, sr.run_id, now_iso()))
    return cards


# ------------------------------------------------------------------ run


def run(stores: list[str], minutes: float, limit: int | None = None, dry_run: bool = False,
        refresh_sitemap: bool = False, phases: tuple[str, ...] = GDU_PHASES) -> bool:
    """Reads the chains and saves what it reads. True when every chain finished cleanly."""
    sink = DryRun(DATA_DIR / "out") if dry_run else Supabase(*load_config())
    started = time.monotonic()
    budget = Budget(minutes)
    runs = {s: StoreRun(sink, s, budget) for s in stores}
    jobs = []
    if "tata" in runs:
        jobs.append(lambda: run_tata(runs["tata"], limit))

    gdu_runs = [runs[s] for s in stores if s in gdu.STORES]
    if gdu_runs:
        session = runs[gdu.SITEMAP_STORE].session if gdu.SITEMAP_STORE in runs else PoliteSession()
        try:
            sitemap = gdu.read_sitemap(session, DATA_DIR / "cache" / "gdu_sitemap.json", refresh_sitemap)
        except Exception as e:
            for sr in gdu_runs:
                sr.error_samples.append(f"sitemap: {e}"[:300])
                sr.finish("blocked" if isinstance(e, BlockedError) else "failed")
        else:
            print(f"GDU sitemap: {len(sitemap.leaves(gdu.SUPERMARKET_DEPARTMENTS))} supermarket categories",
                  flush=True)
            shared = GduPass(sitemap)
            for sr in gdu_runs:
                sr.halt = shared.halt
            jobs.append(lambda: run_gdu(gdu_runs, shared, limit, phases))

    if jobs:
        with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
            futures = [pool.submit(job) for job in jobs]
            try:
                while not all(f.done() for f in futures):
                    time.sleep(0.5)
            except KeyboardInterrupt:
                budget.interrupted.set()
                print("\nStopping: saving what was read so far...", flush=True)
            for f in futures:
                f.result()

    print_summary(runs, sink, time.monotonic() - started)
    return all(sr.status == "done" for sr in runs.values())


def print_summary(runs: dict[str, StoreRun], sink, elapsed_s: float) -> None:
    print(f"\nFinished in {elapsed_s / 60:.1f} min")
    for store, sr in runs.items():
        s = sr.stats
        detail = (f"Ta-Ta catalog {s['catalog_read']}/{s['catalog_total']}" if store == "tata" else
                  f"{s['category_pages']} category pages, {s['brand_pages']} of {s['brands']} brand pages, "
                  f"{s['food_pages']} food pages ({s['food_not_found']} not found)")
        print(f"- {store}: {sr.status}, {s['rows_saved']} rows saved, {sink.count(store)} in total, "
              f"{sr.session.requests} requests, {s['errors']} errors. {detail}. {sr.price_context}")
        for sample in sr.error_samples[:3]:
            print(f"    {sample}")
