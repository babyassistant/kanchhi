from __future__ import annotations

import math
import time
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import APIRouter, Query


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/weather",
    tags=["Weather"],
)


# ============================================================
# CONSTANTS
# ============================================================

OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
)

NOMINATIM_REVERSE_URL = (
    "https://nominatim.openstreetmap.org/reverse"
)

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

MAX_NEARBY_RADIUS_KM = 10.0
MAX_NEARBY_RESULTS = 6

CACHE_TTL_SECONDS = 10 * 60


HEADERS = {
    "User-Agent": (
        "KANCHHI Smart Information Hub "
        "(local development)"
    ),
    "Accept": "application/json",
}


# ============================================================
# MEMORY CACHE
# ============================================================

_weather_cache: Dict[
    Tuple[float, float],
    Dict[str, Any],
] = {}


def cache_key(
    latitude: float,
    longitude: float,
) -> Tuple[float, float]:

    return (
        round(latitude, 4),
        round(longitude, 4),
    )


def save_weather_cache(
    latitude: float,
    longitude: float,
    data: Dict[str, Any],
) -> None:

    _weather_cache[
        cache_key(
            latitude,
            longitude,
        )
    ] = {
        "saved_at": time.time(),
        "data": data,
    }


def get_weather_cache(
    latitude: float,
    longitude: float,
) -> Optional[Dict[str, Any]]:

    cached = _weather_cache.get(
        cache_key(
            latitude,
            longitude,
        )
    )

    if not cached:
        return None

    return cached["data"]


def get_weather_cache_age(
    latitude: float,
    longitude: float,
) -> Optional[float]:

    cached = _weather_cache.get(
        cache_key(
            latitude,
            longitude,
        )
    )

    if not cached:
        return None

    return max(
        0,
        time.time() - cached["saved_at"],
    )


# ============================================================
# WEATHER CODES
# ============================================================

WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",

    45: "Fog",
    48: "Depositing rime fog",

    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",

    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",

    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",

    66: "Light freezing rain",
    67: "Heavy freezing rain",

    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",

    77: "Snow grains",

    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",

    85: "Slight snow showers",
    86: "Heavy snow showers",

    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def safe_float(
    value: Any,
    default: Optional[float] = None,
) -> Optional[float]:

    try:

        if value is None:
            return default

        return float(value)

    except Exception:

        return default


def safe_int(
    value: Any,
    default: Optional[int] = None,
) -> Optional[int]:

    try:

        if value is None:
            return default

        return int(value)

    except Exception:

        return default


def weather_description(
    code: Any,
) -> str:

    number = safe_int(code)

    if number is None:
        return "Unknown"

    return WEATHER_CODES.get(
        number,
        "Unknown",
    )


def weather_icon(
    code: Any,
) -> str:

    number = safe_int(code)

    if number is None:
        return "☁️"

    if number == 0:
        return "☀️"

    if number in [1, 2]:
        return "🌤️"

    if number == 3:
        return "☁️"

    if number in [45, 48]:
        return "🌫️"

    if number in [
        51, 53, 55,
        56, 57,
        61, 63, 65,
        66, 67,
        80, 81, 82,
    ]:
        return "🌧️"

    if number in [
        71, 73, 75,
        77, 85, 86,
    ]:
        return "🌨️"

    if number in [95, 96, 99]:
        return "⛈️"

    return "☁️"


# ============================================================
# DISTANCE
# ============================================================

def haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:

    radius = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    delta_phi = math.radians(
        lat2 - lat1
    )

    delta_lambda = math.radians(
        lon2 - lon1
    )

    a = (
        math.sin(delta_phi / 2) ** 2
        +
        math.cos(phi1)
        * math.cos(phi2)
        * math.sin(delta_lambda / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a),
    )

    return radius * c


# ============================================================
# LOCATION
# ============================================================

def choose_best_local_name(
    address: Dict[str, Any],
) -> str:

    preferred = [
        "neighbourhood",
        "suburb",
        "village",
        "locality",
        "hamlet",
        "town",
        "city",
    ]

    for field in preferred:

        value = address.get(field)

        if value and str(value).strip():
            return str(value).strip()

    return (
        address.get("county")
        or address.get("state_district")
        or address.get("state")
        or "Current Location"
    )


