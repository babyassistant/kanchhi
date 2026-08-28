from __future__ import annotations

import os
import platform
import time
from datetime import datetime, timezone
from typing import Any, Dict, List

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException

from ai import (
    get_gemini_api_keys,
    MODEL_MAP,
)


load_dotenv()


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/system",
    tags=["System Monitoring"],
)


# ============================================================
# START TIME
# ============================================================

SERVER_STARTED_AT = time.time()


# ============================================================
# LOCAL PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MEMORY_DB_PATH = os.path.join(
    BASE_DIR,
    "kanchhi_memory.db",
)

NOTIFICATIONS_DB_PATH = os.path.join(
    BASE_DIR,
    "kanchhi_notifications.db",
)

PREFERENCES_PATH = os.path.join(
    BASE_DIR,
    "preferences.json",
)


# ============================================================
# EXTERNAL SERVICES
# ============================================================

WEATHER_URL = (
    "https://api.open-meteo.com/v1/forecast"
)

NEWS_URLS = {

    "OnlineKhabar":
        "https://www.onlinekhabar.com/",

    "RONB":
        "https://www.ronbpost.com/",

    "Ratopati":
        "https://www.ratopati.com/",
}


# ============================================================
# HELPERS
# ============================================================

def now_iso() -> str:

    return datetime.now(
        timezone.utc
    ).isoformat()


def make_check(
    name: str,
    status: str,
    detail: str,
    duration_ms: float = 0,
) -> Dict[str, Any]:

    return {

        "name":
            name,

        "status":
            status,

        "detail":
            detail,

        "duration_ms":
            round(
                duration_ms,
                2,
            ),

    }


def measure_check(
    check_function,
    service_name: str,
):

    started = time.perf_counter()

    try:

        result = check_function()

        result["duration_ms"] = round(
            (
                time.perf_counter()
                - started
            ) * 1000,
            2,
        )

        return result

    except requests.RequestException as error:

        return make_check(
            service_name,
            "offline",
            str(error),
            (
                time.perf_counter()
                - started
            ) * 1000,
        )

    except Exception as error:

        return make_check(
            service_name,
            "warning",
            str(error),
            (
                time.perf_counter()
                - started
            ) * 1000,
        )


# ============================================================
# BACKEND
# ============================================================

def check_backend():

    return make_check(
        "Backend API",
        "online",
        "FastAPI backend is responding.",
    )


# ============================================================
# KANCHHI AI
# ============================================================

def check_gemini():

    keys = get_gemini_api_keys()

    if not keys:

        return make_check(
            "KANCHHI AI",
            "offline",
            (
                "No Gemini API key is configured. "
                "Set GEMINI_API_KEY in backend/.env."
            ),
        )

    configured_models = [
        name
        for name, value in MODEL_MAP.items()
        if value
    ]

    return make_check(
        "KANCHHI AI",
        "online",
        (
            f"Gemini configuration is available. "
            f"Keys: {len(keys)}. "
            f"Models: {', '.join(configured_models)}."
        ),
    )


# ============================================================
# GOOGLE SEARCH
# ============================================================

def check_google_search():

    api_key = os.getenv(
        "GOOGLE_API_KEY"
    )

    cse_id = os.getenv(
        "GOOGLE_CSE_ID"
    )

    if api_key and cse_id:

        return make_check(
            "Web Search",
            "online",
            "Google Search credentials are configured.",
        )

    if api_key or cse_id:

        return make_check(
            "Web Search",
            "warning",
            (
                "Google Search configuration "
                "is incomplete."
            ),
        )

    return make_check(
        "Web Search",
        "warning",
        (
            "Google Search credentials are "
            "not configured."
        ),
    )


# ============================================================
# LOCAL STORAGE
# ============================================================

def check_local_file(
    service_name: str,
    path: str,
):

    if os.path.exists(path):

        size = os.path.getsize(path)

        return make_check(
            service_name,
            "online",
            (
                "Local storage is available "
                f"({size} bytes)."
            ),
        )

    return make_check(
        service_name,
        "warning",
        "Expected local storage file was not found.",
    )


def check_memory():

    return check_local_file(
        "KANCHHI Memory",
        MEMORY_DB_PATH,
    )


def check_notifications():

    return check_local_file(
        "Notifications",
        NOTIFICATIONS_DB_PATH,
    )


def check_preferences():

    return check_local_file(
        "Preferences",
        PREFERENCES_PATH,
    )


# ============================================================
# WEATHER
# ============================================================

def check_weather_provider():

    response = requests.get(

        WEATHER_URL,

        params={

            "latitude":
                27.7172,

            "longitude":
                85.3240,

            "current":
                "temperature_2m",

        },

        timeout=5,

    )

    if response.ok:

        return make_check(
            "Weather Provider",
            "online",
            "Open-Meteo responded successfully.",
        )

    return make_check(
        "Weather Provider",
        "warning",
        (
            "Open-Meteo returned HTTP "
            f"{response.status_code}."
        ),
    )


