"use client";

import { useEffect, useState } from "react";

type Preferences = {
  theme: "dark" | "light";
  temperatureUnit: "celsius" | "fahrenheit";
  notifications: boolean;
  weatherAlerts: boolean;
  newsUpdates: boolean;
  aiResponses: "concise" | "balanced" | "detailed";
};

const DEFAULT_PREFERENCES: Preferences = {
  theme: "dark",
  temperatureUnit: "celsius",
  notifications: true,
  weatherAlerts: true,
  newsUpdates: true,
  aiResponses: "balanced",
};

export default function PreferencesPanel() {
  const [preferences, setPreferences] =
    useState<Preferences>(
      DEFAULT_PREFERENCES
    );

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          "kanchhi-preferences"
        );

      if (stored) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...JSON.parse(stored),
        });
      }
    } catch (error) {
      console.error(
        "Could not load KANCHHI preferences:",
        error
      );
    }
  }, []);

  const updatePreference = <
    K extends keyof Preferences
  >(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaved(false);
  };

  const savePreferences = () => {
    try {
      localStorage.setItem(
        "kanchhi-preferences",
        JSON.stringify(preferences)
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Could not save KANCHHI preferences:",
        error
      );
    }
  };

  const resetPreferences = () => {
    setPreferences(
      DEFAULT_PREFERENCES
    );

    localStorage.removeItem(
      "kanchhi-preferences"
    );

    setSaved(false);
  };

  return (
    <section className="p-8 lg:p-10">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">

          <p className="text-blue-400 text-sm font-medium mb-2">
            KANCHHI SETTINGS
          </p>

          <h2 className="text-4xl font-bold">
            Preferences
          </h2>

          <p className="text-slate-400 mt-2">
            Customize how KANCHHI behaves for you.
          </p>

        </div>

        {/* GENERAL */}

        <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6 mb-5">

          <h3 className="text-lg font-semibold">
            General
          </h3>

          <p className="text-sm text-slate-500 mt-1 mb-6">
            Basic KANCHHI display preferences.
          </p>

          <div className="space-y-5">

            {/* THEME */}

            <div className="flex items-center justify-between gap-6">

              <div>
                <p className="font-medium">
                  Appearance
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Choose the KANCHHI interface theme.
                </p>
              </div>

              <select
                value={preferences.theme}
                onChange={(event) =>
                  updatePreference(
                    "theme",
                    event.target.value as
                      | "dark"
                      | "light"
                  )
                }
                className="bg-[#182235] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="dark">
                  Dark
                </option>

                <option value="light">
                  Light
                </option>
              </select>

            </div>

            {/* TEMPERATURE */}

            <div className="flex items-center justify-between gap-6">

              <div>
                <p className="font-medium">
                  Temperature unit
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Choose how temperatures are displayed.
                </p>
              </div>

              <select
                value={
                  preferences.temperatureUnit
                }
                onChange={(event) =>
                  updatePreference(
                    "temperatureUnit",
                    event.target.value as
                      | "celsius"
                      | "fahrenheit"
                  )
                }
                className="bg-[#182235] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="celsius">
                  Celsius (°C)
                </option>

                <option value="fahrenheit">
                  Fahrenheit (°F)
                </option>
              </select>

            </div>

          </div>

        </div>

        {/* NOTIFICATIONS */}

        <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6 mb-5">

          <h3 className="text-lg font-semibold">
            Notifications
          </h3>

          <p className="text-sm text-slate-500 mt-1 mb-6">
            Control which KANCHHI updates you receive.
          </p>

          <div className="space-y-5">

            <PreferenceToggle
              label="Notifications"
              description="Enable KANCHHI notifications."
              enabled={
                preferences.notifications
              }
              onChange={(value) =>
                updatePreference(
                  "notifications",
                  value
                )
              }
            />

            <PreferenceToggle
              label="Weather alerts"
              description="Receive important weather updates."
              enabled={
                preferences.weatherAlerts
              }
              onChange={(value) =>
                updatePreference(
                  "weatherAlerts",
                  value
                )
              }
            />

            <PreferenceToggle
              label="News updates"
              description="Receive important news updates."
              enabled={
                preferences.newsUpdates
              }
              onChange={(value) =>
                updatePreference(
                  "newsUpdates",
                  value
                )
              }
            />

          </div>

        </div>

        {/* AI */}

        <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6 mb-6">

          <h3 className="text-lg font-semibold">
            KANCHHI AI
          </h3>

          <p className="text-sm text-slate-500 mt-1 mb-6">
            Customize how KANCHHI AI responds.
          </p>

          <div className="flex items-center justify-between gap-6">

            <div>
              <p className="font-medium">
                Response style
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Choose the preferred answer length.
              </p>
            </div>

            <select
              value={
                preferences.aiResponses
              }
              onChange={(event) =>
                updatePreference(
                  "aiResponses",
                  event.target.value as
                    | "concise"
                    | "balanced"
                    | "detailed"
                )
              }
              className="bg-[#182235] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="concise">
                Concise
              </option>

              <option value="balanced">
                Balanced
              </option>

              <option value="detailed">
                Detailed
              </option>
            </select>

          </div>

        </div>

        {/* ACTIONS */}

        <div className="flex items-center justify-between gap-4">

          <button
            onClick={resetPreferences}
            className="px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-sm text-slate-300 transition"
          >
            Reset
          </button>

          <div className="flex items-center gap-3">

            {saved && (
              <span className="text-sm text-emerald-400">
                Preferences saved
              </span>
            )}

            <button
              onClick={savePreferences}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition"
            >
              Save Preferences
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}

type PreferenceToggleProps = {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
};

function PreferenceToggle({
  label,
  description,
  enabled,
  onChange,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between gap-6">

      <div>
        <p className="font-medium">
          {label}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange(!enabled)
        }
        aria-pressed={enabled}
        className={`relative w-12 h-6 rounded-full transition ${
          enabled
            ? "bg-blue-600"
            : "bg-slate-700"
        }`}
      >

        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
            enabled
              ? "left-7"
              : "left-1"
          }`}
        />

      </button>

    </div>
  );
}