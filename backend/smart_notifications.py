from fastapi import APIRouter
from pydantic import BaseModel, Field
from pathlib import Path
from datetime import datetime, timezone
import json
from typing import Any, Optional


router = APIRouter(
    prefix="/api/smart-notifications",
    tags=["Smart Notifications"],
)


# ============================================================
# STORAGE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

STORAGE_FILE = DATA_DIR / "smart_notifications.json"


# ============================================================
# HELPERS
# ============================================================

def load_notifications() -> list[dict[str, Any]]:
    try:
        if not STORAGE_FILE.exists():
            return []

        with open(
            STORAGE_FILE,
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        if isinstance(data, list):
            return data

        return []

    except Exception as error:
        print(
            "Smart notification load error:",
            repr(error),
        )
        return []


def save_notifications(
    notifications: list[dict[str, Any]]
) -> None:

    with open(
        STORAGE_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            notifications[-200:],
            file,
            ensure_ascii=False,
            indent=2,
        )


def create_id() -> str:

    return (
        "smart-"
        + datetime.now(
            timezone.utc
        ).strftime(
            "%Y%m%d%H%M%S%f"
        )
    )


def now_iso() -> str:

    return datetime.now(
        timezone.utc
    ).isoformat()


def is_duplicate(
    notifications: list[dict[str, Any]],
    kind: str,
    source_key: str,
) -> bool:

    for notification in notifications:

        if (
            notification.get("kind")
            != kind
        ):
            continue

        if (
            notification.get("source_key")
            != source_key
        ):
            continue

        created_value = notification.get(
            "created_at",
            "",
        )

        if not created_value:
            continue

        try:

            created_time = datetime.fromisoformat(
                str(
                    created_value
                ).replace(
                    "Z",
                    "+00:00",
                )
            )

            age_seconds = (
                datetime.now(
                    timezone.utc
                )
                - created_time
            ).total_seconds()

            if age_seconds < 21600:
                return True

        except Exception:
            continue

    return False


# ============================================================
# REQUEST MODELS
# ============================================================

class SmartNotificationCreate(BaseModel):

    kind: str

    title: str

    message: str

    severity: str = "info"

    source_key: str = ""

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


class SmartEvaluationRequest(BaseModel):

    weather: Optional[dict[str, Any]] = None

    news: Optional[list[dict[str, Any]]] = None

    system: Optional[dict[str, Any]] = None


# ============================================================
# LIST
# ============================================================

@router.get("")
def list_smart_notifications():

    notifications = load_notifications()

    return {
        "success": True,
        "count": len(notifications),
        "notifications": notifications[
            -100:
        ][::-1],
    }


# ============================================================
# CREATE
# ============================================================

@router.post("")
def create_smart_notification(
    request: SmartNotificationCreate,
):

    notifications = load_notifications()

    source_key = (
        request.source_key.strip()
        if request.source_key
        else request.kind
    )

    if is_duplicate(
        notifications,
        request.kind,
        source_key,
    ):

        existing = None

        for item in reversed(
            notifications
        ):

            if (
                item.get("kind")
                == request.kind
                and item.get("source_key")
                == source_key
            ):
                existing = item
                break

        return {
            "success": True,
            "created": False,
            "duplicate": True,
            "notification": existing,
        }

    notification = {
        "id": create_id(),
        "kind": request.kind,
        "title": request.title,
        "message": request.message,
        "severity": request.severity,
        "source_key": source_key,
        "metadata": request.metadata,
        "read": False,
        "created_at": now_iso(),
    }

    notifications.append(
        notification
    )

    save_notifications(
        notifications
    )

    return {
        "success": True,
        "created": True,
        "duplicate": False,
        "notification": notification,
    }


# ============================================================
# SMART EVALUATION
# ============================================================

@router.post("/evaluate")
def evaluate_smart_notifications(
    request: SmartEvaluationRequest,
):

    notifications = load_notifications()

    created: list[dict[str, Any]] = []

    # --------------------------------------------------------
    # WEATHER
    # --------------------------------------------------------

    weather = request.weather or {}

    current = weather.get(
        "current",
        {},
    )

    alerts = weather.get(
        "alerts",
        [],
    )

    weather_code = current.get(
        "weather_code"
    )

    temperature = current.get(
        "temperature"
    )

    wind_speed = current.get(
        "wind_speed"
    )

    if isinstance(
        alerts,
        list,
    ):

        for index, alert in enumerate(
            alerts[:5]
        ):

            if not isinstance(
                alert,
                dict,
            ):
                continue

            title = (
                alert.get("title")
                or "Weather Alert"
            )

            message = (
                alert.get("message")
                or "Weather conditions require attention."
            )

            kind = "weather_alert"

            alert_type = (
                alert.get("type")
                or str(index)
            )

            source_key = (
                f"{kind}-{alert_type}"
            )

            if is_duplicate(
                notifications,
                kind,
                source_key,
            ):
                continue

            item = {
                "id": create_id(),
                "kind": kind,
                "title": title,
                "message": message,
                "severity": (
                    alert.get(
                        "severity",
                        "warning",
                    )
                ),
                "source_key": source_key,
                "metadata": {
                    "weather_code":
                        weather_code,
                },
                "read": False,
                "created_at": now_iso(),
            }

            notifications.append(item)
            created.append(item)

    # --------------------------------------------------------
    # HIGH TEMPERATURE
    # --------------------------------------------------------

    if (
        isinstance(
            temperature,
            (int, float),
        )
        and temperature >= 35
    ):

        kind = "heat_warning"
        source_key = "heat-warning"

        if not is_duplicate(
            notifications,
            kind,
            source_key,
        ):

            item = {
                "id": create_id(),
                "kind": kind,
                "title": "High Temperature",
                "message": (
                    f"Current temperature is "
                    f"{round(temperature)}°C."
                ),
                "severity": "warning",
                "source_key": source_key,
                "metadata": {},
                "read": False,
                "created_at": now_iso(),
            }

            notifications.append(item)
            created.append(item)

    # --------------------------------------------------------
    # LOW TEMPERATURE
    # --------------------------------------------------------

    if (
        isinstance(
            temperature,
            (int, float),
        )
        and temperature <= 5
    ):

        kind = "cold_warning"
        source_key = "cold-warning"

        if not is_duplicate(
            notifications,
            kind,
            source_key,
        ):

            item = {
                "id": create_id(),
                "kind": kind,
                "title": "Low Temperature",
                "message": (
                    f"Current temperature is "
                    f"{round(temperature)}°C."
                ),
                "severity": "warning",
                "source_key": source_key,
                "metadata": {},
                "read": False,
                "created_at": now_iso(),
            }

            notifications.append(item)
            created.append(item)

    # --------------------------------------------------------
    # STRONG WIND
    # --------------------------------------------------------

    if (
        isinstance(
            wind_speed,
            (int, float),
        )
        and wind_speed >= 50
    ):

        kind = "wind_warning"
        source_key = "strong-wind"

        if not is_duplicate(
            notifications,
            kind,
            source_key,
        ):

            item = {
                "id": create_id(),
                "kind": kind,
                "title": "Strong Wind",
                "message": (
                    f"Current wind speed is "
                    f"{round(wind_speed)} km/h."
                ),
                "severity": "warning",
                "source_key": source_key,
                "metadata": {},
                "read": False,
                "created_at": now_iso(),
            }

            notifications.append(item)
            created.append(item)

    # --------------------------------------------------------
    # IMPORTANT NEWS
    # --------------------------------------------------------

    news = request.news or []

    important_keywords = [
        "breaking",
        "urgent",
        "alert",
        "warning",
        "earthquake",
        "flood",
        "storm",
        "election",
        "government",
    ]

    for article in news[:20]:

        if not isinstance(
            article,
            dict,
        ):
            continue

        title = str(
            article.get(
                "title",
                "",
            )
        ).strip()

        if not title:
            continue

        lowered = title.lower()

        matched = any(
            keyword in lowered
            for keyword in important_keywords
        )

        if not matched:
            continue

        kind = "important_news"

        source_key = (
            "news-" + title[:100]
        )

        if is_duplicate(
            notifications,
            kind,
            source_key,
        ):
            continue

        item = {
            "id": create_id(),
            "kind": kind,
            "title": "Important News",
            "message": title,
            "severity": "info",
            "source_key": source_key,
            "metadata": {
                "source":
                    article.get(
                        "source"
                    ),
                "link":
                    article.get(
                        "link"
                    ),
            },
            "read": False,
            "created_at": now_iso(),
        }

        notifications.append(item)
        created.append(item)

        if len(created) >= 10:
            break

    save_notifications(
        notifications
    )

    return {
        "success": True,
        "created_count": len(created),
        "created": created,
        "total_notifications":
            len(notifications),
    }


# ============================================================
# MARK READ
# ============================================================

@router.patch(
    "/{notification_id}/read"
)
def mark_smart_notification_read(
    notification_id: str,
):

    notifications = load_notifications()

    for item in notifications:

        if (
            item.get("id")
            == notification_id
        ):

            item["read"] = True

            save_notifications(
                notifications
            )

            return {
                "success": True,
                "notification": item,
            }

    return {
        "success": False,
        "error": "Notification not found.",
    }


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{notification_id}"
)
def delete_smart_notification(
    notification_id: str,
):

    notifications = load_notifications()

    filtered = [
        item
        for item in notifications
        if item.get("id")
        != notification_id
    ]

    save_notifications(
        filtered
    )

    return {
        "success": True,
        "deleted":
            len(notifications)
            - len(filtered),
    }