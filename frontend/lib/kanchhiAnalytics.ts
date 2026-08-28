"use client";

// ============================================================
// KANCHHI ANALYTICS
// 23D — Analytics Dashboard
// 23E — Offline Analytics
//
// Local-first only.
// No analytics are sent to an external service.
//
// Do NOT store:
// - search text
// - AI conversations
// - memory contents
// - passwords
// - personal/private content
// ============================================================


// ============================================================
// TYPES
// ============================================================

export type KanchhiAnalyticsEventName =
  | "app_open"
  | "tab_open"
  | "session_start"
  | "session_end"
  | "offline"
  | "online"
  | "weather_refresh"
  | "news_refresh"
  | "search_used"
  | "assistant_used"
  | "notification_open"
  | "preferences_open"
  | "memory_open"
  | "pwa_launch"
  | "analytics_open"
  | "code_used";


export type KanchhiAnalyticsEvent = {
  id: string;

  name: KanchhiAnalyticsEventName;

  timestamp: number;

  sessionId: string;

  metadata?: Record<
    string,
    string | number | boolean | null
  >;
};


export type KanchhiAnalyticsSession = {
  sessionId: string;

  startedAt: number;

  endedAt: number | null;

  durationMs: number;

  eventCount: number;

  offlineEvents: number;

  onlineEvents: number;
};


export type KanchhiAnalyticsSummary = {
  totalEvents: number;

  totalSessions: number;

  sessionDurationMs: number;

  averageSessionDurationMs: number;

  longestSessionDurationMs: number;

  eventsPerSession: number;

  tabOpens: Record<
    string,
    number
  >;

  eventCounts: Record<
    KanchhiAnalyticsEventName,
    number
  >;

  offlineCount: number;

  onlineCount: number;

  firstEventAt: number | null;

  lastEventAt: number | null;

  sessions: KanchhiAnalyticsSession[];
};


// ============================================================
// CONSTANTS
// ============================================================

const ANALYTICS_STORAGE_KEY =
  "kanchhi-analytics-events";

const ANALYTICS_SESSION_KEY =
  "kanchhi-analytics-session";

const ANALYTICS_ENABLED_KEY =
  "kanchhi-analytics-enabled";

const MAX_EVENTS =
  1000;


const EVENT_NAMES:
  KanchhiAnalyticsEventName[] = [
    "app_open",
    "tab_open",
    "session_start",
    "session_end",
    "offline",
    "online",
    "weather_refresh",
    "news_refresh",
    "search_used",
    "assistant_used",
    "notification_open",
    "preferences_open",
    "memory_open",
    "pwa_launch",
    "analytics_open",
    "code_used",
  ];


// ============================================================
// BROWSER
// ============================================================

function isBrowser(): boolean {

  return (
    typeof window !== "undefined" &&
    typeof localStorage !== "undefined"
  );
}


// ============================================================
// ID
// ============================================================

function createId(
  prefix: string
): string {

  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return `${prefix}-${Date.now()}-${randomPart}`;
}


// ============================================================
// SESSION ID
// ============================================================

export function getKanchhiAnalyticsSessionId(): string {

  if (!isBrowser()) {
    return "server-session";
  }

  try {

    const existing =
      sessionStorage.getItem(
        ANALYTICS_SESSION_KEY
      );

    if (existing) {
      return existing;
    }

    const sessionId =
      createId("session");

    sessionStorage.setItem(
      ANALYTICS_SESSION_KEY,
      sessionId
    );

    return sessionId;

  } catch {

    return "fallback-session";
  }
}


// ============================================================
// ENABLED
// ============================================================

export function isAnalyticsEnabled(): boolean {

  if (!isBrowser()) {
    return false;
  }

  try {

    const stored =
      localStorage.getItem(
        ANALYTICS_ENABLED_KEY
      );

    if (stored === null) {
      return true;
    }

    return stored === "true";

  } catch {

    return true;
  }
}


// ============================================================
// ENABLE / DISABLE
// ============================================================

export function setAnalyticsEnabled(
  enabled: boolean
): void {

  if (!isBrowser()) {
    return;
  }

  try {

    localStorage.setItem(
      ANALYTICS_ENABLED_KEY,
      enabled
        ? "true"
        : "false"
    );

  } catch {
    // Ignore storage failure.
  }
}


// ============================================================
// LOAD
// ============================================================

export function getAnalyticsEvents():
  KanchhiAnalyticsEvent[] {

  if (!isBrowser()) {
    return [];
  }

  try {

    const raw =
      localStorage.getItem(
        ANALYTICS_STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (
        event
      ): event is KanchhiAnalyticsEvent =>
        Boolean(
          event &&
          typeof event.id === "string" &&
          typeof event.name === "string" &&
          typeof event.timestamp === "number" &&
          typeof event.sessionId === "string"
        )
    );

  } catch {

    return [];
  }
}


// ============================================================
// SAVE
// ============================================================

