from fastapi import APIRouter
from pydantic import BaseModel, Field
from pathlib import Path
from datetime import datetime, timezone
import json
from typing import Any


router = APIRouter(
    prefix="/api/scheduled-tasks",
    tags=["Scheduled Tasks"],
)


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

STORAGE_FILE = (
    DATA_DIR / "scheduled_tasks.json"
)


# ============================================================
# STORAGE
# ============================================================

def load_tasks() -> list[dict[str, Any]]:

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
            "Scheduled task load error:",
            repr(error),
        )

        return []


def save_tasks(
    tasks: list[dict[str, Any]]
) -> None:

    with open(
        STORAGE_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            tasks,
            file,
            ensure_ascii=False,
            indent=2,
        )


def create_id() -> str:

    return (
        "task-"
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


# ============================================================
# MODELS
# ============================================================

class ScheduledTaskCreate(BaseModel):

    title: str

    description: str = ""

    task_type: str = "reminder"

    run_at: str

    enabled: bool = True

    payload: dict[str, Any] = Field(
        default_factory=dict
    )


class ScheduledTaskUpdate(BaseModel):

    title: str | None = None

    description: str | None = None

    task_type: str | None = None

    run_at: str | None = None

    enabled: bool | None = None

    payload: dict[str, Any] | None = None


# ============================================================
# LIST
# ============================================================

@router.get("")
def list_tasks():

    tasks = load_tasks()

    sorted_tasks = sorted(
        tasks,
        key=lambda item:
            str(
                item.get(
                    "run_at",
                    "",
                )
            ),
    )

    return {
        "success": True,
        "tasks": sorted_tasks,
    }


# ============================================================
# CREATE
# ============================================================

@router.post("")
def create_task(
    request: ScheduledTaskCreate,
):

    tasks = load_tasks()

    task = {
        "id": create_id(),
        "title": request.title,
        "description":
            request.description,
        "task_type":
            request.task_type,
        "run_at":
            request.run_at,
        "enabled":
            request.enabled,
        "payload":
            request.payload,
        "created_at":
            now_iso(),
        "last_run_at": None,
    }

    tasks.append(task)

    save_tasks(tasks)

    return {
        "success": True,
        "task": task,
    }


# ============================================================
# UPDATE
# ============================================================

@router.patch("/{task_id}")
def update_task(
    task_id: str,
    request: ScheduledTaskUpdate,
):

    tasks = load_tasks()

    for task in tasks:

        if (
            task.get("id")
            != task_id
        ):
            continue

        updates = request.model_dump(
            exclude_unset=True
        )

        task.update(updates)

        save_tasks(tasks)

        return {
            "success": True,
            "task": task,
        }

    return {
        "success": False,
        "error": "Task not found.",
    }


# ============================================================
# RUN
# ============================================================

@router.post("/{task_id}/run")
def run_task(
    task_id: str,
):

    tasks = load_tasks()

    for task in tasks:

        if (
            task.get("id")
            != task_id
        ):
            continue

        task["last_run_at"] = (
            now_iso()
        )

        save_tasks(tasks)

        return {
            "success": True,
            "executed": True,
            "task": task,
            "message":
                "Task marked as executed.",
        }

    return {
        "success": False,
        "error": "Task not found.",
    }


# ============================================================
# DELETE
# ============================================================

@router.delete("/{task_id}")
def delete_task(
    task_id: str,
):

    tasks = load_tasks()

    filtered = [
        task
        for task in tasks
        if task.get("id")
        != task_id
    ]

    save_tasks(filtered)

    return {
        "success": True,
        "deleted":
            len(tasks)
            - len(filtered),
    }