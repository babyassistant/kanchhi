from __future__ import annotations

import os
from typing import Any

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Query


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/search",
    tags=["Search"],
)


# ============================================================
# CONFIG
# ============================================================

GOOGLE_SEARCH_URL = (
    "https://www.googleapis.com/customsearch/v1"
)


def get_google_api_key() -> str:
    return os.getenv(
        "GOOGLE_API_KEY",
        "",
    ).strip()


def get_google_cse_id() -> str:
    return os.getenv(
        "GOOGLE_CSE_ID",
        "",
    ).strip()


# ============================================================
# GOOGLE ERROR
# ============================================================

def get_google_error_message(
    data: Any,
) -> str:

    if not isinstance(data, dict):
        return "Google Search request failed."

    error_data = data.get(
        "error",
        {},
    )

    if isinstance(
        error_data,
        dict,
    ):

        message = error_data.get(
            "message"
        )

        if isinstance(
            message,
            str,
        ) and message.strip():

            return message.strip()

    return "Google Search request failed."


# ============================================================
# SEARCH
# ============================================================

@router.get("")
def perform_search(
    query: str | None = Query(
        default=None,
    ),
    q: str | None = Query(
        default=None,
    ),
):

    search_query = (
        query
        or q
        or ""
    ).strip()


    # --------------------------------------------------------
    # QUERY
    # --------------------------------------------------------

    if not search_query:

        return {
            "success": False,
            "query": "",
            "items": [],
            "count": 0,
            "error":
                "Search query is required.",
        }


    # --------------------------------------------------------
    # CREDENTIALS
    # --------------------------------------------------------

    api_key = get_google_api_key()

    cse_id = get_google_cse_id()


    if not api_key:

        return {
            "success": False,
            "query":
                search_query,
            "items": [],
            "count": 0,
            "error":
                "GOOGLE_API_KEY is missing.",
            "details":
                "Set GOOGLE_API_KEY in backend/.env.",
        }


    if not cse_id:

        return {
            "success": False,
            "query":
                search_query,
            "items": [],
            "count": 0,
            "error":
                "GOOGLE_CSE_ID is missing.",
            "details":
                "Set GOOGLE_CSE_ID in backend/.env.",
        }


    # --------------------------------------------------------
    # GOOGLE REQUEST
    # --------------------------------------------------------

    try:

        response = requests.get(
            GOOGLE_SEARCH_URL,
            params={
                "q":
                    search_query,
                "key":
                    api_key,
                "cx":
                    cse_id,
            },
            timeout=15,
        )

    except requests.Timeout:

        return {
            "success": False,
            "query":
                search_query,
            "items": [],
            "count": 0,
            "error":
                "Google Search request timed out.",
        }

    except requests.RequestException as error:

        return {
            "success": False,
            "query":
                search_query,
            "items": [],
            "count": 0,
            "error":
                "Could not connect to Google Search.",
            "details":
                str(error),
        }


    # --------------------------------------------------------
    # RESPONSE JSON
    # --------------------------------------------------------

    try:

        data: dict[str, Any] = (
            response.json()
        )

    except ValueError:

        return {
            "success": False,
            "query":
                search_query,
            "items": [],
            "count": 0,
            "error":
                "Google Search returned invalid JSON.",
            "status":
                response.status_code,
        }


    # --------------------------------------------------------
    # GOOGLE ERROR
    # --------------------------------------------------------

    if response.status_code != 200:

        message = get_google_error_message(
            data
        )


        if response.status_code == 403:

            details = (
                "Google rejected the Custom Search request. "
                "Verify Google Cloud API access, API key restrictions, "
                "quota, and the configured search engine."
            )

        elif response.status_code == 400:

            details = (
                "Google rejected the search request. "
                "Check the search engine configuration."
            )

        elif response.status_code == 401:

            details = (
                "Google rejected the API credentials."
            )

        elif response.status_code == 429:

            details = (
                "Google Search quota or rate limit has been reached."
            )

        else:

            details = message


        return {
            "success": False,
            "query":
                search_query,
            "items": [],
            "count": 0,
            "error":
                message,
            "status":
                response.status_code,
            "details":
                details,
        }


    # --------------------------------------------------------
    # RESULTS
    # --------------------------------------------------------

    raw_items = data.get(
        "items",
        [],
    )


    if not isinstance(
        raw_items,
        list,
    ):

        raw_items = []


    items: list[dict[str, Any]] = []


    for raw_item in raw_items:

        if not isinstance(
            raw_item,
            dict,
        ):

            continue


        items.append(
            {
                "title":
                    raw_item.get(
                        "title",
                        "",
                    ),

                "link":
                    raw_item.get(
                        "link",
                        "",
                    ),

                "snippet":
                    raw_item.get(
                        "snippet",
                        "",
                    ),

                "displayLink":
                    raw_item.get(
                        "displayLink",
                        "",
                    ),

                "formattedUrl":
                    raw_item.get(
                        "formattedUrl",
                        "",
                    ),
            }
        )


    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    return {
        "success":
            True,

        "query":
            search_query,

        "items":
            items,

        "count":
            len(items),

        "searchInformation":
            data.get(
                "searchInformation",
                {},
            ),
    }


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
def search_health():

    api_key = get_google_api_key()

    cse_id = get_google_cse_id()


    configured = bool(
        api_key
        and cse_id
    )


    return {
        "service":
            "KANCHHI Web Search",

        "status":
            "configured"
            if configured
            else "unavailable",

        "google_api_key":
            bool(api_key),

        "google_cse_id":
            bool(cse_id),
    }


# ============================================================
# CONFIG
# ============================================================

@router.get("/config")
def search_config():

    api_key = get_google_api_key()

    cse_id = get_google_cse_id()


    return {
        "success":
            True,

        "configured":
            bool(
                api_key
                and cse_id
            ),

        "google_api_key":
            bool(api_key),

        "google_cse_id":
            bool(cse_id),
    }