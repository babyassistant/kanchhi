"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getCacheAge,
  loadKanchhiCache,
  saveKanchhiCache,
} from "@/lib/kanchhiCache";


/* ============================================================
   TYPES
============================================================ */

type WeatherLocation = {
  name?: string;
  local_name?: string;
  city?: string;
  district?: string;
  province?: string;
  country?: string;
  display_name?: string;
  latitude?: number;
  longitude?: number;

  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
};


type CurrentWeather = {
  temperature?: number | null;
  feels_like?: number | null;
  humidity?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  wind_gusts?: number | null;
  uv_index?: number | null;
  visibility?: number | null;
  pressure?: number | null;
  cloud_cover?: number | null;
  precipitation?: number | null;
  rain?: number | null;
  showers?: number | null;
  snowfall?: number | null;
  weather_code?: number | null;
  condition?: string;
  icon?: string;
  is_day?: number | boolean | null;
};


type ForecastDay = {
  date?: string;
  temperature_max?: number | null;
  temperature_min?: number | null;
  weather_code?: number | null;
  condition?: string;
  icon?: string;
  precipitation_probability?: number | null;
  precipitation_sum?: number | null;
  uv_index?: number | null;
  sunrise?: string | null;
  sunset?: string | null;
};


type WeatherAlert = {
  type?: string;
  title?: string;
  severity?: string;
  message?: string;
};


type SunData = {
  sunrise?: string | null;
  sunset?: string | null;
  tomorrow_sunrise?: string | null;
  tomorrow_sunset?: string | null;
};


type WeatherResponse = {
  success?: boolean;

  source?: string;

  cached?: boolean;

  cache_age_seconds?: number;

  location?: WeatherLocation;

  current?: CurrentWeather;

  sun?: SunData;

  forecast?: ForecastDay[];

  alerts?: WeatherAlert[];

  timezone?: string;

  timezone_abbreviation?: string;

  last_updated?: string;

  error?: string;

  details?: string;
};


type NearbyPlace = {
  name?: string;
  place_type?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  distance_km?: number;
  display_name?: string;
  temperature?: number | null;
  wind_speed?: number | null;
  humidity?: number | null;
  weather_code?: number | null;
  condition?: string;
  icon?: string;
};


type NearbyResponse = {
  success?: boolean;
  places?: NearbyPlace[];
};


type WeatherCache = {
  weather: WeatherResponse;
  nearby: NearbyPlace[];
  latitude: number;
  longitude: number;
};


/* ============================================================
   API CONFIGURATION
============================================================ */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";


const WEATHER_API =
  `${BACKEND_URL}/api/weather`;


const NEARBY_API =
  `${BACKEND_URL}/api/weather/nearby`;


const AI_WEATHER_API =
  `${BACKEND_URL}/api/ai/weather`;


const WEATHER_CACHE_KEY =
  "weather-latest";


/* ============================================================
   HELPERS
============================================================ */

function safeNumber(
  value: unknown,
): number | null {

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  return null;
}


function formatTemperature(
  value: number | null | undefined,
): string {

  const number =
    safeNumber(value);

  if (number === null) {
    return "--";
  }

  return `${number.toFixed(1)}°C`;
}


function formatInteger(
  value: number | null | undefined,
): string {

  const number =
    safeNumber(value);

  if (number === null) {
    return "--";
  }

  return Math.round(number).toString();
}


function formatDate(
  date?: string,
): string {

  if (!date) {
    return "--";
  }

  try {

    return new Date(
      `${date}T12:00:00`,
    ).toLocaleDateString(
      undefined,
      {
        weekday: "short",
        month: "short",
        day: "numeric",
      },
    );

  } catch {

    return date;
  }
}


function formatTime(
  value?: string | null,
): string {

  if (!value) {
    return "--";
  }

  try {

    const parsed =
      new Date(value);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return value;
    }

    return parsed.toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit",
      },
    );

  } catch {

    return value;
  }
}


function getLocationName(
  location?: WeatherLocation,
): string {

  if (!location) {
    return "Current Location";
  }

  return (
    location.local_name ||
    location.name ||
    location.city ||
    "Current Location"
  );
}


function getDisplayAddress(
  location?: WeatherLocation,
): string {

  if (!location) {
    return "";
  }

  return (
    location.display_name ||
    [
      location.city,
      location.district,
      location.province,
      location.country,
    ]
      .filter(Boolean)
      .join(", ")
  );
}


