"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearAnalyticsEvents,
  formatAnalyticsDuration,
  getAnalyticsDailyActivity,
  getAnalyticsEvents,
  getAnalyticsSummary,
  getOfflineAnalytics,
  isAnalyticsEnabled,
  setAnalyticsEnabled,
  type KanchhiAnalyticsEvent,
  type KanchhiAnalyticsSummary,
} from "@/lib/kanchhiAnalytics";

// ============================================================
// HELPERS
// ============================================================

function formatDateTime(
  timestamp: number | null
): string {
  if (!timestamp) {
    return "--";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getEventLabel(
  name: string
): string {
  const labels: Record<string, string> = {
    app_open: "App Open",
    tab_open: "Tab Open",
    session_start: "Session Start",
    session_end: "Session End",
    offline: "Offline",
    online: "Online",
    weather_refresh: "Weather Used",
    news_refresh: "News Used",
    search_used: "Search Used",
    assistant_used: "Assistant Used",
    notification_open: "Notifications Opened",
    preferences_open: "Preferences Used",
    memory_open: "Memory Opened",
    pwa_launch: "PWA Launch",
    analytics_open: "Analytics Opened",
    code_used: "Code Used",
  };

  return labels[name] || name;
}

function getEventIcon(
  name: string
): string {
  const icons: Record<string, string> = {
    app_open: "🚀",
    tab_open: "📂",
    session_start: "▶️",
    session_end: "⏹️",
    offline: "📡",
    online: "🌐",
    weather_refresh: "☁️",
    news_refresh: "📰",
    search_used: "⌕",
    assistant_used: "🤖",
    notification_open: "🔔",
    preferences_open: "⚙️",
    memory_open: "🧠",
    pwa_launch: "📱",
    analytics_open: "📊",
    code_used: "</>",
  };

  return icons[name] || "•";
}

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>

          <p className="text-3xl font-bold text-white mt-2">
            {value}
          </p>
        </div>

        <span className="text-2xl shrink-0">
          {icon}
        </span>
      </div>

      <p className="text-xs text-slate-600 mt-3">
        {detail}
      </p>
    </div>
  );
}

