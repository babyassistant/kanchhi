from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import json

from ai import generate_ai_response


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/ai/weather",
    tags=["AI Weather"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class WeatherAIRequest(BaseModel):

    weather: dict = Field(
        ...,
        description="Weather data from KANCHHI weather API",
    )


# ============================================================
# WEATHER INTERPRETATION
# ============================================================

@router.post("")
def interpret_weather(
    request: WeatherAIRequest
):

    # --------------------------------------------------------
    # Convert Python dictionary into proper JSON.
    # This makes the Gemini prompt much easier to interpret.
    # --------------------------------------------------------

    weather_json = json.dumps(
        request.weather,
        ensure_ascii=False,
        indent=2,
    )


    # --------------------------------------------------------
    # PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are KANCHHI Weather Intelligence.

Interpret the following REAL weather data.

WEATHER DATA:

{weather_json}

IMPORTANT RULES:

1. Use ONLY the supplied weather data.
2. Never invent temperatures.
3. Never invent rainfall.
4. Never invent precipitation.
5. Never invent locations.
6. Never invent weather alerts.
7. Clearly distinguish current conditions
   from forecast conditions.
8. Give useful practical advice.
9. If precipitation or rainfall data is unavailable,
   explicitly say it is unavailable.
10. Do not claim that the user needs an umbrella
    unless the supplied data supports that conclusion.
11. Speak naturally as KANCHHI.
12. Keep the response concise.
13. Use the supplied location information when available.
14. Use the supplied current weather values exactly.
15. Do not create facts that are not present in the data.

Structure your response exactly as:

Current conditions:
...

What it means:
...

Practical advice:
...

Weather concern:
...

If the supplied data does not contain enough
information for one section, say:

"Information unavailable from the supplied weather data."
"""


    # --------------------------------------------------------
    # GEMINI
    # --------------------------------------------------------

    try:

        result = generate_ai_response(
            prompt,
            "flash",
        )


        return {
            "interpretation": result["reply"],

            "model": result["model"],

            "fallback": result.get(
                "fallback",
                False,
            ),
        }


    except Exception as error:

        print(
            "KANCHHI AI Weather error:",
            repr(error),
        )


        raise HTTPException(
            status_code=500,

            detail=(
                "KANCHHI AI Weather could not "
                "interpret the weather. "
                f"Gemini error: {str(error)}"
            ),
        )