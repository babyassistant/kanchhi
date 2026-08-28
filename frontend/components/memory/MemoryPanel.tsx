"use client";

import {
  useEffect,
  useState,
} from "react";


// ============================================================
// TYPES
// ============================================================

type Memory = {
  id: number;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
};


// ============================================================
// COMPONENT
// ============================================================

export default function MemoryPanel() {

  const [memories, setMemories] =
    useState<Memory[]>([]);

  const [content, setContent] =
    useState("");

  const [category, setCategory] =
    useState("general");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);


  // ==========================================================
  // LOAD MEMORIES
  // ==========================================================

  const loadMemories = async () => {

    setLoading(true);

    setError("");

    try {

      const response = await fetch(
        "http://localhost:8000/api/memory/list"
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Could not load memories."
        );

      }

      setMemories(
        data.memories || []
      );

    } catch (error: any) {

      console.error(
        "KANCHHI Memory Error:",
        error
      );

      setError(
        error.message ||
        "Could not load memories."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadMemories();

  }, []);


  // ==========================================================
  // SAVE MEMORY
  // ==========================================================

  const saveMemory = async () => {

    const trimmed =
      content.trim();

    if (!trimmed || saving) {

      return;

    }

    setSaving(true);

    setError("");

    setSuccess("");

    try {

      const response = await fetch(
        "http://localhost:8000/api/memory",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            content: trimmed,
            category:
              category.trim() ||
              "general",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Could not save memory."
        );

      }

      if (data.memory) {

        setMemories(
          (previous) => [
            data.memory,
            ...previous,
          ]
        );

      }

      setContent("");

      setCategory("general");

      setSuccess(
        "Memory saved successfully."
      );

    } catch (error: any) {

      console.error(
        "KANCHHI Memory Error:",
        error
      );

      setError(
        error.message ||
        "Could not save memory."
      );

    } finally {

      setSaving(false);

    }

  };


  // ==========================================================
  // DELETE MEMORY
  // ==========================================================

  const deleteMemory = async (
    id: number
  ) => {

    if (deletingId !== null) {

      return;

    }

    setDeletingId(id);

    setError("");

    setSuccess("");

    try {

      const response = await fetch(
        `http://localhost:8000/api/memory/${id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Could not delete memory."
        );

      }

      setMemories(
        (previous) =>
          previous.filter(
            (memory) =>
              memory.id !== id
          )
      );

      setSuccess(
        "Memory deleted."
      );

    } catch (error: any) {

      console.error(
        "KANCHHI Memory Error:",
        error
      );

      setError(
        error.message ||
        "Could not delete memory."
      );

    } finally {

      setDeletingId(null);

    }

  };


  // ==========================================================
  // CLEAR ALL
  // ==========================================================

  const clearAllMemories = async () => {

    if (memories.length === 0) {

      return;

    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete all KANCHHI memories?"
      );

    if (!confirmed) {

      return;

    }

    setError("");

    setSuccess("");

    try {

      const response = await fetch(
        "http://localhost:8000/api/memory",
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Could not clear memories."
        );

      }

      setMemories([]);

      setSuccess(
        `${data.deleted || 0} memories cleared.`
      );

    } catch (error: any) {

      console.error(
        "KANCHHI Memory Error:",
        error
      );

      setError(
        error.message ||
        "Could not clear memories."
      );

    }

  };


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    value: string
  ) => {

    try {

      return new Date(
        value
      ).toLocaleString();

    } catch {

      return value;

    }

  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <section className="p-8 lg:p-10">

      <div className="max-w-5xl mx-auto">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-start justify-between gap-4 mb-8">

          <div>

            <p className="text-blue-400 text-sm font-medium mb-2">
              KANCHHI INTELLIGENCE
            </p>

            <h2 className="text-4xl font-bold">
              KANCHHI Memory
            </h2>

            <p className="text-slate-400 mt-2">
              Let KANCHHI remember useful information
              you choose to save.
            </p>

          </div>


          {memories.length > 0 && (

            <button
              onClick={clearAllMemories}
              className="px-4 py-2 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-900 text-sm text-red-300 transition"
            >
              Clear All
            </button>

          )}

        </div>


        {/* ==================================================
            INFORMATION CARD
        ================================================== */}

        <div className="mb-6 rounded-2xl border border-blue-900/40 bg-blue-950/20 p-5">

          <div className="flex gap-4">

            <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl">
              🧠
            </div>

            <div>

              <h3 className="font-semibold text-white">
                Your memory, your control
              </h3>

              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                KANCHHI only remembers information that
                you explicitly save here. You can delete
                individual memories or clear everything
                at any time.
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            ADD MEMORY
        ================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6 mb-6">

          <h3 className="text-lg font-semibold mb-1">
            Save a memory
          </h3>

          <p className="text-sm text-slate-500 mb-5">
            Add something useful that you want KANCHHI
            to remember.
          </p>


          <div className="space-y-4">

            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              placeholder="Example: I prefer Python for backend development."
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-xl bg-[#182235] border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition"
            />


            <div className="flex flex-col sm:flex-row gap-3">

              <input
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                placeholder="Category"
                maxLength={100}
                className="sm:w-56 rounded-xl bg-[#182235] border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition"
              />


              <button
                onClick={saveMemory}
                disabled={
                  saving ||
                  !content.trim()
                }
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition"
              >

                {saving
                  ? "Saving..."
                  : "Save Memory"}

              </button>

            </div>


            <div className="flex justify-between text-xs text-slate-600">

              <span>
                Keep memories useful and concise.
              </span>

              <span>
                {content.length}/2000
              </span>

            </div>

          </div>

        </div>


        {/* ==================================================
            STATUS
        ================================================== */}

        {success && (

          <div className="mb-4 rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>

        )}


        {error && (

          <div className="mb-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>

        )}


        {/* ==================================================
            MEMORY LIST
        ================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-[#111c2e] overflow-hidden">

          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">

            <div>

              <h3 className="font-semibold">
                Saved Memories
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                {memories.length}{" "}
                {memories.length === 1
                  ? "memory"
                  : "memories"}
              </p>

            </div>

          </div>


          {/* LOADING */}

          {loading && (

            <div className="p-8 space-y-4">

              {[1, 2, 3].map(
                (item) => (

                  <div
                    key={item}
                    className="animate-pulse"
                  >

                    <div className="h-5 w-3/4 bg-slate-800 rounded" />

                    <div className="h-3 w-1/3 bg-slate-800 rounded mt-3" />

                  </div>

                )
              )}

            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            memories.length === 0 && (

              <div className="min-h-[280px] flex items-center justify-center p-8">

                <div className="text-center max-w-md">

                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl">
                    🧠
                  </div>

                  <h3 className="text-lg font-semibold">
                    No memories yet
                  </h3>

                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    When you save something above,
                    it will appear here and can later
                    be used by KANCHHI.
                  </p>

                </div>

              </div>

            )}


          {/* MEMORIES */}

          {!loading &&
            memories.length > 0 && (

              <div className="divide-y divide-slate-800">

                {memories.map(
                  (memory) => (

                    <div
                      key={memory.id}
                      className="p-6 hover:bg-slate-900/30 transition"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2 mb-3">

                            <span className="px-2.5 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300">
                              {memory.category}
                            </span>

                            <span className="text-xs text-slate-600">
                              {formatDate(
                                memory.updated_at
                              )}
                            </span>

                          </div>

                          <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {memory.content}
                          </p>

                        </div>


                        <button
                          onClick={() =>
                            deleteMemory(
                              memory.id
                            )
                          }
                          disabled={
                            deletingId ===
                            memory.id
                          }
                          className="shrink-0 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition disabled:opacity-40"
                        >

                          {deletingId ===
                          memory.id
                            ? "..."
                            : "Delete"}

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

        </div>

      </div>

    </section>

  );

}