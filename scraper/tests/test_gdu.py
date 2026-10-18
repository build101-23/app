"""Fixtures are hand-written to mimic the sites' structure; they are not copies of real pages."""
import unittest

from scraper import gdu

SITEMAP = """<urlset>
<url><loc>https://www.devoto.com.uy/product/arroz-blanco-saman-1-kg/373713</loc><lastmod>2026-09-08</lastmod></url>
<url><loc>https://www.devoto.com.uy/product/arroz-parboiled-saman-1-kg/900001</loc></url>
<url><loc>https://www.devoto.com.uy/product/arroz-integral-green-chef-1-kg/981498</loc></url>
<url><loc>https://www.devoto.com.uy/product/leche-entera-conaprole-1-l/500100</loc></url>
<url><loc>https://www.devoto.com.uy/product/televisor-led-50/700700</loc></url>
<url><loc>https://www.devoto.com.uy/products/category/almacen/10</loc></url>
<url><loc>https://www.devoto.com.uy/products/category/canasta-familiar/1010</loc></url>
<url><loc>https://www.devoto.com.uy/products/category/no-usar/101010</loc></url>
<url><loc>https://www.devoto.com.uy/products/category/arroz/101013</loc></url>
<url><loc>https://www.devoto.com.uy/products/category/fideos/101018</loc></url>
<url><loc>https://www.devoto.com.uy/products/category/tv-y-audio/20</loc></url>
<url><loc>https://www.devoto.com.uy/products/category/televisores/2010</loc></url>
</urlset>"""

CARD = """<div class="product-item"><div class="prod-item-box"><div class="top-content">
<figure><a class="w-100" href="/product/{slug}/{id}" role="button"><img src="https://img.test/x" alt="{name}" /></a></figure></div>
<div class="prod-desc"><div class="desc-top"><h3><a href="/product/{slug}/{id}" role="button">{name}</a></h3>
<div class="prod-fav"><a role="button" class="favorite-button" title="Agregar/Quitar de Favoritos" b-x1><span b-x1>Agregar/Quitar de Favoritos</span></a></div></div>
<div class="desc-middle"><div class="prod-cats"><a href="/products/brand/1482" role="button">{brand}</a></div></div>
<div class="desc-prices"><div class="product-prices " data-nosnippet><div class="price">{before}<div class="text" style=""><span class="mon">{mon}</span> <span class="val">{price}</span></div></div></div></div>
<div class="prod-labels">{labels}</div></div><div class="prod-add"><div class="widget-add-to-cart" b-y2><button class="atc-button" b-y2><span b-y2>{button}</span></button></div></div></div></div>"""

CATEGORY_PAGE = (
    '<html><header><span class="text"><strong class="val">Devoto Fresh Market Portones</strong></span></header>'
    '<h6 class="total-prods order-md-0"><strong>52</strong> <span>productos</span></h6>'
    '<div id="lista-productos" class="products-grid-list ">'
    + CARD.format(slug="arroz-blanco-saman-1-kg", id="373713", name="Arroz Blanco SAMAN 1 kg", brand="SAMAN",
                  before='<div class="before"><span class="mon">$</span> <span class="val">69</span></div>',
                  mon="$", price="55", labels='<span class="label">Oferta</span>', button="Agregar")
    + CARD.format(slug="arroz-integral-green-chef-1-kg", id="981498", name="Arroz Integral GREEN CHEF 1 kg",
                  brand="GREEN CHEF", before="", mon="$", price="1.190", labels="", button="Agregar")
    + "</div><footer>Agregar al carrito</footer></html>"
)

PRODUCT_PAGE = """
<html><body>
<!-- <script type="application/ld+json">{"@type":"Product","name":"Commented out"}</script> -->
<script type="application/ld&#x2B;json">{"@context":"https://schema.org","@type":"Product",
 "name":"Arroz Blanco Saman 1 Kg","brand":{"@type":"Brand","name":"SAMAN"},"sku":"373713",
 "gtin":"7730205010025","offers":{"@type":"Offer","price":55,"priceCurrency":"UYU",
 "availability":"https://schema.org/InStock"}}</script>
<span class="text"><strong class="val">Devoto Fresh Market Portones</strong></span>
<ol><li class="breadcrumb-item"><a href="/">Home</a></li>
<li class="breadcrumb-item"><a href="/products/category/almacen/10" role="button">ALMAC&#xC9;N</a></li>
<li class="breadcrumb-item"><a href="/products/category/canasta-familiar/1010" role="button">CANASTA FAMILIAR</a></li>
<li class="breadcrumb-item"><a href="/products/category/arroz/101013" role="button">Arroz</a></li></ol>
<h1 class="det-nom">Arroz Blanco Saman 1 Kg</h1>
<div class="det-precios"><div class="before"><span class="sign">$</span><span class="val">69</span></div>
<div class="text"><span class="sign">$</span><span class="val">55</span></div></div><div class="det-add"></div>
<div class="vin-r det-labels"><span>Oferta</span></div></div>
<table class="det-especs"><tr><th>Contenido</th> <td>1 kg</td></tr></table>
</body></html>
"""