def build_location_data(
    latitude: float,
    longitude: float,
) -> Dict[str, Any]:

    result = {
        "name": "Current Location",
        "local_name": "Current Location",
        "city": "",
        "district": "",
        "province": "",
        "country": "Nepal",
        "display_name": "",
        "address": {},
    }

    try:

        response = requests.get(
            NOMINATIM_REVERSE_URL,
            params={
                "lat": latitude,
                "lon": longitude,
                "format": "jsonv2",
                "addressdetails": 1,
                "namedetails": 1,
                "zoom": 18,
                "accept-language": "ne,en",
            },
            headers=HEADERS,
            timeout=8,
        )

        response.raise_for_status()

        data = response.json()

        address = data.get(
            "address",
            {},
        )

        local_name = (
            choose_best_local_name(
                address
            )
        )

        result.update({
            "name": local_name,
            "local_name": local_name,

            "city": (
                address.get("city")
                or address.get("town")
                or address.get("municipality")
                or ""
            ),

            "district": (
                address.get("county")
                or address.get("state_district")
                or ""
            ),

            "province": (
                address.get("state")
                or ""
            ),

            "country": (
                address.get("country")
                or "Nepal"
            ),

            "display_name": (
                data.get("display_name")
                or ""
            ),

            "address": address,
        })

    except Exception as error:

        print(
            "Reverse geocoding unavailable:",
            error,
        )

    return result


# ============================================================
# OPEN-METEO
# ============================================================

def fetch_weather(
    latitude: float,
    longitude: float,
) -> Dict[str, Any]:

    params = {

        "latitude": latitude,

        "longitude": longitude,

        "current": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "rain",
            "showers",
            "snowfall",
            "weather_code",
            "cloud_cover",
            "pressure_msl",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m",
            "visibility",
        ]),

        "daily": ",".join([
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset",
            "precipitation_sum",
            "precipitation_probability_max",
            "uv_index_max",
        ]),

        "timezone": "auto",

        "forecast_days": 7,
    }

    response = requests.get(
        OPEN_METEO_URL,
        params=params,
        headers=HEADERS,
        timeout=12,
    )

    response.raise_for_status()

    return response.json()


# ============================================================
# BUILD WEATHER RESPONSE
# ============================================================

