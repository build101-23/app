"""Unit tests with hand-written fixtures that mimic each site's structure (not copies of real pages).

Run from spikes/supermarket-prices: python -m unittest
"""
import unittest

import match
import scrape_gdu
import scrape_tata
from common import drop_placeholder_price, gtin13, parse_size, unit_price, valid_gtin

GDU_PAGE = """
<html><body>
<!-- <script type="application/ld+json">{"@type":"Product","name":"Commented out"}</script> -->
<script type="application/ld&#x2B;json">{"@context":"https://schema.org","@type":"Product",
 "name":"Arroz Blanco Saman 1 Kg","brand":{"@type":"Brand","name":"SAMAN"},"sku":"373713",
 "gtin":"7730205010025","offers":{"@type":"Offer","price":55,"priceCurrency":"UYU",
 "availability":"https://schema.org/InStock"}}</script>
<ol><li class="breadcrumb-item"><a href="/">Home</a></li><li class="breadcrumb-item"><a href="/a">Almacén</a></li>
<li class="breadcrumb-item"><a href="/b">Arroz</a></li></ol>
<h1 class="det-nom">Arroz Blanco Saman 1 Kg</h1>
<span class="text"><strong class="val">Devoto Fresh Market Portones</strong></span>
<div class="det-precios"><div class="before"><span class="sign">$</span><span class="val">69</span></div>
<div class="text"><span class="sign">$</span><span class="val">55</span></div></div><div class="det-add"></div>
<div class="vin-r det-labels"><span>Oferta</span></div></div>
<table class="det-especs"><tr><th>Contenido</th> <td>1 kg</td></tr></table>
</body></html>
"""

TATA_PAYLOAD = {"data": {"search": {"products": {"pageInfo": {"totalCount": 1}, "edges": [{"node": {
    "name": "Arroz Blanco Saman 1 Kg", "brand": {"name": "Saman"}, "sku": "299",
    "slug": "arroz-blanco-saman-1-kg-299", "gtin": "1000050592",
    "offers": {"lowPrice": 60, "offers": [{"availability": "https://schema.org/InStock",
                                           "price": 60, "listPrice": 69, "quantity": 10000}]},
}}]}}}}


def offer(store, name, brand, price, size, gtin=None, key="arroz", sku=None):
    s = parse_size(size)
    return {"store_key": store, "product_name": name, "brand": brand, "price": price, "gtin": gtin,
            "store_sku": sku,
            "basket_key": key, "product_url": f"https://example.test/{store}/{name}",
            **s, **unit_price(price, s)}


class SizeTest(unittest.TestCase):
    def test_simple(self):
        self.assertEqual(parse_size("Arroz Saman 1 Kg")["base_qty"], 1000)
        self.assertEqual(parse_size("Leche 1 L")["base_unit"], "ml")

    def test_pack(self):
        s = parse_size("Atún Gomes da Costa 3x80 g")
        self.assertEqual((s["pack_count"], s["base_qty"]), (3, 240))

    def test_pack_suffix(self):
        self.assertEqual(parse_size("Leche 1 L x 12 un")["base_qty"], 12000)

    def test_eggs(self):
        self.assertEqual(parse_size("Huevos x 12")["base_qty"], 12)

    def test_ambiguous_is_none(self):
        self.assertIsNone(parse_size("Yerba 500 g + 1 kg"))
        self.assertIsNone(parse_size("Yerba Mate Sara Azul 1K+100G Gratis"))

    def test_unit_count_before_size(self):
        s = parse_size("Yogur Bebible Yakult 4 U 100 Ml")
        self.assertEqual((s["pack_count"], s["base_qty"], s["base_unit"]), (4, 400, "ml"))

    def test_unit_price(self):
        self.assertEqual(unit_price(55, parse_size("500 g"))["price_per_kg"], 110)


class PlaceholderPriceTest(unittest.TestCase):
    def test_zero_and_one_are_dropped(self):
        for raw in (0.0, 1.0):
            o = drop_placeholder_price({"price": raw, "price_per_kg": 5.0, "notes": None})
            self.assertIsNone(o["price"])
            self.assertIsNone(o["price_per_kg"])
            self.assertIn("placeholder", o["notes"])

    def test_real_price_kept(self):
        self.assertEqual(drop_placeholder_price({"price": 49.0, "notes": None})["price"], 49.0)


class GtinTest(unittest.TestCase):
    def test_valid(self):
        self.assertTrue(valid_gtin("7730205010025"))
        self.assertFalse(valid_gtin("7730205010026"))

    def test_internal_code_is_not_ean(self):
        self.assertFalse(valid_gtin("1000050592"))

    def test_gtin14_to_13(self):
        self.assertEqual(gtin13("07730205010025"), "7730205010025")


class GduParserTest(unittest.TestCase):
    def test_parse(self):
        p = scrape_gdu.parse_product_page(GDU_PAGE)
        self.assertEqual(p["name"], "Arroz Blanco Saman 1 Kg")
        self.assertEqual(p["brand"], "SAMAN")
        self.assertEqual((p["price"], p["html_price"], p["previous_price"]), (55, 55, 69))
        self.assertEqual(p["content_spec"], "1 kg")
        self.assertEqual(p["category"], "Almacén > Arroz")
        self.assertEqual(p["branch"], "Devoto Fresh Market Portones")
        self.assertEqual(p["promo_labels"], ["Oferta"])

    def test_offer(self):
        p = scrape_gdu.parse_product_page(GDU_PAGE)
        o = scrape_gdu.build_offer("devoto", {"id": 373713, "basket_key": "arroz"}, "u", "u", p)
        self.assertEqual(o["gtin"], "7730205010025")
        self.assertEqual(o["size_source"], "spec")
        self.assertEqual(o["price_per_kg"], 55)
        self.assertIn("Portones", o["price_context"])
        self.assertIsNone(o["notes"])

    def test_no_jsonld(self):
        self.assertIsNone(scrape_gdu.parse_product_page("<html></html>"))


