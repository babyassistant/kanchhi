from __future__ import annotations

import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google import genai
from pydantic import BaseModel, Field


load_dotenv()


# ============================================================
# ROUTER
# ============================================================
#
# IMPORTANT:
# This router is for GENERAL KANCHHI AI.
#
# Therefore:
#
# /api/ai/chat
# /api/ai/health
#
# Code intelligence has its own separate router in ai_code.py:
#
# /api/ai/code/review
# /api/ai/code/project
# /api/ai/code/documentation
#
# ============================================================

router = APIRouter(
    prefix="/api/ai",
    tags=["KANCHHI AI"],
)


# ============================================================
# GEMINI KEY CONFIGURATION
# ============================================================

GEMINI_KEY_NAMES = [
    "GEMINI_API_KEY",
    "GEMINI_API_KEY_1",
    "GEMINI_API_KEY_2",
    "GEMINI_API_KEY_3",
    "GEMINI_API_KEY_4",
    "GEMINI_API_KEY_5",
    "GEMINI_API_KEY_6",
    "GEMINI_API_KEY_7",
]


LEGACY_GEMINI_KEY_NAMES = [
    "GEMINI_KEY_FLASH",
    "GEMINI_KEY_PRO",
    "GEMINI_KEY_LITE",
]


def get_gemini_api_keys() -> List[str]:
    keys: List[str] = []

    for name in GEMINI_KEY_NAMES:
        value = os.getenv(name, "")

        if value and value.strip():
            cleaned = value.strip()

            if cleaned not in keys:
                keys.append(cleaned)

    for name in LEGACY_GEMINI_KEY_NAMES:
        value = os.getenv(name, "")

        if value and value.strip():
            cleaned = value.strip()

            if cleaned not in keys:
                keys.append(cleaned)

    return keys


def get_api_key() -> str:
    keys = get_gemini_api_keys()

    if not keys:
        raise RuntimeError(
            "No Gemini API key configured. "
            "Set GEMINI_API_KEY in backend/.env."
        )

    return keys[0]


# ============================================================
# MODEL CONFIGURATION
# ============================================================

MODEL_MAP = {
    "flash": os.getenv(
        "MODEL_FLASH",
        "gemini-2.5-flash",
    ).strip(),

    "pro": os.getenv(
        "MODEL_PRO",
        "gemini-2.5-pro",
    ).strip(),

    "lite": os.getenv(
        "MODEL_LITE",
        "gemini-2.5-flash-lite",
    ).strip(),
}


def choose_model(
    model_type: str = "flash",
) -> str:

    normalized = (
        model_type or "flash"
    ).strip().lower()

    return MODEL_MAP.get(
        normalized,
        MODEL_MAP["flash"],
    )


def get_model(
    model_type: str = "flash",
) -> str:

    return choose_model(
        model_type
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

def create_client(
    api_key: str | None = None,
) -> genai.Client:

    return genai.Client(
        api_key=(
            api_key
            if api_key
            else get_api_key()
        )
    )


# ============================================================
# MODEL ORDER
# ============================================================

def get_models_to_try(
    requested_model: str,
) -> List[str]:

    models: List[str] = []

    for model in [
        requested_model,
        choose_model("flash"),
        choose_model("lite"),
        choose_model("pro"),
    ]:

        if (
            model
            and model not in models
        ):
            models.append(model)

    return models


# ============================================================
# AI GENERATION
# ============================================================

def generate_ai_response(
    prompt: str,
    model_type: str = "flash",
) -> Dict[str, Any]:

    if not isinstance(
        prompt,
        str,
    ):
        raise TypeError(
            "AI prompt must be a string."
        )

    prompt = prompt.strip()

    if not prompt:
        raise ValueError(
            "AI prompt cannot be empty."
        )

    requested_model = choose_model(
        model_type
    )

    models_to_try = get_models_to_try(
            requested_model
        )

    keys = get_gemini_api_keys()

    if not keys:
        raise RuntimeError(
            "No Gemini API keys configured."
        )

    last_error: Exception | None = None

    # ========================================================
    # KEY LOOP
    # ========================================================

    for key_index, api_key in enumerate(keys):

        # ====================================================
        # MODEL LOOP
        # ====================================================

        for model in models_to_try:

            try:

                client = create_client(
                        api_key
                    )

                response = client.models.generate_content(
                        model=model,
                        contents=prompt,
                    )

                text = getattr(
                        response,
                        "text",
                        None,
                    )

                if not text:
                    raise RuntimeError(
                        "Gemini returned an empty response."
                    )

                model_key = "flash"

                for name, value in MODEL_MAP.items():
                    if value == model:
                        model_key = name
                        break

                return {
                    "reply":
                        text.strip(),

                    "model":
                        model,

                    "model_key":
                        model_key,

                    "key_index":
                        key_index,

                    "fallback":
                        (
                            model
                            != requested_model
                        ),
                }

            except Exception as error:

                last_error = error

                print(
                    "KANCHHI Gemini request failed:",
                    {
                        "key":
                            key_index + 1,
                        "model":
                            model,
                        "error":
                            repr(error),
                    },
                )

                continue

    raise RuntimeError(
        "All configured Gemini API keys and fallback models failed. "
        f"Last error: {last_error}"
    )


# ============================================================
# SIMPLE TEXT HELPER
# ============================================================

def generate_text(
    prompt: str,
    model_type: str = "flash",
) -> str:

    result = generate_ai_response(
            prompt,
            model_type,
        )

    return result["reply"]


# ============================================================
# CHAT REQUEST
# ============================================================

class ChatRequest(BaseModel):

    message: str = Field(
        ...,
        min_length=1,
        max_length=20000,
    )


# ============================================================
# GENERAL CHAT
# ============================================================

@router.post("/chat")
def chat(
    request: ChatRequest,
):

    try:

        return generate_ai_response(
            request.message,
            "flash",
        )

    except Exception as error:

        print(
            "KANCHHI AI chat error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "KANCHHI AI could not generate "
                "a response. Gemini error: "
                f"{error}"
            ),
        )


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
def health():

    keys = get_gemini_api_keys()

    return {
        "service":
            "KANCHHI AI",

        "status":
            "configured"
            if keys
            else "unavailable",

        "gemini_keys":
            len(keys),

        "models":
            MODEL_MAP,

        "google_search_key_separate":
            bool(
                os.getenv(
                    "GOOGLE_API_KEY",
                    "",
                ).strip()
            ),
    }