import unittest

from scraper.rows import make_row
from scraper.sizes import fix_mojibake, gtin13, parse_size, priced_per_kg, size_fields, size_from_unit, valid_gtin


class ParseSizeTest(unittest.TestCase):
    def test_simple(self):
        self.assertEqual(parse_size("Arroz Saman 1 Kg")["base_qty"], 1000)
        self.assertEqual(parse_size("Leche 1 L")["base_unit"], "ml")
        self.assertEqual(parse_size("Aceite 1,5 L")["base_qty"], 1500)
        self.assertIsNone(parse_size("Espumante Brut 750 Cl"))  # "Cl" is written for ml: no guessing

    def test_pack(self):
        s = parse_size("Atún Gomes da Costa 3x80 g")
        self.assertEqual((s["pack_count"], s["base_qty"]), (3, 240))

    def test_pack_suffix(self):
        self.assertEqual(parse_size("Leche 1 L x 12 un")["base_qty"], 12000)

    def test_sold_per_kg(self):
        self.assertEqual(parse_size("Limón Importado Malla x kg")["base_qty"], 1000)
        self.assertEqual(parse_size("Zapallo Kabutia por kg")["base_unit"], "g")
        self.assertIsNone(parse_size("Pulpa de Cerdo x Peso"))

    def test_eggs(self):
        self.assertEqual(parse_size("Huevos x 12")["base_qty"], 12)

    def test_ambiguous_is_none(self):
        self.assertIsNone(parse_size("Yerba 500 g + 1 kg"))
        self.assertIsNone(parse_size("Yerba Mate Sara Azul 1K+100G Gratis"))

    def test_unit_count_before_size(self):
        s = parse_size("Yogur Bebible Yakult 4 U 100 Ml")
        self.assertEqual((s["pack_count"], s["base_qty"], s["base_unit"]), (4, 400, "ml"))


class SizeFromUnitTest(unittest.TestCase):
    def test_sold_by_weight(self):
        s = size_from_unit("kg", 1.0)
        self.assertEqual((s["base_qty"], s["base_unit"]), (1000, "g"))
        self.assertEqual(size_from_unit("kg", 0.5)["base_qty"], 500)

    def test_over_one_kg_the_price_is_per_kg(self):
        s = size_from_unit("kg", 1.4)
        self.assertEqual((s["base_qty"], s["base_unit"], s["size_qty"], s["size_unit"]), (1000, "g", 1.4, "kg"))

    def test_priced_per_kg(self):
        self.assertEqual((priced_per_kg(250)["size_qty"], priced_per_kg(250)["size_unit"]), (250, "g"))
        self.assertEqual((priced_per_kg(1500)["size_qty"], priced_per_kg(1500)["size_unit"]), (1.5, "kg"))
        self.assertEqual(priced_per_kg(1500)["base_qty"], 1000)

    def test_units_say_nothing(self):
        self.assertIsNone(size_from_unit("un", 1))
        self.assertIsNone(size_from_unit(None, None))

    def test_fields(self):
        self.assertEqual(size_fields(None, "name")["size_source"], None)
        self.assertEqual(size_fields(parse_size("1 kg"), "spec", "1 Kg")["size_text"], "1 Kg")


class GtinTest(unittest.TestCase):
    def test_valid(self):
        self.assertTrue(valid_gtin("7730205010025"))
        self.assertFalse(valid_gtin("7730205010026"))

    def test_internal_code_is_not_ean(self):
        self.assertFalse(valid_gtin("1000050592"))

    def test_gtin14_to_13(self):
        self.assertEqual(gtin13("07730205010025"), "7730205010025")


class RowTest(unittest.TestCase):
    def test_placeholder_price_is_dropped(self):
        for raw in (0.0, 1.0):
            row = make_row(store_key="devoto", store_sku="1", price=raw, previous_price=5.0)
            self.assertIsNone(row["price"])
            self.assertIsNone(row["previous_price"])
            self.assertIn("placeholder", row["notes"])

    def test_every_field_is_present(self):
        row = make_row(store_key="tata", store_sku="1", price=49.0)
        self.assertEqual(row["price"], 49.0)
        self.assertIn("gtin", row)
        self.assertIsNone(row["gtin"])

    def test_unknown_field_is_rejected(self):
        with self.assertRaises(ValueError):
            make_row(store_key="tata", image="x")


class MojibakeTest(unittest.TestCase):
    def test_repairs_utf8_read_as_latin1(self):
        self.assertEqual(fix_mojibake("VacÃ\xado"), "Vacío")
        self.assertEqual(fix_mojibake("CaÃ±uelas"), "Cañuelas")
        self.assertEqual(fix_mojibake("LimÃ³n"), "Limón")

    def test_leaves_good_text_alone(self):
        for s in ("Vacío", "SÃO PAULO", "Arroz", "", None):
            self.assertEqual(fix_mojibake(s), s)