function getCoordinates(
  weather?: WeatherResponse,
) {

  const latitude =
    safeNumber(
      weather?.location?.latitude ??
      weather?.location?.coordinates?.latitude,
    );

  const longitude =
    safeNumber(
      weather?.location?.longitude ??
      weather?.location?.coordinates?.longitude,
    );

  if (
    latitude === null ||
    longitude === null
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}


/* ============================================================
   COMPONENT
============================================================ */

export default function WeatherPanel() {

  const [
    weather,
    setWeather,
  ] = useState<WeatherResponse | null>(
    null,
  );

  const [
    nearby,
    setNearby,
  ] = useState<NearbyPlace[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    isOffline,
    setIsOffline,
  ] = useState(false);

  const [
    usingCache,
    setUsingCache,
  ] = useState(false);

  const [
    cacheSavedAt,
    setCacheSavedAt,
  ] = useState<number | null>(
    null,
  );

  const [
    aiInterpretation,
    setAiInterpretation,
  ] = useState("");

  const [
    aiLoading,
    setAiLoading,
  ] = useState(false);

  const [
    hasLoadedOnce,
    setHasLoadedOnce,
  ] = useState(false);


  const mountedRef =
    useRef(true);

  const requestInProgressRef =
    useRef(false);

  const lastRequestRef =
    useRef(0);


  /* ==========================================================
     CACHE LOADER
  ========================================================== */

  const loadCachedWeather =
    useCallback(() => {

      const cached =
        loadKanchhiCache<WeatherCache>(
          WEATHER_CACHE_KEY,
        );

      if (!cached) {
        return false;
      }

      if (!mountedRef.current) {
        return true;
      }

      setWeather(
        cached.data.weather,
      );

      setNearby(
        cached.data.nearby || [],
      );

      setUsingCache(true);

      setCacheSavedAt(
        cached.savedAt,
      );

      setHasLoadedOnce(true);

      return true;

    }, []);


  /* ==========================================================
     MOUNT
  ========================================================== */

  useEffect(() => {

    mountedRef.current = true;

    const cached =
      loadKanchhiCache<WeatherCache>(
        WEATHER_CACHE_KEY,
      );

    if (cached) {

      setWeather(
        cached.data.weather,
      );

      setNearby(
        cached.data.nearby || [],
      );

      setUsingCache(true);

      setCacheSavedAt(
        cached.savedAt,
      );

      setHasLoadedOnce(true);

      if (
        typeof navigator !==
          "undefined" &&
        !navigator.onLine
      ) {

        setIsOffline(true);

        setLoading(false);
      }
    }

    return () => {

      mountedRef.current = false;

    };

  }, []);


  /* ==========================================================
     NETWORK STATUS
  ========================================================== */

  useEffect(() => {

    const update =
      () => {

        const online =
          navigator.onLine;

        if (!mountedRef.current) {
          return;
        }

        setIsOffline(
          !online,
        );

        if (online) {
          setError("");
        }
      };

    update();

    window.addEventListener(
      "online",
      update,
    );

    window.addEventListener(
      "offline",
      update,
    );

    return () => {

      window.removeEventListener(
        "online",
        update,
      );

      window.removeEventListener(
        "offline",
        update,
      );

    };

  }, []);


  /* ==========================================================
     NEARBY
  ========================================================== */

  const fetchNearby =
    useCallback(
      async (
        lat: number,
        lon: number,
      ) => {

        try {

          const response =
            await fetch(
              `${NEARBY_API}?lat=${encodeURIComponent(
                lat,
              )}&lon=${encodeURIComponent(
                lon,
              )}&radius=10`,
              {
                cache: "no-store",
              },
            );

          if (!response.ok) {
            return [];
          }

          const data =
            (
              await response.json()
            ) as NearbyResponse;

          if (
            !data.success ||
            !Array.isArray(
              data.places,
            )
          ) {
            return [];
          }

          return data.places;

        } catch {

          return [];

        }
      },
      [],
    );


  /* ==========================================================
     MAIN WEATHER REQUEST
  ========================================================== */

  const fetchWeather =
    useCallback(
      async (
        force = false,
      ) => {

        if (
          requestInProgressRef.current
        ) {
          return;
        }

        const now =
          Date.now();

        if (
          !force &&
          now -
            lastRequestRef.current <
            5000
        ) {
          return;
        }

        lastRequestRef.current =
          now;

        requestInProgressRef.current =
          true;

        if (mountedRef.current) {

          setError("");

          setRefreshing(
            hasLoadedOnce,
          );

          if (!hasLoadedOnce) {
            setLoading(true);
          }
        }


        /* ----------------------------------------------------
           OFFLINE
        ---------------------------------------------------- */

        if (!navigator.onLine) {

          const cached =
            loadCachedWeather();

          if (mountedRef.current) {

            setIsOffline(true);

            setLoading(false);

            setRefreshing(false);

            if (!cached) {

              setError(
                "No cached weather is available yet.",
              );
            }
          }

          requestInProgressRef.current =
            false;

          return;
        }


        try {

          let latitude:
            number;

          let longitude:
            number;


          /* --------------------------------------------------
             GPS
          -------------------------------------------------- */

          const position =
            await new Promise<GeolocationPosition>(
              (
                resolve,
                reject,
              ) => {

                if (
                  !navigator.geolocation
                ) {

                  reject(
                    new Error(
                      "Geolocation is not supported.",
                    ),
                  );

                  return;
                }

                navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000,
                  },
                );
              },
            );


          latitude =
            position.coords.latitude;

          longitude =
            position.coords.longitude;


          /* --------------------------------------------------
             WEATHER
          -------------------------------------------------- */

          const response =
            await fetch(
              `${WEATHER_API}?lat=${encodeURIComponent(
                latitude,
              )}&lon=${encodeURIComponent(
                longitude,
              )}`,
              {
                cache: "no-store",
              },
            );


          let data:
            WeatherResponse;

          try {

            data =
              (
                await response.json()
              ) as WeatherResponse;

          } catch {

            throw new Error(
              `Weather backend returned HTTP ${response.status}.`,
            );
          }


          /* --------------------------------------------------
             BACKEND CACHE MAY STILL BE SUCCESSFUL
          -------------------------------------------------- */

          if (
            !response.ok &&
            !data.success
          ) {

            throw new Error(
              data.error ||
              `Weather backend returned HTTP ${response.status}.`,
            );
          }


          if (
            !data.success ||
            !data.current
          ) {

            throw new Error(
              data.error ||
              "Weather data is unavailable.",
            );
          }


          /* --------------------------------------------------
             NEARBY
          -------------------------------------------------- */

          const nearbyData =
            await fetchNearby(
              latitude,
              longitude,
            );


          /* --------------------------------------------------
             CACHE
          -------------------------------------------------- */

          const cachePayload:
            WeatherCache = {

              weather:
                data,

              nearby:
                nearbyData,

              latitude,

              longitude,
            };


          saveKanchhiCache(
            WEATHER_CACHE_KEY,
            cachePayload,
          );


          /* --------------------------------------------------
             UI
          -------------------------------------------------- */

          if (mountedRef.current) {

            const backendReturnedCache =
              data.cached === true;

            setWeather(
              data,
            );

            setNearby(
              nearbyData,
            );

            setUsingCache(
              backendReturnedCache,
            );

            setCacheSavedAt(
              Date.now(),
            );

            setIsOffline(false);

            setError("");

            setHasLoadedOnce(true);
          }

        } catch (requestError) {

          console.warn(
            "KANCHHI weather request failed:",
            requestError,
          );


          const cached =
            loadCachedWeather();


          if (mountedRef.current) {

            setLoading(false);

            setRefreshing(false);

            if (cached) {

              setUsingCache(true);

              setIsOffline(
                !navigator.onLine,
              );

              setError("");

            } else {

              setError(
                requestError instanceof Error
                  ? requestError.message
                  : "Weather is temporarily unavailable.",
              );
            }
          }

        } finally {

          requestInProgressRef.current =
            false;

          if (mountedRef.current) {

            setLoading(false);

            setRefreshing(false);
          }
        }

      },
      [
        fetchNearby,
        hasLoadedOnce,
        loadCachedWeather,
      ],
    );


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {

    if (hasLoadedOnce) {
      return;
    }

    fetchWeather();

  }, [
    fetchWeather,
    hasLoadedOnce,
  ]);


  /* ==========================================================
     ONLINE REFRESH
  ========================================================== */

  useEffect(() => {

    const handleOnline =
      () => {

        fetchWeather(
          true,
        );
      };

    window.addEventListener(
      "online",
      handleOnline,
    );

    return () => {

      window.removeEventListener(
        "online",
        handleOnline,
      );

    };

  }, [fetchWeather]);


  /* ==========================================================
     AI WEATHER
  ========================================================== */

  const getAIWeather =
    useCallback(
      async () => {

        if (
          !weather?.current
        ) {
          return;
        }

        if (!navigator.onLine) {

          setAiInterpretation(
            "AI weather analysis is unavailable while offline.",
          );

          return;
        }

        setAiLoading(true);

        setAiInterpretation("");


        try {

          const response =
            await fetch(
              AI_WEATHER_API,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  weather,
                }),
              },
            );


          let data:
            Record<string, unknown> = {};

          try {
            data =
              await response.json();
          } catch {
            // Ignore invalid JSON.
          }


          if (!response.ok) {

            throw new Error(
              typeof data.detail === "string"
                ? data.detail
                : `AI weather returned HTTP ${response.status}.`,
            );
          }


          const interpretation =
            typeof data.interpretation ===
              "string"
              ? data.interpretation
              : "";


          setAiInterpretation(
            interpretation ||
            "KANCHHI could not interpret the weather right now.",
          );

        } catch (error) {

          console.warn(
            "KANCHHI AI weather error:",
            error,
          );

          setAiInterpretation(
            "AI weather interpretation is currently unavailable.",
          );

        } finally {

          if (mountedRef.current) {
            setAiLoading(false);
          }
        }

      },
      [weather],
    );


  /* ==========================================================
     DATA
  ========================================================== */

  const current =
    weather?.current;

  const location =
    weather?.location;

  const forecast =
    weather?.forecast || [];

  const alerts =
    weather?.alerts || [];

  const sun =
    weather?.sun;

  const locationName =
    getLocationName(
      location,
    );

  const displayAddress =
    getDisplayAddress(
      location,
    );

  const coordinates =
    getCoordinates(
      weather,
    );


  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    loading &&
    !weather
  ) {

    return (

      <section className="min-h-screen bg-[#0b1220] p-8">

        <div className="mx-auto max-w-6xl">

          <p className="text-sm uppercase tracking-wider text-blue-400">
            KANCHHI WEATHER
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Weather
          </h1>

          <p className="mt-2 text-slate-400">
            Loading weather for your current location...
          </p>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-[#111c2e] p-8">

            <div className="animate-pulse space-y-5">

              <div className="h-6 w-1/3 rounded bg-slate-800" />

              <div className="h-16 w-1/2 rounded bg-slate-800" />

              <div className="h-4 w-2/3 rounded bg-slate-800" />

              <div className="grid grid-cols-2 gap-4">

                <div className="h-20 rounded bg-slate-800" />

                <div className="h-20 rounded bg-slate-800" />

              </div>

            </div>

          </div>

        </div>

      </section>
    );
  }


  /* ==========================================================
     UI
  ========================================================== */

  return (

    <section className="min-h-screen bg-[#0b1220] p-6 md:p-8">

      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div>

            <p className="text-sm uppercase tracking-wider text-blue-400">
              KANCHHI WEATHER
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Weather
            </h1>

            <p className="mt-2 text-slate-400">
              Live weather based on your current GPS location.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              fetchWeather(true)
            }
            disabled={refreshing}
            className="
              self-start
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              px-5
              py-3
              transition
              hover:bg-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>


        {/* CACHE / OFFLINE */}

        {(isOffline || usingCache) && (

          <div className="mb-6 rounded-2xl border border-amber-700/60 bg-amber-950/40 px-5 py-4">

            <div className="flex items-start gap-3">

              <div className="text-xl">
                {isOffline
                  ? "●"
                  : "◐"}
              </div>

              <div>

                <p className="font-semibold text-amber-300">

                  {isOffline
                    ? "Offline mode"
                    : "Cached weather"}

                </p>

                <p className="mt-1 text-sm text-amber-200/70">

                  {cacheSavedAt
                    ? `Showing information from ${getCacheAge(
                        cacheSavedAt,
                      )}.`
                    : "Showing cached weather information."}

                </p>

              </div>

            </div>

          </div>

        )}


        {/* ERROR */}

        {error && !weather && (

          <div className="mb-6 rounded-2xl border border-red-900/70 bg-red-950/40 p-5">

            <p className="font-semibold text-red-300">
              Weather temporarily unavailable
            </p>

            <p className="mt-2 text-sm text-red-200/70">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                fetchWeather(true)
              }
              className="
                mt-4
                rounded-lg
                bg-red-900/50
                px-4
                py-2
                transition
                hover:bg-red-900
              "
            >
              Try again
            </button>

          </div>

        )}


        {/* CURRENT */}

        {weather && (

          <div className="mb-8 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-7 shadow-2xl md:p-8">

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">

              <div>

                <p className="text-sm uppercase tracking-wider text-blue-100">
                  CURRENT LOCATION
                </p>

                <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                  📍 {locationName}
                </h2>

                {displayAddress && (

                  <p className="mt-2 max-w-3xl text-blue-100/80">
                    {displayAddress}
                  </p>

                )}

                <p className="mt-3 text-sm text-blue-100/70">

                  {usingCache
                    ? "Showing cached weather."
                    : "Live weather updated for your location."}

                </p>

              </div>


              <div className="lg:text-right">

                <div className="text-6xl font-bold md:text-7xl">
                  {formatTemperature(
                    current?.temperature,
                  )}
                </div>

                <p className="mt-2 text-xl">
                  {current?.icon || "☁️"}{" "}
                  {current?.condition ||
                    "Weather unavailable"}
                </p>

                <p className="mt-2 text-blue-100/80">
                  Feels like{" "}
                  {formatTemperature(
                    current?.feels_like,
                  )}
                </p>

              </div>

            </div>


            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">

                <p className="text-xs text-blue-100/70">
                  HUMIDITY
                </p>

                <p className="mt-2 text-xl font-semibold">
                  💧 {formatInteger(
                    current?.humidity,
                  )}%
                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">

                <p className="text-xs text-blue-100/70">
                  WIND
                </p>

                <p className="mt-2 text-xl font-semibold">
                  💨 {formatInteger(
                    current?.wind_speed,
                  )} km/h
                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">

                <p className="text-xs text-blue-100/70">
                  PRECIPITATION
                </p>

                <p className="mt-2 text-xl font-semibold">
                  💧{" "}
                  {safeNumber(
                    current?.precipitation,
                  ) !== null
                    ? `${safeNumber(
                        current?.precipitation,
                      )} mm`
                    : "--"}
                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">

                <p className="text-xs text-blue-100/70">
                  UV INDEX
                </p>

                <p className="mt-2 text-xl font-semibold">
                  ☀️{" "}
                  {safeNumber(
                    current?.uv_index,
                  ) !== null
                    ? safeNumber(
                        current?.uv_index,
                      )?.toFixed(1)
                    : "--"}
                </p>

              </div>

            </div>


            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">

                <p className="text-sm text-blue-100/80">
                  🌅 SUNRISE
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {formatTime(
                    sun?.sunrise,
                  )}
                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">

                <p className="text-sm text-blue-100/80">
                  🌇 SUNSET
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {formatTime(
                    sun?.sunset,
                  )}
                </p>

              </div>

            </div>


            {coordinates && (

              <div className="mt-6 border-t border-white/15 pt-5 text-sm text-blue-100/70">

                Coordinates:{" "}
                {coordinates.latitude.toFixed(6)}
                ,{" "}
                {coordinates.longitude.toFixed(6)}

              </div>

            )}

          </div>

        )}


        {/* FORECAST */}

        {forecast.length > 0 && (

          <div className="mb-8 rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

            <p className="text-xs uppercase tracking-wider text-blue-400">
              KANCHHI FORECAST
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              7-Day Forecast
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

              {forecast
                .slice(0, 7)
                .map(
                  (
                    day,
                    index,
                  ) => (

                    <div
                      key={
                        day.date ||
                        index
                      }
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                    >

                      <p className="text-sm font-semibold">
                        {index === 0
                          ? "Today"
                          : formatDate(
                              day.date,
                            )}
                      </p>

                      <div className="mt-3 text-3xl">
                        {day.icon ||
                          "☁️"}
                      </div>

                      <p className="mt-2 min-h-8 text-xs text-slate-400">
                        {day.condition ||
                          "Unavailable"}
                      </p>

                      <div className="mt-4">

                        <span className="font-bold">
                          {formatTemperature(
                            day.temperature_max,
                          )}
                        </span>

                        <span className="ml-2 text-slate-500">
                          {formatTemperature(
                            day.temperature_min,
                          )}
                        </span>

                      </div>

                      <p className="mt-3 text-xs text-blue-400">

                        💧{" "}
                        {safeNumber(
                          day.precipitation_probability,
                        ) !== null
                          ? `${Math.round(
                              safeNumber(
                                day.precipitation_probability,
                              ) as number,
                            )}%`
                          : "--"}

                      </p>

                    </div>
                  ),
                )}

            </div>

          </div>

        )}


        {/* ALERTS */}

        {alerts.length > 0 && (

          <div className="mb-8 rounded-2xl border border-amber-900/60 bg-[#111c2e] p-6">

            <p className="text-xs uppercase tracking-wider text-amber-400">
              KANCHHI ALERTS
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Weather concerns
            </h2>

            <div className="mt-5 space-y-3">

              {alerts.map(
                (
                  alert,
                  index,
                ) => (

                  <div
                    key={
                      `${alert.type || "alert"}-${index}`
                    }
                    className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4"
                  >

                    <div className="flex items-start gap-3">

                      <span className="text-xl">
                        ⚠️
                      </span>

                      <div>

                        <p className="font-semibold text-amber-200">
                          {alert.title ||
                            "Weather alert"}
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {alert.message ||
                            "Weather concern detected."}
                        </p>

                      </div>

                    </div>

                  </div>
                ),
              )}

            </div>

          </div>

        )}


        {/* NEARBY */}

        {nearby.length > 0 && (

          <div className="mb-8 rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

            <p className="text-xs uppercase tracking-wider text-blue-400">
              NEARBY WEATHER
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Nearby places
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {nearby.map(
                (
                  place,
                  index,
                ) => (

                  <div
                    key={
                      `${place.name || "place"}-${index}`
                    }
                    className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="font-semibold">
                          {place.name ||
                            "Nearby place"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {safeNumber(
                            place.distance_km ??
                            place.distance,
                          ) !== null
                            ? `${safeNumber(
                                place.distance_km ??
                                place.distance,
                              )} km away`
                            : "Nearby"}
                        </p>

                      </div>

                      <span className="text-2xl">
                        {place.icon ||
                          "☁️"}
                      </span>

                    </div>

                    <p className="mt-4 text-2xl font-bold">
                      {formatTemperature(
                        place.temperature,
                      )}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {place.condition ||
                        "Weather unavailable"}
                    </p>

                    <div className="mt-3 text-xs text-slate-500">
                      💨{" "}
                      {formatInteger(
                        place.wind_speed,
                      )} km/h
                      {" • "}
                      💧{" "}
                      {formatInteger(
                        place.humidity,
                      )}%
                    </div>

                  </div>
                ),
              )}

            </div>

          </div>

        )}


        {/* AI */}

        {weather && (

          <div className="mb-8 rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs uppercase tracking-wider text-blue-400">
                  KANCHHI INTELLIGENCE
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  AI Weather Analysis
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Interpretation of the available weather data.
                </p>

              </div>

              <button
                type="button"
                onClick={getAIWeather}
                disabled={
                  aiLoading ||
                  isOffline
                }
                className="
                  rounded-lg
                  bg-blue-600
                  px-4
                  py-2
                  transition
                  hover:bg-blue-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {aiLoading
                  ? "Analyzing..."
                  : "Ask KANCHHI"}
              </button>

            </div>


            {aiInterpretation ? (

              <div className="mt-5 whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm leading-7 text-slate-300">
                {aiInterpretation}
              </div>

            ) : (

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-500">

                {isOffline
                  ? "AI weather analysis is unavailable while offline."
                  : "Select Ask KANCHHI to interpret the current weather."}

              </div>

            )}

          </div>

        )}


        {weather?.last_updated && (

          <div className="pb-8 text-xs text-slate-600">

            Weather data timestamp:{" "}
            {weather.last_updated}

            {weather.timezone
              ? ` • ${weather.timezone}`
              : ""}

          </div>

        )}

      </div>

    </section>
  );
}