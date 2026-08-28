type Props = {
  data: any;
};


export default function WeatherHighlights({
  data,
}: Props) {

  const weather =
    data?.weather || {};


  const items = [

    {
      label: "Temperature",
      value: `${weather.temperature ?? "--"}°C`,
      icon: "🌡️",
    },

    {
      label: "Feels Like",
      value: `${weather.feels_like ?? "--"}°C`,
      icon: "🌡️",
    },

    {
      label: "Humidity",
      value: `${weather.humidity ?? "--"}%`,
      icon: "💧",
    },

    {
      label: "Wind Speed",
      value: `${weather.wind_speed ?? "--"} km/h`,
      icon: "💨",
    },

    {
      label: "Wind Direction",
      value: `${weather.wind_direction ?? "--"}°`,
      icon: "🧭",
    },

    {
      label: "UV Index",
      value: weather.uv_index ?? "--",
      icon: "☀️",
    },

    {
      label: "Visibility",
      value:
        weather.visibility != null
          ? `${(
              weather.visibility / 1000
            ).toFixed(1)} km`
          : "--",
      icon: "👁️",
    },

    {
      label: "Condition",
      value:
        weather.description || "--",
      icon:
        weather.icon || "☁️",
    },

  ];


  return (
    <div className="mb-8">


      <h3 className="text-xl font-semibold mb-4">
        Weather Highlights
      </h3>


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {items.map(
          (item) => (

            <div
              key={item.label}
              className="rounded-2xl bg-[#111c2e] border border-slate-800 p-5"
            >

              <div className="text-2xl mb-3">
                {item.icon}
              </div>


              <p className="text-sm text-slate-500">
                {item.label}
              </p>


              <p className="text-xl font-semibold mt-1">
                {item.value}
              </p>

            </div>

          )
        )}

      </div>

    </div>
  );
}