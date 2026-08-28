"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  generateEveningBriefing,
  generateMorningBriefing,
} from "@/lib/kanchhiContext";

import {
  formatAnalyticsDuration,
} from "@/lib/kanchhiAnalytics";

import {
  getPersonalizedFocus,
  loadDashboardSnapshot,
  loadPersonalizedDashboard,
  getDashboardCacheAge,
  type DashboardCurrentWeather,
  type DashboardMemory,
  type DashboardNewsArticle,
  type DashboardNotification,
  type DashboardPreferences,
  type DashboardWatchlist,
  type DashboardWeather,
  type PersonalizedDashboardSnapshot,
} from "@/lib/personalizedDashboard";


// ============================================================
// HELPERS
// ============================================================

function formatTemperature(
  value:
    | number
    | null
    | undefined
): string {

  if (
    typeof value !==
      "number" ||
    !Number.isFinite(value)
  ) {

    return "--";
  }

  return `${Math.round(value)}°C`;
}


function formatNumber(
  value:
    | number
    | null
    | undefined,
  suffix = ""
): string {

  if (
    typeof value !==
      "number" ||
    !Number.isFinite(value)
  ) {

    return "--";
  }

  return `${Math.round(value)}${suffix}`;
}


function getLocationName(
  weather:
    | DashboardWeather
    | null
): string {

  return (
    weather?.location?.local_name ||
    weather?.location?.name ||
    weather?.location?.city ||
    "Current Location"
  );
}


function getLocationSubtitle(
  weather:
    | DashboardWeather
    | null
): string {

  const location =
    weather?.location;

  if (!location) {
    return "";
  }

  return [
    location.district,
    location.province,
    location.country,
  ]
    .filter(
      (
        value
      ): value is string =>
        Boolean(value)
    )
    .join(", ");
}


