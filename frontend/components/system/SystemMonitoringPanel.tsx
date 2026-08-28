"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";


/* ============================================================
   TYPES
============================================================ */

type ServiceStatus =
  | "online"
  | "warning"
  | "offline"
  | "checking";


type ServiceCheck = {
  name?: string;
  status?: ServiceStatus | "degraded";
  detail?: string;
  message?: string;
  duration_ms?: number;
  latency_ms?: number;
};


type MonitoringSummary = {
  total?: number;
  online?: number;
  warning?: number;
  offline?: number;
};


type MonitoringResponse = {
  success?: boolean;

  service?: string;

  status?:
    | "healthy"
    | "warning"
    | "degraded"
    | "online";

  timestamp?: string;

  uptime_seconds?: number;

  uptime_minutes?: number;

  python_version?: string;

  platform?: string;

  checks?: ServiceCheck[];

  services?: ServiceCheck[];

  summary?: MonitoringSummary;

  total_duration_ms?: number;

  external_checks?: boolean;

  version?: string;
};


/* ============================================================
   API
============================================================ */

const SYSTEM_API =
  process.env.NEXT_PUBLIC_BACKEND_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/system`
    : "http://localhost:8000/api/system";


/* ============================================================
   HELPERS
============================================================ */

function normalizeStatus(
  status?:
    | ServiceStatus
    | "degraded"
): ServiceStatus {

  if (
    status === "online"
  ) {
    return "online";
  }

  if (
    status === "warning"
    ||
    status === "degraded"
  ) {
    return "warning";
  }

  if (
    status === "offline"
  ) {
    return "offline";
  }

  if (
    status === "checking"
  ) {
    return "checking";
  }

  return "checking";
}


function getCheckName(
  check: ServiceCheck
): string {

  return (
    typeof check.name ===
      "string" &&
    check.name.trim()
      ? check.name.trim()
      : "Unknown Service"
  );
}


function getCheckDetail(
  check: ServiceCheck
): string {

  if (
    typeof check.detail ===
    "string"
  ) {

    return check.detail;

  }


  if (
    typeof check.message ===
    "string"
  ) {

    return check.message;

  }


  return "No diagnostic information available.";
}


function getDuration(
  check: ServiceCheck
): number | null {

  if (
    typeof check.duration_ms ===
      "number" &&
    Number.isFinite(
      check.duration_ms
    )
  ) {

    return check.duration_ms;

  }


  if (
    typeof check.latency_ms ===
      "number" &&
    Number.isFinite(
      check.latency_ms
    )
  ) {

    return check.latency_ms;

  }


  return null;
}


function statusText(
  status: ServiceStatus
): string {

  switch (status) {

    case "online":
      return "Operational";

    case "warning":
      return "Warning";

    case "offline":
      return "Offline";

    case "checking":
      return "Checking...";

    default:
      return "Unknown";

  }
}


function statusDot(
  status: ServiceStatus
): string {

  switch (status) {

    case "online":
      return "bg-emerald-400";

    case "warning":
      return "bg-amber-400";

    case "offline":
      return "bg-red-400";

    case "checking":
      return "bg-blue-400 animate-pulse";

    default:
      return "bg-slate-500";

  }
}


function statusBadge(
  status: ServiceStatus
): string {

  switch (status) {

    case "online":
      return (
        "bg-emerald-500/10 " +
        "border-emerald-500/20 " +
        "text-emerald-300"
      );

    case "warning":
      return (
        "bg-amber-500/10 " +
        "border-amber-500/20 " +
        "text-amber-300"
      );

    case "offline":
      return (
        "bg-red-500/10 " +
        "border-red-500/20 " +
        "text-red-300"
      );

    case "checking":
      return (
        "bg-blue-500/10 " +
        "border-blue-500/20 " +
        "text-blue-300"
      );

    default:
      return (
        "bg-slate-500/10 " +
        "border-slate-500/20 " +
        "text-slate-400"
      );

  }
}


function formatDuration(
  seconds?: number
): string {

  if (
    typeof seconds !==
      "number" ||
    !Number.isFinite(
      seconds
    )
  ) {

    return "--";

  }


  const total =
    Math.max(
      0,
      Math.floor(seconds)
    );


  const days =
    Math.floor(
      total / 86400
    );


  const hours =
    Math.floor(
      (total % 86400) /
      3600
    );


  const minutes =
    Math.floor(
      (total % 3600) /
      60
    );


  if (
    days > 0
  ) {

    return `${days}d ${hours}h ${minutes}m`;

  }


  if (
    hours > 0
  ) {

    return `${hours}h ${minutes}m`;

  }


  return `${minutes}m`;
}


function formatTime(
  value?: string
): string {

  if (!value) {
    return "--";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "--";

  }


  return date.toLocaleTimeString(
    undefined,
    {
      hour:
        "numeric",

      minute:
        "2-digit",

      second:
        "2-digit",
    }
  );
}


/* ============================================================
   COMPONENT
============================================================ */

export default function SystemMonitoringPanel() {

  const [
    data,
    setData,
  ] = useState<
    MonitoringResponse | null
  >(null);


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


  const [
    browserOnline,
    setBrowserOnline,
  ] = useState(true);


  const [
    autoRefresh,
    setAutoRefresh,
  ] = useState(true);


  const [
    lastChecked,
    setLastChecked,
  ] = useState("");


  const [
    expandedCheck,
    setExpandedCheck,
  ] = useState<string | null>(
    null
  );


  /* ==========================================================
     FETCH
  ========================================================== */

  const fetchChecks =
    useCallback(
      async (
        manual = false
      ) => {

        if (
          typeof navigator !==
          "undefined"
        ) {

          const online =
            navigator.onLine;


          setBrowserOnline(
            online
          );


          if (!online) {

            setError(
              "Your browser is offline. System checks cannot be refreshed."
            );

            setLoading(false);

            setRefreshing(false);

            return;

          }

        }


        if (manual) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        setError("");


        try {

          const response =
            await fetch(
              `${SYSTEM_API}/checks?external=true`,
              {
                method:
                  "GET",

                cache:
                  "no-store",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );


          let result:
            MonitoringResponse;


          try {

            result =
              (
                await response.json()
              ) as MonitoringResponse;

          } catch {

            throw new Error(
              `System monitoring returned invalid JSON (HTTP ${response.status}).`
            );

          }


          if (
            !response.ok
          ) {

            throw new Error(
              `System monitoring returned HTTP ${response.status}.`
            );

          }


          if (
            result.success ===
            false
          ) {

            throw new Error(
              "System monitoring reported a failed health check."
            );

          }


          setData(
            result
          );


          setLastChecked(
            new Date().toISOString()
          );


        } catch (
          requestError
        ) {

          console.error(
            "KANCHHI System Checks Error:",
            requestError
          );


          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load system checks."
          );


        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      []
    );


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {

    fetchChecks(false);


    const handleOnline =
      () => {

        setBrowserOnline(
          true
        );

        fetchChecks(false);

      };


    const handleOffline =
      () => {

        setBrowserOnline(
          false
        );

      };


    window.addEventListener(
      "online",
      handleOnline
    );


    window.addEventListener(
      "offline",
      handleOffline
    );


    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );


      window.removeEventListener(
        "offline",
        handleOffline
      );

    };

  }, [
    fetchChecks,
  ]);


  /* ==========================================================
     AUTO REFRESH
  ========================================================== */

  useEffect(() => {

    if (!autoRefresh) {
      return;
    }


    const interval =
      window.setInterval(
        () => {

          if (
            navigator.onLine
          ) {

            fetchChecks(false);

          }

        },
        15000
      );


    return () => {

      window.clearInterval(
        interval
      );

    };

  }, [
    autoRefresh,
    fetchChecks,
  ]);


  /* ==========================================================
     DERIVED CHECKS
  ========================================================== */

  const checks =
    useMemo(
      () => {

        const source =
          Array.isArray(
            data?.checks
          )
            ? data.checks
            : Array.isArray(
                data?.services
              )
              ? data.services
              : [];


        return source
          .filter(
            (
              item
            ): item is ServiceCheck =>
              Boolean(
                item &&
                typeof item ===
                  "object"
              )
          )
          .map(
            (
              item
            ) => ({
              ...item,

              name:
                getCheckName(
                  item
                ),

              detail:
                getCheckDetail(
                  item
                ),

              status:
                normalizeStatus(
                  item.status
                ),
            })
          );

      },
      [data]
    );


  const summary =
    data?.summary;


  const total =
    typeof summary?.total ===
      "number"
      ? summary.total
      : checks.length;


  const online =
    typeof summary?.online ===
      "number"
      ? summary.online
      : checks.filter(
          (
            check
          ) =>
            normalizeStatus(
              check.status
            ) ===
            "online"
        ).length;


  const warning =
    typeof summary?.warning ===
      "number"
      ? summary.warning
      : checks.filter(
          (
            check
          ) =>
            normalizeStatus(
              check.status
            ) ===
            "warning"
        ).length;


  const offline =
    typeof summary?.offline ===
      "number"
      ? summary.offline
      : checks.filter(
          (
            check
          ) =>
            normalizeStatus(
              check.status
            ) ===
            "offline"
        ).length;


  const overallStatus =
    data?.status;


  let overallTitle =
    "Checking systems...";


  let overallColor =
    "text-blue-300";


  let overallDot =
    "bg-blue-400";


  if (!loading || data) {

    if (
      overallStatus ===
      "healthy" ||
      overallStatus ===
      "online"
    ) {

      overallTitle =
        "All systems operational";

      overallColor =
        "text-emerald-300";

      overallDot =
        "bg-emerald-400";

    } else if (
      overallStatus ===
      "warning"
    ) {

      overallTitle =
        "Some systems need attention";

      overallColor =
        "text-amber-300";

      overallDot =
        "bg-amber-400";

    } else {

      overallTitle =
        "System degraded";

      overallColor =
        "text-red-300";

      overallDot =
        "bg-red-400";

    }

  }


  /* ==========================================================
     UI
  ========================================================== */

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


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="
          mb-8
          flex
          flex-col
          gap-5
          lg:flex-row
          lg:items-end
          lg:justify-between
        ">

          <div>

            <p className="
              text-sm
              uppercase
              tracking-wider
              text-blue-400
            ">
              KANCHHI SYSTEMS
            </p>


            <h1 className="
              mt-2
              text-4xl
              font-bold
              text-white
            ">
              System Monitoring
            </h1>


            <p className="
              mt-2
              max-w-3xl
              text-slate-400
            ">
              Detailed health checks for KANCHHI services
              and external dependencies.
            </p>

          </div>


          <div className="
            flex
            flex-wrap
            gap-2
          ">

            <button
              type="button"
              onClick={() =>
                setAutoRefresh(
                  (
                    value
                  ) =>
                    !value
                )
              }
              className="
                rounded-xl
                border
                border-slate-700
                bg-slate-900
                px-4
                py-3
                text-sm
                text-slate-300
                transition
                hover:bg-slate-800
              "
            >

              Auto refresh:
              {" "}
              {autoRefresh
                ? "On"
                : "Off"}

            </button>


            <button
              type="button"
              onClick={() =>
                fetchChecks(true)
              }
              disabled={
                refreshing
              }
              className="
                rounded-xl
                bg-blue-600
                px-5
                py-3
                text-sm
                font-medium
                text-white
                transition
                hover:bg-blue-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {refreshing
                ? "Checking..."
                : "↻ Run Checks"}

            </button>

          </div>

        </div>


        {/* ====================================================
            OFFLINE
        ==================================================== */}

        {!browserOnline && (

          <div className="
            mb-6
            rounded-2xl
            border
            border-amber-700/60
            bg-amber-950/30
            p-5
          ">

            <div className="
              flex
              items-start
              gap-3
            ">

              <span className="
                text-xl
              ">
                📡
              </span>


              <div>

                <p className="
                  font-semibold
                  text-amber-300
                ">
                  Browser offline
                </p>


                <p className="
                  mt-1
                  text-sm
                  text-amber-200/70
                ">
                  New health checks will run
                  after connectivity returns.
                </p>

              </div>

            </div>

          </div>

        )}


        {/* ====================================================
            ERROR
        ==================================================== */}

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
              Health checks unavailable
            </p>


            <p className="
              mt-2
              text-sm
              leading-6
              text-red-200/70
            ">
              {error}
            </p>

          </div>

        )}


        {/* ====================================================
            OVERALL
        ==================================================== */}

        <div className="
          mb-6
          rounded-2xl
          border
          border-slate-800
          bg-[#111c2e]
          p-6
        ">

          <div className="
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-center
            lg:justify-between
          ">

            <div>

              <p className="
                text-xs
                uppercase
                tracking-wider
                text-slate-500
              ">
                SERVICE HEALTH
              </p>


              <div className="
                mt-2
                flex
                items-center
                gap-3
              ">

                <span
                  className={`
                    h-3
                    w-3
                    shrink-0
                    rounded-full
                    ${overallDot}
                  `}
                />


                <h2
                  className={`
                    text-2xl
                    font-semibold
                    ${overallColor}
                  `}
                >
                  {overallTitle}
                </h2>

              </div>


              <p className="
                mt-2
                text-sm
                text-slate-500
              ">

                Last checked{" "}
                {formatTime(
                  lastChecked ||
                  data?.timestamp
                )}

                {" • "}

                {typeof data?.total_duration_ms ===
                "number"
                  ? `${data.total_duration_ms.toFixed(0)} ms`
                  : "--"}

              </p>

            </div>


            <div className="
              grid
              grid-cols-4
              gap-2
            ">

              <div className="
                rounded-xl
                border
                border-slate-800
                bg-slate-900/70
                px-4
                py-3
                text-center
              ">

                <p className="
                  text-xs
                  text-slate-500
                ">
                  Total
                </p>


                <p className="
                  mt-1
                  text-2xl
                  font-bold
                  text-white
                ">
                  {total}
                </p>

              </div>


              <div className="
                rounded-xl
                border
                border-emerald-500/10
                bg-emerald-500/5
                px-4
                py-3
                text-center
              ">

                <p className="
                  text-xs
                  text-slate-500
                ">
                  Online
                </p>


                <p className="
                  mt-1
                  text-2xl
                  font-bold
                  text-emerald-300
                ">
                  {online}
                </p>

              </div>


              <div className="
                rounded-xl
                border
                border-amber-500/10
                bg-amber-500/5
                px-4
                py-3
                text-center
              ">

                <p className="
                  text-xs
                  text-slate-500
                ">
                  Warning
                </p>


                <p className="
                  mt-1
                  text-2xl
                  font-bold
                  text-amber-300
                ">
                  {warning}
                </p>

              </div>


              <div className="
                rounded-xl
                border
                border-red-500/10
                bg-red-500/5
                px-4
                py-3
                text-center
              ">

                <p className="
                  text-xs
                  text-slate-500
                ">
                  Offline
                </p>


                <p className="
                  mt-1
                  text-2xl
                  font-bold
                  text-red-300
                ">
                  {offline}
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* ====================================================
            SYSTEM INFO
        ==================================================== */}

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
            p-6
          ">

            <p className="
              text-xs
              uppercase
              tracking-wider
              text-slate-500
            ">
              Backend Uptime
            </p>


            <p className="
              mt-3
              text-3xl
              font-bold
              text-white
            ">
              {formatDuration(
                data?.uptime_seconds
              )}
            </p>


            <p className="
              mt-2
              text-xs
              text-slate-600
            ">
              Current backend process
            </p>

          </div>


          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-6
          ">

            <p className="
              text-xs
              uppercase
              tracking-wider
              text-slate-500
            ">
              Python
            </p>


            <p className="
              mt-3
              text-3xl
              font-bold
              text-white
            ">
              {data?.python_version ||
                "--"}
            </p>


            <p className="
              mt-2
              text-xs
              text-slate-600
            ">
              Backend runtime
            </p>

          </div>


          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-6
          ">

            <p className="
              text-xs
              uppercase
              tracking-wider
              text-slate-500
            ">
              Platform
            </p>


            <p className="
              mt-3
              text-3xl
              font-bold
              text-white
            ">
              {data?.platform ||
                "--"}
            </p>


            <p className="
              mt-2
              text-xs
              text-slate-600
            ">
              Backend operating system
            </p>

          </div>

        </div>


        {/* ====================================================
            CHECKS
        ==================================================== */}

        <div className="
          rounded-2xl
          border
          border-slate-800
          bg-[#111c2e]
          p-6
        ">

          <div className="
            flex
            items-center
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
                DETAILED CHECKS
              </p>


              <h2 className="
                mt-1
                text-xl
                font-semibold
                text-white
              ">
                KANCHHI Dependencies
              </h2>

            </div>


            <span className="
              text-xs
              text-slate-500
            ">
              {autoRefresh
                ? "Auto refresh: 15s"
                : "Manual refresh"}
            </span>

          </div>


          {loading &&
          !data ? (

            <div className="
              mt-6
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            ">

              {[
                1,
                2,
                3,
                4,
                5,
                6,
              ].map(
                (
                  item
                ) => (

                  <div
                    key={
                      item
                    }
                    className="
                      h-32
                      animate-pulse
                      rounded-xl
                      border
                      border-slate-800
                      bg-slate-900/50
                    "
                  />

                )
              )}

            </div>

          ) : checks.length ===
            0 ? (

            <div className="
              mt-6
              rounded-xl
              border
              border-slate-800
              bg-slate-900/50
              p-6
              text-center
              text-sm
              text-slate-500
            ">
              No system checks are currently available.
            </div>

          ) : (

            <div className="
              mt-6
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            ">

              {checks.map(
                (
                  check,
                  index
                ) => {

                  const name =
                    getCheckName(
                      check
                    );


                  const detail =
                    getCheckDetail(
                      check
                    );


                  const status =
                    normalizeStatus(
                      check.status
                    );


                  const expanded =
                    expandedCheck ===
                    `${name}-${index}`;


                  const duration =
                    getDuration(
                      check
                    );


                  const preview =
                    detail.length >
                    85
                      ? `${detail.slice(
                          0,
                          85
                        )}...`
                      : detail;


                  return (

                    <button
                      type="button"
                      key={`${name}-${index}`}
                      onClick={() =>
                        setExpandedCheck(
                          expanded
                            ? null
                            : `${name}-${index}`
                        )
                      }
                      className="
                        rounded-xl
                        border
                        border-slate-800
                        bg-slate-900/60
                        p-5
                        text-left
                        transition
                        hover:border-slate-700
                      "
                    >

                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      ">

                        <div className="
                          min-w-0
                        ">

                          <div className="
                            flex
                            items-center
                            gap-2
                          ">

                            <span
                              className={`
                                h-2.5
                                w-2.5
                                shrink-0
                                rounded-full
                                ${statusDot(
                                  status
                                )}
                              `}
                            />


                            <span className="
                              truncate
                              font-semibold
                              text-slate-200
                            ">
                              {name}
                            </span>

                          </div>


                          <p className="
                            mt-3
                            text-xs
                            leading-5
                            text-slate-500
                          ">

                            {expanded
                              ? detail
                              : preview}

                          </p>

                        </div>


                        <span
                          className={`
                            shrink-0
                            rounded-full
                            border
                            px-2.5
                            py-1
                            text-[11px]
                            ${statusBadge(
                              status
                            )}
                          `}
                        >
                          {statusText(
                            status
                          )}
                        </span>

                      </div>


                      <div className="
                        mt-5
                        flex
                        items-center
                        justify-between
                        border-t
                        border-slate-800
                        pt-3
                      ">

                        <span className="
                          text-[11px]
                          text-slate-600
                        ">
                          {expanded
                            ? "Click to collapse"
                            : "Click for details"}
                        </span>


                        <span className="
                          text-[11px]
                          text-slate-500
                        ">
                          {duration !==
                          null
                            ? `${duration.toFixed(
                                0
                              )} ms`
                            : "--"}
                        </span>

                      </div>

                    </button>

                  );

                }
              )}

            </div>

          )}

        </div>


        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="
          pb-8
          pt-6
          text-xs
          text-slate-600
        ">

          KANCHHI System Monitoring
          {" • "}
          Automatic refresh every 15 seconds

        </div>

      </div>

    </section>

  );
}