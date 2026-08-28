from __future__ import annotations

from typing import Any, Optional, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai import (
    choose_model,
    generate_ai_response,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/intelligence",
    tags=["KANCHHI Intelligence"],
)


# ============================================================
# CONTEXT
# ============================================================

class UnifiedContext(BaseModel):

    location: Optional[Any] = None
    weather: Optional[Any] = None
    news: Optional[Any] = None
    memory: Optional[Any] = None
    preferences: Optional[Any] = None
    notifications: Optional[Any] = None
    analytics: Optional[Any] = None
    search: Optional[Any] = None


class ContextRequest(BaseModel):

    context: UnifiedContext = Field(
        default_factory=UnifiedContext
    )


class RouteRequest(BaseModel):

    message: str = Field(
        ...,
        min_length=1,
    )

    context: Optional[UnifiedContext] = None

    requested_model: Literal[
        "auto",
        "flash",
        "pro",
        "lite",
    ] = "auto"


class BriefingRequest(BaseModel):

    context: Optional[
        UnifiedContext
    ] = None

    location: Optional[Any] = None
    weather: Optional[Any] = None
    news: Optional[Any] = None
    memory: Optional[Any] = None
    preferences: Optional[Any] = None
    notifications: Optional[Any] = None
    analytics: Optional[Any] = None
    search: Optional[Any] = None

    style: Literal[
        "concise",
        "normal",
        "detailed",
    ] = "normal"


# ============================================================
# CONTEXT NORMALIZATION
# ============================================================

def normalize_context(
    request: BriefingRequest | ContextRequest | UnifiedContext,
) -> dict:

    if isinstance(
        request,
        UnifiedContext,
    ):

        context = request

    elif hasattr(
        request,
        "context",
    ) and request.context is not None:

        context = request.context

    else:

        context = UnifiedContext(
            location=getattr(
                request,
                "location",
                None,
            ),
            weather=getattr(
                request,
                "weather",
                None,
            ),
            news=getattr(
                request,
                "news",
                None,
            ),
            memory=getattr(
                request,
                "memory",
                None,
            ),
            preferences=getattr(
                request,
                "preferences",
                None,
            ),
            notifications=getattr(
                request,
                "notifications",
                None,
            ),
            analytics=getattr(
                request,
                "analytics",
                None,
            ),
            search=getattr(
                request,
                "search",
                None,
            ),
        )

    return {
        "location":
            context.location,

        "weather":
            context.weather,

        "news":
            context.news,

        "memory":
            context.memory,

        "preferences":
            context.preferences,

        "notifications":
            context.notifications,

        "analytics":
            context.analytics,

        "search":
            context.search,
    }


# ============================================================
# CONTEXT ENDPOINT
# ============================================================

@router.post("/context")
def build_unified_context(
    request: ContextRequest,
):

    context = normalize_context(
        request.context
    )

    available = {
        key:
            value is not None
            and value != []
            and value != {}
        for key, value
        in context.items()
    }

    return {
        "success":
            True,

        "context":
            context,

        "available":
            available,
    }


# ============================================================
# ROUTING
# ============================================================

@router.post("/route")
def route_ai_model(
    request: RouteRequest,
):

    selected_model = choose_model(
        request.message,
        request.requested_model,
        request.context,
    )

    reasons = {
        "flash":
            "General KANCHHI conversation.",

        "pro":
            "Complex reasoning, technical analysis, or coding.",

        "lite":
            "Simple or lightweight request.",
    }

    return {
        "success":
            True,

        "requested_model":
            request.requested_model,

        "selected_model":
            selected_model,

        "reason":
            reasons.get(
                selected_model,
                "Automatic model routing.",
            ),
    }


# ============================================================
# BRIEFING PROMPT
# ============================================================

def build_briefing_prompt(
    briefing_type: str,
    request: BriefingRequest,
) -> str:

    context = normalize_context(
        request
    )

    style_instruction = {
        "concise":
            "Keep it concise.",

        "normal":
            "Give a useful medium-length briefing.",

        "detailed":
            "Give a detailed but practical briefing.",
    }.get(
        request.style,
        "Give a useful medium-length briefing.",
    )

    if briefing_type == "morning":

        task = """
Create the KANCHHI Morning Briefing.

Include:

1. Friendly greeting.
2. Current weather and important forecast.
3. Important news from supplied data.
4. Relevant notifications.
5. Personalized advice from supplied memory/preferences.
6. A short KANCHHI recommendation.
"""

    else:

        task = """
Create the KANCHHI Evening Summary.

Include:

1. Short evening greeting.
2. Today's weather.
3. Important news or trends.
4. Relevant notifications.
5. Personalized observations.
6. Tomorrow / Next Steps.
"""

    return f"""
You are KANCHHI Intelligence.

{task}

Rules:

- Use only supplied information.
- Do not invent facts.
- Clearly say when information is unavailable.
- Return clean Markdown.
- {style_instruction}

APPLICATION CONTEXT:
{context}
"""


# ============================================================
# SHARED BRIEFING GENERATION
# ============================================================

def generate_briefing(
    briefing_type: str,
    request: BriefingRequest,
):

    prompt = build_briefing_prompt(
        briefing_type,
        request,
    )

    try:

        result = generate_ai_response(
            prompt,
            "flash",
        )

        return {
            "success":
                True,

            "type":
                briefing_type,

            "briefing":
                result["reply"],

            "model":
                result["model"],

            "model_key":
                result.get(
                    "model_key",
                    "flash",
                ),

            "fallback":
                result.get(
                    "fallback",
                    False,
                ),
        }

    except Exception as error:

        print(
            f"{briefing_type.title()} briefing error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"KANCHHI {briefing_type.title()} "
                "Briefing could not be generated. "
                f"{error}"
            ),
        )


# ============================================================
# MORNING
# ============================================================

@router.post("/briefing/morning")
def morning_briefing(
    request: BriefingRequest,
):

    return generate_briefing(
        "morning",
        request,
    )


# ============================================================
# EVENING
# ============================================================

@router.post("/briefing/evening")
def evening_briefing(
    request: BriefingRequest,
):

    return generate_briefing(
        "evening",
        request,
    )