function formatForecastDate(
  date?: string
): string {

  if (!date) {
    return "--";
  }

  const parsed =
    new Date(
      `${date}T12:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {

    return date;
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  );
}


function formatClock(
  date: Date
): string {

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}


function getGreeting(
  date: Date
): string {

  const hour =
    date.getHours();

  if (hour < 5) {
    return "Good night";
  }

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  if (hour < 21) {
    return "Good evening";
  }

  return "Good night";
}


function getMemoryText(
  memory:
    | DashboardMemory
    | undefined
): string {

  if (!memory) {
    return "";
  }

  return (
    memory.content ||
    memory.text ||
    memory.value ||
    memory.title ||
    memory.key ||
    ""
  );
}


function getWatchlistText(
  item:
    | DashboardWatchlist
    | undefined
): string {

  if (!item) {
    return "";
  }

  return (
    item.title ||
    item.name ||
    item.keyword ||
    item.query ||
    item.topic ||
    "Watchlist"
  );
}


function getNotificationText(
  item:
    | DashboardNotification
    | undefined
): string {

  if (!item) {
    return "";
  }

  return (
    item.title ||
    item.message ||
    "Notification"
  );
}


function getPreferenceSummary(
  preferences:
    | DashboardPreferences
    | null
): string {

  if (!preferences) {
    return "Preferences are not configured yet.";
  }

  const location =
    preferences.location;

  const topics =
    preferences.topics ||
    preferences.interests ||
    preferences.newsTopics;

  if (
    typeof location ===
    "string" &&
    Array.isArray(topics) &&
    topics.length > 0
  ) {

    return `${location} • ${topics
      .slice(0, 3)
      .map(String)
      .join(", ")}`;
  }

  if (
    typeof location ===
    "string"
  ) {

    return location;
  }

  if (
    Array.isArray(topics) &&
    topics.length > 0
  ) {

    return topics
      .slice(0, 3)
      .map(String)
      .join(", ");
  }

  return "Preferences are configured and ready for KANCHHI.";
}


// ============================================================
// COMPONENT
// ============================================================

export default function DashboardPanel() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    snapshot,
    setSnapshot,
  ] = useState<
    PersonalizedDashboardSnapshot | null
  >(null);

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
    mounted,
    setMounted,
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime,
  ] = useState<Date | null>(
    null
  );

  const [
    briefingType,
    setBriefingType,
  ] = useState<
    "morning" | "evening" | null
  >(null);

  const [
    briefingText,
    setBriefingText,
  ] = useState("");

  const [
    briefingLoading,
    setBriefingLoading,
  ] = useState(false);

  const [
    briefingError,
    setBriefingError,
  ] = useState("");


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadDashboard =
    useCallback(
      async (
        force = false
      ) => {

        if (!force) {

          const cached =
            loadDashboardSnapshot();

          if (cached) {

            setSnapshot(
              cached
            );
          }

        }

        try {

          if (force) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const data =
            await loadPersonalizedDashboard();

          setSnapshot(
            data
          );

        } catch (
          dashboardError
        ) {

          console.error(
            "KANCHHI personalized dashboard error:",
            dashboardError
          );

          const cached =
            loadDashboardSnapshot();

          if (cached) {

            setSnapshot(
              cached
            );

          } else {

            setError(
              dashboardError instanceof
                Error
                ? dashboardError.message
                : "Unable to build the personalized dashboard."
            );

          }

        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      []
    );


  // ==========================================================
  // INITIALIZE CLOCK
  // ==========================================================

  useEffect(() => {

    setMounted(true);

    const updateTime =
      () => {

        setCurrentTime(
          new Date()
        );

      };

    updateTime();

    const interval =
      window.setInterval(
        updateTime,
        30000
      );

    return () => {

      window.clearInterval(
        interval
      );

    };

  }, []);


  // ==========================================================
  // INITIAL DASHBOARD LOAD
  // ==========================================================

  useEffect(() => {

    loadDashboard();

  }, [
    loadDashboard,
  ]);


  // ==========================================================
  // ONLINE / OFFLINE REFRESH
  // ==========================================================

  useEffect(() => {

    const handleOnline =
      () => {

        loadDashboard(
          true
        );

      };

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );

    };

  }, [
    loadDashboard,
  ]);


  // ==========================================================
  // DERIVED
  // ==========================================================

  const weather =
    snapshot?.weather ||
    null;

  const current:
    | DashboardCurrentWeather
    | undefined =
    weather?.current;

  const news =
    snapshot?.news ||
    [];

  const memories =
    snapshot?.memories ||
    [];

  const watchlists =
    snapshot?.watchlists ||
    [];

  const notifications =
    snapshot?.notifications ||
    [];

  const preferences =
    snapshot?.preferences ||
    null;

  const analytics =
    snapshot?.analytics;


  const unreadNotifications =
    notifications.filter(
      (
        item
      ) =>
        item.read !== true
    );


  const weatherAlerts =
    weather?.alerts ||
    [];


  const focus =
    snapshot
      ? getPersonalizedFocus(
          snapshot
        )
      : "dashboard";


  const locationName =
    getLocationName(
      weather
    );


  const locationSubtitle =
    getLocationSubtitle(
      weather
    );


  const topNews =
    news.slice(
      0,
      6
    );


  const topMemories =
    memories.slice(
      0,
      4
    );


  const topWatchlists =
    watchlists.slice(
      0,
      4
    );


  const topNotifications =
    unreadNotifications.slice(
      0,
      4
    );


  const topTabs =
    analytics
      ? Object.entries(
          analytics.tabOpens
        )
          .sort(
            (
              [, a],
              [, b]
            ) => b - a
          )
          .slice(
            0,
            4
          )
      : [];


  const forecast =
    weather?.forecast ||
    [];


  const priorityMessage =
    useMemo(
      () => {

        if (
          unreadNotifications.length >
          0
        ) {

          return "You have notifications that deserve attention.";

        }

        if (
          weatherAlerts.length >
          0
        ) {

          return "KANCHHI detected active weather concerns for your location.";

        }

        if (
          watchlists.length >
          0
        ) {

          return "Your watchlists are being used to prioritize relevant news.";

        }

        if (
          topNews.length >
          0
        ) {

          return "Your news feed has been personalized using your preferences and watchlists.";

        }

        return "KANCHHI is ready to personalize your information hub.";

      },
      [
        unreadNotifications.length,
        weatherAlerts.length,
        watchlists.length,
        topNews.length,
      ]
    );


  // ==========================================================
  // BRIEFING
  // ==========================================================

  const generateBriefing =
    async (
      type:
        | "morning"
        | "evening"
    ) => {

      setBriefingType(
        type
      );

      setBriefingLoading(
        true
      );

      setBriefingError("");

      try {

        const result =
          type === "morning"
            ? await generateMorningBriefing()
            : await generateEveningBriefing();

        if (
          typeof result ===
          "string"
        ) {

          setBriefingText(
            result
          );

        } else if (
          result &&
          typeof result ===
            "object"
        ) {

          const record =
            result as Record<
              string,
              unknown
            >;

          setBriefingText(
            String(
              record.reply ||
              record.text ||
              record.interpretation ||
              "KANCHHI did not return briefing content."
            )
          );

        } else {

          setBriefingText(
            "KANCHHI did not return briefing content."
          );

        }

      } catch (
        briefingRequestError
      ) {

        console.error(
          "KANCHHI dashboard briefing error:",
          briefingRequestError
        );

        setBriefingError(
          briefingRequestError instanceof
            Error
            ? briefingRequestError.message
            : "Unable to generate the briefing."
        );

      } finally {

        setBriefingLoading(
          false
        );

      }

    };


  // ==========================================================
  // HYDRATION-SAFE LOADING
  // ==========================================================

  if (
    !mounted &&
    !snapshot
  ) {

    return (
      <section className="min-h-screen bg-[#0b1220] p-6 md:p-8">
        <div className="mx-auto w-full max-w-[1400px]">

          <div className="mb-7">
            <div className="h-3 w-32 animate-pulse rounded bg-slate-800" />
            <div className="mt-3 h-9 w-64 animate-pulse rounded bg-slate-800" />
            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-800" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-2xl border border-slate-800 bg-[#111c2e]"
                />
              )
            )}

          </div>

          <div className="mt-5 h-80 animate-pulse rounded-2xl border border-slate-800 bg-[#111c2e]" />

        </div>
      </section>
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <section className="min-h-screen bg-[#0b1220] p-6 md:p-8">

      <div className="mx-auto w-full max-w-[1400px]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="text-xs font-medium uppercase tracking-wider text-blue-400">
              KANCHHI PERSONALIZED DASHBOARD
            </div>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-4xl">

              {currentTime
                ? getGreeting(
                    currentTime
                  )
                : "Welcome back"}{" "}

              👋

            </h1>

            <p className="mt-2 text-sm text-slate-400">

              KANCHHI is prioritizing your information using your preferences,
              memory, watchlists, activity, and live context.

            </p>

            {currentTime && (

              <p className="mt-2 text-xs text-slate-600">

                {currentTime.toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }
                )}

                {" • "}

                {formatClock(
                  currentTime
                )}

              </p>

            )}

          </div>


          <div className="flex flex-wrap gap-3">

            <div className="rounded-xl border border-slate-800 bg-[#111c2e] px-4 py-3">

              <div className="text-[10px] uppercase tracking-wider text-slate-600">
                KANCHHI FOCUS
              </div>

              <div className="mt-1 text-sm font-medium capitalize text-slate-200">
                {focus}
              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                loadDashboard(true)
              }
              disabled={
                refreshing
              }
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}

            </button>

          </div>

        </div>


        {/* ==================================================
            OFFLINE / CACHE
        ================================================== */}

        {snapshot?.offline && (

          <div className="mb-6 rounded-2xl border border-amber-700/60 bg-amber-950/30 px-5 py-4">

            <div className="flex items-start gap-3">

              <span className="text-lg">
                ◐
              </span>

              <div>

                <p className="font-semibold text-amber-300">
                  Offline personalized dashboard
                </p>

                <p className="mt-1 text-sm text-amber-200/70">

                  KANCHHI is showing the latest locally cached information.

                  {snapshot.savedAt
                    ? ` Cached ${getDashboardCacheAge(
                        snapshot.savedAt
                      )} ago.`
                    : ""}

                </p>

              </div>

            </div>

          </div>

        )}


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/30 p-5">

            <p className="font-semibold text-red-300">
              Personalized dashboard partially unavailable
            </p>

            <p className="mt-2 text-sm text-red-200/70">
              {error}
            </p>

          </div>

        )}


        {/* ==================================================
            PRIORITY SUMMARY
        ================================================== */}

        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 to-[#111c2e] p-5">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="text-[11px] font-medium uppercase tracking-wider text-blue-400">
                KANCHHI PRIORITY
              </div>

              <div className="mt-1 text-lg font-semibold text-white">
                Personalized for you
              </div>

              <p className="mt-1 text-sm text-slate-400">
                {priorityMessage}
              </p>

            </div>


            <div className="text-right">

              <div className="text-xs text-slate-600">
                Personalized stories
              </div>

              <div className="text-2xl font-bold text-white">
                {news.length}
              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            TOP CONTEXT CARDS
        ================================================== */}

        <div className="grid gap-5 lg:grid-cols-3">


          {/* WEATHER */}

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  WEATHER
                </div>

                <div className="mt-1 text-lg font-semibold text-white">
                  {locationName}
                </div>

                <div className="mt-1 max-w-[260px] text-xs leading-5 text-slate-500">
                  {locationSubtitle ||
                    "Current location"}
                </div>

              </div>

              <div className="text-3xl">
                {current?.icon ||
                  "☁️"}
              </div>

            </div>


            <div className="mt-6 flex items-end justify-between gap-4">

              <div>

                <div className="text-4xl font-semibold text-white">

                  {formatTemperature(
                    current?.temperature
                  )}

                </div>

                <div className="mt-2 text-sm text-slate-400">

                  {current?.condition ||
                    "Weather information unavailable"}

                </div>

              </div>


              {weatherAlerts.length >
                0 && (

                <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-right">

                  <div className="text-[10px] uppercase tracking-wider text-amber-400">
                    Alerts
                  </div>

                  <div className="text-xl font-bold text-amber-200">
                    {weatherAlerts.length}
                  </div>

                </div>

              )}

            </div>


            <div className="mt-5 grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-[#0d1728] px-3 py-3">

                <div className="text-[10px] uppercase tracking-wider text-slate-600">
                  Humidity
                </div>

                <div className="mt-1 text-sm text-slate-300">
                  💧{" "}
                  {formatNumber(
                    current?.humidity,
                    "%"
                  )}
                </div>

              </div>


              <div className="rounded-xl bg-[#0d1728] px-3 py-3">

                <div className="text-[10px] uppercase tracking-wider text-slate-600">
                  Wind
                </div>

                <div className="mt-1 text-sm text-slate-300">
                  💨{" "}
                  {formatNumber(
                    current?.wind_speed,
                    " km/h"
                  )}
                </div>

              </div>

            </div>


            {weather?.last_updated && (

              <div className="mt-4 text-[10px] text-slate-600">
                Updated {weather.last_updated}
                {weather.timezone
                  ? ` • ${weather.timezone}`
                  : ""}
              </div>

            )}

          </div>


          {/* NOTIFICATIONS */}

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  PERSONAL ATTENTION
                </div>

                <div className="mt-1 text-lg font-semibold text-white">
                  Your updates
                </div>

              </div>

              <div className="text-2xl">
                🔔
              </div>

            </div>


            <div className="mt-5 flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-xl font-semibold text-blue-400">

                {unreadNotifications.length}

              </div>

              <div>

                <div className="text-sm text-slate-300">

                  Unread notifications

                </div>

                <div className="mt-1 text-xs text-slate-500">

                  {unreadNotifications.length >
                  0
                    ? "KANCHHI thinks these need your attention."
                    : "Nothing urgent from your notification feed."}

                </div>

              </div>

            </div>


            {topNotifications.length >
              0 && (

              <div className="mt-5 space-y-2">

                {topNotifications.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={
                        item.id ||
                        `${getNotificationText(
                          item
                        )}-${index}`
                      }
                      className="rounded-xl border border-slate-800 bg-[#0d1728] p-3"
                    >

                      <div className="text-xs font-medium text-slate-300">

                        {getNotificationText(
                          item
                        )}

                      </div>

                      {item.message &&
                        item.title && (

                          <div className="mt-1 text-[11px] leading-5 text-slate-500">
                            {item.message}
                          </div>

                        )}

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* WATCHLISTS */}

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  WATCHLISTS
                </div>

                <div className="mt-1 text-lg font-semibold text-white">
                  Your interests
                </div>

              </div>

              <div className="text-2xl">
                👁️
              </div>

            </div>


            <div className="mt-5 text-3xl font-bold text-white">
              {watchlists.length}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              active watchlists used for personalization
            </p>


            {topWatchlists.length >
              0 ? (

              <div className="mt-5 flex flex-wrap gap-2">

                {topWatchlists.map(
                  (
                    item,
                    index
                  ) => (

                    <span
                      key={
                        item.id ||
                        `${getWatchlistText(
                          item
                        )}-${index}`
                      }
                      className="rounded-lg border border-blue-500/10 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300"
                    >
                      {getWatchlistText(
                        item
                      )}
                    </span>

                  )
                )}

              </div>

            ) : (

              <div className="mt-5 rounded-xl border border-slate-800 bg-[#0d1728] p-3 text-xs text-slate-600">
                Add watchlists to make KANCHHI's news ranking more personal.
              </div>

            )}

          </div>

        </div>


        {/* ==================================================
            PERSONALIZED NEWS
        ================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

            <div>

              <div className="text-[11px] font-medium uppercase tracking-wider text-blue-400">
                KANCHHI RANKING
              </div>

              <div className="mt-1 text-xl font-semibold text-white">
                News prioritized for you
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Ranking uses your preferences, watchlists, and article relevance.
              </p>

            </div>

            <div className="text-xs text-slate-600">
              {news.length} stories
            </div>

          </div>


          {topNews.length >
          0 ? (

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">

              {topNews.map(
                (
                  article,
                  index
                ) => (

                  <a
                    key={
                      `${
                        article.link ||
                        article.title ||
                        "news"
                      }-${index}`
                    }
                    href={
                      article.link ||
                      "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-xl border border-slate-800 bg-[#0d1728] p-4 transition hover:border-blue-500/30 hover:bg-slate-900/60"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-2">

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs text-blue-400">

                          {article._kanchhi_rank ??
                            index + 1}

                        </span>

                        <span className="text-[10px] uppercase tracking-wider text-slate-600">

                          {article.source ||
                            "News"}

                        </span>

                      </div>


                      {(article._kanchhi_score ??
                        0) >
                        0 && (

                        <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                          Relevant
                        </span>

                      )}

                    </div>


                    <div className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-200 group-hover:text-white">

                      {article.title ||
                        "Untitled news"}

                    </div>


                    {article.description && (

                      <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                        {article.description}
                      </div>

                    )}

                  </a>

                )
              )}

            </div>

          ) : (

            <div className="mt-5 rounded-xl border border-slate-800 bg-[#0d1728] p-6 text-center text-sm text-slate-500">
              No news is currently available for personalization.
            </div>

          )}

        </div>


        {/* ==================================================
            WEATHER FORECAST
        ================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                CONTEXT
              </div>

              <div className="mt-1 text-xl font-semibold text-white">
                Upcoming weather
              </div>

            </div>

            <div className="text-2xl">
              📅
            </div>

          </div>


          {forecast.length >
          0 ? (

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">

              {forecast
                .slice(
                  0,
                  7
                )
                .map(
                  (
                    day,
                    index
                  ) => (

                    <div
                      key={
                        `${day.date || "day"}-${index}`
                      }
                      className="rounded-xl border border-slate-800 bg-[#0d1728] p-3"
                    >

                      <div className="text-xs font-medium text-slate-400">

                        {index === 0
                          ? "Today"
                          : formatForecastDate(
                              day.date
                            )}

                      </div>

                      <div className="mt-3 text-2xl">
                        {day.icon ||
                          "☁️"}
                      </div>

                      <div className="mt-3 flex items-center gap-2">

                        <span className="text-sm font-semibold text-white">
                          {formatTemperature(
                            day.temperature_max
                          )}
                        </span>

                        <span className="text-xs text-slate-500">
                          {formatTemperature(
                            day.temperature_min
                          )}
                        </span>

                      </div>

                      <div className="mt-2 line-clamp-2 text-[11px] text-slate-500">
                        {day.condition ||
                          "Unknown"}
                      </div>

                      <div className="mt-3 text-[11px] text-blue-400">

                        💧{" "}

                        {typeof day.precipitation_probability ===
                        "number"
                          ? `${Math.round(
                              day.precipitation_probability
                            )}%`
                          : "--"}

                      </div>

                    </div>

                  )
                )}

            </div>

          ) : (

            <div className="mt-5 rounded-xl border border-slate-800 bg-[#0d1728] p-5 text-sm text-slate-500">
              Forecast information is unavailable.
            </div>

          )}

        </div>


        {/* ==================================================
            MEMORY + PREFERENCES
        ================================================== */}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">


          {/* MEMORY */}

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  KANCHHI MEMORY
                </div>

                <div className="mt-1 text-xl font-semibold text-white">
                  Personalized information
                </div>

              </div>

              <div className="text-2xl">
                🧠
              </div>

            </div>


            <div className="mt-5 text-3xl font-bold text-white">
              {memories.length}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              saved memory items available to KANCHHI
            </p>


            {topMemories.length >
            0 ? (

              <div className="mt-5 space-y-2">

                {topMemories.map(
                  (
                    memory,
                    index
                  ) => (

                    <div
                      key={
                        memory.id ||
                        memory.key ||
                        `${index}`
                      }
                      className="rounded-xl border border-slate-800 bg-[#0d1728] p-3"
                    >

                      <div className="line-clamp-2 text-sm text-slate-300">

                        {getMemoryText(
                          memory
                        )}

                      </div>

                      {memory.category && (

                        <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                          {memory.category}
                        </div>

                      )}

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="mt-5 rounded-xl border border-slate-800 bg-[#0d1728] p-4 text-sm text-slate-500">
                KANCHHI has no saved memory items yet.
              </div>

            )}

          </div>


          {/* PREFERENCES */}

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  USER PREFERENCES
                </div>

                <div className="mt-1 text-xl font-semibold text-white">
                  Personal context
                </div>

              </div>

              <div className="text-2xl">
                ⚙️
              </div>

            </div>


            <div className="mt-5 rounded-xl border border-slate-800 bg-[#0d1728] p-5">

              <p className="text-sm leading-6 text-slate-300">

                {getPreferenceSummary(
                  preferences
                )}

              </p>

            </div>


            <div className="mt-4 text-xs text-slate-600">
              KANCHHI uses this context to prioritize information across the dashboard.
            </div>

          </div>

        </div>


        {/* ==================================================
            ANALYTICS / PERSONALIZATION
        ================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-[11px] font-medium uppercase tracking-wider text-blue-400">
                PERSONALIZATION SIGNALS
              </div>

              <div className="mt-1 text-xl font-semibold text-white">
                How KANCHHI adapts to you
              </div>

            </div>

            <div className="text-2xl">
              📊
            </div>

          </div>


          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">


            <div className="rounded-xl border border-slate-800 bg-[#0d1728] p-4">

              <div className="text-[10px] uppercase tracking-wider text-slate-600">
                Events
              </div>

              <div className="mt-1 text-2xl font-bold text-white">
                {analytics?.totalEvents ??
                  0}
              </div>

            </div>


            <div className="rounded-xl border border-slate-800 bg-[#0d1728] p-4">

              <div className="text-[10px] uppercase tracking-wider text-slate-600">
                Sessions
              </div>

              <div className="mt-1 text-2xl font-bold text-white">
                {analytics?.totalSessions ??
                  0}
              </div>

            </div>


            <div className="rounded-xl border border-slate-800 bg-[#0d1728] p-4">

              <div className="text-[10px] uppercase tracking-wider text-slate-600">
                Usage
              </div>

              <div className="mt-1 text-2xl font-bold text-white">

                {analytics
                  ? formatAnalyticsDuration(
                      analytics.sessionDurationMs
                    )
                  : "0m"}

              </div>

            </div>


            <div className="rounded-xl border border-slate-800 bg-[#0d1728] p-4">

              <div className="text-[10px] uppercase tracking-wider text-slate-600">
                Top Section
              </div>

              <div className="mt-1 text-lg font-bold capitalize text-white">

                {topTabs[0]?.[0] ||
                  "dashboard"}

              </div>

            </div>

          </div>


          {topTabs.length >
            0 && (

            <div className="mt-5">

              <div className="mb-3 text-xs text-slate-500">
                Frequently used sections
              </div>

              <div className="flex flex-wrap gap-2">

                {topTabs.map(
                  (
                    [tab, count]
                  ) => (

                    <span
                      key={tab}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-400"
                    >

                      {tab}

                      {" • "}

                      {count}

                    </span>

                  )
                )}

              </div>

            </div>

          )}

        </div>


        {/* ==================================================
            MORNING / EVENING INTELLIGENCE
        ================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#111c2e] p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <div className="text-[11px] font-medium uppercase tracking-wider text-blue-400">
                KANCHHI INTELLIGENCE
              </div>

              <div className="mt-1 text-xl font-semibold text-white">
                Morning / Evening intelligence
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Generate a personalized briefing using KANCHHI's existing intelligence engine.
              </p>

            </div>


            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  generateBriefing(
                    "morning"
                  )
                }
                disabled={
                  briefingLoading
                }
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {briefingLoading &&
                briefingType ===
                  "morning"
                  ? "Generating..."
                  : "🌅 Morning"}

              </button>


              <button
                type="button"
                onClick={() =>
                  generateBriefing(
                    "evening"
                  )
                }
                disabled={
                  briefingLoading
                }
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {briefingLoading &&
                briefingType ===
                  "evening"
                  ? "Generating..."
                  : "🌙 Evening"}

              </button>

            </div>

          </div>


          {briefingError && (

            <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
              {briefingError}
            </div>

          )}


          {briefingText && (

            <div className="mt-5 max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-[#0d1728] p-5">

              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">

                {briefingText}

              </div>

            </div>

          )}


          {!briefingText &&
            !briefingError && (

              <div className="mt-5 rounded-xl border border-slate-800 bg-[#0d1728] p-5 text-sm text-slate-600">

                Select Morning or Evening to generate KANCHHI intelligence.

              </div>

            )}

        </div>


        {/* ==================================================
            PERSONALIZED RECOMMENDATION
        ================================================== */}

        <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-xl">
              ✨
            </div>

            <div>

              <div className="text-[11px] font-medium uppercase tracking-wider text-blue-400">
                KANCHHI RECOMMENDATION
              </div>

              <div className="mt-1 text-lg font-semibold text-white">

                {unreadNotifications.length >
                0
                  ? "Review your notifications first."
                  : weatherAlerts.length >
                    0
                    ? "Check today's weather alerts before heading out."
                    : watchlists.length >
                      0
                      ? "Review the personalized news selected from your watchlists."
                      : preferences
                        ? "Your dashboard is adapting to your configured preferences."
                        : "Configure your preferences and watchlists to make KANCHHI more personal."}

              </div>

              <p className="mt-2 text-sm leading-6 text-slate-400">

                KANCHHI continuously prioritizes the information most relevant
                to your current context without changing the underlying modules.

              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-900 pt-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">

          <div>
            KANCHHI Personalized Dashboard • Phase 9
          </div>

          <div>

            {snapshot?.savedAt
              ? `Personalized snapshot ${getDashboardCacheAge(
                  snapshot.savedAt
                )} ago`
              : "Building personalized snapshot"}

          </div>

        </div>

      </div>

    </section>

  );
}