def build_weather_response(
    latitude: float,
    longitude: float,
) -> Dict[str, Any]:

    location = build_location_data(
        latitude,
        longitude,
    )

    weather = fetch_weather(
        latitude,
        longitude,
    )

    current = weather.get(
        "current",
        {},
    )

    daily = weather.get(
        "daily",
        {},
    )

    current_code = safe_int(
        current.get("weather_code")
    )

    temperature = safe_float(
        current.get("temperature_2m")
    )

    feels_like = safe_float(
        current.get("apparent_temperature")
    )

    humidity = safe_float(
        current.get(
            "relative_humidity_2m"
        )
    )

    wind_speed = safe_float(
        current.get("wind_speed_10m")
    )

    wind_direction = safe_float(
        current.get(
            "wind_direction_10m"
        )
    )

    visibility_m = safe_float(
        current.get("visibility")
    )

    visibility_km = (
        round(
            visibility_m / 1000,
            1,
        )
        if visibility_m is not None
        else None
    )

    # --------------------------------------------------------
    # DAILY
    # --------------------------------------------------------

    forecast: List[Dict[str, Any]] = []

    dates = daily.get(
        "time",
        [],
    )

    max_temps = daily.get(
        "temperature_2m_max",
        [],
    )

    min_temps = daily.get(
        "temperature_2m_min",
        [],
    )

    daily_codes = daily.get(
        "weather_code",
        [],
    )

    precipitation_probability = daily.get(
        "precipitation_probability_max",
        [],
    )

    precipitation_sum = daily.get(
        "precipitation_sum",
        [],
    )

    daily_uv = daily.get(
        "uv_index_max",
        [],
    )

    sunrise = daily.get(
        "sunrise",
        [],
    )

    sunset = daily.get(
        "sunset",
        [],
    )

    for index, date in enumerate(
        dates
    ):

        code = (
            daily_codes[index]
            if index < len(daily_codes)
            else None
        )

        forecast.append({

            "date": date,

            "temperature_max": (
                max_temps[index]
                if index < len(max_temps)
                else None
            ),

            "temperature_min": (
                min_temps[index]
                if index < len(min_temps)
                else None
            ),

            "weather_code": code,

            "condition":
                weather_description(
                    code
                ),

            "icon":
                weather_icon(
                    code
                ),

            "precipitation_probability": (
                precipitation_probability[index]
                if index <
                len(
                    precipitation_probability
                )
                else None
            ),

            "precipitation_sum": (
                precipitation_sum[index]
                if index <
                len(
                    precipitation_sum
                )
                else None
            ),

            "uv_index": (
                daily_uv[index]
                if index < len(daily_uv)
                else None
            ),

            "sunrise": (
                sunrise[index]
                if index < len(sunrise)
                else None
            ),

            "sunset": (
                sunset[index]
                if index < len(sunset)
                else None
            ),
        })

    # --------------------------------------------------------
    # ALERTS
    # --------------------------------------------------------

    alerts: List[Dict[str, Any]] = []

    if current_code in [95, 96, 99]:

        alerts.append({
            "type": "thunderstorm",
            "title": "Thunderstorm Alert",
            "severity": "high",
            "message": (
                "Thunderstorm conditions are occurring "
                "in your area. Stay indoors and avoid "
                "exposed areas."
            ),
        })

    max_rain_probability = 0.0

    if precipitation_probability:

        values = [
            safe_float(
                value,
                0,
            )
            or 0
            for value in
            precipitation_probability
        ]

        max_rain_probability = max(
            values,
            default=0,
        )

    if max_rain_probability >= 70:

        alerts.append({
            "type": "rain",
            "title": "High Rain Probability",
            "severity": "medium",
            "message": (
                f"There is a "
                f"{round(max_rain_probability)}% "
                "chance of precipitation."
            ),
        })

    if (
        wind_speed is not None
        and wind_speed >= 50
    ):

        alerts.append({
            "type": "wind",
            "title": "Strong Wind Alert",
            "severity": "high",
            "message": (
                f"Current wind speed is "
                f"{round(wind_speed)} km/h."
            ),
        })

    if (
        temperature is not None
        and temperature >= 35
    ):

        alerts.append({
            "type": "heat",
            "title": "High Temperature",
            "severity": "medium",
            "message": (
                f"Current temperature is "
                f"{round(temperature, 1)}°C."
            ),
        })

    if (
        temperature is not None
        and temperature <= 5
    ):

        alerts.append({
            "type": "cold",
            "title": "Low Temperature",
            "severity": "medium",
            "message": (
                f"Current temperature is "
                f"{round(temperature, 1)}°C."
            ),
        })

    return {

        "success": True,

        "source": "live",

        "cached": False,

        "location": {
            **location,

            "latitude": latitude,

            "longitude": longitude,

            "coordinates": {
                "latitude": latitude,
                "longitude": longitude,
            },
        },

        "current": {

            "temperature":
                temperature,

            "feels_like":
                feels_like,

            "humidity":
                humidity,

            "wind_speed":
                wind_speed,

            "wind_direction":
                wind_direction,

            "wind_gusts":
                safe_float(
                    current.get(
                        "wind_gusts_10m"
                    )
                ),

            "uv_index":
                (
                    forecast[0]["uv_index"]
                    if forecast
                    else None
                ),

            "visibility":
                visibility_km,

            "pressure":
                safe_float(
                    current.get(
                        "pressure_msl"
                    )
                ),

            "cloud_cover":
                safe_float(
                    current.get(
                        "cloud_cover"
                    )
                ),

            "precipitation":
                safe_float(
                    current.get(
                        "precipitation"
                    )
                ),

            "rain":
                safe_float(
                    current.get(
                        "rain"
                    )
                ),

            "showers":
                safe_float(
                    current.get(
                        "showers"
                    )
                ),

            "snowfall":
                safe_float(
                    current.get(
                        "snowfall"
                    )
                ),

            "weather_code":
                current_code,

            "condition":
                weather_description(
                    current_code
                ),

            "icon":
                weather_icon(
                    current_code
                ),

            "is_day":
                current.get(
                    "is_day"
                ),
        },

        "sun": {

            "sunrise": (
                sunrise[0]
                if sunrise
                else None
            ),

            "sunset": (
                sunset[0]
                if sunset
                else None
            ),

            "tomorrow_sunrise": (
                sunrise[1]
                if len(sunrise) > 1
                else None
            ),

            "tomorrow_sunset": (
                sunset[1]
                if len(sunset) > 1
                else None
            ),
        },

        "forecast":
            forecast,

        "alerts":
            alerts,

        "timezone":
            weather.get(
                "timezone"
            ),

        "timezone_abbreviation":
            weather.get(
                "timezone_abbreviation"
            ),

        "last_updated":
            current.get(
                "time"
            ),
    }


