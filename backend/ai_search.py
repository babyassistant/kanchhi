from fastapi import APIRouter
from pydantic import BaseModel, Field

from ai import generate_ai_response


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/ai/search",
    tags=["AI Search"],
)


# ============================================================
# REQUEST
# ============================================================

class SearchIntentRequest(BaseModel):

    message: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# NATURAL LANGUAGE SEARCH
# ============================================================

@router.post("/intent")
def analyze_search_intent(
    request: SearchIntentRequest
):

    prompt = f"""
You are KANCHHI Search Intelligence.

Convert the user's natural-language request
into a structured search instruction.

USER REQUEST:

{request.message}

Possible intents:

- web_search
- news
- weather
- general

Return JSON only:

{{
  "intent": "web_search",
  "query": "optimized search query",
  "reason": "short explanation"
}}

Rules:

1. Preserve the user's meaning.
2. Remove unnecessary conversational words.
3. Create a useful search query.
4. Do not answer the user's question.
5. Do not invent facts.
6. If the user clearly asks about weather,
   use "weather".
7. If the user clearly asks for news,
   use "news".
8. Otherwise use "web_search".
"""

    result = generate_ai_response(
        prompt,
        "lite",
    )

    return {

        "result": result["reply"],

        "model": result["model"],

    }