function saveAnalyticsEvents(
  events: KanchhiAnalyticsEvent[]
): void {

  if (!isBrowser()) {
    return;
  }

  try {

    localStorage.setItem(
      ANALYTICS_STORAGE_KEY,
      JSON.stringify(
        events.slice(-MAX_EVENTS)
      )
    );

  } catch {
    // Ignore storage failure.
  }
}


// ============================================================
// TRACK
// ============================================================

export function trackKanchhiEvent(
  name: KanchhiAnalyticsEventName,
  metadata?: Record<
    string,
    string | number | boolean | null
  >
): KanchhiAnalyticsEvent | null {

  if (!isBrowser()) {
    return null;
  }

  if (!isAnalyticsEnabled()) {
    return null;
  }

  const event:
    KanchhiAnalyticsEvent = {

    id:
      createId("event"),

    name,

    timestamp:
      Date.now(),

    sessionId:
      getKanchhiAnalyticsSessionId(),

    metadata,

  };

  const events =
    getAnalyticsEvents();

  events.push(event);

  saveAnalyticsEvents(events);

  return event;
}


// ============================================================
// TRACK TAB
// ============================================================

export function trackKanchhiTab(
  tab: string
): KanchhiAnalyticsEvent | null {

  return trackKanchhiEvent(
    "tab_open",
    {
      tab,
    }
  );
}


// ============================================================
// START SESSION
// ============================================================

export function startKanchhiAnalyticsSession(): void {

  if (!isBrowser()) {
    return;
  }

  if (!isAnalyticsEnabled()) {
    return;
  }

  const sessionId =
    getKanchhiAnalyticsSessionId();

  const events =
    getAnalyticsEvents();

  const hasSessionStart =
    events.some(
      (event) =>
        event.sessionId === sessionId &&
        event.name === "session_start"
    );

  if (hasSessionStart) {
    return;
  }

  trackKanchhiEvent(
    "session_start"
  );

  trackKanchhiEvent(
    "app_open"
  );

  const isStandalone =
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    (
      "standalone" in window.navigator &&
      Boolean(
        (
          window.navigator as Navigator & {
            standalone?: boolean;
          }
        ).standalone
      )
    );

  if (isStandalone) {

    trackKanchhiEvent(
      "pwa_launch"
    );
  }


  if (!navigator.onLine) {

    trackKanchhiEvent(
      "offline",
      {
        source: "session_start",
      }
    );

  }

}


// ============================================================
// END SESSION
// ============================================================

export function endKanchhiAnalyticsSession(): void {

  if (!isBrowser()) {
    return;
  }

  if (!isAnalyticsEnabled()) {
    return;
  }

  const sessionId =
    getKanchhiAnalyticsSessionId();

  const events =
    getAnalyticsEvents();

  const hasSessionEnd =
    events.some(
      (event) =>
        event.sessionId === sessionId &&
        event.name === "session_end"
    );

  if (hasSessionEnd) {
    return;
  }

  trackKanchhiEvent(
    "session_end"
  );
}


// ============================================================
// CLEAR
// ============================================================

export function clearAnalyticsEvents(): void {

  if (!isBrowser()) {
    return;
  }

  try {

    localStorage.removeItem(
      ANALYTICS_STORAGE_KEY
    );

  } catch {
    // Ignore.
  }
}


// ============================================================
// BUILD SESSIONS
// ============================================================

export function getAnalyticsSessions():
  KanchhiAnalyticsSession[] {

  const events =
    getAnalyticsEvents();

  const grouped:
    Record<
      string,
      KanchhiAnalyticsEvent[]
    > = {};


  for (const event of events) {

    if (!grouped[event.sessionId]) {

      grouped[event.sessionId] =
        [];
    }

    grouped[event.sessionId].push(
      event
    );
  }


  const sessions =
    Object.entries(
      grouped
    ).map(
      (
        [
          sessionId,
          sessionEvents,
        ]
      ) => {

        const sorted =
          [...sessionEvents].sort(
            (
              a,
              b
            ) =>
              a.timestamp -
              b.timestamp
          );

        const startedAt =
          sorted[0]?.timestamp ||
          Date.now();

        const sessionEnd =
          sorted.find(
            (event) =>
              event.name ===
              "session_end"
          );

        const lastTimestamp =
          sessionEnd?.timestamp ||
          sorted[
            sorted.length - 1
          ]?.timestamp ||
          startedAt;

        const durationMs =
          Math.max(
            0,
            lastTimestamp -
              startedAt
          );

        return {

          sessionId,

          startedAt,

          endedAt:
            sessionEnd?.timestamp ||
            null,

          durationMs,

          eventCount:
            sorted.length,

          offlineEvents:
            sorted.filter(
              (event) =>
                event.name ===
                "offline"
            ).length,

          onlineEvents:
            sorted.filter(
              (event) =>
                event.name ===
                "online"
            ).length,

        };

      }
    );


  return sessions.sort(
    (
      a,
      b
    ) =>
      b.startedAt -
      a.startedAt
  );
}


// ============================================================
// SUMMARY
// ============================================================