# ============================================================
# NEWS
# ============================================================

def check_news_provider(
    name: str,
    url: str,
):

    response = requests.get(

        url,

        headers={
            "User-Agent":
                "KANCHHI System Monitor/1.0",
        },

        timeout=5,

    )

    if response.ok:

        return make_check(
            name,
            "online",
            (
                f"{name} responded with "
                f"HTTP {response.status_code}."
            ),
        )

    return make_check(
        name,
        "warning",
        (
            f"{name} returned "
            f"HTTP {response.status_code}."
        ),
    )


# ============================================================
# EXECUTE
# ============================================================

def execute_check(
    name: str,
) -> Dict[str, Any]:

    functions = {

        "Backend API":
            check_backend,

        "KANCHHI AI":
            check_gemini,

        "Web Search":
            check_google_search,

        "KANCHHI Memory":
            check_memory,

        "Notifications":
            check_notifications,

        "Preferences":
            check_preferences,

        "Weather Provider":
            check_weather_provider,

    }

    if name in functions:

        return measure_check(
            functions[name],
            name,
        )

    if name in NEWS_URLS:

        return measure_check(

            lambda:
                check_news_provider(
                    name,
                    NEWS_URLS[name],
                ),

            name,

        )

    raise KeyError(
        f"Unknown check: {name}"
    )


# ============================================================
# ALL CHECKS
# ============================================================

def run_all_checks(
    include_external: bool = True,
) -> List[Dict[str, Any]]:

    names = [

        "Backend API",

        "KANCHHI AI",

        "Web Search",

        "KANCHHI Memory",

        "Notifications",

        "Preferences",

        "Weather Provider",

    ]

    if include_external:

        names.extend([
            "OnlineKhabar",
            "RONB",
            "Ratopati",
        ])

    return [
        execute_check(
            name
        )
        for name in names
    ]


# ============================================================
# STATUS
# ============================================================

def calculate_status(
    checks:
        List[Dict[str, Any]]
) -> str:

    offline = sum(
        1
        for check in checks
        if check["status"] == "offline"
    )

    warning = sum(
        1
        for check in checks
        if check["status"] == "warning"
    )

    if offline > 0:

        return "degraded"

    if warning > 0:

        return "warning"

    return "healthy"


def build_summary(
    checks:
        List[Dict[str, Any]]
):

    return {

        "total":
            len(checks),

        "online":
            sum(
                1
                for check in checks
                if check["status"]
                == "online"
            ),

        "warning":
            sum(
                1
                for check in checks
                if check["status"]
                == "warning"
            ),

        "offline":
            sum(
                1
                for check in checks
                if check["status"]
                == "offline"
            ),

    }


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
def system_health(
    probe: bool = False,
):

    checks = run_all_checks(
        include_external=probe
    )

    return {

        "service":
            "KANCHHI System Monitoring",

        "status":
            calculate_status(
                checks
            ),

        "timestamp":
            now_iso(),

        "uptime_seconds":
            max(
                0,
                int(
                    time.time()
                    - SERVER_STARTED_AT
                ),
            ),

        "uptime_minutes":
            round(
                (
                    time.time()
                    - SERVER_STARTED_AT
                ) / 60,
                1,
            ),

        "python_version":
            platform.python_version(),

        "platform":
            platform.system(),

        "services":
            checks,

        "summary":
            build_summary(
                checks
            ),

    }


# ============================================================
# DETAILED CHECKS
# ============================================================

@router.get("/checks")
def detailed_checks(
    external: bool = True,
):

    started = time.perf_counter()

    checks = run_all_checks(
        include_external=external
    )

    total_duration_ms = (
        time.perf_counter()
        - started
    ) * 1000

    return {

        "service":
            "KANCHHI Service Health Checks",

        "status":
            calculate_status(
                checks
            ),

        "timestamp":
            now_iso(),

        "checks":
            checks,

        "summary":
            build_summary(
                checks
            ),

        "total_duration_ms":
            round(
                total_duration_ms,
                2,
            ),

    }


# ============================================================
# SINGLE CHECK
# ============================================================

@router.get("/checks/{check_name}")
def single_check(
    check_name: str,
):

    normalized = (
        check_name
        .strip()
        .lower()
    )

    mapping = {

        "backend":
            "Backend API",

        "ai":
            "KANCHHI AI",

        "search":
            "Web Search",

        "memory":
            "KANCHHI Memory",

        "notifications":
            "Notifications",

        "preferences":
            "Preferences",

        "weather":
            "Weather Provider",

        "onlinekhabar":
            "OnlineKhabar",

        "ronb":
            "RONB",

        "ratopati":
            "Ratopati",

    }

    if normalized not in mapping:

        raise HTTPException(

            status_code=404,

            detail={

                "error":
                    "Unknown health check.",

                "available":
                    list(
                        mapping.keys()
                    ),

            },

        )

    result = execute_check(
        mapping[normalized]
    )

    return {

        "timestamp":
            now_iso(),

        "check":
            result,

    }