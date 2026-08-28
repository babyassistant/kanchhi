"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type NewsItem = {
  title?: string;
  description?: string;
  link?: string;
  source?: string;
};

type WeatherData = {
  location?: {
    name?: string;
  };
  current?: {
    temperature?: number | null;
    condition?: string;
  };
};

type PersonalizedResponse = {
  recommendations: {
    title: string;
    reason: string;
    type: string;
    priority: "high" | "medium" | "low";
    link?: string;
  }[];
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

export default function PersonalizedPanel() {
  const [
    recommendations,
    setRecommendations,
  ] = useState<
    PersonalizedResponse["recommendations"]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadPersonalized =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const [
            preferencesResponse,
            memoryResponse,
            watchlistResponse,
            newsResponse,
            weatherResponse,
          ] =
            await Promise.all([
              fetch(
                `${BACKEND_URL}/api/preferences`,
                {
                  cache:
                    "no-store",
                },
              ),
              fetch(
                `${BACKEND_URL}/api/memory/list`,
                {
                  cache:
                    "no-store",
                },
              ),
              fetch(
                `${BACKEND_URL}/api/watchlists`,
                {
                  cache:
                    "no-store",
                },
              ),
              fetch(
                `${BACKEND_URL}/api/news`,
                {
                  cache:
                    "no-store",
                },
              ),
              fetch(
                `${BACKEND_URL}/api/weather?lat=27.6647&lon=85.3710`,
                {
                  cache:
                    "no-store",
                },
              ),
            ]);

          const preferences =
            await preferencesResponse
              .json()
              .catch(
                () => ({}),
              );

          const memory =
            await memoryResponse
              .json()
              .catch(
                () => ({}),
              );

          const watchlists =
            await watchlistResponse
              .json()
              .catch(
                () => ({}),
              );

          const news =
            await newsResponse
              .json()
              .catch(
                () => ({}),
              );

          const weather =
            (
              await weatherResponse
                .json()
            ) as WeatherData;

          const items: PersonalizedResponse["recommendations"] =
            [];

          const articles =
            Array.isArray(
              news?.articles,
            )
              ? news.articles
              : Array.isArray(
                    news,
                  )
                ? news
                : [];

          const firstArticle =
            articles[0] as NewsItem | undefined;

          if (
            firstArticle?.title
          ) {
            items.push({
              title:
                firstArticle.title,
              reason:
                "This is one of the latest available news items in your KANCHHI feed.",
              type: "news",
              priority:
                "medium",
              link:
                firstArticle.link,
            });
          }

          if (
            weather.current
              ?.temperature !==
            undefined
          ) {
            const temperature =
              weather.current
                ?.temperature;

            const condition =
              weather.current
                ?.condition ||
              "current conditions";

            if (
              typeof temperature ===
                "number" &&
              temperature >= 30
            ) {
              items.push({
                title:
                  "Plan around the heat",
                reason:
                  `Current weather is ${temperature.toFixed(
                    1,
                  )}°C with ${condition}.`,
                type: "weather",
                priority:
                  "high",
              });
            }
          }

          if (
            watchlists &&
            (
              Array.isArray(
                watchlists.watchlists,
              ) ||
              Array.isArray(
                watchlists,
              )
            )
          ) {
            items.push({
              title:
                "Review your watchlists",
              reason:
                "You have saved interests that can be turned into focused updates.",
              type: "watchlist",
              priority:
                "medium",
            });
          }

          if (
            memory &&
            (
              Array.isArray(
                memory.memories,
              ) ||
              Array.isArray(
                memory,
              )
            )
          ) {
            items.push({
              title:
                "Use KANCHHI memory for better recommendations",
              reason:
                "Your saved context can improve future personalization.",
              type: "memory",
              priority:
                "low",
            });
          }

          if (
            preferences
          ) {
            items.push({
              title:
                "Keep your KANCHHI preferences current",
              reason:
                "Up-to-date preferences improve recommendation relevance.",
              type: "preferences",
              priority:
                "low",
            });
          }

          setRecommendations(
            items.slice(
              0,
              8,
            ),
          );
        } catch (
          requestError
        ) {
          console.error(
            "KANCHHI personalization error:",
            requestError,
          );

          setError(
            "Personalized recommendations could not be loaded.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadPersonalized();
  }, [
    loadPersonalized,
  ]);

  return (
    <section className="min-h-screen bg-[#0b1220] p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
            KANCHHI PERSONALIZED
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            What matters to you
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Recommendations based on available KANCHHI context, preferences, memory, weather, news, and saved interests.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-8 text-slate-500">
            KANCHHI is building your recommendations...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-8 text-slate-500">
            No personalized recommendations are available yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">

            {recommendations.map(
              (
                recommendation,
                index,
              ) => {
                const content = (
                  <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5 transition hover:border-slate-700 hover:bg-slate-900">
                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs uppercase tracking-wider text-blue-400">
                          {recommendation.type}
                        </p>

                        <h2 className="mt-2 text-lg font-semibold text-white">
                          {recommendation.title}
                        </h2>
                      </div>

                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-500">
                        {recommendation.priority}
                      </span>

                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {recommendation.reason}
                    </p>
                  </div>
                );

                return recommendation.link ? (
                  <a
                    key={`${recommendation.type}-${index}`}
                    href={
                      recommendation.link
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={`${recommendation.type}-${index}`}
                  >
                    {content}
                  </div>
                );
              },
            )}

          </div>
        )}

      </div>
    </section>
  );
}