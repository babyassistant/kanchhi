from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pathlib import Path
import sqlite3
from datetime import datetime, timezone


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/memory",
    tags=["Memory"],
)


# ============================================================
# DATABASE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_PATH = BASE_DIR / "kanchhi_memory.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def initialize_database():

    connection = get_connection()

    try:

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                content TEXT NOT NULL,

                category TEXT NOT NULL DEFAULT 'general',

                created_at TEXT NOT NULL,

                updated_at TEXT NOT NULL
            )
            """
        )

        connection.commit()

    finally:

        connection.close()


# Initialize when this module loads
initialize_database()


# ============================================================
# REQUEST MODELS
# ============================================================

class MemoryCreate(BaseModel):

    content: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )

    category: str = Field(
        default="general",
        min_length=1,
        max_length=100,
    )


class MemoryUpdate(BaseModel):

    content: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )

    category: str = Field(
        default="general",
        min_length=1,
        max_length=100,
    )


# ============================================================
# HELPERS
# ============================================================

def row_to_dict(row):

    if row is None:
        return None

    return {
        "id": row["id"],
        "content": row["content"],
        "category": row["category"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def current_timestamp():

    return datetime.now(
        timezone.utc
    ).isoformat()


# ============================================================
# HEALTH CHECK
# ============================================================

@router.get("")
def memory_status():

    connection = get_connection()

    try:

        result = connection.execute(
            "SELECT COUNT(*) AS count FROM memories"
        ).fetchone()

        count = result["count"]

    finally:

        connection.close()

    return {
        "status": "online",
        "service": "KANCHHI Memory",
        "memory_count": count,
        "database": "SQLite",
    }


# ============================================================
# GET ALL MEMORIES
# ============================================================

@router.get("/list")
def get_memories():

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT
                id,
                content,
                category,
                created_at,
                updated_at
            FROM memories
            ORDER BY updated_at DESC
            """
        ).fetchall()

    finally:

        connection.close()

    return {
        "memories": [
            row_to_dict(row)
            for row in rows
        ],
        "count": len(rows),
    }


# ============================================================
# CREATE MEMORY
# ============================================================

@router.post("")
def create_memory(
    request: MemoryCreate,
):

    content = request.content.strip()

    category = request.category.strip()

    if not content:

        raise HTTPException(
            status_code=400,
            detail="Memory content cannot be empty.",
        )

    if not category:

        category = "general"

    now = current_timestamp()

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO memories (
                content,
                category,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                content,
                category,
                now,
                now,
            ),
        )

        connection.commit()

        memory_id = cursor.lastrowid

        row = connection.execute(
            """
            SELECT
                id,
                content,
                category,
                created_at,
                updated_at
            FROM memories
            WHERE id = ?
            """,
            (memory_id,),
        ).fetchone()

    finally:

        connection.close()

    return {
        "message": "Memory saved successfully.",
        "memory": row_to_dict(row),
    }


# ============================================================
# UPDATE MEMORY
# ============================================================

@router.put("/{memory_id}")
def update_memory(
    memory_id: int,
    request: MemoryUpdate,
):

    content = request.content.strip()

    category = request.category.strip()

    if not content:

        raise HTTPException(
            status_code=400,
            detail="Memory content cannot be empty.",
        )

    if not category:

        category = "general"

    now = current_timestamp()

    connection = get_connection()

    try:

        existing = connection.execute(
            """
            SELECT id
            FROM memories
            WHERE id = ?
            """,
            (memory_id,),
        ).fetchone()

        if not existing:

            raise HTTPException(
                status_code=404,
                detail="Memory not found.",
            )

        connection.execute(
            """
            UPDATE memories
            SET
                content = ?,
                category = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                content,
                category,
                now,
                memory_id,
            ),
        )

        connection.commit()

        row = connection.execute(
            """
            SELECT
                id,
                content,
                category,
                created_at,
                updated_at
            FROM memories
            WHERE id = ?
            """,
            (memory_id,),
        ).fetchone()

    finally:

        connection.close()

    return {
        "message": "Memory updated successfully.",
        "memory": row_to_dict(row),
    }


# ============================================================
# DELETE MEMORY
# ============================================================

@router.delete("/{memory_id}")
def delete_memory(
    memory_id: int,
):

    connection = get_connection()

    try:

        existing = connection.execute(
            """
            SELECT id
            FROM memories
            WHERE id = ?
            """,
            (memory_id,),
        ).fetchone()

        if not existing:

            raise HTTPException(
                status_code=404,
                detail="Memory not found.",
            )

        connection.execute(
            """
            DELETE FROM memories
            WHERE id = ?
            """,
            (memory_id,),
        )

        connection.commit()

    finally:

        connection.close()

    return {
        "message": "Memory deleted successfully.",
        "id": memory_id,
    }


# ============================================================
# CLEAR ALL MEMORIES
# ============================================================

@router.delete("")
def clear_memories():

    connection = get_connection()

    try:

        result = connection.execute(
            "SELECT COUNT(*) AS count FROM memories"
        ).fetchone()

        count = result["count"]

        connection.execute(
            "DELETE FROM memories"
        )

        connection.commit()

    finally:

        connection.close()

    return {
        "message": "All memories cleared.",
        "deleted": count,
    }


# ============================================================
# MEMORY CONTEXT
# ============================================================

@router.get("/context")
def get_memory_context():

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT
                id,
                content,
                category,
                created_at,
                updated_at
            FROM memories
            ORDER BY updated_at DESC
            LIMIT 50
            """
        ).fetchall()

    finally:

        connection.close()

    memories = [
        row_to_dict(row)
        for row in rows
    ]

    return {
        "memories": memories,
        "count": len(memories),
    }