import tempfile
import unittest
from pathlib import Path
from unittest import mock

import requests

from scraper import db as db_module
from scraper import gdu
from scraper.db import DryRun, Supabase
from scraper.fetch import BlockedError
from scraper.rows import make_row
from scraper.run import FLUSH_EVERY, SIBLING_BLOCKED, Budget, GduPass, Stop, StoreRun, attempt, gdu_step


class FakeResponse:
    def __init__(self, data, status=200, headers=None):
        self.data, self.status_code, self.headers, self.text = data, status, headers or {}, str(data)

    def json(self):
        return self.data


class FakeSession:
    """Records calls and answers like PostgREST would."""

    def __init__(self, pages=()):
        self.headers, self.calls, self.pages = {}, [], list(pages)

    def request(self, method, url, **kw):
        self.calls.append((method, url, kw))
        if url.endswith("rpc/upsert_store_products"):
            return FakeResponse(len(kw["json"]["rows"]))
        if method == "GET":
            return FakeResponse(self.pages.pop(0) if self.pages else [])
        return FakeResponse([{"id": 1}])


class SupabaseTest(unittest.TestCase):
    def test_secret_key_goes_in_apikey_only(self):
        s = FakeSession()
        Supabase("https://x.supabase.co", "sb_secret_test", s)
        self.assertEqual(s.headers["apikey"], "sb_secret_test")
        self.assertNotIn("Authorization", s.headers)

    def test_save_in_batches(self):
        s = FakeSession()
        db = Supabase("https://x.supabase.co", "k", s)
        self.assertEqual(db.save([{"store_sku": str(i)} for i in range(1200)]), 1200)
        self.assertEqual([len(kw["json"]["rows"]) for _, _, kw in s.calls], [500, 500, 200])

    def test_dropped_connection_is_retried(self):
        class Flaky(FakeSession):
            failures = 2

            def request(self, method, url, **kw):
                if self.failures:
                    self.failures -= 1
                    raise requests.ConnectionError("Connection reset by peer")
                return super().request(method, url, **kw)

        with mock.patch.object(db_module, "RETRY_WAITS_S", (0, 0, 0)):
            self.assertEqual(Supabase("https://x.supabase.co", "k", Flaky()).save([{"store_sku": "1"}]), 1)
            with self.assertRaises(requests.ConnectionError):  # a new run row is never retried
                Supabase("https://x.supabase.co", "k", Flaky()).start_run("tata")


class SkusTest(unittest.TestCase):
    def test_pages_until_empty(self):
        s = FakeSession(pages=[[{"id": 1, "store_sku": "a"}], [{"id": 5, "store_sku": "b"}]])
        self.assertEqual(Supabase("https://x.supabase.co", "k", s).skus("devoto"), {"a", "b"})
        self.assertEqual([kw["params"]["id"] for _, _, kw in s.calls], ["gt.0", "gt.1", "gt.5"])
        self.assertNotIn("read_from", s.calls[0][2]["params"])

    def test_only_rows_read_from_a_source(self):
        s = FakeSession()
        Supabase("https://x.supabase.co", "k", s).skus("disco", "category_page")
        self.assertEqual(s.calls[0][2]["params"]["read_from"], "eq.category_page")


class StoreRunTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.sink = DryRun(Path(self.tmp.name))

    def tearDown(self):
        self.tmp.cleanup()

    def row(self, sku, price=10.0):
        return make_row(store_key="tata", store_sku=sku, name="x", url_path="/x", price=price,
                        read_from="search_api", run_id=1, checked_at="t")

    def test_rows_are_saved_in_batches_and_once(self):
        sr = StoreRun(self.sink, "tata", Budget(1))
        for i in range(FLUSH_EVERY + 5):
            sr.add(self.row(str(i)))
        sr.add(self.row("0"))
        self.assertEqual(self.sink.count("tata"), FLUSH_EVERY)
        self.assertTrue(attempt(sr, lambda: None))
        sr.finish("done")
        self.assertEqual((sr.status, self.sink.count("tata")), ("done", FLUSH_EVERY + 5))

    def test_how_a_run_ends(self):
        def raises(sr, error):
            def work():
                sr.add(self.row("1"))
                raise error
            return work

        for error, status in ((Stop("time budget"), "done"), (BlockedError("403"), "blocked"), (KeyError("x"), "failed")):
            sr = StoreRun(self.sink, "tata", Budget(1))
            self.assertFalse(attempt(sr, raises(sr, error)))
            self.assertEqual(sr.status, status)
            self.assertEqual(sr.stats["rows_saved"], 1)  # rows read before the end are kept
        self.assertEqual(self.sink.runs[1]["stats"]["stopped_by"], "time budget")

    def test_budget(self):
        with self.assertRaises(Stop):
            Budget(0).check()


class GduPassTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.sink = DryRun(Path(self.tmp.name))
        self.shared = GduPass(gdu.Sitemap({}, {}))

    def tearDown(self):
        self.tmp.cleanup()

    def test_brands(self):
        self.shared.add_brands([{"brand_id": "1482"}, {"brand_id": None}, {"brand_id": "7"}])
        self.assertEqual(self.shared.brands, {"1482", "7"})

    def test_a_block_stops_the_other_chains(self):
        devoto, geant = StoreRun(self.sink, "devoto", Budget(1)), StoreRun(self.sink, "geant", Budget(1))
        devoto.halt = geant.halt = self.shared.halt

        def blocked(sr, shared, limit):
            raise BlockedError("403")

        self.assertFalse(attempt(devoto, lambda: gdu_step(devoto, self.shared, blocked, None)))
        self.assertEqual(devoto.status, "blocked")
        with self.assertRaises(Stop) as stop:
            geant.get("https://www.geant.com.uy/products/brand/1482")  # no request is made
        self.assertEqual(str(stop.exception), SIBLING_BLOCKED)
        self.assertEqual(geant.session.requests, 0)


if __name__ == "__main__":
    unittest.main()
