"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import NewsCard from "./NewsCard";
import NewsFilters from "./NewsFilter";

// ============================================================
// TYPES
// ============================================================

export type NewsCategory =
  | "Politics"
  | "Sports"
  | "Business"
  | "Technology"
  | "Entertainment"
  | "Health"
  | "World"
  | "General";

export type NewsArticle = {
  title: string;
  link: string;
  image?: string;
  description?: string;
  source: string;

  sourceKey:
    | "onlinekhabar"
    | "ronb"
    | "ratopati";

  publishedAt?: string;
  category: NewsCategory;
};

type SourceCounts = {
  onlinekhabar: number;
  ronb: number;
  ratopati: number;
  total: number;
};

// ============================================================
// COMPONENT
// ============================================================

export default function NewsPanel() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [newsData, setNewsData] =
    useState<NewsArticle[]>([]);

  const [newsError, setNewsError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [selectedSource, setSelectedSource] =
    useState("all");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [sourceCounts, setSourceCounts] =
    useState<SourceCounts>({
      onlinekhabar: 0,
      ronb: 0,
      ratopati: 0,
      total: 0,
    });

  const [updatedAt, setUpdatedAt] =
    useState("");

  // ==========================================================
  // FETCH NEWS
  // ==========================================================

  const fetchNews = async () => {
    try {
      setLoading(true);
      setNewsError("");

      const response = await fetch(
        "http://localhost:8000/api/news",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `News API returned ${response.status}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(
          data.details ||
            data.error ||
            "Unable to load news."
        );
      }

      const articles: NewsArticle[] =
        Array.isArray(data.news)
          ? data.news
          : [];

      setNewsData(articles);

      setSourceCounts({
        onlinekhabar:
          data.sources?.onlinekhabar || 0,

        ronb:
          data.sources?.ronb || 0,

        ratopati:
          data.sources?.ratopati || 0,

        total:
          data.sources?.total ||
          articles.length,
      });

      setUpdatedAt(
        data.updatedAt || ""
      );
    } catch (error: unknown) {
      console.error(
        "KANCHHI News Error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Could not connect to KANCHHI backend.";

      setNewsError(message);
      setNewsData([]);

      setSourceCounts({
        onlinekhabar: 0,
        ronb: 0,
        ratopati: 0,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchNews();
  }, []);

  // ==========================================================
  // FILTER NEWS
  // ==========================================================

  const filteredNews = useMemo(() => {
    return newsData.filter(
      (article) => {
        const sourceMatches =
          selectedSource === "all"
            ? true
            : article.sourceKey ===
              selectedSource;

        const categoryMatches =
          selectedCategory === "All"
            ? true
            : article.category ===
              selectedCategory;

        return (
          sourceMatches &&
          categoryMatches
        );
      }
    );
  }, [
    newsData,
    selectedSource,
    selectedCategory,
  ]);

  // ==========================================================
  // FORMAT UPDATED TIME
  // ==========================================================

  const formattedUpdatedAt =
    useMemo(() => {
      if (!updatedAt) {
        return "";
      }

      const date =
        new Date(updatedAt);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      return date.toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );
    }, [updatedAt]);

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSelectedSource("all");
    setSelectedCategory("All");
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="p-8 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-end
            lg:justify-between
            gap-6
            mb-8
          "
        >
          <div>
            <p
              className="
                text-blue-400
                text-sm
                font-medium
                mb-2
              "
            >
              KANCHHI NEWS
            </p>

            <h2
              className="
                text-4xl
                font-bold
              "
            >
              Latest News
            </h2>

            <p
              className="
                text-slate-400
                mt-2
              "
            >
              Headlines from Onlinekhabar,
              RONB and Ratopati.
            </p>

            {formattedUpdatedAt && (
              <p
                className="
                  text-xs
                  text-slate-600
                  mt-2
                "
              >
                Updated at {formattedUpdatedAt}
              </p>
            )}
          </div>

          <button
            onClick={fetchNews}
            disabled={loading}
            className="
              px-5
              py-3
              rounded-xl
              bg-slate-800
              hover:bg-slate-700
              border
              border-slate-700
              disabled:opacity-50
              transition
            "
          >
            {loading
              ? "Loading..."
              : "↻ Refresh News"}
          </button>
        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <NewsFilters
          selectedSource={selectedSource}
          setSelectedSource={
            setSelectedSource
          }
          selectedCategory={
            selectedCategory
          }
          setSelectedCategory={
            setSelectedCategory
          }
          sourceCounts={sourceCounts}
        />

        {/* ==================================================
            ERROR
        ================================================== */}

        {newsError && (
          <div
            className="
              mb-6
              rounded-xl
              border
              border-red-800
              bg-red-950/40
              p-5
              text-red-300
            "
          >
            <div
              className="
                font-semibold
                mb-1
              "
            >
              News service unavailable
            </div>

            <div
              className="
                text-sm
                text-red-400
              "
            >
              {newsError}
            </div>

            <button
              onClick={fetchNews}
              disabled={loading}
              className="
                mt-4
                px-4
                py-2
                rounded-lg
                bg-red-900/60
                hover:bg-red-900
                border
                border-red-800
                text-sm
                transition
                disabled:opacity-50
              "
            >
              {loading
                ? "Retrying..."
                : "Try Again"}
            </button>
          </div>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-3
              gap-6
            "
          >
            {[
              1,
              2,
              3,
              4,
              5,
              6,
            ].map((item) => (
              <div
                key={item}
                className="
                  h-[440px]
                  rounded-2xl
                  bg-[#111c2e]
                  border
                  border-slate-800
                  animate-pulse
                "
              />
            ))}
          </div>
        ) : filteredNews.length > 0 ? (
          <>
            {/* ==================================================
                NEWS RESULT COUNT
            ================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                mb-4
              "
            >
              <p
                className="
                  text-sm
                  text-slate-500
                "
              >
                Showing{" "}
                <span
                  className="
                    text-slate-300
                    font-medium
                  "
                >
                  {filteredNews.length}
                </span>{" "}
                stories
              </p>
            </div>

            {/* ==================================================
                NEWS GRID
            ================================================== */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                xl:grid-cols-3
                gap-6
              "
            >
              {filteredNews.map(
                (article, index) => (
                  <NewsCard
                    key={`${article.link}-${index}`}
                    article={article}
                  />
                )
              )}
            </div>
          </>
        ) : (
          <>
            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            <div
              className="
                rounded-2xl
                bg-[#111c2e]
                border
                border-slate-800
                p-12
                text-center
              "
            >
              <div
                className="
                  text-5xl
                  mb-4
                "
              >
                📰
              </div>

              <h3
                className="
                  text-xl
                  font-semibold
                "
              >
                No news available
              </h3>

              <p
                className="
                  text-slate-500
                  mt-2
                "
              >
                {selectedSource === "all" &&
                selectedCategory === "All"
                  ? "No news was returned by the news services."
                  : "No news matches the selected filters."}
              </p>

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-3
                  mt-5
                "
              >
                <button
                  onClick={resetFilters}
                  className="
                    px-5
                    py-2.5
                    rounded-lg
                    bg-blue-600
                    hover:bg-blue-500
                    transition
                  "
                >
                  Reset Filters
                </button>

                <button
                  onClick={fetchNews}
                  disabled={loading}
                  className="
                    px-5
                    py-2.5
                    rounded-lg
                    bg-slate-800
                    hover:bg-slate-700
                    border
                    border-slate-700
                    transition
                    disabled:opacity-50
                  "
                >
                  Refresh
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}