export function getAnalyticsSummary():
  KanchhiAnalyticsSummary {

  const events =
    getAnalyticsEvents();

  const sessions =
    getAnalyticsSessions();

  const eventCounts =
    EVENT_NAMES.reduce(
      (
        result,
        eventName
      ) => {

        result[eventName] =
          0;

        return result;

      },
      {} as Record<
        KanchhiAnalyticsEventName,
        number
      >
    );


  const tabOpens:
    Record<
      string,
      number
    > = {};


  let firstEventAt:
    number | null =
      null;

  let lastEventAt:
    number | null =
      null;


  for (const event of events) {

    eventCounts[event.name] =
      (
        eventCounts[event.name] ||
        0
      ) + 1;


    if (
      firstEventAt === null ||
      event.timestamp <
        firstEventAt
    ) {

      firstEventAt =
        event.timestamp;
    }


    if (
      lastEventAt === null ||
      event.timestamp >
        lastEventAt
    ) {

      lastEventAt =
        event.timestamp;
    }


    if (
      event.name ===
        "tab_open" &&
      event.metadata?.tab
    ) {

      const tab =
        String(
          event.metadata.tab
        );

      tabOpens[tab] =
        (
          tabOpens[tab] ||
          0
        ) + 1;
    }
  }


  const sessionDurationMs =
    sessions.reduce(
      (
        total,
        session
      ) =>
        total +
        session.durationMs,
      0
    );


  const averageSessionDurationMs =
    sessions.length > 0
      ? sessionDurationMs /
        sessions.length
      : 0;


  const longestSessionDurationMs =
    sessions.reduce(
      (
        maximum,
        session
      ) =>
        Math.max(
          maximum,
          session.durationMs
        ),
      0
    );


  const eventsPerSession =
    sessions.length > 0
      ? events.length /
        sessions.length
      : 0;


  return {

    totalEvents:
      events.length,

    totalSessions:
      sessions.length,

    sessionDurationMs,

    averageSessionDurationMs,

    longestSessionDurationMs,

    eventsPerSession,

    tabOpens,

    eventCounts,

    offlineCount:
      eventCounts.offline ||
      0,

    onlineCount:
      eventCounts.online ||
      0,

    firstEventAt,

    lastEventAt,

    sessions,

  };
}


// ============================================================
// DAILY ACTIVITY
// ============================================================

export function getAnalyticsDailyActivity(
  days = 7
): Array<{
  date: string;
  count: number;
}> {

  const events =
    getAnalyticsEvents();

  const result:
    Array<{
      date: string;
      count: number;
    }> = [];


  const now =
    new Date();


  for (
    let index = days - 1;
    index >= 0;
    index--
  ) {

    const date =
      new Date(now);

    date.setHours(
      0,
      0,
      0,
      0
    );

    date.setDate(
      date.getDate() -
      index
    );


    const key =
      date.toISOString()
        .slice(
          0,
          10
        );


    result.push({
      date: key,
      count: 0,
    });
  }


  for (const event of events) {

    const key =
      new Date(
        event.timestamp
      )
        .toISOString()
        .slice(
          0,
          10
        );

    const bucket =
      result.find(
        (item) =>
          item.date ===
          key
      );

    if (bucket) {
      bucket.count += 1;
    }
  }


  return result;
}


// ============================================================
// OFFLINE ACTIVITY
// ============================================================

export function getOfflineAnalytics() {

  const events =
    getAnalyticsEvents();

  const offlineEvents =
    events.filter(
      (event) =>
        event.name ===
        "offline"
    );

  const onlineEvents =
    events.filter(
      (event) =>
        event.name ===
        "online"
    );

  const totalNetworkEvents =
    offlineEvents.length +
    onlineEvents.length;


  const offlineRatio =
    totalNetworkEvents > 0
      ? (
          offlineEvents.length /
          totalNetworkEvents
        ) * 100
      : 0;


  const recentOfflineEvents =
    offlineEvents
      .sort(
        (
          a,
          b
        ) =>
          b.timestamp -
          a.timestamp
      )
      .slice(
        0,
        10
      );


  return {

    offlineCount:
      offlineEvents.length,

    onlineCount:
      onlineEvents.length,

    offlineRatio,

    recentOfflineEvents,

  };
}


// ============================================================
// FORMAT DURATION
// ============================================================

export function formatAnalyticsDuration(
  milliseconds: number
): string {

  if (
    !Number.isFinite(
      milliseconds
    ) ||
    milliseconds <= 0
  ) {

    return "0m";
  }


  const totalSeconds =
    Math.floor(
      milliseconds /
      1000
    );


  const hours =
    Math.floor(
      totalSeconds /
      3600
    );


  const minutes =
    Math.floor(
      (
        totalSeconds %
        3600
      ) /
      60
    );


  const seconds =
    totalSeconds %
    60;


  if (hours > 0) {

    return `${hours}h ${minutes}m`;
  }


  if (minutes > 0) {

    return `${minutes}m ${seconds}s`;
  }


  return `${seconds}s`;
}