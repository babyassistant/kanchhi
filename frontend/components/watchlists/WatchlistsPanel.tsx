"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type Watchlist = {
  id: string;
  name: string;
  category?: string;
  keywords?: string[];
  enabled?: boolean;
};

const API =
  "http://localhost:8000/api/watchlists";

export default function WatchlistsPanel() {

  const [
    watchlists,
    setWatchlists,
  ] = useState<
    Watchlist[]
  >([]);

  const [
    name,
    setName,
  ] = useState("");

  const [
    keywords,
    setKeywords,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

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

      const data =
        await response.json();

      setWatchlists(
        Array.isArray(
          data.watchlists
        )
          ? data.watchlists
          : []
      );

    } catch {
      setError(
        "Watchlists are unavailable."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createWatchlist(
    event: FormEvent
  ) {

    event.preventDefault();

    const cleanName =
      name.trim();

    const cleanKeywords =
      keywords
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean);

    if (
      !cleanName ||
      cleanKeywords.length === 0
    ) {
      return;
    }

    try {

      const response =
        await fetch(
          API,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                cleanName,

              category:
                "General",

              keywords:
                cleanKeywords,

              enabled:
                true,
            }),
          }
        );

      if (!response.ok) {
        throw new Error();
      }

      setName("");
      setKeywords("");

      await load();

    } catch {
      setError(
        "Unable to create watchlist."
      );
    }
  }

  async function toggle(
    watchlist: Watchlist
  ) {

    await fetch(
      `${API}/${watchlist.id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          enabled:
            !watchlist.enabled,
        }),
      }
    );

    await load();
  }

  async function remove(
    id: string
  ) {

    await fetch(
      `${API}/${id}`,
      {
        method: "DELETE",
      }
    );

    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="min-h-screen bg-[#0b1220] p-6 lg:p-10">

      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="text-sm uppercase tracking-wider text-blue-400">
            PHASE 6
          </p>

          <h1 className="mt-2 text-4xl font-bold text-white">
            Watchlists
          </h1>

          <p className="mt-2 text-slate-400">
            Tell KANCHHI which topics deserve extra attention.
          </p>
        </div>

        <form
          onSubmit={createWatchlist}
          className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6"
        >

          <h2 className="text-xl font-semibold text-white">
            Add Watchlist
          </h2>

          <input
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            placeholder="Example: AI News"
            className="mt-5 w-full rounded-xl border border-slate-700 bg-[#0d1728] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          />

          <input
            value={keywords}
            onChange={(event) =>
              setKeywords(
                event.target.value
              )
            }
            placeholder="Keywords separated by commas: AI, Gemini, OpenAI"
            className="mt-4 w-full rounded-xl border border-slate-700 bg-[#0d1728] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500"
          >
            Add Watchlist
          </button>
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-2">

          {loading ? (
            <div className="rounded-2xl bg-[#111c2e] p-8 text-slate-500">
              Loading watchlists...
            </div>
          ) : watchlists.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-8 text-slate-500">
              No watchlists yet.
            </div>
          ) : (
            watchlists.map(
              (
                watchlist
              ) => (
                <div
                  key={
                    watchlist.id
                  }
                  className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h3 className="font-semibold text-white">
                        {watchlist.name}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(
                          watchlist.keywords ||
                          []
                        ).map(
                          (
                            keyword
                          ) => (
                            <span
                              key={
                                keyword
                              }
                              className="rounded-lg bg-blue-600/10 px-2.5 py-1 text-xs text-blue-300"
                            >
                              {keyword}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <span
                      className={
                        watchlist.enabled
                          ? "text-xs text-emerald-400"
                          : "text-xs text-slate-600"
                      }
                    >
                      {watchlist.enabled
                        ? "Active"
                        : "Paused"}
                    </span>

                  </div>

                  <div className="mt-5 flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        toggle(
                          watchlist
                        )
                      }
                      className="rounded-lg bg-slate-800 px-4 py-2 text-xs text-slate-300"
                    >
                      {watchlist.enabled
                        ? "Pause"
                        : "Enable"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        remove(
                          watchlist.id
                        )
                      }
                      className="rounded-lg bg-red-950/40 px-4 py-2 text-xs text-red-300"
                    >
                      Delete
                    </button>

                  </div>
                </div>
              )
            )
          )}

        </div>

        {error && (
          <div className="mt-5 rounded-xl bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

      </div>
    </section>
  );
}