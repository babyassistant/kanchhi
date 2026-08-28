from fastapi import APIRouter
from pydantic import BaseModel, Field
from pathlib import Path
from datetime import datetime, timezone
import json
from typing import Any


router = APIRouter(
    prefix="/api/watchlists",
    tags=["Watchlists"],
)


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

STORAGE_FILE = (
    DATA_DIR / "watchlists.json"
)


# ============================================================
# STORAGE
# ============================================================

def load_watchlists() -> list[dict[str, Any]]:

    try:

        if not STORAGE_FILE.exists():
            return []

        with open(
            STORAGE_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

        if isinstance(
            data,
            list,
        ):
            return data

        return []

    except Exception as error:

        print(
            "Watchlist load error:",
            repr(error),
        )

        return []


def save_watchlists(
    data: list[dict[str, Any]]
) -> None:

    with open(
        STORAGE_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2,
        )


def create_id() -> str:

    return (
        "watch-"
        + datetime.now(
            timezone.utc
        ).strftime(
            "%Y%m%d%H%M%S%f"
        )
    )


# ============================================================
# MODELS
# ============================================================

class WatchlistCreate(BaseModel):

    name: str

    category: str = "General"

    keywords: list[str] = Field(
        default_factory=list
    )

    enabled: bool = True


class WatchlistUpdate(BaseModel):

    name: str | None = None

    category: str | None = None

    keywords: list[str] | None = None

    enabled: bool | None = None


# ============================================================
# LIST
# ============================================================

@router.get("")
def get_watchlists():

    return {
        "success": True,
        "watchlists":
            load_watchlists(),
    }


# ============================================================
# CREATE
# ============================================================

@router.post("")
def create_watchlist(
    request: WatchlistCreate,
):

    watchlists = load_watchlists()

    item = {
        "id": create_id(),
        "name":
            request.name,
        "category":
            request.category,
        "keywords":
            request.keywords,
        "enabled":
            request.enabled,
        "created_at":
            datetime.now(
                timezone.utc
            ).isoformat(),
    }

    watchlists.append(item)

    save_watchlists(
        watchlists
    )

    return {
        "success": True,
        "watchlist": item,
    }


# ============================================================
# UPDATE
# ============================================================

@router.patch(
    "/{watchlist_id}"
)
def update_watchlist(
    watchlist_id: str,
    request: WatchlistUpdate,
):

    watchlists = load_watchlists()

    for item in watchlists:

        if (
            item.get("id")
            != watchlist_id
        ):
            continue

        updates = request.model_dump(
            exclude_unset=True
        )

        item.update(updates)

        save_watchlists(
            watchlists
        )

        return {
            "success": True,
            "watchlist": item,
        }

    return {
        "success": False,
        "error": "Watchlist not found.",
    }


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{watchlist_id}"
)
def delete_watchlist(
    watchlist_id: str,
):

    watchlists = load_watchlists()

    filtered = [
        item
        for item in watchlists
        if item.get("id")
        != watchlist_id
    ]

    save_watchlists(
        filtered
    )

    return {
        "success": True,
        "deleted":
            len(watchlists)
            - len(filtered),
    }