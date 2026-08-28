"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

// ============================================================
// TYPES
// ============================================================

type ScheduledTask = {
  id?: string | number;

  title?: string;

  description?: string;

  task?: string;

  schedule?: string;

  cron?: string;

  status?: string;

  enabled?: boolean;

  active?: boolean;

  next_run?: string;

  nextRun?: string;

  created_at?: string;

  createdAt?: string;

  [key: string]: unknown;
};

type ScheduledTasksResponse = {
  success?: boolean;

  tasks?: ScheduledTask[];

  error?: string;

  detail?: string;
};


// ============================================================
// API
// ============================================================

const BACKEND_URL =
  "http://localhost:8000";

const TASKS_API =
  `${BACKEND_URL}/api/scheduled-tasks`;


// ============================================================
// HELPERS
// ============================================================

function formatDate(
  value?: string,
): string {
  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function getTaskTitle(
  task: ScheduledTask,
): string {
  return (
    task.title ||
    task.task ||
    "Scheduled task"
  );
}

function getTaskDescription(
  task: ScheduledTask,
): string {
  return (
    task.description ||
    task.schedule ||
    task.cron ||
    "Scheduled KANCHHI task."
  );
}

function isTaskEnabled(
  task: ScheduledTask,
): boolean {
  if (
    typeof task.enabled ===
    "boolean"
  ) {
    return task.enabled;
  }

  if (
    typeof task.active ===
    "boolean"
  ) {
    return task.active;
  }

  return (
    task.status === "active" ||
    task.status === "enabled"
  );
}


// ============================================================
// COMPONENT
// ============================================================

export default function ScheduledTasksPanel() {

  const [
    tasks,
    setTasks,
  ] = useState<ScheduledTask[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // LOAD TASKS
  // ==========================================================

  const loadTasks =
    useCallback(
      async () => {

        try {

          setError("");

          setRefreshing(
            tasks.length > 0,
          );

          setLoading(
            tasks.length === 0,
          );

          const response =
            await fetch(
              TASKS_API,
              {
                method: "GET",
                cache: "no-store",
              },
            );

          let data:
            ScheduledTasksResponse;

          try {

            data =
              await response.json();

          } catch {

            data = {};

          }

          if (!response.ok) {

            throw new Error(
              data?.detail ||
              data?.error ||
              `Scheduled tasks returned HTTP ${response.status}.`,
            );
          }

          setTasks(
            Array.isArray(
              data?.tasks,
            )
              ? data.tasks
              : [],
          );

        } catch (
          requestError
        ) {

          console.error(
            "KANCHHI scheduled tasks error:",
            requestError,
          );

          setError(
            requestError instanceof
            Error
              ? requestError.message
              : "Unable to load scheduled tasks.",
          );

          setTasks([]);

        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      [
        tasks.length,
      ],
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadTasks();

  }, [
    loadTasks,
  ]);


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
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-end
          md:justify-between
        ">

          <div>

            <p className="
              text-sm
              font-medium
              uppercase
              tracking-wider
              text-blue-400
            ">
              KANCHHI AUTOMATION
            </p>

            <h1 className="
              mt-2
              text-4xl
              font-bold
            ">
              Scheduled Tasks
            </h1>

            <p className="
              mt-2
              max-w-2xl
              text-slate-400
            ">
              Tasks scheduled for KANCHHI to
              execute automatically.
            </p>

          </div>


          <button
            type="button"
            onClick={
              loadTasks
            }
            disabled={
              refreshing
            }
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              px-5
              py-3
              transition
              hover:bg-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
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
            p-5
          ">

            <p className="
              font-semibold
              text-red-300
            ">
              Scheduled task service unavailable
            </p>

            <p className="
              mt-2
              text-sm
              text-red-200/70
            ">
              {error}
            </p>

          </div>

        )}


        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div className="
          mb-6
          grid
          gap-5
          md:grid-cols-3
        ">

          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-5
          ">

            <p className="
              text-sm
              text-slate-500
            ">
              Total Tasks
            </p>

            <p className="
              mt-2
              text-3xl
              font-bold
            ">
              {tasks.length}
            </p>

          </div>


          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-5
          ">

            <p className="
              text-sm
              text-slate-500
            ">
              Active
            </p>

            <p className="
              mt-2
              text-3xl
              font-bold
              text-emerald-400
            ">
              {
                tasks.filter(
                  isTaskEnabled,
                ).length
              }
            </p>

          </div>


          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-5
          ">

            <p className="
              text-sm
              text-slate-500
            ">
              Status
            </p>

            <p className="
              mt-2
              text-lg
              font-semibold
              text-slate-200
            ">
              Scheduler ready
            </p>

          </div>

        </div>


        {/* ==================================================
            TASKS
        ================================================== */}

        {loading ? (

          <div className="
            grid
            gap-5
            md:grid-cols-2
            xl:grid-cols-3
          ">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="
                    h-44
                    animate-pulse
                    rounded-2xl
                    border
                    border-slate-800
                    bg-[#111c2e]
                  "
                />

              ),
            )}

          </div>

        ) : tasks.length === 0 ? (

          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-10
            text-center
          ">

            <div className="
              text-5xl
            ">
              ⏰
            </div>

            <h2 className="
              mt-4
              text-xl
              font-semibold
            ">
              No scheduled tasks
            </h2>

            <p className="
              mt-2
              text-sm
              text-slate-500
            ">
              KANCHHI does not have any scheduled
              tasks yet.
            </p>

          </div>

        ) : (

          <div className="
            grid
            gap-5
            md:grid-cols-2
            xl:grid-cols-3
          ">

            {tasks.map(
              (
                task,
                index,
              ) => (

                <div
                  key={
                    String(
                      task.id ??
                      `${getTaskTitle(task)}-${index}`,
                    )
                  }
                  className="
                    rounded-2xl
                    border
                    border-slate-800
                    bg-[#111c2e]
                    p-5
                  "
                >

                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">

                    <div>

                      <p className="
                        text-xs
                        uppercase
                        tracking-wider
                        text-blue-400
                      ">
                        TASK
                      </p>

                      <h2 className="
                        mt-1
                        text-lg
                        font-semibold
                        text-white
                      ">
                        {
                          getTaskTitle(
                            task,
                          )
                        }
                      </h2>

                    </div>

                    <span
                      className={`
                        rounded-full
                        px-2.5
                        py-1
                        text-xs
                        font-medium
                        ${
                          isTaskEnabled(
                            task,
                          )
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-800 text-slate-500"
                        }
                      `}
                    >
                      {
                        isTaskEnabled(
                          task,
                        )
                          ? "Active"
                          : "Inactive"
                      }
                    </span>

                  </div>


                  <p className="
                    mt-4
                    text-sm
                    leading-6
                    text-slate-400
                  ">
                    {
                      getTaskDescription(
                        task,
                      )
                    }
                  </p>


                  <div className="
                    mt-5
                    border-t
                    border-slate-800
                    pt-4
                  ">

                    <p className="
                      text-xs
                      text-slate-600
                    ">
                      Next run
                    </p>

                    <p className="
                      mt-1
                      text-sm
                      text-slate-300
                    ">
                      {
                        formatDate(
                          task.next_run ||
                          task.nextRun,
                        )
                      }
                    </p>

                  </div>

                </div>

              ),
            )}

          </div>

        )}

      </div>

    </section>

  );
}