"""Fixtures are hand-written to mimic the site's structure; they are not copies of real responses."""
import unittest

from scraper import tata

TREE = [
    {"id": 191, "name": "Almacén", "url": "https://secure.tata.com.uy/almacen", "children": [
        {"id": 52, "name": "Desayuno", "url": "https://secure.tata.com.uy/almacen/desayuno", "children": [
            {"id": 53, "name": "Café", "url": "https://secure.tata.com.uy/almacen/desayuno/cafe", "children": []}]},
        {"id": 62, "name": "Aceites", "url": "https://secure.tata.com.uy/almacen/aceites-y-aderezos", "children": []}]},
    {"id": 6, "name": "Bebidas", "url": "https://secure.tata.com.uy/bebidas", "children": []},
]


def node(sku, name, price=60, list_price=None, **extra):
    return {
        "sku": sku, "slug": f"{name.lower().replace(' ', '-')}-{sku}", "name": name, "gtin": "1000050592",
        "brand": {"name": "Saman"}, "categoriesIds": ["191", "52", "53"], "measurementUnit": "un",
        "unitMultiplier": 1, "hasMulticurrencyPrice": False,
        "offers": {"offers": [{"availability": "https://schema.org/InStock", "price": price,
                               "listPrice": list_price if list_price is not None else price}]},
        **extra,
    }


class TreeTest(unittest.TestCase):
    def test_paths(self):
        paths = tata.category_paths(tata.parse_tree(TREE))
        self.assertEqual(paths["53"], "almacen/desayuno/cafe")
        self.assertEqual(paths["6"], "bebidas")


class IterPagesTest(unittest.TestCase):
    def test_big_department_is_read_through_its_subcategories(self):
        counts = {("almacen",): 3000, ("almacen", "desayuno"): 150, ("almacen", "aceites-y-aderezos"): 20,
                  ("bebidas",): 30}
        calls = []

        def fetch(facets, after):
            key = tuple(v for _, v in facets)
            calls.append((key, after))
            total = counts[key]
            return total, [{"sku": f"{key}-{after}-{i}"} for i in range(min(tata.PAGE_SIZE, total - after))]

        pages = list(tata.iter_pages(fetch, tata.parse_tree(TREE), max_results=2500))
        self.assertEqual(calls, [
            (("almacen",), 0),
            (("almacen", "desayuno"), 0), (("almacen", "desayuno"), 100),
            (("almacen", "aceites-y-aderezos"), 0),
            (("bebidas",), 0),
        ])
        self.assertEqual(sum(len(p) for p in pages), 150 + 20 + 30)

    def test_clothing_is_skipped(self):
        tree = tata.parse_tree(TREE + [{"id": 9, "name": "Textil", "url": "https://secure.tata.com.uy/textil", "children": []}])
        seen = []
        list(tata.iter_pages(lambda facets, after: seen.append(facets[-1][1]) or (1, [{"sku": "x"}]), tree))
        self.assertNotIn("textil", seen)
        self.assertIn("bebidas", seen)

    def test_facets(self):
        params = tata.query_params([("category-1", "almacen")], after=200)
        self.assertIn('"after":"200"', params["variables"])
        self.assertIn('{"key":"category-1","value":"almacen"}', params["variables"])
        self.assertIn('"sort":"name_asc"', params["variables"])

    def test_graphql_error_raises(self):
        with self.assertRaises(ValueError):
            tata.parse_page({"errors": [{"message": "Sorry, something went wrong."}]})


class NodeRowTest(unittest.TestCase):
    def setUp(self):
        self.paths = tata.category_paths(tata.parse_tree(TREE))

    def test_row(self):
        row = tata.node_row(node("299", "Arroz Blanco Saman 1 Kg", price=60, list_price=69), self.paths, 4, "t")
        self.assertEqual((row["store_key"], row["store_sku"], row["store_code"]), ("tata", "299", "1000050592"))
        self.assertIsNone(row["gtin"])
        self.assertEqual(row["category"], "almacen/desayuno/cafe")
        self.assertEqual(row["url_path"], "/arroz-blanco-saman-1-kg-299/p")
        self.assertEqual((row["price"], row["previous_price"], row["currency"]), (60, 69, "UYU"))
        self.assertEqual((row["size_source"], row["base_qty"]), ("name", 1000))
        self.assertEqual((row["availability"], row["read_from"]), ("InStock", "search_api"))

    def test_sold_by_weight(self):
        row = tata.node_row(node("7", "Banana Ecuador 1 Kg", price=139, measurementUnit="kg", unitMultiplier=1),
                            self.paths, 4, "t")
        self.assertEqual((row["size_source"], row["base_qty"], row["base_unit"]), ("unit", 1000, "g"))
        self.assertIsNone(row["notes"])

    def test_price_is_for_the_amount_sold_not_the_name(self):
        row = tata.node_row(node("8747", "Aguja Sin Hueso En Trozo 780 G", price=346.51, measurementUnit="kg",
                                 unitMultiplier=0.827), self.paths, 4, "t")
        self.assertEqual((row["size_source"], row["base_qty"], row["size_qty"], row["size_unit"]), ("unit", 827, 0.827, "kg"))
        self.assertIn("priced for 0.827 kg", row["notes"])

    def test_over_one_kg_the_price_is_per_kg(self):
        row = tata.node_row(node("13220", "Lomo De Cerdo 1.4 Kg", price=199, measurementUnit="kg", unitMultiplier=1.4),
                            self.paths, 4, "t")
        self.assertEqual((row["price"], row["base_qty"], row["base_unit"]), (199, 1000, "g"))
        self.assertEqual((row["size_source"], row["size_qty"], row["size_unit"], row["pack_count"]), ("unit", 1.4, "kg", 1))
        self.assertIsNone(row["notes"])

    def test_over_one_kg_a_name_that_disagrees_is_noted(self):
        row = tata.node_row(node("13221", "Lomo De Cerdo 2 Kg", price=199, measurementUnit="kg", unitMultiplier=1.4),
                            self.paths, 4, "t")
        self.assertEqual((row["base_qty"], row["size_qty"]), (1000, 1.4))
        self.assertEqual(row["notes"], "sold as 1.4 kg; the name says otherwise")

    def test_one_kg_tray_is_sold_whole(self):
        row = tata.node_row(node("14482", "Carne Picada Bandeja 1 Kg", price=380, measurementUnit="kg", unitMultiplier=1),
                            self.paths, 4, "t")
        self.assertEqual((row["price"], row["base_qty"], row["size_qty"], row["size_unit"]), (380, 1000, 1, "kg"))
        self.assertIsNone(row["notes"])

    def test_mis_encoded_names_are_repaired(self):
        row = tata.node_row(node("9", "VacÃ\xado Novillo CaÃ±uelas 1 Kg", brand={"name": "CaÃ±uelas"}), self.paths, 4, "t")
        self.assertEqual((row["name"], row["brand"]), ("Vacío Novillo Cañuelas 1 Kg", "Cañuelas"))

    def test_multicurrency_currency_is_not_guessed(self):
        row = tata.node_row(node("8", "Televisor 50", hasMulticurrencyPrice=True), self.paths, 4, "t")
        self.assertIsNone(row["currency"])
        self.assertIn("multicurrency", row["notes"])


if __name__ == "__main__":
    unittest.main()
