from fastapi import APIRouter
from typing import Any


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# DASHBOARD ENDPOINT
# ============================================================

@router.get("")
def get_dashboard():
    """
    Return the basic personalized dashboard configuration.

    The dashboard frontend uses the existing KANCHHI feature
    endpoints for live weather, news, notifications, and memory.

    This endpoint provides dashboard-level information only.
    """

    return {
        "service": "KANCHHI Dashboard",
        "status": "online",
        "sections": {
            "weather": True,
            "news": True,
            "notifications": True,
            "memory": True,
            "assistant": True,
            "recent_activity": True,
        },
    }