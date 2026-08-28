from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai import generate_ai_response


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/ai/code",
    tags=["AI Code Intelligence"],
)


# ============================================================
# LIMITS
# ============================================================

MAX_FILE_CONTENT = 20000
MAX_PROJECT_FILES = 25
MAX_PROJECT_CONTEXT = 90000


# ============================================================
# MODELS
# ============================================================

class ProjectFile(BaseModel):

    path: str = Field(
        ...,
        min_length=1,
        max_length=500,
    )

    content: str = Field(
        default="",
    )


class CodeReviewRequest(BaseModel):

    filename: str = Field(
        default="example.tsx",
        max_length=500,
    )

    language: str = Field(
        default="TypeScript / TSX",
        max_length=100,
    )

    code: str = Field(
        ...,
        min_length=1,
        max_length=50000,
    )

    project_files: Optional[
        List[ProjectFile]
    ] = None


class ProjectAssistantRequest(BaseModel):

    question: str = Field(
        ...,
        min_length=1,
        max_length=20000,
    )

    project_files: List[
        ProjectFile
    ] = Field(
        default_factory=list,
    )


class ProjectDocumentationRequest(BaseModel):

    project_name: str = Field(
        default="KANCHHI Project",
        max_length=200,
    )

    project_files: List[
        ProjectFile
    ] = Field(
        default_factory=list,
    )


# ============================================================
# FILE NORMALIZATION
# ============================================================

def normalize_project_files(
    project_files:
        Optional[
            List[ProjectFile]
        ],
) -> List[ProjectFile]:

    if not project_files:
        return []

    normalized: List[
        ProjectFile
    ] = []

    for file in project_files[
        :MAX_PROJECT_FILES
    ]:

        path = str(file.path).strip()

        if not path:
            continue

        content = file.content or ""

        if len(content) > MAX_FILE_CONTENT:

            content = (
                content[:MAX_FILE_CONTENT]
                + "\n\n"
                + "[FILE CONTENT TRUNCATED]"
            )

        normalized.append(
            ProjectFile(
                path=path[:500],
                content=content,
            )
        )

    return normalized


# ============================================================
# PROJECT CONTEXT
# ============================================================

def build_project_context(
    project_files:
        List[ProjectFile],
) -> str:

    if not project_files:

        return (
            "No project files were supplied."
        )

    sections: List[str] = []

    total_length = 0

    for file in project_files:

        section = (
            f"FILE: {file.path}\n"
            f"{file.content}\n"
            f"{'=' * 70}\n"
        )

        if (
            total_length
            + len(section)
            > MAX_PROJECT_CONTEXT
        ):

            sections.append(
                "\n"
                "[PROJECT CONTEXT LIMIT REACHED]"
            )

            break

        sections.append(
            section
        )

        total_length += len(
            section
        )

    return "\n".join(
        sections
    )


# ============================================================
# AI HELPER
# ============================================================

def run_code_ai(
    prompt: str,
) -> Dict[str, Any]:

    try:

        result = generate_ai_response(
                prompt,
                "flash",
            )

        return result

    except Exception as error:

        print(
            "KANCHHI Code Intelligence error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "KANCHHI Code Intelligence failed. "
                f"Gemini error: {error}"
            ),
        )


# ============================================================
# REVIEW
# ============================================================

@router.post("/review")
def review_code(
    request:
        CodeReviewRequest,
):

    files = normalize_project_files(
            request.project_files
        )

    context = build_project_context(
            files
        )

    prompt = f"""
You are KANCHHI Code Intelligence.

Perform a professional code review of the supplied code.

TARGET FILE:
{request.filename}

LANGUAGE:
{request.language}

CODE:
{request.code}

PROJECT CONTEXT:
{context}

Analyze:

1. Syntax
2. Runtime behavior
3. Logic
4. Type issues
5. Security
6. Performance
7. Error handling
8. Maintainability
9. Architecture
10. Integration risks

Use exactly this structure:

# KANCHHI Code Review

## Overall Assessment

## Critical Problems

## Bugs

## Type / Syntax Problems

## Security

## Performance

## Maintainability

## Recommended Changes

## Corrected Code

Rules:

- Do not invent problems.
- Do not claim a library/API exists unless supported by the supplied code.
- Do not invent project files.
- Do not invent runtime behavior without evidence.
- Identify uncertainty explicitly.
- For sections with no issue, say:
  No significant issues found.
- In Corrected Code, provide complete replaceable code where practical.
"""

    return run_code_ai(
        prompt
    )


# ============================================================
# PROJECT ASSISTANT
# ============================================================

@router.post("/project")
def project_assistant(
    request:
        ProjectAssistantRequest,
):

    files = normalize_project_files(
            request.project_files
        )

    context = build_project_context(
            files
        )

    prompt = f"""
You are KANCHHI Project-Aware Code Assistant.

DEVELOPER QUESTION:
{request.question}

PROJECT FILES:
{context}

Rules:

1. Use supplied files as the source of truth.
2. Do not invent files.
3. Do not invent functions.
4. Do not invent APIs.
5. Mention exact filenames when relevant.
6. Explain the reasoning.
7. Give the exact fix where possible.
8. Distinguish observed facts from assumptions.
9. If information is insufficient, say so.
10. Prefer complete replaceable code when a fix requires code changes.

Use exactly:

# KANCHHI Project Assistant

## Answer

## Relevant Files

## Reasoning

## Root Cause

## Recommended Fix

## Complete Replacement Code

## Verification Steps
"""

    return run_code_ai(
        prompt
    )


# ============================================================
# DOCUMENTATION
# ============================================================

@router.post("/documentation")
def project_documentation(
    request:
        ProjectDocumentationRequest,
):

    files = normalize_project_files(
            request.project_files
        )

    if not files:

        return {
            "reply": (
                "No project files were supplied. "
                "Add project files before generating documentation."
            ),
            "model":
                None,
            "model_key":
                None,
            "fallback":
                False,
        }

    context = build_project_context(
            files
        )

    project_name = request.project_name.strip()

    prompt = f"""
You are KANCHHI Project Documentation Intelligence.

PROJECT:
{project_name}

PROJECT FILES:
{context}

Generate documentation using ONLY the supplied project files.

Create:

# {project_name}

## Overview

## Architecture

## Frontend

## Backend

## API Endpoints

## Core Features

## AI Integration

## Memory

## Offline / Cache

## Analytics

## System Monitoring

## Code Intelligence

## Push Notifications

## Voice

## Authentication / Security

## Project Structure

## Development Notes

## Known Limitations

Rules:

- Do not invent information.
- Do not invent endpoints.
- Do not invent files.
- Do not claim an integration exists unless supported by the supplied files.
- For unavailable information, write:
  Information unavailable from supplied project files.
"""

    return run_code_ai(
        prompt
    )


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
def code_intelligence_health():

    return {
        "service":
            "KANCHHI Code Intelligence",

        "status":
            "online",

        "base_path":
            "/api/ai/code",

        "features": [
            "code_review",
            "project_assistant",
            "project_documentation",
        ],
    }