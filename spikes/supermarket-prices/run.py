"""Runs the spike: scrape the basket at each chain, match products and write the outputs.

Usage:
  python run.py                      # full basket, all four chains
  python run.py --limit 2            # smoke run: 2 GDU candidates, 2 Ta-Ta products per item
  python run.py --stores devoto,tata
"""
from __future__ import annotations

import argparse
import csv
import json
import time
from pathlib import Path

import match
import scrape_gdu
import scrape_tata
from common import PoliteSession, drop_placeholder_price, now_iso

OUT_DIR = Path(__file__).parent / "data" / "out"
ALL_STORES = ("devoto", "geant", "disco", "tata")


def write_csv(path: Path, rows: list[dict]) -> None:
    fields: list[str] = []
    for r in rows:
        fields += [k for k in r if k not in fields]
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stores", default=",".join(ALL_STORES))
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--refresh-sitemap", action="store_true")
    ap.add_argument("--rematch", action="store_true",
                    help="redo matching from data/out/offers.json without any request")
    args = ap.parse_args()
    if args.rematch:
        return rematch()
    stores = [s for s in args.stores.split(",") if s]
    gdu_stores = tuple(s for s in stores if s in scrape_gdu.STORES)

    sess = PoliteSession()
    started, t0, cpu0 = now_iso(), time.monotonic(), time.process_time()
    timings: dict = {}
    offers: list[dict] = []
    report: dict = {}

    if gdu_stores:
        print("GDU (Devoto/Géant/Disco)...", flush=True)
        o, r = scrape_gdu.run(sess, stores=gdu_stores, refresh_sitemap=args.refresh_sitemap,
                              limit=args.limit, timings=timings)
        offers += o
        report.update(r)
    if "tata" in stores:
        print("Ta-Ta...", flush=True)
        o, r = scrape_tata.run(sess, limit=args.limit)
        offers += o
        report["tata"] = r

    present = [s for s in ALL_STORES if s in stores]
    comparison, review, match_stats = run_matching(offers, present)
    gdu = [o for o in offers if o["store_key"] in scrape_gdu.STORES]
    jsonld_vs_visible = sum(1 for o in gdu if o["notes"] and "visible price" in o["notes"])

    run_report = {
        "started_at": started,
        "finished_at": now_iso(),
        "wall_s": round(time.monotonic() - t0, 1),
        "cpu_s": round(time.process_time() - cpu0, 2),
        "args": vars(args),
        "requests": len(sess.log),
        "per_store": report,
        "offers": len(offers),
        **match_stats,
        "gdu_jsonld_price_differs_from_visible": {"offers": len(gdu), "differ": jsonld_vs_visible},
        "gdu_with_previous_price": sum(1 for o in gdu if o["previous_price"] is not None),
        "gdu_without_valid_ean": sum(1 for o in gdu if not o["gtin"]),
        "size_unknown": sum(1 for o in offers if o["base_qty"] is None),
        "timings": timings,
        "request_log": sess.log,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "offers.json").write_text(json.dumps(offers, ensure_ascii=False, indent=1))
    write_csv(OUT_DIR / "offers.csv", offers)
    write_matching(comparison, review)
    (OUT_DIR / "run_report.json").write_text(json.dumps(run_report, ensure_ascii=False, indent=1))
    print_summary(run_report)


def run_matching(offers: list[dict], stores: list[str]) -> tuple[list[dict], list[dict], dict]:
    groups, review = match.match(offers)
    levels: dict[str, int] = {}
    for g in groups:
        if len(g["members"]) >= 2:  # a product alone in its group matched nothing
            for s, (lvl, _) in g["members"].items():
                levels[lvl] = levels.get(lvl, 0) + 1
        levels["substitute"] = levels.get("substitute", 0) + len(g["substitutes"])
    stats = {
        "groups": len(groups),
        "groups_with_2plus_stores_exact": sum(1 for g in groups if len(g["members"]) >= 2),
        "groups_with_tata_exact": sum(1 for g in groups if "tata" in g["members"] and len(g["members"]) >= 2),
        "match_levels": levels,
        "review_rows": len(review),
        "gdu_price_spread": match.gdu_price_spread(groups),
    }
    return match.comparison_rows(groups, stores), review, stats


def write_matching(comparison: list[dict], review: list[dict]) -> None:
    write_csv(OUT_DIR / "comparison.csv", comparison)
    write_csv(OUT_DIR / "review.csv", review or [{"reason": None}])


def rematch() -> None:
    raw = json.loads((OUT_DIR / "offers.json").read_text())
    report = json.loads((OUT_DIR / "run_report.json").read_text())
    for o in raw:  # apply rules added after the run, without new requests
        drop_placeholder_price(o)
    offers = [o for o in raw if o["price"] is not None]
    report["placeholder_prices_dropped"] = len(raw) - len(offers)
    (OUT_DIR / "offers.json").write_text(json.dumps(raw, ensure_ascii=False, indent=1))
    write_csv(OUT_DIR / "offers.csv", raw)
    stores = [s for s in ALL_STORES if any(o["store_key"] == s for o in offers)]
    comparison, review, stats = run_matching(offers, stores)
    write_matching(comparison, review)
    report.update(stats, rematched_at=now_iso())
    (OUT_DIR / "run_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1))
    print_summary(report)


def print_summary(run_report: dict) -> None:
    summary = {k: v for k, v in run_report.items() if k != "request_log"}
    for s in summary["per_store"].values():
        s["errors"] = s["errors"][:5]
    print(json.dumps(summary, ensure_ascii=False, indent=1))
    print(f"Outputs in {OUT_DIR}")


if __name__ == "__main__":
    main()
