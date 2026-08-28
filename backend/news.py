from fastapi import APIRouter
import requests

from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET

from datetime import datetime, timezone
import re
import json
import threading
import time


router = APIRouter(
    prefix="/api/news",
    tags=["News"]
)


# ============================================================
# HEADERS
# ============================================================

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 "
        "(KHTML, like Gecko) "
        "Chrome/151.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,"
        "application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


# ============================================================
# CACHE
# ============================================================

NEWS_CACHE = None
NEWS_CACHE_TIME = 0

CACHE_TTL = 120  # 2 minutes

cache_lock = threading.Lock()


# ============================================================
# CONSTANTS
# ============================================================

MAX_ARTICLES_PER_SOURCE = 12
MAX_TOTAL_ARTICLES = 30


# ============================================================
# TEXT HELPERS
# ============================================================

def clean_text(value):
    """
    Clean excessive whitespace from text.
    """

    if not value:
        return ""

    return re.sub(
        r"\s+",
        " ",
        str(value)
    ).strip()


def normalize_title(title):
    """
    Normalize title for duplicate detection.
    """

    title = clean_text(title).lower()

    # Remove punctuation
    title = re.sub(
        r"[^\w\s\u0900-\u097F]",
        "",
        title
    )

    # Remove extra spaces
    title = re.sub(
        r"\s+",
        " ",
        title
    ).strip()

    return title


# ============================================================
# IMAGE HELPER
# ============================================================

def get_image_from_element(element, base_url):
    """
    Try several common image attributes.
    """

    if not element:
        return None

    img = element.find("img")

    if not img:
        return None

    image = (
        img.get("src")
        or img.get("data-src")
        or img.get("data-lazy-src")
        or img.get("data-original")
        or img.get("data-image")
    )

    if not image:

        srcset = img.get("srcset")

        if srcset:

            image = (
                srcset
                .split(",")[0]
                .strip()
                .split(" ")[0]
            )

    if image:

        return urljoin(
            base_url,
            image
        )

    return None


# ============================================================
# DESCRIPTION HELPER
# ============================================================

def get_description_from_element(element):
    """
    Try to extract a short description.
    """

    if not element:
        return None

    selectors = [
        "p",
        ".excerpt",
        ".description",
        ".summary",
    ]

    for selector in selectors:

        tag = element.select_one(selector)

        if tag:

            text = clean_text(
                tag.get_text(
                    " ",
                    strip=True
                )
            )

            if len(text) >= 30:

                return text[:300]

    return None


# ============================================================
# DATE HELPERS
# ============================================================

def parse_date(value):
    """
    Convert common date formats to ISO UTC.
    """

    if not value:
        return None

    value = clean_text(value)

    try:

        # ISO format
        parsed = datetime.fromisoformat(
            value.replace(
                "Z",
                "+00:00"
            )
        )

        if parsed.tzinfo is None:

            parsed = parsed.replace(
                tzinfo=timezone.utc
            )

        return parsed.astimezone(
            timezone.utc
        ).isoformat()

    except Exception:
        pass

    # Common RSS date format
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M %z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ]

    for date_format in formats:

        try:

            parsed = datetime.strptime(
                value,
                date_format
            )

            if parsed.tzinfo is None:

                parsed = parsed.replace(
                    tzinfo=timezone.utc
                )

            return parsed.astimezone(
                timezone.utc
            ).isoformat()

        except Exception:
            continue

    return None


