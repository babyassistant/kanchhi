"use client";

import {
  useEffect,
  useState,
} from "react";

type Article = {
  title?: string;
  link?: string;
  source?: string;
  description?: string;
  image?: string;
  _kanchhi_score?: number;
  _kanchhi_rank?: number;
};

const NEWS_API =
  "http://localhost:8000/api/news";

const RANK_API =
  "http://localhost:8000/api/smart-news/rank";

const WATCHLIST_API =
  "http://localhost:8000/api/watchlists";

export default function SmartNewsPanel() {

  const [
    articles,
    setArticles,
  ] = useState<Article[]>([]);

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
      setError("");

      const [
        newsResponse,
        watchResponse,
      ] = await Promise.all([
        fetch(
          NEWS_API,
          {
            cache: "no-store",
          }
        ),

        fetch(
          WATCHLIST_API,
          {
            cache: "no-store",
          }
        ),
      ]);

      if (
        !newsResponse.ok
      ) {
        throw new Error();
      }

      const newsData =
        await newsResponse.json();

      const watchData =
        watchResponse.ok
          ? await watchResponse.json()
          : {
              watchlists: [],
            };

      const rawArticles =
        Array.isArray(
          newsData.news
        )
          ? newsData.news
          : [];

      const keywords: string[] =
        Array.isArray(
          watchData.watchlists
        )
          ? watchData.watchlists
              .filter(
                (
                  item: {
                    enabled?: boolean;
                  }
                ) =>
                  item.enabled !==
                  false
              )
              .flatMap(
                (
                  item: {
                    keywords?: string[];
                  }
                ) =>
                  Array.isArray(
                    item.keywords
                  )
                    ? item.keywords
                    : []
              )
          : [];

      const rankResponse =
        await fetch(
          RANK_API +
            (
              keywords.length
                ? `?keywords=${encodeURIComponent(
                    keywords.join(",")
                  )}`
                : ""
            ),
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                rawArticles
              ),
          }
        );

      if (
        !rankResponse.ok
      ) {
        throw new Error();
      }

      const rankData =
        await rankResponse.json();

      setArticles(
        Array.isArray(
          rankData.articles
        )
          ? rankData.articles
          : rawArticles
      );

    } catch (error) {

      console.error(
        "Smart news error:",
        error
      );

      setError(
        "Smart news ranking is temporarily unavailable."
      );

    } finally {
      setLoading(false);
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
              Smart News
            </h1>

            <p className="mt-2 text-slate-400">
              KANCHHI ranks news by importance and your watchlist interests.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-xl bg-slate-800 px-5 py-3 text-sm text-slate-300 disabled:opacity-40"
          >
            {loading
              ? "Refreshing..."
              : "Refresh Ranking"}
          </button>

        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-2xl bg-[#111c2e]"
                />
              )
            )}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-10 text-center text-slate-500">
            No news available.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {articles.map(
              (
                article,
                index
              ) => (
                <a
                  key={
                    article.link ||
                    `${article.title}-${index}`
                  }
                  href={
                    article.link ||
                    "#"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-slate-800 bg-[#111c2e] p-5 transition hover:border-blue-500/40"
                >

                  <div className="flex items-center justify-between">

                    <span className="rounded-lg bg-blue-600/10 px-2 py-1 text-xs font-medium text-blue-300">
                      #{article._kanchhi_rank || index + 1}
                    </span>

                    <span className="text-xs text-slate-600">
                      Score{" "}
                      {article._kanchhi_score ??
                        0}
                    </span>
                  </div>

                  <h2 className="mt-4 line-clamp-3 text-lg font-semibold text-white group-hover:text-blue-300">
                    {article.title ||
                      "Untitled article"}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {article.description ||
                      "No description available."}
                  </p>

                  <div className="mt-5 text-xs text-slate-600">
                    {article.source ||
                      "News"}
                  </div>

                </a>
              )
            )}

          </div>
        )}

      </div>
    </section>
  );
}