"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  generateEveningBriefing,
  generateMorningBriefing,
  type KanchhiBriefingResult,
} from "@/lib/kanchhiContext";

// ============================================================
// TYPES
// ============================================================

type BriefingMode =
  | "morning"
  | "evening";

// ============================================================
// COMPONENT
// ============================================================

export default function BriefingPanel() {
  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    morning,
    setMorning,
  ] = useState<string>("");

  const [
    evening,
    setEvening,
  ] = useState<string>("");

  const [
    morningLoading,
    setMorningLoading,
  ] = useState(false);

  const [
    eveningLoading,
    setEveningLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    offline,
    setOffline,
  ] = useState(false);

  // ==========================================================
  // MOUNT
  // ==========================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==========================================================
  // NETWORK
  // ==========================================================

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const updateNetwork =
      () => {
        setOffline(
          !navigator.onLine
        );
      };

    updateNetwork();

    window.addEventListener(
      "online",
      updateNetwork
    );

    window.addEventListener(
      "offline",
      updateNetwork
    );

    return () => {
      window.removeEventListener(
        "online",
        updateNetwork
      );

      window.removeEventListener(
        "offline",
        updateNetwork
      );
    };
  }, [mounted]);

  // ==========================================================
  // EXTRACT TEXT
  // ==========================================================

  function getText(
    result:
      | KanchhiBriefingResult
      | null
      | undefined
  ): string {
    return (
      result?.briefing ||
      result?.reply ||
      ""
    );
  }

  // ==========================================================
  // GENERATE
  // ==========================================================

  const generate =
    useCallback(
      async (
        mode: BriefingMode
      ) => {
        if (offline) {
          setError(
            mode ===
              "morning"
              ? "Morning briefing is unavailable while offline."
              : "Evening summary is unavailable while offline."
          );

          return;
        }

        setError("");

        if (
          mode ===
          "morning"
        ) {
          setMorningLoading(
            true
          );
        } else {
          setEveningLoading(
            true
          );
        }

        try {
          const result =
            mode ===
            "morning"
              ? await generateMorningBriefing()
              : await generateEveningBriefing();

          const text =
            getText(result);

          if (
            mode ===
            "morning"
          ) {
            setMorning(
              text ||
                "No morning briefing was generated."
            );
          } else {
            setEvening(
              text ||
                "No evening summary was generated."
            );
          }

          if (
            result?.offline
          ) {
            setError(
              text
            );
          }

        } catch (error) {
          console.error(
            "KANCHHI briefing error:",
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "KANCHHI briefing could not be generated."
          );

        } finally {
          if (
            mode ===
            "morning"
          ) {
            setMorningLoading(
              false
            );
          } else {
            setEveningLoading(
              false
            );
          }
        }
      },
      [offline]
    );

  // ==========================================================
  // HYDRATION SAFE
  // ==========================================================

  if (!mounted) {
    return (
      <section className="min-h-screen bg-[#0b1220] p-6 lg:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-wider text-blue-400">
              KANCHHI INTELLIGENCE
            </div>

            <h1 className="mt-2 text-4xl font-bold text-white">
              AI Briefings
            </h1>

            <p className="mt-2 text-slate-400">
              Personalized daily intelligence from KANCHHI.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl bg-[#111c2e]" />
            <div className="h-72 animate-pulse rounded-2xl bg-[#111c2e]" />
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="min-h-screen bg-[#0b1220] p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-blue-400">
            KANCHHI INTELLIGENCE
          </div>

          <h1 className="mt-2 text-4xl font-bold text-white">
            AI Briefings
          </h1>

          <p className="mt-2 text-slate-400">
            Personalized daily intelligence from KANCHHI.
          </p>
        </div>

        {/* OFFLINE */}

        {offline && (
          <div className="mb-6 rounded-2xl border border-amber-800/60 bg-amber-950/30 px-5 py-4">
            <div className="font-medium text-amber-300">
              Offline mode
            </div>

            <div className="mt-1 text-sm text-amber-200/70">
              AI briefing generation is paused until the
              network connection returns.
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && !offline && (
          <div className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/30 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* BRIEFINGS */}

        <div className="grid gap-5 lg:grid-cols-2">

          {/* MORNING */}

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6">
            <div className="flex items-start justify-between gap-4">

              <div>
                <div className="text-xs uppercase tracking-wider text-blue-400">
                  MORNING
                </div>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  AI Morning Briefing
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Start your day with relevant KANCHHI context.
                </p>
              </div>

              <div className="text-3xl">
                🌅
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                generate(
                  "morning"
                )
              }
              disabled={
                morningLoading ||
                offline
              }
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
            >
              {morningLoading
                ? "Generating..."
                : "Generate Briefing"}
            </button>

            <div className="mt-5 min-h-[220px] whitespace-pre-line rounded-xl bg-[#0d1728] p-5 text-sm leading-6 text-slate-300">
              {morning ||
                "Click Generate Briefing to create your morning intelligence."}
            </div>
          </div>

          {/* EVENING */}

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6">
            <div className="flex items-start justify-between gap-4">

              <div>
                <div className="text-xs uppercase tracking-wider text-blue-400">
                  EVENING
                </div>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  AI Evening Summary
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Review important information from your day.
                </p>
              </div>

              <div className="text-3xl">
                🌙
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                generate(
                  "evening"
                )
              }
              disabled={
                eveningLoading ||
                offline
              }
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
            >
              {eveningLoading
                ? "Generating..."
                : "Generate Summary"}
            </button>

            <div className="mt-5 min-h-[220px] whitespace-pre-line rounded-xl bg-[#0d1728] p-5 text-sm leading-6 text-slate-300">
              {evening ||
                "Click Generate Summary to create your evening intelligence."}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}