def get_date_from_element(element):
    """
    Try multiple HTML date locations.
    """

    if not element:
        return None

    # <time datetime="">
    time_tag = element.find("time")

    if time_tag:

        value = (
            time_tag.get("datetime")
            or time_tag.get_text(
                " ",
                strip=True
            )
        )

        parsed = parse_date(value)

        if parsed:
            return parsed

    # Common metadata attributes
    attributes = [
        "datetime",
        "data-date",
        "data-time",
        "data-published",
        "data-published-at",
    ]

    for attribute in attributes:

        tag = element.find(
            attrs={
                attribute: True
            }
        )

        if tag:

            value = tag.get(
                attribute
            )

            parsed = parse_date(value)

            if parsed:
                return parsed

    # Meta tags
    meta_names = [
        "article:published_time",
        "og:published_time",
        "date",
        "pubdate",
        "publish-date",
    ]

    for name in meta_names:

        meta = element.find(
            "meta",
            attrs={
                "property": name
            }
        )

        if not meta:

            meta = element.find(
                "meta",
                attrs={
                    "name": name
                }
            )

        if meta:

            parsed = parse_date(
                meta.get("content")
            )

            if parsed:
                return parsed

    return None


# ============================================================
# JSON-LD DATE
# ============================================================

def get_jsonld_date(soup):
    """
    Try to find publication date from JSON-LD.
    """

    scripts = soup.find_all(
        "script",
        type="application/ld+json"
    )

    for script in scripts:

        try:

            data = json.loads(
                script.string or
                script.get_text()
            )

            objects = (
                data
                if isinstance(data, list)
                else [data]
            )

            for obj in objects:

                if not isinstance(
                    obj,
                    dict
                ):
                    continue

                date_value = (
                    obj.get(
                        "datePublished"
                    )
                    or obj.get(
                        "dateCreated"
                    )
                )

                parsed = parse_date(
                    date_value
                )

                if parsed:
                    return parsed

        except Exception:
            continue

    return None


# ============================================================
# CATEGORY
# ============================================================

def detect_category(
    title,
    link="",
    description=""
):
    """
    Detect a simple news category.
    """

    text = (
        f"{title} "
        f"{description} "
        f"{link}"
    ).lower()

    category_rules = {

        "Politics": [
            "politics",
            "government",
            "minister",
            "prime minister",
            "parliament",
            "election",
            "president",
            "नेता",
            "सरकार",
            "मन्त्री",
            "प्रधानमन्त्री",
            "संसद",
            "निर्वाचन",
            "राजनीति",
        ],

        "Sports": [
            "sport",
            "sports",
            "football",
            "cricket",
            "match",
            "player",
            "tournament",
            "league",
            "खेल",
            "क्रिकेट",
            "फुटबल",
            "खेलाडी",
        ],

        "Business": [
            "business",
            "economy",
            "economic",
            "bank",
            "share",
            "stock",
            "market",
            "finance",
            "company",
            "व्यवसाय",
            "अर्थतन्त्र",
            "बैंक",
            "सेयर",
            "बजार",
        ],

        "Technology": [
            "technology",
            "tech",
            "ai",
            "artificial intelligence",
            "software",
            "internet",
            "digital",
            "technology",
            "प्रविधि",
            "एआई",
            "इन्टरनेट",
        ],

        "Entertainment": [
            "movie",
            "film",
            "music",
            "actor",
            "actress",
            "singer",
            "entertainment",
            "celebrity",
            "चलचित्र",
            "फिल्म",
            "संगीत",
            "अभिनेता",
            "अभिनेत्री",
        ],

        "Health": [
            "health",
            "hospital",
            "doctor",
            "disease",
            "medical",
            "medicine",
            "स्वास्थ्य",
            "अस्पताल",
            "डाक्टर",
            "रोग",
        ],

        "World": [
            "world",
            "international",
            "america",
            "india",
            "china",
            "uk",
            "global",
            "अन्तर्राष्ट्रिय",
            "विश्व",
        ],

    }

    for category, keywords in category_rules.items():

        for keyword in keywords:

            if keyword in text:

                return category

    return "General"


# ============================================================
# ARTICLE CREATOR
# ============================================================

def create_article(
    source,
    source_key,
    title,
    link,
    image=None,
    description=None,
    published_at=None,
):
    """
    Create consistent article structure.
    """

    title = clean_text(title)
    link = clean_text(link)

    description = clean_text(
        description
    ) if description else None

    category = detect_category(
        title,
        link,
        description or ""
    )

    return {

        "source": source,

        "sourceKey": source_key,

        "title": title,

        "link": link,

        "image": image,

        "description": description,

        "publishedAt": published_at,

        "category": category,

    }