WEIGHABLE_PRICES = (
    '<div class="prod-price product-price-weighable"><div class="product-prices " data-nosnippet><div class="price">'
    '<div class="text" style=""><span class="mon">$</span>\n <span class="val">{kg}</span><span class="mon"> / kg</span>'
    '</div></div></div></div><div class="product-prices " data-nosnippet><div class="price"><div class="text" style="">'
    '<span class="mon">$</span>\n <span class="val">{piece}</span></div></div></div></div>'
)

WEIGHABLE_CARD = (
    '<div class="product-item"><div class="prod-desc"><div class="desc-top"><h3>'
    '<a href="/product/cebolla-malla-aprox.-1.5-kg/400632" role="button">Cebolla malla aprox. 1.5 kg</a></h3></div>'
    '<div class="desc-middle"><div class="prod-cats"><a href="/products/brand/9" role="button">FRUTAS Y VERDURAS</a></div></div>'
    '<div class="desc-prices">' + WEIGHABLE_PRICES.format(kg="119", piece="179") + '</div>'
    '<div class="prod-labels"></div></div><div class="prod-add"><div class="widget-add-to-cart"><button class="atc-button">'
    '<span>Agregar</span></button></div></div></div></div>'
)


def product_page(name, sku, ld_price, prices, spec=""):
    return (
        '<html><body><script type="application/ld&#x2B;json">{"@context":"https://schema.org","@type":"Product",'
        f'"name":"{name}","sku":"{sku}","offers":{{"@type":"Offer","price":{ld_price},"priceCurrency":"UYU",'
        '"availability":"https://schema.org/InStock"}}</script>'
        f'<h1 class="det-nom">{name}</h1><div class="det-precios" data-nosnippet>{prices}</div><div class="det-add"></div>'
        f'<table class="det-especs">{spec}</table></body></html>'
    )


# Carne picada: $329 per kg, and a 250 g piece costs $83 (329 x 0.25 = 82.25, rounded up).
WEIGHABLE_PAGE = product_page("Carne Picada Especial x 250 g", "301223", 329,
                              WEIGHABLE_PRICES.format(kg="329", piece="83").replace(
                                  '<div class="prod-price product-price-weighable"><div class="product-prices "',
                                  '<div class="product-prices product-price-weighable"'))
# Nalga: the page shows only the 750 g piece's price; JSON-LD has the price per kg.
PIECE_PAGE = product_page("Nalga de ternera un. x 750 g", "300566", 709,
                          '<div class="product-prices " data-nosnippet><div class="price"><div class="text" style="">'
                          '<span class="mon">$</span> <span class="val">532</span></div></div></div>')


class SitemapTest(unittest.TestCase):
    def setUp(self):
        self.sitemap = gdu.Sitemap.parse([SITEMAP])

    def test_products_and_categories(self):
        self.assertEqual(self.sitemap.products["373713"], "arroz-blanco-saman-1-kg")
        self.assertEqual(len(self.sitemap.products), 5)
        self.assertEqual(self.sitemap.categories["101013"], "arroz")
        self.assertEqual(len(self.sitemap.categories), 7)

    def test_leaves_of_supermarket_departments(self):
        self.assertEqual(self.sitemap.leaves(gdu.SUPERMARKET_DEPARTMENTS), ["101013", "101018"])

    def test_path(self):
        self.assertEqual(self.sitemap.path("101013"), "almacen/canasta-familiar/arroz")
        self.assertIsNone(self.sitemap.path("999999"))
        self.assertIsNone(self.sitemap.path(None))


