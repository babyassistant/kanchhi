export default function WeatherSkeleton() {

  return (
    <section className="p-8 lg:p-10">

      <div className="max-w-7xl mx-auto animate-pulse">


        {/* HEADER */}

        <div className="flex items-center justify-between mb-8">

          <div>

            <div className="h-4 w-32 bg-slate-800 rounded" />

            <div className="h-10 w-48 bg-slate-800 rounded mt-3" />

            <div className="h-4 w-72 bg-slate-800 rounded mt-3" />

          </div>


          <div className="h-12 w-28 bg-slate-800 rounded-xl" />

        </div>


        {/* CURRENT */}

        <div className="rounded-3xl bg-slate-800 p-8 mb-6">

          <div className="flex justify-between">

            <div>

              <div className="h-4 w-32 bg-slate-700 rounded" />

              <div className="h-10 w-64 bg-slate-700 rounded mt-4" />

              <div className="h-4 w-52 bg-slate-700 rounded mt-3" />

            </div>


            <div>

              <div className="h-16 w-40 bg-slate-700 rounded" />

              <div className="h-4 w-28 bg-slate-700 rounded mt-3" />

            </div>

          </div>

        </div>


        {/* HIGHLIGHTS */}

        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {[1, 2, 3, 4].map(
            (item) => (

              <div
                key={item}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-5 h-32"
              />

            )
          )}

        </div>


        {/* NEARBY */}

        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {[1, 2, 3, 4].map(
            (item) => (

              <div
                key={item}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-5 h-40"
              />

            )
          )}

        </div>


        {/* FORECAST */}

        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />


        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">

          {[1, 2, 3, 4, 5, 6, 7].map(
            (item) => (

              <div
                key={item}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-4 h-44"
              />

            )
          )}

        </div>

      </div>

    </section>
  );
}