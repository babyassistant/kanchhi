from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pywebpush import WebPushException, webpush


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/push",
    tags=["Push Notifications"],
)


# ============================================================
# STORAGE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

SUBSCRIPTIONS_FILE = (
    DATA_DIR / "push_subscriptions.json"
)


# ============================================================
# CONFIGURATION
# ============================================================

VAPID_PUBLIC_KEY = (
    os.getenv(
        "VAPID_PUBLIC_KEY",
        "",
    ).strip()
)

VAPID_PRIVATE_KEY = (
    os.getenv(
        "VAPID_PRIVATE_KEY",
        "",
    ).strip()
)

VAPID_SUBJECT = (
    os.getenv(
        "VAPID_SUBJECT",
        "",
    ).strip()
)


# ============================================================
# MODELS
# ============================================================

class PushKeys(BaseModel):

    p256dh: str = Field(
        ...,
        min_length=1,
    )

    auth: str = Field(
        ...,
        min_length=1,
    )


class PushSubscriptionRequest(BaseModel):

    endpoint: str = Field(
        ...,
        min_length=1,
    )

    expirationTime: int | None = None

    keys: PushKeys


class PushUnsubscribeRequest(BaseModel):

    endpoint: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# STORAGE HELPERS
# ============================================================

def load_subscriptions() -> list[dict[str, Any]]:

    if not SUBSCRIPTIONS_FILE.exists():
        return []

    try:

        with SUBSCRIPTIONS_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

        if not isinstance(data, list):
            return []

        valid: list[dict[str, Any]] = []

        for item in data:

            if (
                isinstance(item, dict)
                and isinstance(
                    item.get("endpoint"),
                    str,
                )
                and isinstance(
                    item.get("keys"),
                    dict,
                )
            ):

                valid.append(item)

        return valid

    except Exception as error:

        print(
            "KANCHHI Push subscription load error:",
            repr(error),
        )

        return []


def save_subscriptions(
    subscriptions: list[dict[str, Any]],
) -> None:

    temp_file = (
        DATA_DIR
        / "push_subscriptions.tmp"
    )

    try:

        with temp_file.open(
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                subscriptions[-500:],
                file,
                ensure_ascii=False,
                indent=2,
            )

        temp_file.replace(
            SUBSCRIPTIONS_FILE
        )

    except Exception:

        try:

            if temp_file.exists():
                temp_file.unlink()

        except Exception:
            pass

        raise


# ============================================================
# CONFIG HELPERS
# ============================================================

def push_configured() -> bool:

    return bool(
        VAPID_PUBLIC_KEY
        and VAPID_PRIVATE_KEY
        and VAPID_SUBJECT
    )


def valid_vapid_subject() -> bool:

    return (
        VAPID_SUBJECT.startswith(
            "mailto:"
        )
        and len(
            VAPID_SUBJECT
        ) > len("mailto:")
    )


def normalize_subscription(
    subscription: dict[str, Any],
) -> dict[str, Any] | None:

    endpoint = subscription.get(
        "endpoint"
    )

    expiration_time = subscription.get(
        "expirationTime"
    )

    keys = subscription.get(
        "keys"
    )

    if not isinstance(
        endpoint,
        str,
    ):
        return None

    if not isinstance(
        keys,
        dict,
    ):
        return None

    p256dh = keys.get(
        "p256dh"
    )

    auth = keys.get(
        "auth"
    )

    if not isinstance(
        p256dh,
        str,
    ):
        return None

    if not isinstance(
        auth,
        str,
    ):
        return None

    return {
        "endpoint":
            endpoint,

        "expirationTime":
            expiration_time,

        "keys": {
            "p256dh":
                p256dh,

            "auth":
                auth,
        },
    }


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
def push_health():

    subscriptions = (
        load_subscriptions()
    )

    configured = (
        push_configured()
        and valid_vapid_subject()
    )

    return {
        "service":
            "KANCHHI Web Push",

        "status":
            "configured"
            if configured
            else "unavailable",

        "public_key":
            bool(VAPID_PUBLIC_KEY),

        "private_key":
            bool(VAPID_PRIVATE_KEY),

        "subject":
            bool(VAPID_SUBJECT),

        "subject_is_mailto":
            valid_vapid_subject(),

        "subscription_count":
            len(subscriptions),
    }


# ============================================================
# PUBLIC CONFIG
# ============================================================

@router.get("/config")
def push_config():

    if not VAPID_PUBLIC_KEY:

        return {
            "success":
                False,

            "publicKey":
                "",

            "error":
                "VAPID public key is not configured.",
        }

    return {
        "success":
            True,

        "publicKey":
            VAPID_PUBLIC_KEY,
    }


# ============================================================
# SUBSCRIBE
# ============================================================

