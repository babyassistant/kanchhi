"use client";

import {
  getCacheAge,
  loadKanchhiCache,
  saveKanchhiCache,
} from "@/lib/kanchhiCache";

import {
  getAnalyticsSummary,
  type KanchhiAnalyticsSummary,
} from "@/lib/kanchhiAnalytics";


// ============================================================
// API
// ============================================================

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";


// ============================================================
// STORAGE
// ============================================================

const DASHBOARD_CACHE_KEY =
  "kanchhi-personalized-dashboard";


// ============================================================
// TYPES
// ============================================================

export type DashboardLocation = {
  name?: string;
  local_name?: string;
  city?: string;
  district?: string;
  province?: string;
  country?: string;
  display_name?: string;
  latitude?: number;
  longitude?: number;
};

export type DashboardCurrentWeather = {
  temperature?: number | null;
  feels_like?: number | null;
  humidity?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  wind_gusts?: number | null;
  uv_index?: number | null;
  precipitation?: number | null;
  weather_code?: number | null;
  condition?: string;
  icon?: string;
  is_day?: number | boolean | null;
};

export type DashboardForecastDay = {
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

export type DashboardWeather = {
  success?: boolean;

  location?: DashboardLocation;

  current?: DashboardCurrentWeather;

  forecast?: DashboardForecastDay[];

  alerts?: DashboardWeatherAlert[];

  sun?: {
    sunrise?: string | null;
    sunset?: string | null;
  };

  timezone?: string;

  timezone_abbreviation?: string;

  last_updated?: string;

  error?: string;

  details?: string;
};

export type DashboardWeatherAlert = {
  type?: string;
  title?: string;
  severity?: string;
  message?: string;
};

export type DashboardNewsArticle = {
  title?: string;
  link?: string;
  image?: string;
  description?: string;
  source?: string;
  sourceKey?: string;
  publishedAt?: string;
  category?: string;

  _kanchhi_score?: number;
  _kanchhi_rank?: number;
};

export type DashboardMemory = {
  id?: string;
  key?: string;
  title?: string;
  content?: string;
  text?: string;
  value?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;

  [key: string]: unknown;
};

export type DashboardWatchlist = {
  id?: string;
  title?: string;
  name?: string;
  keyword?: string;
  query?: string;
  topic?: string;
  keywords?: string[];
  enabled?: boolean;

  [key: string]: unknown;
};

export type DashboardNotification = {
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  severity?: string;
  read?: boolean;
  createdAt?: string;

  [key: string]: unknown;
};

export type DashboardPreferences = {
  [key: string]: unknown;
};

export type PersonalizedNewsArticle =
  DashboardNewsArticle & {
    _kanchhi_score: number;
    _kanchhi_rank: number;
  };

export type PersonalizedDashboardSnapshot = {
  weather: DashboardWeather | null;

  news: PersonalizedNewsArticle[];

  memories: DashboardMemory[];

  watchlists: DashboardWatchlist[];

  notifications: DashboardNotification[];

  preferences: DashboardPreferences | null;

  analytics: KanchhiAnalyticsSummary;

  savedAt: number;

  offline?: boolean;
};


// ============================================================
// WEATHER CACHE SHAPE
// Compatible with your existing WeatherPanel cache.
// ============================================================

type WeatherCache = {
  weather: DashboardWeather;
  nearby?: unknown[];
  latitude?: number;
  longitude?: number;
};


// ============================================================
// HELPERS
// ============================================================

function isBrowser(): boolean {
  return typeof window !== "undefined";
}


function normalizeArray<T>(
  value: unknown
): T[] {

  if (Array.isArray(value)) {
    return value as T[];
  }

  return [];
}


function cleanText(
  value: unknown
): string {

  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .toLowerCase();
}


function uniqueStrings(
  values: string[]
): string[] {

  return Array.from(
    new Set(
      values
        .map(cleanText)
        .filter(
          (value) =>
            value.length >= 2
        )
    )
  );
}


async function fetchJson(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<unknown> {

  const controller =
    new AbortController();

  const timeout =
    window.setTimeout(
      () => {
        controller.abort();
      },
      timeoutMs
    );

  try {

    const response =
      await fetch(
        url,
        {
          ...options,
          signal:
            controller.signal,
          cache: "no-store",
        }
      );

    if (!response.ok) {

      throw new Error(
        `Request returned HTTP ${response.status}.`
      );
    }

    return await response.json();

  } finally {

    window.clearTimeout(
      timeout
    );
  }
}


// ============================================================
// PREFERENCES
// ============================================================

function extractPreferenceKeywords(
  preferences: DashboardPreferences | null
): string[] {

  if (!preferences) {
    return [];
  }

  const candidates: unknown[] = [

    preferences.interests,

    preferences.topics,

    preferences.newsTopics,

    preferences.preferredTopics,

    preferences.favoriteTopics,

    preferences.categories,

    preferences.news_categories,

    preferences.news_preferences,

    preferences.watchKeywords,

    preferences.keywords,

  ];

  const values: string[] = [];

  for (
    const candidate
    of candidates
  ) {

    if (
      Array.isArray(
        candidate
      )
    ) {

      for (
        const item
        of candidate
      ) {

        if (
          typeof item ===
          "string"
        ) {

          values.push(item);

        } else if (
          item &&
          typeof item ===
            "object"
        ) {

          const record =
            item as Record<
              string,
              unknown
            >;

          for (
            const key of [
              "name",
              "title",
              "topic",
              "keyword",
              "label",
              "value",
            ]
          ) {

            if (
              typeof record[key] ===
              "string"
            ) {

              values.push(
                record[key] as string
              );

            }
          }

        }

      }

    } else if (
      typeof candidate ===
      "string"
    ) {

      values.push(
        ...candidate.split(",")
      );

    }

  }

  return uniqueStrings(
    values
  );
}


// ============================================================
// WATCHLIST KEYWORDS
// ============================================================

function extractWatchlistKeywords(
  watchlists: DashboardWatchlist[]
): string[] {

  const values: string[] = [];

  for (
    const watchlist
    of watchlists
  ) {

    if (
      watchlist.enabled === false
    ) {
      continue;
    }

    const candidates = [

      watchlist.name,

      watchlist.title,

      watchlist.keyword,

      watchlist.query,

      watchlist.topic,

    ];

    for (
      const value
      of candidates
    ) {

      if (
        typeof value ===
        "string"
      ) {

        values.push(value);

      }

    }

    if (
      Array.isArray(
        watchlist.keywords
      )
    ) {

      values.push(
        ...watchlist.keywords
      );

    }

  }

  return uniqueStrings(
    values
  );
}


// ============================================================
// NEWS RANKING
// ============================================================

function scoreArticle(
  article: DashboardNewsArticle,
  preferenceKeywords: string[],
  watchlistKeywords: string[]
): number {

  const title =
    cleanText(
      article.title
    );

  const description =
    cleanText(
      article.description
    );

  const source =
    cleanText(
      article.source
    );

  const category =
    cleanText(
      article.category
    );

  const combined =
    [
      title,
      description,
      source,
      category,
    ]
      .filter(Boolean)
      .join(" ");

  let score = 0;


  // ----------------------------------------------------------
  // WATCHLIST MATCHES
  // ----------------------------------------------------------

  for (
    const keyword
    of watchlistKeywords
  ) {

    if (
      title.includes(keyword)
    ) {

      score += 15;

    } else if (
      combined.includes(keyword)
    ) {

      score += 9;

    }

  }


  // ----------------------------------------------------------
  // PREFERENCE MATCHES
  // ----------------------------------------------------------

  for (
    const keyword
    of preferenceKeywords
  ) {

    if (
      title.includes(keyword)
    ) {

      score += 10;

    } else if (
      combined.includes(keyword)
    ) {

      score += 5;

    }

  }


  // ----------------------------------------------------------
  // CATEGORY SIGNAL
  // ----------------------------------------------------------

  if (
    category &&
    preferenceKeywords.includes(
      category
    )
  ) {

    score += 8;

  }


  // ----------------------------------------------------------
  // SOURCE SIGNAL
  // ----------------------------------------------------------

  if (
    article.source
  ) {

    score += 1;

  }


  return score;
}


export function rankPersonalizedNews(
  articles: DashboardNewsArticle[],
  preferences: DashboardPreferences | null,
  watchlists: DashboardWatchlist[]
): PersonalizedNewsArticle[] {

  const preferenceKeywords =
    extractPreferenceKeywords(
      preferences
    );

  const watchlistKeywords =
    extractWatchlistKeywords(
      watchlists
    );

  return articles
    .map(
      (
        article
      ) => {

        const score =
          scoreArticle(
            article,
            preferenceKeywords,
            watchlistKeywords
          );

        return {
          ...article,
          _kanchhi_score:
            score,
        };

      }
    )
    .sort(
      (
        a,
        b
      ) => {

        if (
          b._kanchhi_score !==
          a._kanchhi_score
        ) {

          return (
            b._kanchhi_score -
            a._kanchhi_score
          );

        }

        return (
          String(
            a.title || ""
          ).localeCompare(
            String(
              b.title || ""
            )
          )
        );

      }
    )
    .map(
      (
        article,
        index
      ) => ({
        ...article,
        _kanchhi_rank:
          index + 1,
      })
    );
}


// ============================================================
// LOAD WEATHER CACHE
// ============================================================

function loadCachedWeather():
  DashboardWeather | null {

  const cached =
    loadKanchhiCache<WeatherCache>(
      "weather-latest"
    );

  if (!cached) {
    return null;
  }

  if (
    cached.data &&
    cached.data.weather
  ) {

    return cached.data.weather;
  }

  return null;
}


// ============================================================
// DASHBOARD SNAPSHOT STORAGE
// ============================================================

function saveDashboardSnapshot(
  snapshot: PersonalizedDashboardSnapshot
): void {

  if (!isBrowser()) {
    return;
  }

  try {

    localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify(
        snapshot
      )
    );

  } catch {

    // Storage failure is non-fatal.
  }
}


export function loadDashboardSnapshot():
  PersonalizedDashboardSnapshot | null {

  if (!isBrowser()) {
    return null;
  }

  try {

    const raw =
      localStorage.getItem(
        DASHBOARD_CACHE_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {

      return null;
    }

    return parsed as
      PersonalizedDashboardSnapshot;

  } catch {

    return null;
  }
}


// ============================================================
// INDIVIDUAL API LOADERS
// ============================================================

export async function loadPreferences():
  Promise<DashboardPreferences | null> {

  try {

    const data =
      await fetchJson(
        `${BACKEND_URL}/api/preferences`
      );

    if (
      data &&
      typeof data ===
        "object"
    ) {

      const record =
        data as Record<
          string,
          unknown
        >;

      const preferences =
        record.preferences ??
        record.data ??
        record;

      if (
        preferences &&
        typeof preferences ===
          "object"
      ) {

        return preferences as
          DashboardPreferences;
      }

    }

  } catch {

    // Fall back to null.
  }

  return null;
}


export async function loadMemories():
  Promise<DashboardMemory[]> {

  try {

    const data =
      await fetchJson(
        `${BACKEND_URL}/api/memory/list`
      );

    if (
      data &&
      typeof data ===
        "object"
    ) {

      const record =
        data as Record<
          string,
          unknown
        >;

      return normalizeArray<
        DashboardMemory
      >(
        record.memories ??
        record.memory ??
        record.data ??
        data
      );

    }

  } catch {

    // Ignore.
  }

  return [];
}


export async function loadSmartNotifications():
  Promise<DashboardNotification[]> {

  try {

    const data =
      await fetchJson(
        `${BACKEND_URL}/api/smart-notifications`
      );

    if (
      data &&
      typeof data ===
        "object"
    ) {

      const record =
        data as Record<
          string,
          unknown
        >;

      return normalizeArray<
        DashboardNotification
      >(
        record.notifications ??
        record.data ??
        []
      );

    }

  } catch {

    // Ignore.
  }

  return [];
}


export async function loadWatchlists():
  Promise<DashboardWatchlist[]> {

  try {

    const data =
      await fetchJson(
        `${BACKEND_URL}/api/watchlists`
      );

    if (
      data &&
      typeof data ===
        "object"
    ) {

      const record =
        data as Record<
          string,
          unknown
        >;

      return normalizeArray<
        DashboardWatchlist
      >(
        record.watchlists ??
        record.data ??
        []
      );

    }

  } catch {

    // Ignore.
  }

  return [];
}


export async function loadNews():
  Promise<
    DashboardNewsArticle[]
  > {

  try {

    const data =
      await fetchJson(
        `${BACKEND_URL}/api/news`
      );

    if (
      data &&
      typeof data ===
        "object"
    ) {

      const record =
        data as Record<
          string,
          unknown
        >;

      return normalizeArray<
        DashboardNewsArticle
      >(
        record.news ??
        record.articles ??
        []
      );

    }

  } catch {

    // Ignore.
  }

  return [];
}


export async function loadWeather(
  latitude: number,
  longitude: number
): Promise<DashboardWeather | null> {

  try {

    const data =
      await fetchJson(
        `${BACKEND_URL}/api/weather?lat=${encodeURIComponent(
          latitude
        )}&lon=${encodeURIComponent(
          longitude
        )}`,
        {},
        15000
      );

    if (
      data &&
      typeof data ===
        "object"
    ) {

      const weather =
        data as DashboardWeather;

      if (
        weather.success !==
        false
      ) {

        return weather;
      }

    }

  } catch {

    // Cache fallback happens in loadPersonalizedDashboard.
  }

  return null;
}


// ============================================================
// COMPLETE DASHBOARD LOAD
// ============================================================

export async function loadPersonalizedDashboard():
  Promise<PersonalizedDashboardSnapshot> {

  const cached =
    loadDashboardSnapshot();

  const analytics =
    getAnalyticsSummary();


  // ----------------------------------------------------------
  // OFFLINE
  // ----------------------------------------------------------

  if (
    isBrowser() &&
    !navigator.onLine
  ) {

    const offlineWeather =
      loadCachedWeather();

    if (cached) {

      return {
        ...cached,
        weather:
          offlineWeather ??
          cached.weather,
        analytics,
        offline: true,
      };

    }

    return {
      weather:
        offlineWeather,
      news: [],
      memories: [],
      watchlists: [],
      notifications: [],
      preferences: null,
      analytics,
      savedAt:
        Date.now(),
      offline: true,
    };

  }


  // ----------------------------------------------------------
  // PARALLEL LOAD
  // ----------------------------------------------------------

  const [
    weatherResult,
    newsResult,
    preferencesResult,
    memoriesResult,
    notificationsResult,
    watchlistsResult,
  ] =
    await Promise.all([
      new Promise<
        DashboardWeather | null
      >(
        (
          resolve
        ) => {

          if (
            typeof navigator ===
              "undefined" ||
            !navigator.geolocation
          ) {

            resolve(
              loadCachedWeather()
            );

            return;
          }

          navigator.geolocation.getCurrentPosition(
            async (
              position
            ) => {

              const live =
                await loadWeather(
                  position.coords.latitude,
                  position.coords.longitude
                );

              resolve(
                live ??
                loadCachedWeather()
              );

            },
            () => {

              resolve(
                loadCachedWeather()
              );

            },
            {
              enableHighAccuracy:
                false,

              timeout:
                8000,

              maximumAge:
                300000,
            }
          );

        }
      ),

      loadNews(),

      loadPreferences(),

      loadMemories(),

      loadSmartNotifications(),

      loadWatchlists(),
    ]);


  // ----------------------------------------------------------
  // FALLBACKS
  // ----------------------------------------------------------

  const news =
    newsResult.length > 0
      ? newsResult
      : cached?.news || [];


  const preferences =
    preferencesResult ??
    cached?.preferences ??
    null;


  const memories =
    memoriesResult.length > 0
      ? memoriesResult
      : cached?.memories || [];


  const notifications =
    notificationsResult.length > 0
      ? notificationsResult
      : cached?.notifications || [];


  const watchlists =
    watchlistsResult.length > 0
      ? watchlistsResult
      : cached?.watchlists || [];


  const personalizedNews =
    rankPersonalizedNews(
      news,
      preferences,
      watchlists
    );


  const snapshot:
    PersonalizedDashboardSnapshot =
    {

      weather:
        weatherResult ??
        cached?.weather ??
        null,

      news:
        personalizedNews,

      memories,

      watchlists,

      notifications,

      preferences,

      analytics,

      savedAt:
        Date.now(),

      offline:
        false,
    };


  saveDashboardSnapshot(
    snapshot
  );

  return snapshot;
}


// ============================================================
// CACHE AGE
// ============================================================

export function getDashboardCacheAge(
  savedAt: number
): string {

  return getCacheAge(
    savedAt
  );
}


// ============================================================
// PERSONALIZED FOCUS
// ============================================================

export function getPersonalizedFocus(
  snapshot: PersonalizedDashboardSnapshot
): string {

  const alerts =
    snapshot.notifications.filter(
      (
        item
      ) =>
        item.read !== true
    ).length;

  const weatherAlerts =
    snapshot.weather?.alerts?.length ||
    0;

  if (
    alerts > 0
  ) {

    return "notifications";

  }

  if (
    weatherAlerts > 0
  ) {

    return "weather";

  }

  if (
    snapshot.watchlists.length > 0 &&
    snapshot.news.length > 0
  ) {

    return "watchlists";

  }

  const topTabs =
    Object.entries(
      snapshot.analytics.tabOpens
    ).sort(
      (
        [, a],
        [, b]
      ) => b - a
    );

  if (
    topTabs.length > 0
  ) {

    return topTabs[0][0];

  }

  if (
    snapshot.news.length > 0
  ) {

    return "news";

  }

  return "dashboard";
}