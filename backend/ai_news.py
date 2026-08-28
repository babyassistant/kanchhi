from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai import generate_ai_response


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/ai/news",
    tags=["AI News"],
)


# ============================================================
# NEWS SUMMARY REQUEST
# ============================================================

class NewsSummaryRequest(BaseModel):

    title: str = Field(
        ...,
        min_length=1,
    )

    description: str = ""

    source: str = ""

    link: str = ""


# ============================================================
# TRENDING REQUEST
# ============================================================

class TrendingNewsRequest(BaseModel):

    articles: list[dict] = Field(
        default_factory=list
    )


# ============================================================
# NEWS SUMMARY
# ============================================================

@router.post("/summary")
def summarize_news(
    request: NewsSummaryRequest
):

    prompt = f"""
You are KANCHHI News Intelligence.

Summarize the following news information.

SOURCE:
{request.source}

TITLE:
{request.title}

DESCRIPTION:
{request.description}

ARTICLE LINK:
{request.link}

RULES:

1. Do not invent facts.
2. Do not assume information that isn't supplied.
3. Clearly explain the main point.
4. Keep it concise.
5. Use 3-5 bullet points.
6. End with a short "Takeaway".
7. Do not mention that you are an AI.
8. Do not claim that you read the full article
   unless the article content was actually supplied.

Format:

Summary:

• ...
• ...
• ...

Takeaway:
...
"""

    result = generate_ai_response(
        prompt,
        "flash",
    )

    return {

        "summary": result["reply"],

        "model": result["model"],

    }


# ============================================================
# TRENDING NEWS
# ============================================================

@router.post("/trending")
def analyze_trending_news(
    request: TrendingNewsRequest
):

    if not request.articles:

        return {

            "trending": [],

            "model": None,

        }


    # Limit input to prevent unnecessarily
    # large Gemini requests.

    articles = request.articles[:50]


    prompt = f"""
You are KANCHHI Trending News Intelligence.

Analyze the following news articles collected
from multiple news sources.

ARTICLES:

{articles}

Your job is to identify stories that appear
to be receiving coverage across multiple sources.

Rules:

1. Do not invent stories.
2. Use only the supplied article titles.
3. Group articles that clearly refer to
   the same event/topic.
4. Do not combine unrelated stories.
5. Rank topics by number of different sources.
6. Prefer stories covered by multiple sources.
7. Return a maximum of 5 trending topics.

Return JSON only using this structure:

{{
  "trending": [
    {{
      "title": "short topic title",
      "summary": "short explanation",
      "sourceCount": 2,
      "sources": ["OnlineKhabar", "RONB"]
    }}
  ]
}}
"""

    result = generate_ai_response(
        prompt,
        "lite",
    )

    return {

        "trending": result["reply"],

        "model": result["model"],

    }