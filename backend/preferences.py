from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from pathlib import Path
import json


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/preferences",
    tags=["Preferences"],
)


# ============================================================
# STORAGE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

PREFERENCES_FILE = BASE_DIR / "preferences.json"


# ============================================================
# DEFAULT PREFERENCES
# ============================================================

DEFAULT_PREFERENCES = {
    "theme": "dark",
    "accent_color": "blue",

    "temperature_unit": "celsius",
    "wind_speed_unit": "kmh",

    "weather_alerts": True,

    "news_notifications": True,
    "ai_notifications": True,

    "news_categories": [
        "general",
        "technology",
        "business",
        "sports",
    ],

    "news_sources": [],

    "default_ai_model": "flash",

    "language": "en",

    "compact_mode": False,

    "save_chat_history": True,
}


# ============================================================
# REQUEST MODEL
# ============================================================

class PreferencesUpdate(BaseModel):

    theme: Literal[
        "dark",
        "light",
        "system",
    ] | None = None

    accent_color: str | None = None

    temperature_unit: Literal[
        "celsius",
        "fahrenheit",
    ] | None = None

    wind_speed_unit: Literal[
        "kmh",
        "mph",
    ] | None = None

    weather_alerts: bool | None = None

    news_notifications: bool | None = None

    ai_notifications: bool | None = None

    news_categories: list[str] | None = None

    news_sources: list[str] | None = None

    default_ai_model: Literal[
        "flash",
        "pro",
        "lite",
    ] | None = None

    language: str | None = None

    compact_mode: bool | None = None

    save_chat_history: bool | None = None


# ============================================================
# LOAD PREFERENCES
# ============================================================

def load_preferences():

    if not PREFERENCES_FILE.exists():

        save_preferences(
            DEFAULT_PREFERENCES.copy()
        )

        return DEFAULT_PREFERENCES.copy()

    try:

        with open(
            PREFERENCES_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            stored = json.load(file)

        preferences = DEFAULT_PREFERENCES.copy()

        preferences.update(stored)

        return preferences

    except Exception as error:

        print(
            "Could not load preferences:",
            repr(error),
        )

        return DEFAULT_PREFERENCES.copy()


# ============================================================
# SAVE PREFERENCES
# ============================================================

def save_preferences(
    preferences: dict,
):

    try:

        with open(
            PREFERENCES_FILE,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                preferences,
                file,
                indent=2,
                ensure_ascii=False,
            )

    except Exception as error:

        print(
            "Could not save preferences:",
            repr(error),
        )

        raise


# ============================================================
# GET PREFERENCES
# ============================================================

@router.get("")
def get_preferences():

    return {
        "preferences": load_preferences(),
    }


# ============================================================
# UPDATE PREFERENCES
# ============================================================

@router.put("")
def update_preferences(
    request: PreferencesUpdate,
):

    preferences = load_preferences()

    updates = request.model_dump(
        exclude_none=True
    )

    preferences.update(updates)

    save_preferences(
        preferences
    )

    return {
        "message": "Preferences updated successfully.",
        "preferences": preferences,
    }


# ============================================================
# RESET PREFERENCES
# ============================================================

@router.post("/reset")
def reset_preferences():

    preferences = DEFAULT_PREFERENCES.copy()

    save_preferences(
        preferences
    )

    return {
        "message": "Preferences reset successfully.",
        "preferences": preferences,
    }