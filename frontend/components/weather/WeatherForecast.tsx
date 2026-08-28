type Props = {
  data: any;
};


export default function WeatherForecast({
  data,
}: Props) {

  const forecast =
    data?.forecast || [];


  return (
    <div>

      <h3 className="text-xl font-semibold mb-4">
        7-Day Forecast
      </h3>


      {forecast.length === 0 ? (

        <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6">

          <p className="text-slate-400">
            7-day forecast is not available.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">

          {forecast
            .slice(0, 7)
            .map(
              (
                day: any,
                index: number
              ) => (

                <div
                  key={`${day.date}-${index}`}
                  className="rounded-2xl bg-[#111c2e] border border-slate-800 p-4 text-center hover:border-blue-500 transition"
                >

                  <p className="text-sm text-slate-400">

                    {formatDay(
                      day.date,
                      index
                    )}

                  </p>


                  <div className="text-3xl my-4">

                    {day.icon ||
                      "☁️"}

                  </div>


                  <p className="text-sm text-slate-400">

                    {day.description}

                  </p>


                  <div className="mt-4">

                    <p className="text-xl font-bold">

                      {day.max_temperature ??
                        "--"}°

                    </p>


                    <p className="text-sm text-slate-500 mt-1">

                      {day.min_temperature ??
                        "--"}°

                    </p>

                  </div>


                  {day.precipitation_probability != null && (

                    <p className="text-xs text-blue-400 mt-3">

                      💧{" "}
                      {day.precipitation_probability}%

                    </p>

                  )}

                </div>

              )
            )}

        </div>

      )}

    </div>
  );
}


function formatDay(
  date: string,
  index: number
) {

  if (index === 0) {
    return "Today";
  }


  if (!date) {
    return "--";
  }


  const parsed =
    new Date(
      `${date}T12:00:00`
    );


  return parsed.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
    }
  );
}