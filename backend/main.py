from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# CORE
# ============================================================

from search import router as search_router
from weather import router as weather_router
from news import router as news_router
from code import router as code_router


# ============================================================
# AI
# ============================================================

from ai import router as ai_router
from ai_weather import router as ai_weather_router
from ai_news import router as ai_news_router
from ai_search import router as ai_search_router
from ai_code import router as ai_code_router


# ============================================================
# USER SYSTEMS
# ============================================================

from notifications import router as notifications_router
from preferences import router as preferences_router
from memory import router as memory_router


# ============================================================
# SYSTEM MONITORING
# ============================================================

from system_monitoring import (
    router as system_monitoring_router,
)


# ============================================================
# PHASE 5 — INTELLIGENCE
# ============================================================

from intelligence import (
    router as intelligence_router,
)


# ============================================================
# PHASE 6
# ============================================================

from smart_notifications import (
    router as smart_notifications_router,
)

from scheduled_tasks import (
    router as scheduled_tasks_router,
)

from watchlists import (
    router as watchlists_router,
)

from smart_news import (
    router as smart_news_router,
)


# ============================================================
# PHASE 7
#
# Optional because some project versions may not contain
# backend/unified_search.py.
# ============================================================

try:
    from unified_search import (
        router as unified_search_router,
    )
except ImportError:
    unified_search_router = None


# ============================================================
# PHASE 12 — PUSH NOTIFICATIONS
# ============================================================

from push_notifications import (
    router as push_notifications_router,
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="KANCHHI Backend",
    description="Backend API for KANCHHI Smart Information Hub",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# CORE ROUTERS
# ============================================================

app.include_router(search_router)
app.include_router(weather_router)
app.include_router(news_router)
app.include_router(code_router)


# ============================================================
# AI ROUTERS
# ============================================================

app.include_router(ai_router)
app.include_router(ai_weather_router)
app.include_router(ai_news_router)
app.include_router(ai_search_router)

# IMPORTANT:
# ai_code.py contains:
#
# /api/ai/code
# /api/ai/code/review
# /api/ai/code/project
# /api/ai/code/documentation
# /api/ai/code/health
#
# Register it ONCE.
app.include_router(ai_code_router)


# ============================================================
# USER ROUTERS
# ============================================================

app.include_router(notifications_router)
app.include_router(preferences_router)
app.include_router(memory_router)


# ============================================================
# SYSTEM MONITORING
# ============================================================

app.include_router(
    system_monitoring_router
)


# ============================================================
# PHASE 5 — INTELLIGENCE
# ============================================================

app.include_router(
    intelligence_router
)


# ============================================================
# PHASE 6
# ============================================================

app.include_router(
    smart_notifications_router
)

app.include_router(
    scheduled_tasks_router
)

app.include_router(
    watchlists_router
)

app.include_router(
    smart_news_router
)


# ============================================================
# PHASE 7
# ============================================================

if unified_search_router is not None:
    app.include_router(
        unified_search_router
    )


# ============================================================
# PHASE 12 — PUSH NOTIFICATIONS
# ============================================================

app.include_router(
    push_notifications_router
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "service": "KANCHHI",
        "status": "online",
        "message": "KANCHHI backend is running.",
        "phase": "Phase 12",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():

    return {
        "service": "KANCHHI API",
        "status": "healthy",
    }