# ============================================================
# ONLINEKHABAR
# ============================================================

def fetch_onlinekhabar():

    url = "https://www.onlinekhabar.com/"

    articles = []
    seen_links = set()

    try:

        response = requests.get(
            url,
            headers=HEADERS,
            timeout=15
        )

        response.raise_for_status()

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

        jsonld_date = get_jsonld_date(
            soup
        )

        article_elements = soup.find_all(
            "article"
        )

        if article_elements:

            for article in article_elements:

                link_tag = article.find(
                    "a",
                    href=True
                )

                if not link_tag:
                    continue

                title_tag = article.find(
                    ["h1", "h2", "h3", "h4"]
                )

                if not title_tag:
                    continue

                title = clean_text(
                    title_tag.get_text(
                        " ",
                        strip=True
                    )
                )

                href = link_tag.get(
                    "href"
                )

                if (
                    not title
                    or not href
                    or len(title) < 10
                ):
                    continue

                link = urljoin(
                    url,
                    href
                )

                if link in seen_links:
                    continue

                seen_links.add(link)

                image = get_image_from_element(
                    article,
                    url
                )

                description = (
                    get_description_from_element(
                        article
                    )
                )

                published_at = (
                    get_date_from_element(
                        article
                    )
                    or jsonld_date
                )

                articles.append(
                    create_article(
                        source="OnlineKhabar",
                        source_key="onlinekhabar",
                        title=title,
                        link=link,
                        image=image,
                        description=description,
                        published_at=published_at,
                    )
                )

                if len(articles) >= MAX_ARTICLES_PER_SOURCE:
                    break

        else:

            for heading in soup.find_all(
                ["h2", "h3"]
            ):

                link_tag = heading.find(
                    "a",
                    href=True
                )

                if not link_tag:
                    continue

                title = clean_text(
                    heading.get_text(
                        " ",
                        strip=True
                    )
                )

                href = link_tag.get(
                    "href"
                )

                if (
                    not title
                    or not href
                    or len(title) < 10
                ):
                    continue

                link = urljoin(
                    url,
                    href
                )

                if link in seen_links:
                    continue

                seen_links.add(link)

                parent = heading.find_parent()

                image = get_image_from_element(
                    parent,
                    url
                )

                description = (
                    get_description_from_element(
                        parent
                    )
                )

                published_at = (
                    get_date_from_element(
                        parent
                    )
                    or jsonld_date
                )

                articles.append(
                    create_article(
                        source="OnlineKhabar",
                        source_key="onlinekhabar",
                        title=title,
                        link=link,
                        image=image,
                        description=description,
                        published_at=published_at,
                    )
                )

                if len(articles) >= MAX_ARTICLES_PER_SOURCE:
                    break

    except Exception as error:

        print(
            "OnlineKhabar error:",
            error
        )

    print(
        f"OnlineKhabar articles: {len(articles)}"
    )

    return articles


# ============================================================
# RONB
# ============================================================

