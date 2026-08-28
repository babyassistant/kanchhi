from __future__ import annotations

import os

from dotenv import load_dotenv


# Load backend/.env
load_dotenv()


GOOGLE_API_KEY = os.getenv(
    "GOOGLE_API_KEY"
)

GOOGLE_CSE_ID = os.getenv(
    "GOOGLE_CSE_ID"
)