class CategoryPageTest(unittest.TestCase):
    def test_cards(self):
        total, cards = gdu.parse_listing_page(CATEGORY_PAGE)
        self.assertEqual(total, 52)
        self.assertEqual([c["id"] for c in cards], ["373713", "981498"])
        first, last = cards
        self.assertEqual((first["name"], first["brand"], first["price"], first["previous_price"]),
                         ("Arroz Blanco SAMAN 1 kg", "SAMAN", 55, 69))
        self.assertEqual(first["labels"], ["Oferta"])
        self.assertEqual(first["brand_id"], "1482")
        self.assertEqual(last["price"], 1190)
        self.assertEqual(last["button"], "Agregar")  # the footer after the last card isn't part of it

    def test_branch(self):
        self.assertEqual(gdu.page_branch(CATEGORY_PAGE), "Devoto Fresh Market Portones")

    def test_card_row(self):
        _, cards = gdu.parse_listing_page(CATEGORY_PAGE)
        row = gdu.card_row("geant", cards[0], "almacen/canasta-familiar/arroz", 7, "2026-10-17T10:00:00-03:00")
        self.assertEqual((row["store_key"], row["store_sku"], row["url_path"]),
                         ("geant", "373713", "/product/arroz-blanco-saman-1-kg/373713"))
        self.assertEqual((row["price"], row["previous_price"], row["currency"]), (55, 69, "UYU"))
        self.assertEqual((row["size_source"], row["base_qty"], row["base_unit"]), ("name", 1000, "g"))
        self.assertEqual((row["availability"], row["read_from"], row["run_id"]), ("InStock", "category_page", 7))
        self.assertIsNone(row["gtin"])

    def test_unknown_currency_symbol_is_not_guessed(self):
        _, cards = gdu.parse_listing_page(CATEGORY_PAGE)
        row = gdu.card_row("geant", {**cards[1], "currency_symbol": "€"}, None, 1, "t")
        self.assertIsNone(row["currency"])
        self.assertIn("currency", row["notes"])


class ProductPageTest(unittest.TestCase):
    def test_parse(self):
        p = gdu.parse_product_page(PRODUCT_PAGE)
        self.assertEqual((p["name"], p["brand"], p["sku"]), ("Arroz Blanco Saman 1 Kg", "SAMAN", "373713"))
        self.assertEqual((p["price"], p["html_price"], p["previous_price"]), (55, 55, 69))
        self.assertEqual((p["content_spec"], p["category_id"]), ("1 kg", "101013"))
        self.assertEqual(p["branch"], "Devoto Fresh Market Portones")
        self.assertEqual(p["promo_labels"], ["Oferta"])

    def test_row(self):
        p = gdu.parse_product_page(PRODUCT_PAGE)
        row = gdu.product_row("devoto", p, "/product/arroz-blanco-saman-1-kg/373713", "almacen/canasta-familiar/arroz",
                              3, "2026-10-17T10:00:00-03:00")
        self.assertEqual((row["gtin"], row["size_source"], row["size_text"]), ("7730205010025", "spec", "1 kg"))
        self.assertEqual((row["price"], row["previous_price"], row["currency"]), (55, 69, "UYU"))
        self.assertEqual((row["availability"], row["read_from"]), ("InStock", "product_page"))
        self.assertIsNone(row["notes"])

    def test_not_a_product(self):
        self.assertIsNone(gdu.parse_product_page("<html></html>"))


class WeighableCardTest(unittest.TestCase):
    def setUp(self):
        _, (self.card,) = gdu.parse_listing_page(WEIGHABLE_CARD)

    def test_parse(self):
        self.assertEqual((self.card["price"], self.card["kg_price"], self.card["piece_price"]), (119, 119, 179))
        self.assertIsNone(self.card["weighable_note"])

    def test_row_is_priced_per_kg_and_sold_by_the_piece(self):
        row = gdu.card_row("disco", self.card, None, 1, "t")
        self.assertEqual((row["price"], row["base_qty"], row["base_unit"]), (119, 1000, "g"))
        self.assertEqual((row["size_source"], row["size_qty"], row["size_unit"], row["pack_count"]), ("unit", 1.5, "kg", 1))
        self.assertIsNone(row["size_text"])
        self.assertIsNone(row["notes"])  # 119 x 1.5 = 178.5: the site rounds the piece up to 179

    def test_no_weight_in_the_name_sells_one_kg(self):
        row = gdu.card_row("disco", {**self.card, "name": "Zapallo Kabutia"}, None, 1, "t")
        self.assertEqual((row["base_qty"], row["size_qty"], row["size_unit"]), (1000, 1, "kg"))
        self.assertIn("unit of sale taken as 1 kg", row["notes"])
        self.assertIn("piece price 179 != 119 per kg x 1 kg", row["notes"])

    def test_only_one_sign_gives_a_note_and_no_size(self):
        no_class = WEIGHABLE_CARD.replace(" product-price-weighable", "")
        no_per_kg = WEIGHABLE_CARD.replace('<span class="mon"> / kg</span>', "")
        for page, note in ((no_class, "price per kg without the weighable class"),
                           (no_per_kg, "weighable price block without a price per kg")):
            _, (card,) = gdu.parse_listing_page(page)
            row = gdu.card_row("disco", card, None, 1, "t")
            self.assertEqual((row["notes"], row["size_source"], row["base_qty"]), (note, None, None))

    def test_flat_card_is_not_weighable(self):
        _, cards = gdu.parse_listing_page(CATEGORY_PAGE)
        self.assertEqual((cards[0]["kg_price"], cards[0]["weighable_note"]), (None, None))