def fetch_ronb():

    url = "https://www.ronbpost.com/"

    articles = []
    seen_links = set()

    try:

        response = requests.get(
            url,
            headers=HEADERS,
            timeout=15
        )

        response.raise_for_status()

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

        jsonld_date = get_jsonld_date(
            soup
        )

        article_elements = soup.find_all(
            "article"
        )

        if article_elements:

            for article in article_elements:

                link_tag = article.find(
                    "a",
                    href=True
                )

                if not link_tag:
                    continue

                title_tag = article.find(
                    ["h1", "h2", "h3", "h4"]
                )

                if not title_tag:
                    continue

                title = clean_text(
                    title_tag.get_text(
                        " ",
                        strip=True
                    )
                )

                href = link_tag.get(
                    "href"
                )

                if (
                    not title
                    or not href
                    or len(title) < 10
                ):
                    continue

                link = urljoin(
                    url,
                    href
                )

                if link in seen_links:
                    continue

                seen_links.add(link)

                image = get_image_from_element(
                    article,
                    url
                )

                description = (
                    get_description_from_element(
                        article
                    )
                )

                published_at = (
                    get_date_from_element(
                        article
                    )
                    or jsonld_date
                )

                articles.append(
                    create_article(
                        source="RONB",
                        source_key="ronb",
                        title=title,
                        link=link,
                        image=image,
                        description=description,
                        published_at=published_at,
                    )
                )

                if len(articles) >= MAX_ARTICLES_PER_SOURCE:
                    break

        else:

            for heading in soup.find_all(
                ["h2", "h3", "h4"]
            ):

                link_tag = heading.find(
                    "a",
                    href=True
                )

                if not link_tag:
                    continue

                title = clean_text(
                    heading.get_text(
                        " ",
                        strip=True
                    )
                )

                href = link_tag.get(
                    "href"
                )

                if (
                    not title
                    or not href
                    or len(title) < 10
                ):
                    continue

                link = urljoin(
                    url,
                    href
                )

                if link in seen_links:
                    continue

                seen_links.add(link)

                parent = heading.find_parent()

                image = get_image_from_element(
                    parent,
                    url
                )

                if not image and parent:

                    grandparent = (
                        parent.find_parent()
                    )

                    image = get_image_from_element(
                        grandparent,
                        url
                    )

                description = (
                    get_description_from_element(
                        parent
                    )
                )

                published_at = (
                    get_date_from_element(
                        parent
                    )
                    or jsonld_date
                )

                articles.append(
                    create_article(
                        source="RONB",
                        source_key="ronb",
                        title=title,
                        link=link,
                        image=image,
                        description=description,
                        published_at=published_at,
                    )
                )

                if len(articles) >= MAX_ARTICLES_PER_SOURCE:
                    break

    except Exception as error:

        print(
            "RONB error:",
            error
        )

    print(
        f"RONB articles: {len(articles)}"
    )

    return articles


# ============================================================
# RATOPATI
# ============================================================

def fetch_ratopati():

    rss_urls = [

        "https://www.ratopati.com/feed",

        "https://www.ratopati.com/rss",

    ]

    articles = []

    namespaces = {

        "media":
            "http://search.yahoo.com/mrss/",

        "content":
            "http://purl.org/rss/1.0/modules/content/",

    }

    for rss_url in rss_urls:

        try:

            response = requests.get(
                rss_url,
                headers=HEADERS,
                timeout=15
            )

            response.raise_for_status()

            root = ET.fromstring(
                response.content
            )

            items = root.findall(
                ".//item"
            )

            if not items:
                continue

            for item in items:

                title_element = item.find(
                    "title"
                )

                link_element = item.find(
                    "link"
                )

                if (
                    title_element is None
                    or link_element is None
                ):
                    continue

                title = clean_text(
                    title_element.text
                    or ""
                )

                link = clean_text(
                    link_element.text
                    or ""
                )

                if (
                    not title
                    or not link
                ):
                    continue

                image = None

                media_content = item.find(
                    "media:content",
                    namespaces
                )

                if media_content is not None:

                    image = media_content.get(
                        "url"
                    )

                if not image:

                    thumbnail = item.find(
                        "media:thumbnail",
                        namespaces
                    )

                    if thumbnail is not None:

                        image = thumbnail.get(
                            "url"
                        )

                if not image:

                    enclosure = item.find(
                        "enclosure"
                    )

                    if enclosure is not None:

                        enclosure_type = (
                            enclosure.get("type")
                            or ""
                        )

                        if enclosure_type.startswith(
                            "image/"
                        ):

                            image = enclosure.get(
                                "url"
                            )

                description = None

                description_element = item.find(
                    "description"
                )

                if description_element is not None:

                    raw_description = (
                        description_element.text
                        or ""
                    )

                    description_soup = (
                        BeautifulSoup(
                            raw_description,
                            "html.parser"
                        )
                    )

                    description = clean_text(
                        description_soup.get_text(
                            " ",
                            strip=True
                        )
                    )

                    if not description:

                        description = None

                    elif len(description) > 300:

                        description = (
                            description[:300]
                            + "..."
                        )

                published_at = None

                pub_date = item.find(
                    "pubDate"
                )

                if pub_date is not None:

                    published_at = parse_date(
                        pub_date.text
                    )

                articles.append(
                    create_article(
                        source="Ratopati",
                        source_key="ratopati",
                        title=title,
                        link=link,
                        image=image,
                        description=description,
                        published_at=published_at,
                    )
                )

                if len(articles) >= MAX_ARTICLES_PER_SOURCE:
                    break

            if articles:
                break

        except Exception as error:

            print(
                f"Ratopati RSS error ({rss_url}):",
                error
            )

    print(
        f"Ratopati articles: {len(articles)}"
    )

    return articles