class TataParserTest(unittest.TestCase):
    def test_parse_and_offer(self):
        [p] = scrape_tata.parse_search(TATA_PAYLOAD)
        o = scrape_tata.build_offer({"key": "arroz"}, p, "u")
        self.assertEqual((o["price"], o["previous_price"]), (60, 69))
        self.assertEqual(o["store_code"], "1000050592")
        self.assertIsNone(o["gtin"])
        self.assertEqual(o["product_url"], "https://www.tata.com.uy/arroz-blanco-saman-1-kg-299/p")
        self.assertEqual(o["base_qty"], 1000)

    def test_empty_payload(self):
        self.assertEqual(scrape_tata.parse_search({}), [])


class MatchTest(unittest.TestCase):
    def setUp(self):
        self.offers = [
            offer("devoto", "Arroz Blanco Saman 1 Kg", "SAMAN", 55, "1 kg", gtin="7730205010025"),
            offer("geant", "Arroz Blanco Saman 1 Kg", "SAMAN", 55, "1 kg", gtin="7730205010025"),
            offer("disco", "Arroz Blanco Saman 1 Kg", "SAMAN", 58, "1 kg", gtin="7730205010025"),
            offer("tata", "Arroz Blanco Saman 1 Kg", "Saman", 60, "1 kg"),
            offer("tata", "Arroz Integral Saman 1 Kg", "Saman", 112, "1 kg"),
            offer("devoto", "Arroz Parboiled Saman 1 Kg", "SAMAN", 70, "1 kg", gtin="7730205010032"),
            offer("tata", "Arroz Parboiled TaTa 500 G", "TaTa", 30, "500 g"),
            offer("tata", "Arroz Parboiled Saman Bolsa Grande 1 Kg", "Saman", 79, "1 kg"),
        ]
        self.groups, self.review = match.match(self.offers)

    def group(self, name):
        return next(g for g in self.groups if g["name"] == name)

    def test_exact_gtin_and_exact(self):
        g = self.group("Arroz Blanco Saman 1 Kg")
        self.assertEqual({s: lvl for s, (lvl, _) in g["members"].items()},
                         {"devoto": "exact_gtin", "geant": "exact_gtin", "disco": "exact_gtin", "tata": "exact"})

    def test_critical_tokens_block_substitutes(self):
        g = self.group("Arroz Blanco Saman 1 Kg")
        self.assertNotIn("tata", g["substitutes"])  # integral never substitutes blanco
        integral = self.group("Arroz Integral Saman 1 Kg")
        self.assertEqual(integral["substitutes"], {})

    def test_partial_name_goes_to_review(self):
        self.assertTrue(any(r["product_name"].startswith("Arroz Parboiled Saman Bolsa") for r in self.review))
        g = self.group("Arroz Parboiled Saman 1 Kg")
        self.assertNotIn("tata", g["members"])

    def test_substitute_by_unit_price(self):
        g = self.group("Arroz Parboiled Saman 1 Kg")
        sub, reason = g["substitutes"]["tata"]
        self.assertEqual(sub["product_name"], "Arroz Parboiled TaTa 500 G")  # $60/kg beats $79/kg
        self.assertIn("unit price", reason)

    def test_unrelated_product_is_not_a_substitute(self):
        groups, _ = match.match([
            offer("devoto", "Leche ultra CONAPROLE primeros pasos 1 L", "CONAPROLE", 96, "1 L", key="leche", sku="1"),
            offer("tata", "Leche Chocolatada Conaprole Lactolate Sachet 1 L", "Conaprole", 69, "1 L", key="leche"),
        ])
        self.assertEqual(groups[0]["substitutes"], {})

    def test_cheapest_with_ties(self):
        rows = match.comparison_rows(self.groups, ["devoto", "geant", "disco", "tata"])
        row = next(r for r in rows if r["group_name"] == "Arroz Blanco Saman 1 Kg")
        self.assertEqual((row["cheapest_exact"], row["cheapest_exact_price"]), ("devoto|geant", 55))

    def test_exact_sku_without_ean(self):
        groups, _ = match.match([
            offer("devoto", "Arroz Integral GREEN CHEF 1 kg", "GREEN CHEF", 119, "1 kg", sku="981498"),
            offer("geant", "Arroz Integral GREEN CHEF 1 kg", "GREEN CHEF", 119, "1 kg", sku="981498"),
            offer("tata", "Arroz Integral Green Chef 1 Kg", "Green Chef", 99, "1 kg", sku="981498"),
        ])
        self.assertEqual({s: lvl for s, (lvl, _) in groups[0]["members"].items()},
                         {"devoto": "exact_sku", "geant": "exact_sku", "tata": "exact"})

    def test_tata_name_filter(self):
        import json as _json
        payload = _json.loads(_json.dumps(TATA_PAYLOAD))
        payload["data"]["search"]["products"]["edges"][0]["node"]["name"] = "Coca-Cola Zero Azúcar 2.25 L"
        [p] = scrape_tata.parse_search(payload)
        self.assertFalse(scrape_tata.keep(p, {"name_must": "azucar"}))

    def test_gdu_spread(self):
        self.assertEqual(match.gdu_price_spread(self.groups)["with_different_prices"], 1)


if __name__ == "__main__":
    unittest.main()
