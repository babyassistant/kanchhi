"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  askConversationalSearch,
  runUnifiedSearch,
  semanticMemorySearch,
  loadMemories,
  type MemoryResult,
  type NewsResult,
  type SearchResult,
} from "@/lib/phase7Search";


// ============================================================
// TYPES
// ============================================================

type SearchMode =
  | "unified"
  | "conversation"
  | "memory";

type ChatMessage = {
  id: string;

  role:
    | "user"
    | "assistant";

  content: string;
};


// ============================================================
// HELPERS
// ============================================================

function createId(
  prefix: string,
): string {

  return (
    `${prefix}-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}


function safeString(
  value: unknown,
): string {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  return String(
    value,
  );
}


function getSearchTitle(
  result: SearchResult,
): string {

  return (
    safeString(
      result.title,
    ) ||
    safeString(
      result.name,
    ) ||
    "Untitled result"
  );
}


function getSearchDescription(
  result: SearchResult,
): string {

  return (
    safeString(
      result.description,
    ) ||
    safeString(
      result.snippet,
    ) ||
    "No description available."
  );
}


function getSearchLink(
  result: SearchResult,
): string {

  return (
    safeString(
      result.link,
    ) ||
    safeString(
      result.url,
    ) ||
    "#"
  );
}


function getMemoryTitle(
  memory: MemoryResult,
): string {

  return (
    safeString(
      memory.key,
    ) ||
    safeString(
      memory.category,
    ) ||
    "KANCHHI Memory"
  );
}


function getMemoryValue(
  memory: MemoryResult,
): string {

  return (
    safeString(
      memory.value,
    ) ||
    safeString(
      memory.content,
    ) ||
    "Saved information"
  );
}


// ============================================================
// COMPONENT
// ============================================================

export default function UnifiedSearchPanel() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    mode,
    setMode,
  ] = useState<SearchMode>(
    "unified",
  );


  const [
    query,
    setQuery,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // UNIFIED SEARCH
  // ==========================================================

  const [
    webResults,
    setWebResults,
  ] = useState<
    SearchResult[]
  >([]);


  const [
    newsResults,
    setNewsResults,
  ] = useState<
    NewsResult[]
  >([]);


  const [
    memoryResults,
    setMemoryResults,
  ] = useState<
    MemoryResult[]
  >([]);


  // ==========================================================
  // CONVERSATION
  // ==========================================================

  const [
    messages,
    setMessages,
  ] = useState<
    ChatMessage[]
  >([]);


  const [
    conversationInput,
    setConversationInput,
  ] = useState("");


  // ==========================================================
  // SEMANTIC MEMORY
  // ==========================================================

  const [
    allMemories,
    setAllMemories,
  ] = useState<
    MemoryResult[]
  >([]);


  const [
    memoryQuery,
    setMemoryQuery,
  ] = useState("");


  // ==========================================================
  // UNIFIED SEARCH
  // ==========================================================

  const executeUnifiedSearch =
    useCallback(
      async (
        searchQuery?: string,
      ) => {

        const clean =
          (
            searchQuery ??
            query
          ).trim();

        if (!clean) {

          setError(
            "Enter something to search.",
          );

          return;

        }

        try {

          setLoading(true);

          setError("");

          const result =
            await runUnifiedSearch(
              clean,
            );

          setWebResults(
            result.web,
          );

          setNewsResults(
            result.news,
          );

          setMemoryResults(
            result.memory,
          );

        } catch (
          searchError
        ) {

          console.error(
            "KANCHHI unified search error:",
            searchError,
          );

          setError(
            searchError instanceof
            Error
              ? searchError.message
              : "Unified search failed.",
          );

        } finally {

          setLoading(false);

        }

      },
      [
        query,
      ],
    );


  // ==========================================================
  // LOAD SEMANTIC MEMORY
  // ==========================================================

  const executeMemorySearch =
    useCallback(
      async () => {

        const clean =
          memoryQuery.trim();

        if (!clean) {

          setError(
            "Enter a memory search query.",
          );

          return;

        }

        try {

          setLoading(true);

          setError("");

          let source =
            allMemories;

          if (
            source.length ===
            0
          ) {

            source =
              await loadMemories();

            setAllMemories(
              source,
            );

          }

          const ranked =
            semanticMemorySearch(
              source,
              clean,
            );

          setMemoryResults(
            ranked.slice(
              0,
              20,
            ),
          );

        } catch (
          memoryError
        ) {

          console.error(
            "KANCHHI semantic memory search error:",
            memoryError,
          );

          setError(
            memoryError instanceof
            Error
              ? memoryError.message
              : "Semantic memory search failed.",
          );

        } finally {

          setLoading(false);

        }

      },
      [
        allMemories,
        memoryQuery,
      ],
    );


  // ==========================================================
  // CONVERSATIONAL SEARCH
  // ==========================================================

  const executeConversation =
    useCallback(
      async () => {

        const clean =
          conversationInput.trim();

        if (!clean) {

          return;

        }

        const userMessage:
          ChatMessage = {

          id:
            createId(
              "user",
            ),

          role:
            "user",

          content:
            clean,

        };


        setMessages(
          (
            previous,
          ) => [
            ...previous,
            userMessage,
          ],
        );


        setConversationInput("");

        setLoading(true);

        setError("");


        try {

          const context =
            await runUnifiedSearch(
              clean,
            );


          const history =
            messages.map(
              (
                message,
              ) => ({
                role:
                  message.role,

                content:
                  message.content,
              }),
            );


          const response =
            await askConversationalSearch(
              clean,
              history,
              {
                search:
                  context.web,

                news:
                  context.news,

                memory:
                  context.memory,
              },
            );


          const assistantMessage:
            ChatMessage = {

            id:
              createId(
                "assistant",
              ),

            role:
              "assistant",

            content:
              response.reply,

          };


          setMessages(
            (
              previous,
            ) => [
              ...previous,
              assistantMessage,
            ],
          );


        } catch (
          conversationError
        ) {

          console.error(
            "KANCHHI conversational search error:",
            conversationError,
          );

          setError(
            conversationError instanceof
            Error
              ? conversationError.message
              : "Conversational search failed.",
          );

        } finally {

          setLoading(false);

        }

      },
      [
        conversationInput,
        messages,
      ],
    );


  // ==========================================================
  // EXAMPLE SEARCHES
  // ==========================================================

  const suggestions =
    useMemo(
      () => [
        "latest AI news",
        "weather technology",
        "Python programming",
        "Gemini AI",
      ],
      [],
    );


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <section className="
      min-h-screen
      bg-[#0b1220]
      p-6
      md:p-8
    ">

      <div className="
        mx-auto
        max-w-7xl
      ">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="
          mb-8
        ">

          <p className="
            text-sm
            font-medium
            uppercase
            tracking-wider
            text-blue-400
          ">
            KANCHHI SEARCH
          </p>

          <h1 className="
            mt-2
            text-4xl
            font-bold
          ">
            Unified Search
          </h1>

          <p className="
            mt-2
            max-w-3xl
            text-slate-400
          ">
            Search the web, understand information
            conversationally, and find relevant
            information inside KANCHHI Memory.
          </p>

        </div>


        {/* ==================================================
            MODE SWITCHER
        ================================================== */}

        <div className="
          mb-6
          flex
          flex-wrap
          gap-2
        ">

          <button
            type="button"
            onClick={() =>
              setMode(
                "unified",
              )
            }
            className={`
              rounded-xl
              border
              px-4
              py-2.5
              text-sm
              transition
              ${
                mode === "unified"
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-800 bg-[#111c2e] text-slate-300 hover:bg-slate-800"
              }
            `}
          >
            🔎 Unified Search
          </button>


          <button
            type="button"
            onClick={() =>
              setMode(
                "conversation",
              )
            }
            className={`
              rounded-xl
              border
              px-4
              py-2.5
              text-sm
              transition
              ${
                mode === "conversation"
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-800 bg-[#111c2e] text-slate-300 hover:bg-slate-800"
              }
            `}
          >
            🤖 Conversational Search
          </button>


          <button
            type="button"
            onClick={() =>
              setMode(
                "memory",
              )
            }
            className={`
              rounded-xl
              border
              px-4
              py-2.5
              text-sm
              transition
              ${
                mode === "memory"
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-800 bg-[#111c2e] text-slate-300 hover:bg-slate-800"
              }
            `}
          >
            🧠 Semantic Memory Search
          </button>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="
            mb-6
            rounded-2xl
            border
            border-red-900/60
            bg-red-950/30
            p-4
            text-sm
            text-red-300
          ">

            {error}

          </div>

        )}


        {/* ==================================================
            UNIFIED SEARCH
        ================================================== */}

        {mode ===
          "unified" && (

          <div>

            <div className="
              rounded-2xl
              border
              border-slate-800
              bg-[#111c2e]
              p-5
              md:p-6
            ">

              <form
                onSubmit={(
                  event,
                ) => {

                  event.preventDefault();

                  executeUnifiedSearch();

                }}
                className="
                  flex
                  flex-col
                  gap-3
                  md:flex-row
                "
              >

                <input
                  value={query}
                  onChange={(
                    event,
                  ) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search web, news and KANCHHI memory..."
                  className="
                    min-w-0
                    flex-1
                    rounded-xl
                    border
                    border-slate-700
                    bg-[#0d1728]
                    px-4
                    py-3
                    text-white
                    outline-none
                    transition
                    focus:border-blue-500
                  "
                />

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="
                    rounded-xl
                    bg-blue-600
                    px-6
                    py-3
                    font-medium
                    transition
                    hover:bg-blue-500
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {loading
                    ? "Searching..."
                    : "Search"}
                </button>

              </form>


              <div className="
                mt-4
                flex
                flex-wrap
                gap-2
              ">

                {suggestions.map(
                  (
                    suggestion,
                  ) => (

                    <button
                      key={
                        suggestion
                      }
                      type="button"
                      onClick={() => {

                        setQuery(
                          suggestion,
                        );

                        executeUnifiedSearch(
                          suggestion,
                        );

                      }}
                      className="
                        rounded-lg
                        border
                        border-slate-800
                        bg-slate-900/60
                        px-3
                        py-1.5
                        text-xs
                        text-slate-400
                        transition
                        hover:border-blue-500
                        hover:text-slate-200
                      "
                    >
                      {suggestion}
                    </button>

                  )
                )}

              </div>

            </div>


            <div className="
              mt-6
              grid
              gap-6
              xl:grid-cols-3
            ">


              {/* WEB */}

              <div className="
                rounded-2xl
                border
                border-slate-800
                bg-[#111c2e]
                p-5
              ">

                <div className="
                  mb-5
                  flex
                  items-center
                  justify-between
                ">

                  <div>

                    <p className="
                      text-xs
                      uppercase
                      tracking-wider
                      text-blue-400
                    ">
                      WEB
                    </p>

                    <h2 className="
                      mt-1
                      text-lg
                      font-semibold
                    ">
                      Search Results
                    </h2>

                  </div>

                  <span className="
                    rounded-lg
                    bg-blue-600/10
                    px-2.5
                    py-1
                    text-xs
                    text-blue-400
                  ">
                    {webResults.length}
                  </span>

                </div>


                {webResults.length ===
                0 ? (

                  <p className="
                    text-sm
                    text-slate-500
                  ">
                    No web results yet.
                  </p>

                ) : (

                  <div className="
                    space-y-3
                  ">

                    {webResults
                      .slice(
                        0,
                        8,
                      )
                      .map(
                        (
                          result,
                          index,
                        ) => (

                          <a
                            key={
                              `${getSearchTitle(
                                result,
                              )}-${index}`
                            }
                            href={
                              getSearchLink(
                                result,
                              )
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="
                              block
                              rounded-xl
                              border
                              border-slate-800
                              bg-slate-900/60
                              p-4
                              transition
                              hover:border-blue-500/40
                            "
                          >

                            <p className="
                              line-clamp-2
                              text-sm
                              font-medium
                              text-slate-200
                            ">
                              {
                                getSearchTitle(
                                  result,
                                )
                              }
                            </p>

                            <p className="
                              mt-2
                              line-clamp-3
                              text-xs
                              leading-5
                              text-slate-500
                            ">
                              {
                                getSearchDescription(
                                  result,
                                )
                              }
                            </p>

                            {result.source && (

                              <p className="
                                mt-2
                                text-[11px]
                                text-blue-400
                              ">
                                {safeString(
                                  result.source,
                                )}
                              </p>

                            )}

                          </a>

                        )
                      )}

                  </div>

                )}

              </div>


              {/* NEWS */}

              <div className="
                rounded-2xl
                border
                border-slate-800
                bg-[#111c2e]
                p-5
              ">

                <div className="
                  mb-5
                  flex
                  items-center
                  justify-between
                ">

                  <div>

                    <p className="
                      text-xs
                      uppercase
                      tracking-wider
                      text-blue-400
                    ">
                      NEWS
                    </p>

                    <h2 className="
                      mt-1
                      text-lg
                      font-semibold
                    ">
                      Relevant News
                    </h2>

                  </div>

                  <span className="
                    rounded-lg
                    bg-blue-600/10
                    px-2.5
                    py-1
                    text-xs
                    text-blue-400
                  ">
                    {newsResults.length}
                  </span>

                </div>


                {newsResults.length ===
                0 ? (

                  <p className="
                    text-sm
                    text-slate-500
                  ">
                    No matching news yet.
                  </p>

                ) : (

                  <div className="
                    space-y-3
                  ">

                    {newsResults
                      .slice(
                        0,
                        8,
                      )
                      .map(
                        (
                          article,
                          index,
                        ) => (

                          <a
                            key={
                              `${safeString(
                                article.title,
                              )}-${index}`
                            }
                            href={
                              safeString(
                                article.link,
                              ) || "#"
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="
                              block
                              rounded-xl
                              border
                              border-slate-800
                              bg-slate-900/60
                              p-4
                              transition
                              hover:border-blue-500/40
                            "
                          >

                            <p className="
                              line-clamp-2
                              text-sm
                              font-medium
                              text-slate-200
                            ">
                              {
                                safeString(
                                  article.title,
                                ) ||
                                "Untitled article"
                              }
                            </p>

                            <p className="
                              mt-2
                              text-xs
                              text-slate-500
                            ">
                              {
                                safeString(
                                  article.source,
                                ) ||
                                "News"
                              }
                            </p>

                          </a>

                        )
                      )}

                  </div>

                )}

              </div>


              {/* MEMORY */}

              <div className="
                rounded-2xl
                border
                border-slate-800
                bg-[#111c2e]
                p-5
              ">

                <div className="
                  mb-5
                  flex
                  items-center
                  justify-between
                ">

                  <div>

                    <p className="
                      text-xs
                      uppercase
                      tracking-wider
                      text-blue-400
                    ">
                      MEMORY
                    </p>

                    <h2 className="
                      mt-1
                      text-lg
                      font-semibold
                    ">
                      Relevant Memories
                    </h2>

                  </div>

                  <span className="
                    rounded-lg
                    bg-blue-600/10
                    px-2.5
                    py-1
                    text-xs
                    text-blue-400
                  ">
                    {memoryResults.length}
                  </span>

                </div>


                {memoryResults.length ===
                0 ? (

                  <p className="
                    text-sm
                    text-slate-500
                  ">
                    No matching memories yet.
                  </p>

                ) : (

                  <div className="
                    space-y-3
                  ">

                    {memoryResults
                      .slice(
                        0,
                        8,
                      )
                      .map(
                        (
                          memory,
                          index,
                        ) => (

                          <div
                            key={
                              `${safeString(
                                memory.id,
                              )}-${index}`
                            }
                            className="
                              rounded-xl
                              border
                              border-slate-800
                              bg-slate-900/60
                              p-4
                            "
                          >

                            <div className="
                              flex
                              items-center
                              justify-between
                              gap-3
                            ">

                              <p className="
                                text-sm
                                font-medium
                                text-slate-200
                              ">
                                {
                                  getMemoryTitle(
                                    memory,
                                  )
                                }
                              </p>

                              <span className="
                                text-[11px]
                                text-blue-400
                              ">
                                score{" "}
                                {
                                  memory.score ??
                                  0
                                }
                              </span>

                            </div>

                            <p className="
                              mt-2
                              line-clamp-3
                              text-xs
                              leading-5
                              text-slate-500
                            ">
                              {
                                getMemoryValue(
                                  memory,
                                )
                              }
                            </p>

                          </div>

                        )
                      )}

                  </div>

                )}

              </div>

            </div>

          </div>

        )}


        {/* ==================================================
            CONVERSATIONAL SEARCH
        ================================================== */}

        {mode ===
          "conversation" && (

          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-5
            md:p-6
          ">

            <div className="
              mb-6
            ">

              <p className="
                text-xs
                uppercase
                tracking-wider
                text-blue-400
              ">
                PHASE 7 • 35
              </p>

              <h2 className="
                mt-1
                text-2xl
                font-semibold
              ">
                Conversational Search
              </h2>

              <p className="
                mt-2
                text-sm
                text-slate-500
              ">
                Ask questions naturally. KANCHHI can combine
                search results, news and your relevant memories
                before answering.
              </p>

            </div>


            <div className="
              min-h-[420px]
              rounded-2xl
              border
              border-slate-800
              bg-[#0d1728]
              p-4
              md:p-5
            ">

              {messages.length ===
              0 ? (

                <div className="
                  flex
                  min-h-[320px]
                  items-center
                  justify-center
                  text-center
                ">

                  <div className="
                    max-w-md
                  ">

                    <div className="
                      text-5xl
                    ">
                      🤖
                    </div>

                    <h3 className="
                      mt-4
                      text-xl
                      font-semibold
                    ">
                      Ask KANCHHI
                    </h3>

                    <p className="
                      mt-2
                      text-sm
                      text-slate-500
                    ">
                      Try asking:
                      "What is happening with AI today?"
                    </p>

                  </div>

                </div>

              ) : (

                <div className="
                  space-y-4
                ">

                  {messages.map(
                    (
                      message,
                    ) => (

                      <div
                        key={
                          message.id
                        }
                        className={`
                          flex
                          ${
                            message.role ===
                            "user"
                              ? "justify-end"
                              : "justify-start"
                          }
                        `}
                      >

                        <div
                          className={`
                            max-w-[85%]
                            rounded-2xl
                            px-4
                            py-3
                            text-sm
                            leading-6
                            ${
                              message.role ===
                              "user"
                                ? "bg-blue-600 text-white"
                                : "border border-slate-800 bg-slate-900 text-slate-300"
                            }
                          `}
                        >
                          <p className="
                            whitespace-pre-wrap
                          ">
                            {
                              message.content
                            }
                          </p>
                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            <form
              onSubmit={(
                event,
              ) => {

                event.preventDefault();

                executeConversation();

              }}
              className="
                mt-4
                flex
                flex-col
                gap-3
                md:flex-row
              "
            >

              <input
                value={
                  conversationInput
                }
                onChange={(
                  event,
                ) =>
                  setConversationInput(
                    event.target.value,
                  )
                }
                placeholder="Ask a question..."
                className="
                  min-w-0
                  flex-1
                  rounded-xl
                  border
                  border-slate-700
                  bg-[#0d1728]
                  px-4
                  py-3
                  text-white
                  outline-none
                  focus:border-blue-500
                "
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !conversationInput.trim()
                }
                className="
                  rounded-xl
                  bg-blue-600
                  px-6
                  py-3
                  font-medium
                  transition
                  hover:bg-blue-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading
                  ? "Thinking..."
                  : "Ask KANCHHI"}
              </button>

            </form>

          </div>

        )}


        {/* ==================================================
            SEMANTIC MEMORY SEARCH
        ================================================== */}

        {mode ===
          "memory" && (

          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-5
            md:p-6
          ">

            <div className="
              mb-6
            ">

              <p className="
                text-xs
                uppercase
                tracking-wider
                text-blue-400
              ">
                PHASE 7 • 36
              </p>

              <h2 className="
                mt-1
                text-2xl
                font-semibold
              ">
                Semantic Memory Search
              </h2>

              <p className="
                mt-2
                text-sm
                text-slate-500
              ">
                Find saved information by meaning and related
                terms instead of requiring an exact phrase.
              </p>

            </div>


            <form
              onSubmit={(
                event,
              ) => {

                event.preventDefault();

                executeMemorySearch();

              }}
              className="
                flex
                flex-col
                gap-3
                md:flex-row
              "
            >

              <input
                value={
                  memoryQuery
                }
                onChange={(
                  event,
                ) =>
                  setMemoryQuery(
                    event.target.value,
                  )
                }
                placeholder="Search your KANCHHI memory..."
                className="
                  min-w-0
                  flex-1
                  rounded-xl
                  border
                  border-slate-700
                  bg-[#0d1728]
                  px-4
                  py-3
                  text-white
                  outline-none
                  focus:border-blue-500
                "
              />

              <button
                type="submit"
                disabled={
                  loading
                }
                className="
                  rounded-xl
                  bg-blue-600
                  px-6
                  py-3
                  font-medium
                  transition
                  hover:bg-blue-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading
                  ? "Searching..."
                  : "Search Memory"}
              </button>

            </form>


            <div className="
              mt-6
            ">

              {memoryResults.length ===
              0 ? (

                <div className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-[#0d1728]
                  p-8
                  text-center
                ">

                  <div className="
                    text-4xl
                  ">
                    🧠
                  </div>

                  <p className="
                    mt-3
                    text-sm
                    text-slate-500
                  ">
                    No matching memories found.
                  </p>

                </div>

              ) : (

                <div className="
                  grid
                  gap-4
                  md:grid-cols-2
                ">

                  {memoryResults.map(
                    (
                      memory,
                      index,
                    ) => (

                      <div
                        key={
                          `${safeString(
                            memory.id,
                          )}-${index}`
                        }
                        className="
                          rounded-2xl
                          border
                          border-slate-800
                          bg-[#0d1728]
                          p-5
                        "
                      >

                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        ">

                          <p className="
                            text-sm
                            font-semibold
                            text-slate-200
                          ">
                            {
                              getMemoryTitle(
                                memory,
                              )
                            }
                          </p>

                          <span className="
                            rounded-lg
                            bg-blue-600/10
                            px-2
                            py-1
                            text-xs
                            text-blue-400
                          ">
                            {
                              memory.score ??
                              0
                            }
                          </span>

                        </div>

                        <p className="
                          mt-3
                          text-sm
                          leading-6
                          text-slate-400
                        ">
                          {
                            getMemoryValue(
                              memory,
                            )
                          }
                        </p>

                        {memory.category && (

                          <p className="
                            mt-3
                            text-xs
                            text-slate-600
                          ">
                            Category:{" "}
                            {
                              safeString(
                                memory.category,
                              )
                            }
                          </p>

                        )}

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        )}

      </div>

    </section>

  );
}