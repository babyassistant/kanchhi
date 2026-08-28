type SourceCounts = {
  onlinekhabar: number;
  ronb: number;
  ratopati: number;
  total: number;
};


type Props = {
  selectedSource: string;

  setSelectedSource: (
    source: string
  ) => void;

  selectedCategory: string;

  setSelectedCategory: (
    category: string
  ) => void;

  sourceCounts: SourceCounts;
};


// ============================================================
// NEWS FILTERS
// ============================================================

export default function NewsFilters({
  selectedSource,
  setSelectedSource,
  selectedCategory,
  setSelectedCategory,
  sourceCounts,
}: Props) {

  const sourceFilters = [

    {
      value: "all",
      label: "All Sources",
      count: sourceCounts.total,
    },

    {
      value: "onlinekhabar",
      label: "Onlinekhabar",
      count: sourceCounts.onlinekhabar,
    },

    {
      value: "ronb",
      label: "RONB",
      count: sourceCounts.ronb,
    },

    {
      value: "ratopati",
      label: "Ratopati",
      count: sourceCounts.ratopati,
    },

  ];


  const categories = [

    "All",

    "Politics",

    "Sports",

    "Business",

    "Technology",

    "Entertainment",

    "Health",

    "World",

    "General",

  ];


  return (

    <div className="mb-8">

      {/* ==================================================
          SOURCE FILTER
      ================================================== */}

      <div className="mb-4">

        <p className="
          text-xs
          uppercase
          tracking-wider
          text-slate-500
          mb-3
        ">
          Sources
        </p>


        <div className="
          flex
          flex-wrap
          gap-2
        ">

          {sourceFilters.map(
            (filter) => (

              <button
                key={filter.value}
                onClick={() =>
                  setSelectedSource(
                    filter.value
                  )
                }
                className={`
                  px-5
                  py-2.5
                  rounded-full
                  text-sm
                  font-medium
                  transition
                  flex
                  items-center
                  gap-2

                  ${
                    selectedSource ===
                    filter.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }
                `}
              >

                <span>
                  {filter.label}
                </span>


                <span
                  className={`
                    min-w-5
                    h-5
                    px-1.5
                    rounded-full
                    text-xs
                    flex
                    items-center
                    justify-center

                    ${
                      selectedSource ===
                      filter.value
                        ? "bg-white/20"
                        : "bg-slate-700"
                    }
                  `}
                >

                  {filter.count}

                </span>

              </button>

            )
          )}

        </div>

      </div>


      {/* ==================================================
          CATEGORY FILTER
      ================================================== */}

      <div>

        <p className="
          text-xs
          uppercase
          tracking-wider
          text-slate-500
          mb-3
        ">
          Categories
        </p>


        <div className="
          flex
          flex-wrap
          gap-2
        ">

          {categories.map(
            (category) => (

              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
                className={`
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                  transition

                  ${
                    (
                      selectedCategory ===
                      category
                    )
                      ? "bg-slate-700 text-white border border-slate-600"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                  }
                `}
              >

                {category}

              </button>

            )
          )}

        </div>

      </div>

    </div>

  );
}