class WeighablePageTest(unittest.TestCase):
    def test_weighable_page(self):
        p = gdu.parse_product_page(WEIGHABLE_PAGE)
        self.assertEqual((p["price"], p["html_price"], p["kg_price"], p["piece_price"]), (329, 329, 329, 83))
        row = gdu.product_row("disco", p, "/product/x/301223", None, 1, "t")
        self.assertEqual((row["price"], row["base_qty"], row["base_unit"]), (329, 1000, "g"))
        self.assertEqual((row["size_source"], row["size_qty"], row["size_unit"]), ("unit", 250, "g"))
        self.assertIsNone(row["notes"])

    def test_weighable_page_keeps_the_spec_text(self):
        page = WEIGHABLE_PAGE.replace('<table class="det-especs">', '<table class="det-especs"><tr><th>Contenido</th> <td>250 g</td></tr>')
        row = gdu.product_row("disco", gdu.parse_product_page(page), "/product/x/301223", None, 1, "t")
        self.assertEqual((row["size_source"], row["size_text"], row["size_qty"], row["base_qty"]), ("unit", "250 g", 250, 1000))

    def test_piece_page_takes_the_visible_price(self):
        p = gdu.parse_product_page(PIECE_PAGE)
        self.assertEqual((p["price"], p["html_price"], p["kg_price"]), (709, 532, None))
        row = gdu.product_row("geant", p, "/product/x/300566", None, 1, "t")
        self.assertEqual((row["price"], row["size_source"], row["base_qty"]), (532, "name", 750))
        self.assertEqual(row["notes"], "JSON-LD price 709 != visible price 532")

    def test_small_difference_keeps_the_json_ld_price(self):
        p = {**gdu.parse_product_page(PRODUCT_PAGE), "html_price": 55.5}
        row = gdu.product_row("devoto", p, "/x", None, 1, "t")
        self.assertEqual(row["price"], 55)
        self.assertIn("JSON-LD price 55 != visible price 55.5", row["notes"])

    def test_flat_page_is_not_weighable(self):
        p = gdu.parse_product_page(PRODUCT_PAGE)
        self.assertEqual((p["kg_price"], p["piece_price"], p["weighable_note"]), (None, None, None))


class FoodCandidatesTest(unittest.TestCase):
    def test_newest_first_taking_turns_and_skipping_saved(self):
        sitemap = gdu.Sitemap({
            "100": "banana-ecuador", "300": "banana-organica", "200": "banana-deshidratada",
            "150": "avena-arrollada-1-kg", "160": "avena-instantanea", "400": "televisor-x", "500": "bananas-pack",
            "600": "avena",
        }, {})
        ids = gdu.food_candidates(sitemap, saved={"300"}, terms=("banana", "avena"), per_term=2)
        # banana: 200, 100 (300 is saved; "bananas-pack" isn't "banana-..."); avena: 600, 160.
        self.assertEqual(ids, ["200", "600", "100", "160"])

    def test_fresh_produce_first(self):
        sitemap = gdu.Sitemap({
            "900500": "tomate-perita-en-lata-400-g", "900400": "tomate-triturado-1-l",
            "401026": "tomate-americano-aprox-x-200-g", "410056": "tomate-cherry-bandeja-250-g",
            "401022": "tomate-x-kg", "300100": "tomate-malla-1-kg",
        }, {})
        ids = gdu.food_candidates(sitemap, saved=set(), terms=("tomate",), per_term=5)
        self.assertEqual(ids, ["410056", "401026", "401022", "300100", "900500"])


if __name__ == "__main__":
    unittest.main()