# ============================================================
# DEDUPLICATION
# ============================================================

def deduplicate_news(articles):

    unique_articles = []

    seen_links = set()
    seen_titles = set()

    for article in articles:

        link = (
            article.get("link")
            or ""
        ).strip()

        title = normalize_title(
            article.get("title")
            or ""
        )

        if not link or not title:
            continue

        # Exact URL duplicate
        if link in seen_links:
            continue

        # Exact normalized title duplicate
        if title in seen_titles:
            continue

        seen_links.add(link)
        seen_titles.add(title)

        unique_articles.append(
            article
        )

    return unique_articles


# ============================================================
# SORT NEWS
# ============================================================

def sort_news(articles):

    def sort_key(article):

        published_at = (
            article.get(
                "publishedAt"
            )
        )

        if not published_at:

            return ""

        return published_at

    return sorted(
        articles,
        key=sort_key,
        reverse=True
    )


# ============================================================
# FETCH ALL NEWS
# ============================================================

def fetch_all_news():

    onlinekhabar = fetch_onlinekhabar()

    ronb = fetch_ronb()

    ratopati = fetch_ratopati()

    all_news = (
        onlinekhabar
        + ronb
        + ratopati
    )

    # Deduplicate
    all_news = deduplicate_news(
        all_news
    )

    # Sort newest first
    all_news = sort_news(
        all_news
    )

    # Limit total
    all_news = all_news[
        :MAX_TOTAL_ARTICLES
    ]

    return (
        onlinekhabar,
        ronb,
        ratopati,
        all_news
    )


# ============================================================
# MAIN NEWS ENDPOINT
# ============================================================

@router.get("")
def get_news():

    global NEWS_CACHE
    global NEWS_CACHE_TIME

    current_time = time.time()

    # --------------------------------------------------------
    # RETURN CACHE
    # --------------------------------------------------------

    with cache_lock:

        if (
            NEWS_CACHE is not None
            and
            current_time - NEWS_CACHE_TIME
            < CACHE_TTL
        ):

            print(
                "Returning cached news"
            )

            return NEWS_CACHE

    # --------------------------------------------------------
    # FETCH FRESH NEWS
    # --------------------------------------------------------

    (
        onlinekhabar,
        ronb,
        ratopati,
        all_news
    ) = fetch_all_news()

    result = {

        "news": all_news,

        "sources": {

            "onlinekhabar": len(
                [
                    article
                    for article in all_news
                    if article["sourceKey"]
                    == "onlinekhabar"
                ]
            ),

            "ronb": len(
                [
                    article
                    for article in all_news
                    if article["sourceKey"]
                    == "ronb"
                ]
            ),

            "ratopati": len(
                [
                    article
                    for article in all_news
                    if article["sourceKey"]
                    == "ratopati"
                ]
            ),

            "total": len(
                all_news
            ),

        },

        "cached": False,

        "cacheTTL": CACHE_TTL,

        "updatedAt": datetime.now(
            timezone.utc
        ).isoformat(),

    }

    # --------------------------------------------------------
    # SAVE CACHE
    # --------------------------------------------------------

    with cache_lock:

        NEWS_CACHE = result

        NEWS_CACHE_TIME = time.time()

    return result