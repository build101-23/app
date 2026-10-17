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


class FoodCandidatesTest(unittest.TestCase):
    def test_newest_first_taking_turns_and_skipping_saved(self):
        sitemap = gdu.Sitemap({
            "100": "banana-ecuador-x-kg", "300": "banana-organica", "200": "banana-deshidratada",
            "150": "avena-arrollada-1-kg", "160": "avena-instantanea", "400": "televisor-x", "500": "bananas-pack",
            "600": "avena",
        }, {})
        ids = gdu.food_candidates(sitemap, saved={"300"}, terms=("banana", "avena"), per_term=2)
        # banana: 200, 100 (300 is saved; "bananas-pack" isn't "banana-..."); avena: 600, 160.
        self.assertEqual(ids, ["200", "600", "100", "160"])


if __name__ == "__main__":
    unittest.main()