# ============================================================
# WEATHER ENDPOINT
# ============================================================

@router.get("")
def get_weather(
    lat: float = Query(...),
    lon: float = Query(...),
):

    if not (
        -90 <= lat <= 90
        and
        -180 <= lon <= 180
    ):

        return {
            "success": False,
            "error": "Invalid coordinates.",
        }

    try:

        data = build_weather_response(
            lat,
            lon,
        )

        save_weather_cache(
            lat,
            lon,
            data,
        )

        return data

    except requests.RequestException as error:

        cached = get_weather_cache(
            lat,
            lon,
        )

        if cached:

            cached_copy = {
                **cached,
                "source": "cache",
                "cached": True,
                "cache_age_seconds":
                    get_weather_cache_age(
                        lat,
                        lon,
                    ),
            }

            print(
                "Weather live request failed; "
                "returning cached weather:",
                error,
            )

            return cached_copy

        print(
            "Weather provider unavailable:",
            error,
        )

        return {
            "success": False,
            "source": "unavailable",
            "cached": False,
            "error": (
                "Weather service is temporarily "
                "unavailable."
            ),
            "details": str(error),
        }

    except Exception as error:

        cached = get_weather_cache(
            lat,
            lon,
        )

        if cached:

            return {
                **cached,
                "source": "cache",
                "cached": True,
                "cache_age_seconds":
                    get_weather_cache_age(
                        lat,
                        lon,
                    ),
            }

        print(
            "Weather endpoint error:",
            error,
        )

        return {
            "success": False,
            "source": "unavailable",
            "cached": False,
            "error": (
                "Unable to load weather."
            ),
            "details": str(error),
        }


# ============================================================
# OSM NEARBY PLACES
# ============================================================

def fetch_nearby_osm_places(
    latitude: float,
    longitude: float,
    radius_meters: int = 10000,
) -> List[Dict[str, Any]]:

    query = f"""
    [out:json][timeout:15];

    (
      nwr["place"~"city|town|village|suburb|neighbourhood|hamlet|locality"]
      (around:{radius_meters},{latitude},{longitude});
    );

    out center tags;
    """

    for endpoint in OVERPASS_ENDPOINTS:

        try:

            response = requests.post(
                endpoint,
                data=query,
                headers={
                    **HEADERS,
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                },
                timeout=18,
            )

            response.raise_for_status()

            data = response.json()

            elements = data.get(
                "elements",
                [],
            )

            places: List[
                Dict[str, Any]
            ] = []

            seen = set()

            for element in elements:

                tags = element.get(
                    "tags",
                    {},
                )

                name = (
                    tags.get("name")
                    or tags.get("name:ne")
                    or tags.get("official_name")
                )

                if not name:
                    continue

                place_lat: Optional[
                    float
                ] = None

                place_lon: Optional[
                    float
                ] = None

                if element.get("type") == "node":

                    place_lat = safe_float(
                        element.get("lat")
                    )

                    place_lon = safe_float(
                        element.get("lon")
                    )

                else:

                    center = element.get(
                        "center",
                        {},
                    )

                    place_lat = safe_float(
                        center.get("lat")
                    )

                    place_lon = safe_float(
                        center.get("lon")
                    )

                if (
                    place_lat is None
                    or
                    place_lon is None
                ):
                    continue

                distance = (
                    haversine_distance(
                        latitude,
                        longitude,
                        place_lat,
                        place_lon,
                    )
                )

                if (
                    distance >
                    MAX_NEARBY_RADIUS_KM
                ):
                    continue

                if distance < 0.25:
                    continue

                key = (
                    str(name)
                    .strip()
                    .lower()
                )

                if key in seen:
                    continue

                seen.add(key)

                places.append({
                    "name": str(name),

                    "place_type":
                        tags.get(
                            "place"
                        )
                        or "place",

                    "latitude":
                        place_lat,

                    "longitude":
                        place_lon,

                    "distance":
                        round(
                            distance,
                            1,
                        ),

                    "distance_km":
                        round(
                            distance,
                            1,
                        ),

                    "display_name":
                        str(name),
                })

            places.sort(
                key=lambda item:
                    item["distance"]
            )

            return places[
                :MAX_NEARBY_RESULTS
            ]

        except Exception as error:

            print(
                f"Overpass error "
                f"({endpoint}):",
                error,
            )

    return []


