"use client";

// ============================================================
// KANCHHI CONTEXT ENGINE
//
// Phase 5 reliability version.
//
// Responsibilities:
// - collect application context
// - avoid network requests while offline
// - send context to backend when online
// - provide safe fallbacks
// ============================================================

// ============================================================
// API
// ============================================================

const BACKEND_URL =
  "http://localhost:8000";

// ============================================================
// TYPES
// ============================================================

export type KanchhiContextData = {
  location?: unknown;
  weather?: unknown;
  news?: unknown;
  memory?: unknown;
  preferences?: unknown;
  notifications?: unknown;
  search?: unknown;
  analytics?: unknown;
};

export type KanchhiBriefingResult = {
  briefing?: string;
  reply?: string;
  model?: string;
  fallback?: boolean;
  offline?: boolean;
};

// ============================================================
// NETWORK
// ============================================================

function isOnline(): boolean {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return false;
  }

  return navigator.onLine;
}

// ============================================================
// GENERIC FETCH
// ============================================================

async function fetchJSON(
  url: string,
  options?: RequestInit
): Promise<unknown | null> {
  if (!isOnline()) {
    return null;
  }

  try {
    const response =
      await fetch(
        url,
        {
          ...options,
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {
    console.warn(
      "KANCHHI context request unavailable:",
      error
    );

    return null;
  }
}

// ============================================================
// WEATHER
// ============================================================

async function getWeatherContext(): Promise<unknown> {
  if (
    !isOnline() ||
    typeof navigator ===
      "undefined" ||
    !navigator.geolocation
  ) {
    return null;
  }

  try {
    const position =
      await new Promise<GeolocationPosition>(
        (
          resolve,
          reject
        ) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy:
                true,

              timeout:
                8000,

              maximumAge:
                300000,
            }
          );
        }
      );

    const {
      latitude,
      longitude,
    } = position.coords;

    return await fetchJSON(
      `${BACKEND_URL}/api/weather?lat=${latitude}&lon=${longitude}`
    );

  } catch {
    return null;
  }
}

// ============================================================
// NEWS
// ============================================================

async function getNewsContext(): Promise<unknown> {
  const result =
    await fetchJSON(
      `${BACKEND_URL}/api/news`
    );

  if (
    result &&
    typeof result ===
      "object" &&
    "news" in result
  ) {
    return (
      result as {
        news?: unknown;
      }
    ).news;
  }

  return result;
}

// ============================================================
// MEMORY
// ============================================================

async function getMemoryContext(): Promise<unknown> {
  const result =
    await fetchJSON(
      `${BACKEND_URL}/api/memory/list`
    );

  return result;
}

// ============================================================
// PREFERENCES
// ============================================================

async function getPreferencesContext(): Promise<unknown> {
  return await fetchJSON(
    `${BACKEND_URL}/api/preferences`
  );
}

// ============================================================
// BUILD CONTEXT
// ============================================================

export async function buildKanchhiContext(): Promise<KanchhiContextData> {
  if (!isOnline()) {
    return {
      weather: null,
      news: null,
      memory: null,
      preferences: null,
      notifications: null,
      search: null,
      analytics: null,
    };
  }

  const [
    weather,
    news,
    memory,
    preferences,
  ] = await Promise.all([
    getWeatherContext(),
    getNewsContext(),
    getMemoryContext(),
    getPreferencesContext(),
  ]);

  return {
    weather,
    news,
    memory,
    preferences,
    notifications: null,
    search: null,
    analytics: null,
  };
}

// ============================================================
// SEND CONTEXT TO BACKEND ROUTER
// ============================================================

export async function routeKanchhiIntelligence(
  message: string,
  context?: KanchhiContextData
): Promise<unknown | null> {
  if (!isOnline()) {
    return null;
  }

  return await fetchJSON(
    `${BACKEND_URL}/api/intelligence/route`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        message,
        context:
          context ||
          (await buildKanchhiContext()),
      }),
    }
  );
}

// ============================================================
// GENERIC BRIEFING REQUEST
// ============================================================

async function requestBriefing(
  endpoint:
    | "morning"
    | "evening"
): Promise<KanchhiBriefingResult> {
  if (!isOnline()) {
    return {
      offline: true,
      briefing:
        endpoint ===
        "morning"
          ? "Morning briefing is unavailable while offline."
          : "Evening summary is unavailable while offline.",
    };
  }

  const context =
    await buildKanchhiContext();

  try {
    const response =
      await fetch(
        `${BACKEND_URL}/api/intelligence/briefing/${endpoint}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            location:
              context.location ||
              null,

            weather:
              context.weather ||
              null,

            news:
              context.news ||
              null,

            memory:
              context.memory ||
              null,

            preferences:
              context.preferences ||
              null,

            analytics:
              context.analytics ||
              null,

            search:
              context.search ||
              null,
          }),

          cache: "no-store",
        }
      );

    let data:
      | KanchhiBriefingResult
      | { detail?: string }
      | null = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail =
        data &&
        "detail" in data
          ? data.detail
          : "";

      return {
        briefing:
          String(
            detail ||
              "KANCHHI could not generate this briefing."
          ),
      };
    }

    const result =
      data as KanchhiBriefingResult;

    return {
      ...result,

      briefing:
        result.briefing ||
        result.reply ||
        "KANCHHI generated no briefing text.",
    };

  } catch (error) {
    console.warn(
      `KANCHHI ${endpoint} briefing unavailable:`,
      error
    );

    return {
      briefing:
        endpoint ===
        "morning"
          ? "Morning briefing is currently unavailable."
          : "Evening summary is currently unavailable.",
    };
  }
}

// ============================================================
// MORNING
// ============================================================

export async function generateMorningBriefing(): Promise<KanchhiBriefingResult | null> {
  if (!isOnline()) {
    return {
      offline: true,
      briefing:
        "Morning briefing is unavailable while offline.",
    };
  }

  return await requestBriefing(
    "morning"
  );
}

// ============================================================
// EVENING
// ============================================================

export async function generateEveningBriefing(): Promise<KanchhiBriefingResult | null> {
  if (!isOnline()) {
    return {
      offline: true,
      briefing:
        "Evening summary is unavailable while offline.",
    };
  }

  return await requestBriefing(
    "evening"
  );
}

// ============================================================
// CONTEXT SNAPSHOT
// ============================================================

export async function getKanchhiContextSnapshot(): Promise<KanchhiContextData> {
  return await buildKanchhiContext();
}