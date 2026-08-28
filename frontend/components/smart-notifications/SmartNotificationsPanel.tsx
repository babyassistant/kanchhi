"use client";

import {
  useEffect,
  useState,
} from "react";

type SmartNotification = {
  id: string;
  kind?: string;
  title?: string;
  message?: string;
  severity?: string;
  read?: boolean;
  created_at?: string;
};

const API =
  "http://localhost:8000/api/smart-notifications";

export default function SmartNotificationsPanel() {

  const [
    notifications,
    setNotifications,
  ] = useState<
    SmartNotification[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    running,
    setRunning,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function load() {

    try {

      setLoading(true);

      const response =
        await fetch(
          API,
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      setNotifications(
        Array.isArray(
          data.notifications
        )
          ? data.notifications
          : []
      );

    } catch {
      setError(
        "Smart notifications are unavailable."
      );
    } finally {
      setLoading(false);
    }
  }

  async function runEvaluation() {

    if (
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      setError(
        "Smart notification evaluation is unavailable offline."
      );
      return;
    }

    setRunning(true);
    setError("");

    try {

      let weather: unknown =
        null;

      try {

        if (
          navigator.geolocation
        ) {

          const position =
            await new Promise<GeolocationPosition>(
              (
                resolve,
                reject
              ) =>
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  {
                    timeout: 8000,
                    maximumAge: 300000,
                  }
                )
            );

          const response =
            await fetch(
              `http://localhost:8000/api/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
              {
                cache: "no-store",
              }
            );

          if (
            response.ok
          ) {
            weather =
              await response.json();
          }
        }

      } catch {
        weather = null;
      }

      let news: unknown =
        null;

      try {

        const response =
          await fetch(
            "http://localhost:8000/api/news",
            {
              cache: "no-store",
            }
          );

        if (
          response.ok
        ) {

          const data =
            await response.json();

          news =
            Array.isArray(
              data.news
            )
              ? data.news
              : [];
        }

      } catch {
        news = null;
      }

      await fetch(
        `${API}/evaluate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            weather,
            news,
          }),
        }
      );

      await load();

    } catch {
      setError(
        "Smart notification evaluation failed."
      );
    } finally {
      setRunning(false);
    }
  }

  async function markRead(
    id: string
  ) {

    try {

      await fetch(
        `${API}/${id}/read`,
        {
          method: "PATCH",
        }
      );

      await load();

    } catch {
      setError(
        "Unable to mark notification as read."
      );
    }
  }

  async function remove(
    id: string
  ) {

    try {

      await fetch(
        `${API}/${id}`,
        {
          method: "DELETE",
        }
      );

      await load();

    } catch {
      setError(
        "Unable to delete notification."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="min-h-screen bg-[#0b1220] p-6 lg:p-10">

      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-sm uppercase tracking-wider text-blue-400">
              PHASE 6
            </p>

            <h1 className="mt-2 text-4xl font-bold text-white">
              Smart Notifications
            </h1>

            <p className="mt-2 text-slate-400">
              KANCHHI detects important weather and news events
              and turns them into useful notifications.
            </p>
          </div>

          <button
            type="button"
            onClick={runEvaluation}
            disabled={running}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
          >
            {running
              ? "Checking..."
              : "Run Smart Check"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-[#111c2e]"
                />
              )
            )}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-10 text-center">
            <div className="text-4xl">
              🔔
            </div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              No smart notifications
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Run a smart check to let KANCHHI evaluate
              weather and news conditions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {notifications.map(
              (
                notification
              ) => (
                <div
                  key={
                    notification.id
                  }
                  className={`rounded-2xl border p-5 ${
                    notification.read
                      ? "border-slate-800 bg-[#111c2e] opacity-70"
                      : "border-blue-500/20 bg-[#111c2e]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-5">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {notification.kind?.startsWith(
                            "weather"
                          )
                            ? "⛈️"
                            : "📰"}
                        </span>

                        <h3 className="font-semibold text-white">
                          {notification.title}
                        </h3>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {notification.message}
                      </p>

                      <div className="mt-3 text-xs text-slate-600">
                        {notification.created_at
                          ? new Date(
                              notification.created_at
                            ).toLocaleString()
                          : ""}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">

                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() =>
                            markRead(
                              notification.id
                            )
                          }
                          className="rounded-lg bg-blue-600/20 px-3 py-2 text-xs text-blue-300"
                        >
                          Mark read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          remove(
                            notification.id
                          )
                        }
                        className="rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-300"
                      >
                        Delete
                      </button>

                    </div>
                  </div>
                </div>
              )
            )}

          </div>
        )}

      </div>
    </section>
  );
}