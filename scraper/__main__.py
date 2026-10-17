"""python -m scraper: read supermarket prices into Supabase. See docs/development.md."""
import argparse
import sys

from .run import ALL_STORES, GDU_PHASES, run


def main() -> None:
    ap = argparse.ArgumentParser(prog="python -m scraper", description="Read supermarket prices into Supabase.")
    ap.add_argument("--stores", default=",".join(ALL_STORES), help="comma-separated, default: all four chains")
    ap.add_argument("--minutes", type=float, default=25, help="time budget for the whole run (default 25)")
    ap.add_argument("--limit", type=int, help="smoke run: at most N pages per chain and phase")
    ap.add_argument("--dry-run", action="store_true", help="write rows to scraper/data/out/ instead of Supabase")
    ap.add_argument("--refresh-sitemap", action="store_true", help="ignore the GDU sitemap cached in the last 24 h")
    ap.add_argument("--phases", default=",".join(GDU_PHASES),
                    help="GDU phases to run: categories,brands,food (brands needs categories)")
    args = ap.parse_args()
    stores = [s for s in args.stores.split(",") if s]
    unknown = set(stores) - set(ALL_STORES)
    if unknown:
        ap.error(f"unknown stores: {', '.join(sorted(unknown))}")
    phases = tuple(p for p in args.phases.split(",") if p)
    if set(phases) - set(GDU_PHASES):
        ap.error(f"unknown phases: {', '.join(sorted(set(phases) - set(GDU_PHASES)))}")
    ok = run(stores, args.minutes, args.limit, args.dry_run, args.refresh_sitemap, phases)
    sys.exit(0 if ok else 1)


main()