@router.post("/subscribe")
def subscribe(
    request: PushSubscriptionRequest,
):

    if not push_configured():

        raise HTTPException(
            status_code=503,
            detail=(
                "VAPID configuration is incomplete. "
                "Check backend/.env."
            ),
        )

    if not valid_vapid_subject():

        raise HTTPException(
            status_code=503,
            detail=(
                "VAPID_SUBJECT must be a mailto: "
                "address, for example "
                "mailto:you@example.com."
            ),
        )

    subscription = (
        request.model_dump()
    )

    subscriptions = load_subscriptions()

    existing_index = None

    for index, item in enumerate(
        subscriptions
    ):

        if (
            item.get("endpoint")
            == request.endpoint
        ):

            existing_index = index
            break

    if existing_index is None:

        subscriptions.append(
            subscription
        )

    else:

        subscriptions[
            existing_index
        ] = subscription

    save_subscriptions(
        subscriptions
    )

    return {
        "success":
            True,

        "message":
            "Push subscription registered.",

        "count":
            len(subscriptions),
    }


# ============================================================
# UNSUBSCRIBE
# ============================================================

@router.post("/unsubscribe")
def unsubscribe(
    request:
        PushUnsubscribeRequest,
):

    subscriptions = load_subscriptions()

    filtered = [
        item
        for item in subscriptions
        if item.get("endpoint")
        != request.endpoint
    ]

    save_subscriptions(
        filtered
    )

    return {
        "success":
            True,

        "removed":
            len(subscriptions)
            - len(filtered),

        "count":
            len(filtered),
    }


# ============================================================
# SEND ONE PUSH
# ============================================================

def send_push(
    subscription: dict[str, Any],
    payload: str,
) -> tuple[str, int | None]:

    try:

        result = webpush(
            subscription_info=subscription,

            data=payload,

            vapid_private_key=
                VAPID_PRIVATE_KEY,

            vapid_claims={
                "sub":
                    VAPID_SUBJECT,
            },
        )

        status_code = getattr(
            result,
            "status_code",
            None,
        )

        return (
            "sent",
            status_code,
        )

    except WebPushException as error:

        response = getattr(
            error,
            "response",
            None,
        )

        status_code = getattr(
            response,
            "status_code",
            None,
        )

        print(
            "KANCHHI Web Push delivery error:",
            repr(error),
        )

        if status_code is not None:

            print(
                "KANCHHI Web Push HTTP status:",
                status_code,
            )

        return (
            "failed",
            status_code,
        )

    except Exception as error:

        print(
            "KANCHHI Web Push unexpected error:",
            repr(error),
        )

        return (
            "failed",
            None,
        )


# ============================================================
# TEST PUSH
# ============================================================

@router.post("/test")
def test_push():

    if not push_configured():

        raise HTTPException(
            status_code=503,
            detail=(
                "VAPID is not fully configured. "
                "Check VAPID_PUBLIC_KEY, "
                "VAPID_PRIVATE_KEY and "
                "VAPID_SUBJECT in backend/.env."
            ),
        )

    if not valid_vapid_subject():

        raise HTTPException(
            status_code=503,
            detail=(
                "VAPID_SUBJECT must start with "
                "mailto:, for example "
                "mailto:you@example.com."
            ),
        )

    subscriptions = load_subscriptions()

    if not subscriptions:

        raise HTTPException(
            status_code=404,
            detail=(
                "No browser push subscription "
                "is registered."
            ),
        )

    payload = json.dumps(
        {
            "title":
                "KANCHHI",

            "body":
                "KANCHHI push notification test received.",

            "url":
                "/",

            "tag":
                "kanchhi-test",
        }
    )

    valid_subscriptions: list[
        dict[str, Any]
    ] = []

    sent = 0
    failed = 0
    expired = 0

    for subscription in subscriptions:

        normalized = normalize_subscription(
                subscription
            )

        if normalized is None:

            failed += 1
            continue

        status, http_status = send_push(
            normalized,
            payload,
        )

        if status == "sent":

            sent += 1

            valid_subscriptions.append(
                normalized
            )

            continue

        failed += 1

        # 404 / 410 normally means the browser
        # subscription is no longer valid.
        if http_status in (
            404,
            410,
        ):

            expired += 1

            continue

        valid_subscriptions.append(
            normalized
        )

    save_subscriptions(
        valid_subscriptions
    )

    if sent == 0:

        raise HTTPException(
            status_code=502,
            detail=(
                "KANCHHI could not deliver the "
                "push notification. "
                f"Failed subscriptions: {failed}."
            ),
        )

    return {
        "success":
            True,

        "message":
            "KANCHHI test notification sent.",

        "sent":
            sent,

        "failed":
            failed,

        "expired":
            expired,

        "remaining":
            len(valid_subscriptions),
    }