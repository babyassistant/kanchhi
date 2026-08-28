"use client";

type Props = {
  data: any;
};


export default function WeatherAlerts({
  data,
}: Props) {

  const alerts =
    data?.alerts || [];


  if (!alerts.length) {

    return (

      <div className="mb-7">

        <div className="flex items-center justify-between mb-3">

          <div>

            <p className="text-blue-400 text-xs font-medium uppercase tracking-wider">
              KANCHHI ALERTS
            </p>

            <h3 className="text-xl font-semibold">
              Weather Alerts
            </h3>

          </div>

          <span className="text-xl">
            ✓
          </span>

        </div>


        <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-4">

          <p className="text-emerald-300 text-sm">
            No significant weather alerts for your location.
          </p>

        </div>

      </div>

    );
  }


  return (

    <div className="mb-7">

      <div className="flex items-center justify-between mb-3">

        <div>

          <p className="text-blue-400 text-xs font-medium uppercase tracking-wider">
            KANCHHI ALERTS
          </p>

          <h3 className="text-xl font-semibold">
            Weather Alerts
          </h3>

        </div>

        <span className="text-xl">
          ⚠️
        </span>

      </div>


      <div className="space-y-3">

        {alerts.map(
          (alert: any, index: number) => {

            const severity =
              alert.severity || "medium";


            const severityClass =
              severity === "high"
                ? "border-red-900/60 bg-red-950/30"
                : "border-yellow-900/60 bg-yellow-950/20";


            const badgeClass =
              severity === "high"
                ? "bg-red-500/20 text-red-300"
                : "bg-yellow-500/20 text-yellow-300";


            return (

              <div
                key={`${alert.type}-${index}`}
                className={`rounded-2xl border p-4 ${severityClass}`}
              >

                <div className="flex items-start gap-4">

                  <div className="w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center text-xl shrink-0">

                    {alert.icon || "⚠️"}

                  </div>


                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <h4 className="font-semibold">

                        {alert.title}

                      </h4>


                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${badgeClass}`}
                      >

                        {severity}

                      </span>

                    </div>


                    <p className="text-sm text-slate-400 mt-1">

                      {alert.message}

                    </p>

                  </div>

                </div>

              </div>

            );

          }
        )}

      </div>

    </div>

  );
}