function EmptyBox({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mt-5 rounded-xl bg-slate-900/60 border border-slate-800 p-6 text-center text-slate-500">
      {children}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AnalyticsPanel() {
  const [summary, setSummary] =
    useState<KanchhiAnalyticsSummary>(
      () => getAnalyticsSummary()
    );

  const [events, setEvents] =
    useState<KanchhiAnalyticsEvent[]>(
      () => getAnalyticsEvents()
    );

  const [analyticsEnabled, setAnalyticsEnabledState] =
    useState(() => isAnalyticsEnabled());

  const [isOnline, setIsOnline] =
    useState(true);

  const [showEvents, setShowEvents] =
    useState(false);

  const [offlineData, setOfflineData] =
    useState(() => getOfflineAnalytics());

  const [dailyActivity, setDailyActivity] =
    useState(() => getAnalyticsDailyActivity(7));

  // ==========================================================
  // REFRESH ANALYTICS
  // ==========================================================

  const refreshAnalytics = useCallback(() => {
    setSummary(getAnalyticsSummary());

    setEvents(getAnalyticsEvents());

    setAnalyticsEnabledState(
      isAnalyticsEnabled()
    );

    setOfflineData(
      getOfflineAnalytics()
    );

    setDailyActivity(
      getAnalyticsDailyActivity(7)
    );
  }, []);

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshAnalytics();
  }, [refreshAnalytics]);

  // ==========================================================
  // NETWORK + STORAGE LISTENERS
  // ==========================================================

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshAnalytics();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshAnalytics();
    };

    const handleStorage = () => {
      refreshAnalytics();
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    const interval = window.setInterval(
      refreshAnalytics,
      3000
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.clearInterval(interval);
    };
  }, [refreshAnalytics]);

  // ==========================================================
  // ANALYTICS TOGGLE
  // ==========================================================

  const handleAnalyticsToggle = () => {
    const next = !analyticsEnabled;

    setAnalyticsEnabled(next);

    setAnalyticsEnabledState(next);

    refreshAnalytics();
  };

  // ==========================================================
  // CLEAR ANALYTICS
  // ==========================================================

  const handleClear = () => {
    const confirmed = window.confirm(
      "Clear all locally stored KANCHHI analytics data?"
    );

    if (!confirmed) {
      return;
    }

    clearAnalyticsEvents();

    refreshAnalytics();
  };

  // ==========================================================
  // MOST USED TABS
  // ==========================================================

  const topTabs = useMemo(() => {
    return Object.entries(summary.tabOpens)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [summary.tabOpens]);

  // ==========================================================
  // TOP EVENT TYPES
  // ==========================================================

  const topEvents = useMemo(() => {
    return Object.entries(summary.eventCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [summary.eventCounts]);

  // ==========================================================
  // RECENT EVENTS
  // ==========================================================

  const recentEvents = useMemo(() => {
    return [...events]
      .sort(
        (a, b) =>
          b.timestamp - a.timestamp
      )
      .slice(0, 20);
  }, [events]);

  // ==========================================================
  // RECENT SESSIONS
  // ==========================================================

  const recentSessions = useMemo(() => {
    return summary.sessions.slice(0, 6);
  }, [summary.sessions]);

  // ==========================================================
  // DAILY MAXIMUM
  // ==========================================================

  const dailyMaximum = Math.max(
    1,
    ...dailyActivity.map(
      (item) => item.count
    )
  );

  // ==========================================================
  // OFFLINE RATIO
  // ==========================================================

  const offlinePercent = Math.round(
    offlineData.offlineRatio
  );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="min-h-screen bg-[#0b1220] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
          <div>
            <p className="text-sm uppercase tracking-wider text-blue-400">
              KANCHHI ANALYTICS
            </p>

            <h1 className="text-4xl font-bold mt-2 text-white">
              Usage Analytics
            </h1>

            <p className="text-slate-400 mt-2 max-w-3xl">
              Local usage statistics, session information,
              activity trends and offline behavior.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAnalytics}
            className="self-start px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition text-white"
          >
            ↻ Refresh Analytics
          </button>
        </div>

        {/* ==================================================
            STATUS
        ================================================== */}

        <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-5 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    analyticsEnabled
                      ? "bg-emerald-400"
                      : "bg-slate-600"
                  }`}
                />

                <p className="font-semibold text-slate-200">
                  Local analytics
                </p>
              </div>

              <p className="text-sm text-slate-500 mt-2">
                Analytics are stored only in this browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <span className="px-3 py-1.5 rounded-full text-xs border border-slate-700 bg-slate-900/60 text-slate-300">
                {isOnline
                  ? "🌐 Online"
                  : "📡 Offline"}
              </span>

              <span className="px-3 py-1.5 rounded-full text-xs border border-slate-700 bg-slate-900/60 text-slate-300">
                {events.length} events
              </span>

              <button
                type="button"
                onClick={handleAnalyticsToggle}
                className={`px-4 py-2.5 rounded-xl border transition ${
                  analyticsEnabled
                    ? "bg-blue-600 border-blue-500 hover:bg-blue-500 text-white"
                    : "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
                }`}
              >
                {analyticsEnabled
                  ? "Analytics Enabled"
                  : "Analytics Disabled"}
              </button>

            </div>
          </div>
        </div>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          <MetricCard
            label="Total Events"
            value={summary.totalEvents}
            detail="Stored locally"
            icon="📊"
          />

          <MetricCard
            label="Sessions"
            value={summary.totalSessions}
            detail="Browser sessions"
            icon="▶️"
          />

          <MetricCard
            label="Usage Time"
            value={formatAnalyticsDuration(
              summary.sessionDurationMs
            )}
            detail="Approximate tracked time"
            icon="⏱️"
          />

          <MetricCard
            label="Events / Session"
            value={summary.eventsPerSession.toFixed(1)}
            detail="Average activity"
            icon="⚡"
          />

        </div>

        {/* ==================================================
            DAILY ACTIVITY
        ================================================== */}

        <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6 mb-8">

          <p className="text-xs uppercase tracking-wider text-blue-400">
            23D ACTIVITY
          </p>

          <h2 className="text-xl font-semibold text-white mt-1">
            Last 7 Days
          </h2>

          <div className="grid grid-cols-7 gap-2 md:gap-3 mt-6">

            {dailyActivity.map((item) => {
              const percent = Math.max(
                item.count > 0 ? 8 : 2,
                Math.round(
                  (item.count / dailyMaximum) *
                    100
                )
              );

              const label = new Date(
                `${item.date}T12:00:00`
              ).toLocaleDateString(
                undefined,
                {
                  weekday: "short",
                }
              );

              return (
                <div
                  key={item.date}
                  className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-center"
                >
                  <p className="text-xs text-slate-500">
                    {label}
                  </p>

                  <div className="h-28 mt-3 flex items-end justify-center">
                    <div
                      className="w-5 rounded-t-lg bg-blue-600 transition-all"
                      style={{
                        height: `${percent}%`,
                      }}
                    />
                  </div>

                  <p className="text-sm font-semibold text-slate-300 mt-3">
                    {item.count}
                  </p>
                </div>
              );
            })}

          </div>
        </div>

        {/* ==================================================
            SESSION STATISTICS
        ================================================== */}

        <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6 mb-8">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <p className="text-xs uppercase tracking-wider text-blue-400">
                23C SESSION STATISTICS
              </p>

              <h2 className="text-xl font-semibold text-white mt-1">
                Session Performance
              </h2>
            </div>

            <span className="text-sm text-slate-500">
              {summary.totalSessions} sessions
            </span>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

            <MetricCard
              label="Average Session"
              value={formatAnalyticsDuration(
                summary.averageSessionDurationMs
              )}
              detail="Average duration"
              icon="⏱️"
            />

            <MetricCard
              label="Longest Session"
              value={formatAnalyticsDuration(
                summary.longestSessionDurationMs
              )}
              detail="Longest tracked session"
              icon="🏆"
            />

            <MetricCard
              label="Network Events"
              value={
                summary.offlineCount +
                summary.onlineCount
              }
              detail="Online + offline transitions"
              icon="📡"
            />

          </div>

          {recentSessions.length > 0 ? (
            <div className="mt-6 space-y-2">

              {recentSessions.map(
                (
                  session,
                  index
                ) => (
                  <div
                    key={session.sessionId}
                    className="rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                      <div>
                        <p className="text-sm text-slate-300">
                          Session {index + 1}
                        </p>

                        <p className="text-xs text-slate-600 mt-1">
                          Started{" "}
                          {formatDateTime(
                            session.startedAt
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">

                        <span>
                          {session.eventCount} events
                        </span>

                        <span>
                          {formatAnalyticsDuration(
                            session.durationMs
                          )}
                        </span>

                        {session.offlineEvents > 0 && (
                          <span className="text-amber-400">
                            {session.offlineEvents} offline
                          </span>
                        )}

                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          ) : (
            <EmptyBox>
              No session statistics available yet.
            </EmptyBox>
          )}

        </div>

        {/* ==================================================
            NAVIGATION + FEATURE ACTIVITY
        ================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

          {/* NAVIGATION */}

          <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6">

            <p className="text-xs uppercase tracking-wider text-blue-400">
              NAVIGATION
            </p>

            <h2 className="text-xl font-semibold text-white mt-1">
              Most Used Sections
            </h2>

            {topTabs.length === 0 ? (
              <EmptyBox>
                No navigation data yet.
              </EmptyBox>
            ) : (
              <div className="space-y-4 mt-6">

                {topTabs.map(
                  ([tab, count]) => {
                    const maximum =
                      topTabs[0]?.[1] || 1;

                    const percent =
                      Math.max(
                        5,
                        Math.round(
                          (count / maximum) *
                            100
                        )
                      );

                    return (
                      <div key={tab}>

                        <div className="flex items-center justify-between mb-2">

                          <span className="text-sm text-slate-300 capitalize">
                            {tab}
                          </span>

                          <span className="text-sm text-slate-500">
                            {count}
                          </span>

                        </div>

                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                              width: `${percent}%`,
                            }}
                          />
                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* FEATURE ACTIVITY */}

          <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6">

            <p className="text-xs uppercase tracking-wider text-blue-400">
              FEATURE ACTIVITY
            </p>

            <h2 className="text-xl font-semibold text-white mt-1">
              Activity Breakdown
            </h2>

            {topEvents.length === 0 ? (
              <EmptyBox>
                No feature activity yet.
              </EmptyBox>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-6">

                {topEvents.map(
                  ([name, count]) => (
                    <div
                      key={name}
                      className="rounded-xl bg-slate-900/70 border border-slate-800 p-4"
                    >

                      <div className="text-xl">
                        {getEventIcon(name)}
                      </div>

                      <p className="text-sm text-slate-400 mt-2">
                        {getEventLabel(name)}
                      </p>

                      <p className="text-2xl font-bold text-white mt-1">
                        {count}
                      </p>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

        {/* ==================================================
            23E OFFLINE ANALYTICS
        ================================================== */}

        <div className="rounded-2xl bg-[#111c2e] border border-amber-900/40 p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <p className="text-xs uppercase tracking-wider text-amber-400">
                23E OFFLINE ANALYTICS
              </p>

              <h2 className="text-xl font-semibold text-white mt-1">
                Offline Activity
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Offline and online network transitions are retained locally.
              </p>

            </div>

            <span
              className={`px-3 py-1.5 rounded-full text-xs border ${
                isOnline
                  ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-300"
                  : "border-amber-700/50 bg-amber-950/30 text-amber-300"
              }`}
            >
              {isOnline
                ? "Currently Online"
                : "Currently Offline"}
            </span>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

            <MetricCard
              label="Offline Events"
              value={offlineData.offlineCount}
              detail="Times offline mode detected"
              icon="📡"
            />

            <MetricCard
              label="Online Events"
              value={offlineData.onlineCount}
              detail="Times connection returned"
              icon="🌐"
            />

            <MetricCard
              label="Offline Ratio"
              value={`${offlinePercent}%`}
              detail="Of recorded network transitions"
              icon="◐"
            />

          </div>

          {offlineData.recentOfflineEvents.length >
          0 ? (
            <div className="mt-6 space-y-2">

              {offlineData.recentOfflineEvents.map(
                (event) => (
                  <div
                    key={event.id}
                    className="rounded-xl bg-amber-950/20 border border-amber-900/30 px-4 py-3"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <div className="flex items-center gap-3">

                        <span>
                          📡
                        </span>

                        <span className="text-sm text-slate-300">
                          Offline detected
                        </span>

                      </div>

                      <span className="text-xs text-slate-600">
                        {formatDateTime(
                          event.timestamp
                        )}
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <EmptyBox>
              No offline transitions have been recorded yet.
            </EmptyBox>
          )}

        </div>

        {/* ==================================================
            ANALYTICS RANGE
        ================================================== */}

        <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6 mb-8">

          <p className="text-xs uppercase tracking-wider text-blue-400">
            ANALYTICS RANGE
          </p>

          <h2 className="text-xl font-semibold text-white mt-1">
            Tracking Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">

            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">

              <p className="text-xs text-slate-500">
                First Recorded Event
              </p>

              <p className="text-sm text-slate-300 mt-2">
                {formatDateTime(
                  summary.firstEventAt
                )}
              </p>

            </div>

            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">

              <p className="text-xs text-slate-500">
                Latest Recorded Event
              </p>

              <p className="text-sm text-slate-300 mt-2">
                {formatDateTime(
                  summary.lastEventAt
                )}
              </p>

            </div>

          </div>
        </div>

        {/* ==================================================
            RECENT EVENTS
        ================================================== */}

        <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6 mb-8">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <p className="text-xs uppercase tracking-wider text-blue-400">
                EVENT LOG
              </p>

              <h2 className="text-xl font-semibold text-white mt-1">
                Recent Events
              </h2>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowEvents(
                  (value) => !value
                )
              }
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition text-white"
            >
              {showEvents
                ? "Hide Events"
                : "Show Events"}
            </button>

          </div>

          {showEvents && (
            <div className="mt-5 space-y-2">

              {recentEvents.length === 0 ? (
                <EmptyBox>
                  No events recorded yet.
                </EmptyBox>
              ) : (
                recentEvents.map(
                  (event) => (
                    <div
                      key={event.id}
                      className="rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-3"
                    >

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                        <div className="flex items-center gap-3">

                          <span>
                            {getEventIcon(
                              event.name
                            )}
                          </span>

                          <span className="text-sm text-slate-300">
                            {getEventLabel(
                              event.name
                            )}
                          </span>

                        </div>

                        <span className="text-xs text-slate-600">
                          {formatDateTime(
                            event.timestamp
                          )}
                        </span>

                      </div>

                      {event.metadata &&
                        Object.keys(
                          event.metadata
                        ).length > 0 && (
                          <p className="text-xs text-slate-600 mt-2 pl-7">
                            {Object.entries(
                              event.metadata
                            )
                              .map(
                                (
                                  [
                                    key,
                                    value,
                                  ]
                                ) =>
                                  `${key}: ${String(
                                    value
                                  )}`
                              )
                              .join(
                                " • "
                              )}
                          </p>
                        )}

                    </div>
                  )
                )
              )}

            </div>
          )}

        </div>

        {/* ==================================================
            DATA MANAGEMENT
        ================================================== */}

        <div className="rounded-2xl bg-[#111c2e] border border-red-900/40 p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <p className="text-xs uppercase tracking-wider text-red-400">
                DATA MANAGEMENT
              </p>

              <h2 className="text-xl font-semibold text-white mt-1">
                Clear Local Analytics
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Permanently removes locally stored analytics events.
              </p>

            </div>

            <button
              type="button"
              onClick={handleClear}
              className="px-5 py-2.5 rounded-xl bg-red-950/50 border border-red-900 text-red-300 hover:bg-red-900/50 transition"
            >
              Clear Analytics Data
            </button>

          </div>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="text-xs text-slate-600 pb-8">
          KANCHHI Analytics 23D + 23E • Local storage only • Maximum 1000 events
        </div>

      </div>
    </section>
  );
}