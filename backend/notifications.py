from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime, timezone
import sqlite3
import os


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


# ============================================================
# DATABASE
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_PATH = os.path.join(
    BASE_DIR,
    "kanchhi_notifications.db",
)


# ============================================================
# TYPES
# ============================================================

NotificationType = Literal[
    "weather",
    "news",
    "system",
    "ai",
]


NotificationPriority = Literal[
    "low",
    "normal",
    "high",
    "critical",
]


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    connection = sqlite3.connect(
        DATABASE_PATH,
        timeout=10,
    )

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def init_database():

    connection = get_connection()

    try:

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                type TEXT NOT NULL,

                title TEXT NOT NULL,

                message TEXT NOT NULL,

                priority TEXT NOT NULL DEFAULT 'normal',

                read INTEGER NOT NULL DEFAULT 0,

                created_at TEXT NOT NULL
            )
            """
        )

        connection.commit()

    finally:

        connection.close()


init_database()


# ============================================================
# REQUEST MODELS
# ============================================================

class NotificationCreate(BaseModel):

    type: NotificationType = "system"

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )

    priority: NotificationPriority = "normal"


# ============================================================
# RESPONSE HELPERS
# ============================================================

def row_to_notification(row):

    if row is None:
        return None

    return {
        "id": row["id"],
        "type": row["type"],
        "title": row["title"],
        "message": row["message"],
        "priority": row["priority"],
        "read": bool(row["read"]),
        "created_at": row["created_at"],
    }


# ============================================================
# CREATE NOTIFICATION
# ============================================================

def create_notification(
    notification_type: str,
    title: str,
    message: str,
    priority: str = "normal",
):

    connection = get_connection()

    try:

        created_at = datetime.now(
            timezone.utc
        ).isoformat()

        cursor = connection.execute(
            """
            INSERT INTO notifications (
                type,
                title,
                message,
                priority,
                read,
                created_at
            )
            VALUES (?, ?, ?, ?, 0, ?)
            """,
            (
                notification_type,
                title,
                message,
                priority,
                created_at,
            ),
        )

        connection.commit()

        notification_id = cursor.lastrowid

        row = connection.execute(
            """
            SELECT *
            FROM notifications
            WHERE id = ?
            """,
            (notification_id,),
        ).fetchone()

        return row_to_notification(row)

    finally:

        connection.close()


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@router.get("")
def get_notifications(
    unread_only: bool = Query(
        False,
        description="Return only unread notifications",
    ),

    limit: int = Query(
        50,
        ge=1,
        le=100,
    ),
):

    connection = get_connection()

    try:

        if unread_only:

            rows = connection.execute(
                """
                SELECT *
                FROM notifications
                WHERE read = 0
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        else:

            rows = connection.execute(
                """
                SELECT *
                FROM notifications
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return {
            "notifications": [
                row_to_notification(row)
                for row in rows
            ]
        }

    finally:

        connection.close()


# ============================================================
# UNREAD COUNT
# ============================================================

@router.get("/unread-count")
def get_unread_count():

    connection = get_connection()

    try:

        row = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM notifications
            WHERE read = 0
            """
        ).fetchone()

        return {
            "count": row["count"]
        }

    finally:

        connection.close()


# ============================================================
# CREATE NOTIFICATION API
# ============================================================

@router.post("")
def create_notification_api(
    request: NotificationCreate,
):

    notification = create_notification(
        notification_type=request.type,
        title=request.title,
        message=request.message,
        priority=request.priority,
    )

    return {
        "notification": notification
    }


# ============================================================
# MARK ONE AS READ
# ============================================================

@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
):

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            UPDATE notifications
            SET read = 1
            WHERE id = ?
            """,
            (notification_id,),
        )

        connection.commit()

        if cursor.rowcount == 0:

            raise HTTPException(
                status_code=404,
                detail="Notification not found.",
            )

        return {
            "success": True,
            "id": notification_id,
            "read": True,
        }

    finally:

        connection.close()


# ============================================================
# MARK ALL AS READ
# ============================================================

@router.patch("/read-all")
def mark_all_as_read():

    connection = get_connection()

    try:

        connection.execute(
            """
            UPDATE notifications
            SET read = 1
            WHERE read = 0
            """
        )

        connection.commit()

        return {
            "success": True,
            "message": "All notifications marked as read.",
        }

    finally:

        connection.close()


# ============================================================
# DELETE ONE
# ============================================================

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
):

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            DELETE FROM notifications
            WHERE id = ?
            """,
            (notification_id,),
        )

        connection.commit()

        if cursor.rowcount == 0:

            raise HTTPException(
                status_code=404,
                detail="Notification not found.",
            )

        return {
            "success": True,
            "id": notification_id,
        }

    finally:

        connection.close()


# ============================================================
# CLEAR ALL
# ============================================================

@router.delete("")
def clear_notifications():

    connection = get_connection()

    try:

        connection.execute(
            """
            DELETE FROM notifications
            """
        )

        connection.commit()

        return {
            "success": True,
            "message": "All notifications cleared.",
        }

    finally:

        connection.close()


# ============================================================
# TEST NOTIFICATION
# ============================================================

@router.post("/test")
def create_test_notification():

    notification = create_notification(
        notification_type="system",
        title="KANCHHI notification test",
        message=(
            "Notifications are working correctly."
        ),
        priority="normal",
    )

    return {
        "success": True,
        "notification": notification,
    }


# ============================================================
# WEATHER NOTIFICATION HELPER
# ============================================================

def create_weather_notification(
    title: str,
    message: str,
    priority: str = "normal",
):

    return create_notification(
        notification_type="weather",
        title=title,
        message=message,
        priority=priority,
    )


# ============================================================
# NEWS NOTIFICATION HELPER
# ============================================================

def create_news_notification(
    title: str,
    message: str,
    priority: str = "normal",
):

    return create_notification(
        notification_type="news",
        title=title,
        message=message,
        priority=priority,
    )


# ============================================================
# AI NOTIFICATION HELPER
# ============================================================

def create_ai_notification(
    title: str,
    message: str,
    priority: str = "normal",
):

    return create_notification(
        notification_type="ai",
        title=title,
        message=message,
        priority=priority,
    )