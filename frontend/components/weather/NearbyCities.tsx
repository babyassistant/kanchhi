"use client";

type Props = {
  data: any;
};


export default function NearbyCities({
  data,
}: Props) {

  const cities =
    data?.nearby_cities || [];


  return (

    <div className="mb-8">

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">

        <div>

          <h3 className="text-xl font-semibold">
            Nearby Places
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Dynamically detected within 10 km of your current GPS location
          </p>

        </div>

        <p className="text-xs text-slate-500">
          {cities.length} places found
        </p>

      </div>


      {cities.length === 0 ? (

        <div className="rounded-2xl bg-[#111c2e] border border-slate-800 p-6">

          <p className="text-slate-400">
            No nearby places were found within 10 km.
          </p>

          <p className="text-xs text-slate-600 mt-2">
            Nearby places update automatically when your GPS location changes.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {cities.map(
            (city: any, index: number) => (

              <div
                key={`${city.name}-${city.latitude}-${index}`}
                className="rounded-2xl bg-[#111c2e] border border-slate-800 p-5 hover:border-blue-500/60 hover:-translate-y-0.5 transition-all"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="font-semibold truncate">

                      {city.name}

                    </p>

                    <p className="text-xs text-slate-500 mt-1">

                      {city.distance ?? "--"} km away

                    </p>

                  </div>


                  <span className="text-2xl shrink-0">

                    {city.weather_icon ||
                      "☁️"}

                  </span>

                </div>


                <p className="text-3xl font-bold mt-5">

                  {city.temperature ?? "--"}°C

                </p>


                <p className="text-sm text-slate-400 mt-2">

                  {city.condition ||
                    "Weather unavailable"}

                </p>


                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-500">

                  <span>
                    💨 {city.windspeed ?? "--"} km/h
                  </span>

                  <span>
                    {city.place_type || "place"}
                  </span>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );
}