# ============================================================
# NEARBY WEATHER
# ============================================================

def fetch_nearby_weather(
    places: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:

    if not places:
        return []

    latitudes = ",".join(
        str(
            place["latitude"]
        )
        for place in places
    )

    longitudes = ",".join(
        str(
            place["longitude"]
        )
        for place in places
    )

    try:

        response = requests.get(
            OPEN_METEO_URL,
            params={

                "latitude":
                    latitudes,

                "longitude":
                    longitudes,

                "current": ",".join([
                    "temperature_2m",
                    "weather_code",
                    "wind_speed_10m",
                    "relative_humidity_2m",
                ]),

                "timezone":
                    "auto",
            },
            headers=HEADERS,
            timeout=15,
        )

        response.raise_for_status()

        data = response.json()

        if isinstance(data, dict):
            data = [data]

        results: List[
            Dict[str, Any]
        ] = []

        for index, place in enumerate(
            places
        ):

            weather = (
                data[index]
                if index < len(data)
                else {}
            )

            current = weather.get(
                "current",
                {},
            )

            code = current.get(
                "weather_code"
            )

            results.append({

                **place,

                "temperature":
                    safe_float(
                        current.get(
                            "temperature_2m"
                        )
                    ),

                "wind_speed":
                    safe_float(
                        current.get(
                            "wind_speed_10m"
                        )
                    ),

                "humidity":
                    safe_float(
                        current.get(
                            "relative_humidity_2m"
                        )
                    ),

                "weather_code":
                    safe_int(
                        code
                    ),

                "condition":
                    weather_description(
                        code
                    ),

                "icon":
                    weather_icon(
                        code
                    ),
            })

        return results

    except Exception as error:

        print(
            "Nearby weather unavailable:",
            error,
        )

        return [
            {
                **place,

                "temperature": None,

                "wind_speed": None,

                "humidity": None,

                "weather_code": None,

                "condition":
                    "Weather unavailable",

                "icon":
                    "☁️",
            }
            for place in places
        ]


# ============================================================
# NEARBY ENDPOINT
# ============================================================

@router.get("/nearby")
def get_nearby_weather(
    lat: float = Query(...),
    lon: float = Query(...),

    radius: float = Query(
        10.0,
        ge=1.0,
        le=10.0,
    ),
):

    if not (
        -90 <= lat <= 90
        and
        -180 <= lon <= 180
    ):

        return {
            "success": False,
            "error": "Invalid coordinates.",
            "places": [],
        }

    radius_meters = min(
        int(radius * 1000),
        10000,
    )

    places = fetch_nearby_osm_places(
        lat,
        lon,
        radius_meters,
    )

    nearby = fetch_nearby_weather(
        places
    )

    return {

        "success": True,

        "center": {
            "latitude": lat,
            "longitude": lon,
        },

        "radius_km":
            radius,

        "count":
            len(nearby),

        "places":
            nearby,
    }