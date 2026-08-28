from fastapi import APIRouter, Query
from typing import Any


router = APIRouter(
    prefix="/api/smart-news",
    tags=["Smart News"],
)


IMPORTANT_WORDS = {
    "breaking": 10,
    "urgent": 9,
    "alert": 8,
    "warning": 8,
    "earthquake": 10,
    "flood": 10,
    "storm": 9,
    "election": 7,
    "government": 6,
    "economy": 6,
    "technology": 5,
    "business": 5,
    "health": 5,
    "sports": 4,
}


def normalize_keywords(
    keywords: str | list[str] | None
) -> list[str]:

    if keywords is None:
        return []

    if isinstance(
        keywords,
        list,
    ):

        raw = keywords

    else:

        raw = keywords.split(",")

    result = []

    for keyword in raw:

        value = str(
            keyword
        ).strip().lower()

        if value:
            result.append(value)

    return result


def score_article(
    article: dict[str, Any],
    keywords: list[str],
) -> float:

    title = str(
        article.get(
            "title",
            "",
        )
    ).lower()

    description = str(
        article.get(
            "description",
            "",
        )
    ).lower()

    source = str(
        article.get(
            "source",
            "",
        )
    ).lower()

    text = (
        title
        + " "
        + description
        + " "
        + source
    )

    score = 0.0

    # --------------------------------------------------------
    # IMPORTANT TOPICS
    # --------------------------------------------------------

    for word, points in (
        IMPORTANT_WORDS.items()
    ):

        if word in text:
            score += points

    # --------------------------------------------------------
    # WATCHLIST KEYWORDS
    # --------------------------------------------------------

    for keyword in keywords:

        if keyword in text:
            score += 12

        if keyword in title:
            score += 8

    # --------------------------------------------------------
    # SOURCE QUALITY
    # --------------------------------------------------------

    if "onlinekhabar" in source:
        score += 2

    elif "ratopati" in source:
        score += 2

    elif "ronb" in source:
        score += 1

    # --------------------------------------------------------
    # PUBLISHED DATE
    # --------------------------------------------------------

    published = (
        article.get("publishedAt")
        or article.get("published")
    )

    if published:
        score += 1

    return score


@router.post("/rank")
def rank_news(
    articles: list[dict[str, Any]],
    keywords: str | None = Query(
        default=None,
    ),
):

    normalized_keywords = normalize_keywords(
            keywords
        )

    ranked: list[
        dict[str, Any]
    ] = []

    for article in articles:

        if not isinstance(
            article,
            dict,
        ):
            continue

        score = score_article(
            article,
            normalized_keywords,
        )

        ranked.append({
            **article,
            "_kanchhi_score":
                round(score, 2),
        })

    ranked.sort(
        key=lambda item:
            item.get(
                "_kanchhi_score",
                0,
            ),
        reverse=True,
    )

    for index, article in enumerate(
        ranked,
        start=1,
    ):

        article[
            "_kanchhi_rank"
        ] = index

    return {
        "success": True,
        "count": len(ranked),
        "keywords":
            normalized_keywords,
        "articles": ranked,
    }