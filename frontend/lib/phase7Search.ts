"use client";

// ============================================================
// KANCHHI PHASE 7 SEARCH
//
// 34 - Unified Search
// 35 - Conversational Search
// 36 - Semantic Memory Search
// ============================================================

export type SearchResult = {
  title?: string;
  description?: string;
  snippet?: string;
  link?: string;
  url?: string;
  source?: string;
  category?: string;
  score?: number;
  [key: string]: unknown;
};

export type MemoryResult = {
  id?: string | number;
  key?: string;
  value?: string;
  content?: string;
  category?: string;
  created_at?: string;
  score?: number;
  [key: string]: unknown;
};

export type NewsResult = {
  title?: string;
  description?: string;
  link?: string;
  source?: string;
  category?: string;
  publishedAt?: string;
  published?: string;
  image?: string;
  score?: number;
  [key: string]: unknown;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type UnifiedSearchResult = {
  web: SearchResult[];
  news: NewsResult[];
  memory: MemoryResult[];
};

// ============================================================
// API
// ============================================================

const BACKEND_URL = "http://localhost:8000";

// ============================================================
// JSON REQUEST HELPER
// ============================================================

async function requestJson(
  url: string,
  options?: RequestInit,
): Promise<any> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error ||
        `Request failed with HTTP ${response.status}.`,
    );
  }

  return data;
}

// ============================================================
// SEARCH
// ============================================================

export async function searchWeb(
  query: string,
): Promise<SearchResult[]> {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return [];
  }

  const data = await requestJson(
    `${BACKEND_URL}/api/search?q=${encodeURIComponent(cleanQuery)}`,
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.search_results)) {
    return data.search_results;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

// ============================================================
// NEWS
// ============================================================

export async function loadNews(): Promise<NewsResult[]> {
  const data = await requestJson(
    `${BACKEND_URL}/api/news`,
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.news)) {
    return data.news;
  }

  return [];
}

// ============================================================
// MEMORY
// ============================================================

export async function loadMemories(): Promise<MemoryResult[]> {
  const data = await requestJson(
    `${BACKEND_URL}/api/memory/list`,
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.memory)) {
    return data.memory;
  }

  if (Array.isArray(data?.memories)) {
    return data.memories;
  }

  return [];
}

// ============================================================
// TOKENIZER
// ============================================================

function tokenize(
  text: string,
): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

// ============================================================
// MEMORY SCORE
// ============================================================

export function scoreMemory(
  memory: MemoryResult,
  query: string,
): number {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return 0;
  }

  const key = String(
    memory.key || "",
  ).toLowerCase();

  const value = String(
    memory.value ||
      memory.content ||
      "",
  ).toLowerCase();

  const category = String(
    memory.category || "",
  ).toLowerCase();

  const fullText =
    `${key} ${value} ${category}`;

  const searchableTokens = new Set(
    tokenize(fullText),
  );

  let score = 0;

  for (const token of queryTokens) {
    if (searchableTokens.has(token)) {
      score += 1;
    }

    if (key.includes(token)) {
      score += 4;
    }

    if (value.includes(token)) {
      score += 2;
    }

    if (category.includes(token)) {
      score += 1;
    }
  }

  const phrase =
    query.trim().toLowerCase();

  if (
    phrase &&
    fullText.includes(phrase)
  ) {
    score += 5;
  }

  return score;
}

// ============================================================
// SEMANTIC MEMORY SEARCH
// ============================================================

export function semanticMemorySearch(
  memories: MemoryResult[],
  query: string,
): MemoryResult[] {
  return memories
    .map((memory) => ({
      ...memory,
      score: scoreMemory(
        memory,
        query,
      ),
    }))
    .filter(
      (memory) =>
        Number(memory.score || 0) > 0,
    )
    .sort(
      (a, b) =>
        Number(b.score || 0) -
        Number(a.score || 0),
    );
}

// ============================================================
// NEWS LOCAL RANKING
// ============================================================

export function rankNewsLocally(
  news: NewsResult[],
  query: string,
): NewsResult[] {
  const tokens = tokenize(query);

  if (tokens.length === 0) {
    return [...news];
  }

  return news
    .map((article) => {
      const title = String(
        article.title || "",
      ).toLowerCase();

      const description = String(
        article.description || "",
      ).toLowerCase();

      const source = String(
        article.source || "",
      ).toLowerCase();

      const text =
        `${title} ${description} ${source}`;

      let score = 0;

      for (const token of tokens) {
        if (title.includes(token)) {
          score += 5;
        }

        if (description.includes(token)) {
          score += 2;
        }

        if (text.includes(token)) {
          score += 1;
        }
      }

      return {
        ...article,
        score,
      };
    })
    .sort(
      (a, b) =>
        Number(b.score || 0) -
        Number(a.score || 0),
    );
}

// ============================================================
// UNIFIED SEARCH
// ============================================================

export async function runUnifiedSearch(
  query: string,
): Promise<UnifiedSearchResult> {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return {
      web: [],
      news: [],
      memory: [],
    };
  }

  const results =
    await Promise.allSettled([
      searchWeb(cleanQuery),
      loadNews(),
      loadMemories(),
    ]);

  const web =
    results[0].status === "fulfilled"
      ? results[0].value
      : [];

  const rawNews =
    results[1].status === "fulfilled"
      ? results[1].value
      : [];

  const memories =
    results[2].status === "fulfilled"
      ? results[2].value
      : [];

  return {
    web,

    news: rankNewsLocally(
      rawNews,
      cleanQuery,
    ).slice(0, 10),

    memory: semanticMemorySearch(
      memories,
      cleanQuery,
    ).slice(0, 10),
  };
}

// ============================================================
// CONVERSATIONAL SEARCH
// ============================================================

export async function askConversationalSearch(
  message: string,
  history: ConversationMessage[] = [],
  context?: {
    search?: unknown;
    news?: unknown;
    memory?: unknown;
  },
): Promise<{
  reply: string;
  model?: string;
  fallback?: boolean;
}> {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return {
      reply: "Please enter a question.",
    };
  }

  const data = await requestJson(
    `${BACKEND_URL}/api/ai/chat`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        message: cleanMessage,

        history,

        context: {
          search:
            context?.search ?? null,

          news:
            context?.news ?? null,

          memory:
            context?.memory ?? null,
        },

        model: "flash",
      }),
    },
  );

  return {
    reply:
      data?.reply ||
      data?.response ||
      data?.message ||
      "KANCHHI could not generate a response.",

    model:
      data?.model,

    fallback:
      data?.fallback === true,
  };
}