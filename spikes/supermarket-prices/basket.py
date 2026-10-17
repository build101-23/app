"""Test basket: everyday products.

- GDU (Devoto/Géant/Disco): product URLs are discovered in the public sitemap by filtering the slug.
  `slug` filters the product type; `brands` (optional) restricts to mass-market brands to
  raise the odds of finding the same product at other chains.
- Ta-Ta: the same `term` goes to the site's search, and only results whose name contains
  `name_must` are kept (drops non-food results).

This selection is a deliberate bias of the test: it favors brands present at every chain.
"""

COMMON_BRANDS = (
    "conaprole|saman|adria|las-acacias|puritas|optimo|condesa|uruguay|quaker|bella-union|"
    "canarias|baldo|gomes-da-costa|cololo|la-abundancia|blue-patna|green-chef|claldy|"
    "rio-de-la-plata|arcor|campoclaro|del-gauchito|la-campagnola|ottonello|primor"
)

BASKET = [
    {"key": "arroz",     "slug": r"^arroz-(blanco|parboil|integral)",                     "brands": COMMON_BRANDS, "term": "arroz",     "name_must": "arroz"},
    {"key": "leche",     "slug": r"^leche-(entera|descremada|semidesc|ultra|larga)",      "brands": COMMON_BRANDS, "term": "leche",     "name_must": "leche"},
    {"key": "fideos",    "slug": r"^fideos-",                                             "brands": COMMON_BRANDS, "term": "fideos",    "name_must": "fideo"},
    {"key": "aceite",    "slug": r"^aceite-(de-)?(girasol|soja|oliva|canola|maiz|mezcla)", "brands": COMMON_BRANDS, "term": "aceite",    "name_must": "aceite"},
    {"key": "avena",     "slug": r"^avena",                                               "brands": COMMON_BRANDS, "term": "avena",     "name_must": "avena"},
    {"key": "yogur",     "slug": r"^yogur",                                               "brands": COMMON_BRANDS, "term": "yogur",     "name_must": "yogur"},
    {"key": "huevos",    "slug": r"^huevos?-",                                            "brands": None,          "term": "huevos",    "name_must": "huevo"},
    {"key": "legumbres", "slug": r"^(lentejas|porotos|garbanzos|arvejas)",                "brands": COMMON_BRANDS, "term": "lentejas",  "name_must": "lenteja"},
    {"key": "porotos",   "slug": None,                                                    "brands": None,          "term": "porotos",   "name_must": "poroto"},
    {"key": "harina",    "slug": r"^harina-",                                             "brands": COMMON_BRANDS, "term": "harina",    "name_must": "harina"},
    {"key": "azucar",    "slug": r"^azucar",                                              "brands": COMMON_BRANDS, "term": "azucar",    "name_must": "azucar"},
    {"key": "atun",      "slug": r"^atun",                                                "brands": COMMON_BRANDS, "term": "atun",      "name_must": "atun"},
    {"key": "yerba",     "slug": r"^yerba",                                               "brands": COMMON_BRANDS, "term": "yerba",     "name_must": "yerba"},
    {"key": "polenta",   "slug": r"^polenta",                                             "brands": COMMON_BRANDS, "term": "polenta",   "name_must": "polenta"},
    {"key": "manteca",   "slug": r"^manteca",                                             "brands": COMMON_BRANDS, "term": "manteca",   "name_must": "manteca"},
]

# Max products per basket item (keeps the request count low)
GDU_MAX_PER_ITEM = 5
TATA_MAX_PER_ITEM = 24
