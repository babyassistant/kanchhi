"use client";

import {
  useMemo,
  useState,
} from "react";

type ProjectFile = {
  path: string;
  content: string;
};

type AIResponse = {
  reply?: string;
  model?: string;
  model_key?: string;
  fallback?: boolean;
  detail?: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

function parseProjectFiles(
  text: string,
): ProjectFile[] {
  const blocks =
    text
      .split(
        /\n={3,}\n/,
      )
      .map(
        (block) =>
          block.trim(),
      )
      .filter(Boolean);

  const files: ProjectFile[] =
    [];

  for (
    const block of blocks
  ) {
    const match =
      block.match(
        /^FILE:\s*(.+)\n([\s\S]*)$/i,
      );

    if (!match) {
      continue;
    }

    files.push({
      path:
        match[1].trim(),

      content:
        match[2].trim(),
    });
  }

  return files;
}

async function postCodeAI(
  path: string,
  body: unknown,
): Promise<AIResponse> {
  const response =
    await fetch(
      `${BACKEND_URL}/api/ai/code${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        body:
          JSON.stringify(
            body,
          ),
        cache:
          "no-store",
      },
    );

  const data =
    await response
      .json()
      .catch(
        () => ({}),
      ) as AIResponse;

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.reply ||
        `KANCHHI Code AI returned HTTP ${response.status}.`,
    );
  }

  return data;
}

export default function CodeIntelligencePanel() {
  const [
    activeMode,
    setActiveMode,
  ] = useState<
    "review" |
    "project" |
    "docs"
  >("review");

  const [
    code,
    setCode,
  ] = useState("");

  const [
    filename,
    setFilename,
  ] = useState(
    "example.tsx",
  );

  const [
    language,
    setLanguage,
  ] = useState(
    "TypeScript / TSX",
  );

  const [
    question,
    setQuestion,
  ] = useState("");

  const [
    projectText,
    setProjectText,
  ] = useState("");

  const [
    projectName,
    setProjectName,
  ] = useState(
    "KANCHHI Project",
  );

  const [
    output,
    setOutput,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const parsedFiles =
    useMemo(
      () =>
        parseProjectFiles(
          projectText,
        ),
      [projectText],
    );

  async function handleReview() {
    if (!code.trim()) {
      setError(
        "Paste code into the editor first.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const result =
        await postCodeAI(
          "/review",
          {
            filename,
            language,
            code,
            project_files:
              parsedFiles,
          },
        );

      setOutput(
        result.reply ||
          "No code review was returned.",
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Code review failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleProject() {
    if (!question.trim()) {
      setError(
        "Enter a project question first.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const result =
        await postCodeAI(
          "/project",
          {
            question,
            project_files:
              parsedFiles,
          },
        );

      setOutput(
        result.reply ||
          "No project response was returned.",
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Project assistant failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDocs() {
    if (
      parsedFiles.length ===
      0
    ) {
      setError(
        'Add project files using "FILE: path" blocks first.',
      );
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const result =
        await postCodeAI(
          "/documentation",
          {
            project_name:
              projectName,
            project_files:
              parsedFiles,
          },
        );

      setOutput(
        result.reply ||
          "No documentation was returned.",
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Documentation generation failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAction() {
    if (
      activeMode ===
      "review"
    ) {
      await handleReview();
      return;
    }

    if (
      activeMode ===
      "project"
    ) {
      await handleProject();
      return;
    }

    await handleDocs();
  }

  return (
    <section className="min-h-screen bg-[#0b1220] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
            KANCHHI CODE INTELLIGENCE
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            AI Code Intelligence
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Review code, reason about your project, and generate technical documentation.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">

          {[
            {
              id: "review" as const,
              icon: "🔍",
              title:
                "AI Code Review",
              text:
                "Find bugs, security risks, and maintainability problems.",
            },
            {
              id: "project" as const,
              icon: "🧠",
              title:
                "Project-Aware Assistant",
              text:
                "Ask questions using project files as context.",
            },
            {
              id: "docs" as const,
              icon: "📚",
              title:
                "Project Documentation",
              text:
                "Generate documentation from supplied project files.",
            },
          ].map(
            (mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() =>
                  setActiveMode(
                    mode.id,
                  )
                }
                className={`
                  rounded-2xl
                  border
                  p-5
                  text-left
                  transition
                  ${
                    activeMode ===
                    mode.id
                      ? "border-blue-500 bg-blue-600/20"
                      : "border-slate-800 bg-[#111c2e] hover:bg-slate-900"
                  }
                `}
              >
                <div className="text-2xl">
                  {mode.icon}
                </div>

                <p className="mt-3 font-semibold">
                  {mode.title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {mode.text}
                </p>
              </button>
            ),
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

            {activeMode ===
              "review" && (
              <>
                <div className="grid gap-4 md:grid-cols-2">

                  <input
                    value={filename}
                    onChange={(
                      event,
                    ) =>
                      setFilename(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Filename"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />

                  <input
                    value={language}
                    onChange={(
                      event,
                    ) =>
                      setLanguage(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Language"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />

                </div>

                <textarea
                  value={code}
                  onChange={(
                    event,
                  ) =>
                    setCode(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Paste code here..."
                  className="mt-5 h-[460px] w-full resize-none rounded-xl border border-slate-700 bg-[#080d17] p-4 font-mono text-sm text-green-300 outline-none focus:border-blue-500"
                />
              </>
            )}

            {activeMode !==
              "review" && (
              <>
                {activeMode ===
                  "project" && (
                  <textarea
                    value={question}
                    onChange={(
                      event,
                    ) =>
                      setQuestion(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Ask a question about your project..."
                    className="h-32 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-white outline-none focus:border-blue-500"
                  />
                )}

                {activeMode ===
                  "docs" && (
                  <input
                    value={projectName}
                    onChange={(
                      event,
                    ) =>
                      setProjectName(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Project name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                )}

                <textarea
                  value={projectText}
                  onChange={(
                    event,
                  ) =>
                    setProjectText(
                      event.target
                        .value,
                    )
                  }
                  placeholder={
                    "FILE: frontend/app/page.tsx\n...\n====================\nFILE: backend/main.py\n..."
                  }
                  className="mt-5 h-[420px] w-full resize-none rounded-xl border border-slate-700 bg-[#080d17] p-4 font-mono text-sm text-slate-300 outline-none focus:border-blue-500"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Parsed files:{" "}
                  {parsedFiles.length}
                </p>
              </>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={
                handleAction
              }
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "KANCHHI is working..."
                : activeMode ===
                    "review"
                  ? "🔍 Review Code"
                  : activeMode ===
                      "project"
                    ? "🧠 Ask KANCHHI"
                    : "📚 Generate Documentation"}
            </button>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-400">
                  KANCHHI INTELLIGENCE
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {activeMode ===
                    "review"
                    ? "Code Review"
                    : activeMode ===
                        "project"
                      ? "Project Assistant"
                      : "Generated Documentation"}
                </h2>
              </div>

              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-500">
                AI
              </span>
            </div>

            <div className="mt-5 h-[580px] overflow-auto rounded-xl border border-slate-800 bg-[#080d17] p-5">

              {output ? (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-300">
                  {output}
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-sm text-slate-600">
                  <div>
                    <div className="text-4xl">
                      🤖
                    </div>

                    <p className="mt-3">
                      KANCHHI Code Intelligence output will appear here.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}