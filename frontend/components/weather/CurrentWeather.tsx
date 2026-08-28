"use client";

type Props = {
  data: any;
};


function formatSunTime(value?: string) {

  if (!value) {
    return "--";
  }

  try {

    const date = new Date(value);

    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );

  } catch {

    return "--";
  }
}


export default function CurrentWeather({
  data,
}: Props) {

  const location =
    data?.location || {};

  const weather =
    data?.weather || {};

  const sun =
    data?.sun || {};


  const locationName =
    location.name ||
    location.city ||
    "Your Location";


  return (

    <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 md:p-8 mb-6 shadow-xl">

      {/* TOP */}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

        {/* LOCATION */}

        <div className="min-w-0">

          <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-2">
            Current Location
          </p>


          <h3 className="text-3xl md:text-4xl font-bold break-words">

            📍 {locationName}

          </h3>


          <p className="text-blue-100 mt-2 text-sm">

            {location.district &&
              `${location.district}, `}

            {location.province &&
              `${location.province}, `}

            {location.country}

          </p>


          {location.road && (

            <p className="text-blue-200/80 text-xs mt-2">

              {location.road}

            </p>

          )}

        </div>


        {/* TEMPERATURE */}

        <div className="text-left lg:text-right shrink-0">

          <p className="text-5xl md:text-6xl font-bold">

            {weather.temperature ?? "--"}°C

          </p>


          <p className="text-blue-100 mt-2">

            {weather.icon || "☁️"}{" "}

            {weather.condition ||
              "Weather unavailable"}

          </p>


          <p className="text-blue-100 text-sm mt-1">

            💨 {weather.windspeed ?? "--"} km/h

          </p>

        </div>

      </div>


      {/* SUNRISE / SUNSET */}

      <div className="grid grid-cols-2 gap-4 mt-7">

        {/* SUNRISE */}

        <div className="rounded-2xl bg-white/10 border border-white/10 p-4">

          <div className="flex items-center gap-3">

            <div className="text-2xl">
              🌅
            </div>

            <div>

              <p className="text-xs text-blue-200 uppercase tracking-wide">
                Sunrise
              </p>

              <p className="text-lg font-semibold">
                {formatSunTime(
                  sun.sunrise
                )}
              </p>

            </div>

          </div>

        </div>


        {/* SUNSET */}

        <div className="rounded-2xl bg-white/10 border border-white/10 p-4">

          <div className="flex items-center gap-3">

            <div className="text-2xl">
              🌇
            </div>

            <div>

              <p className="text-xs text-blue-200 uppercase tracking-wide">
                Sunset
              </p>

              <p className="text-lg font-semibold">
                {formatSunTime(
                  sun.sunset
                )}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* COORDINATES */}

      <div className="mt-6 pt-5 border-t border-white/20 text-xs text-blue-100">

        Coordinates:{" "}

        {typeof location.latitude === "number"
          ? location.latitude.toFixed(6)
          : "--"}

        {" , "}

        {typeof location.longitude === "number"
          ? location.longitude.toFixed(6)
          : "--"}

      </div>

    </div>
  );
}