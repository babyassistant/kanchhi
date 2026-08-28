"use client";

type KanchhiSidebarProps = {

  activeTab: string;

  setActiveTab: (
    tab: string
  ) => void;

};


const menuItems = [

  {
    id: "dashboard",
    icon: "⌂",
    label: "Dashboard",
  },

  {
    id: "search",
    icon: "⌕",
    label: "Search",
  },

  {
    id: "weather",
    icon: "☁",
    label: "Weather",
  },

  {
    id: "news",
    icon: "◉",
    label: "News",
  },

  {
    id: "code",
    icon: "</>",
    label: "Code",
  },

  {
    id: "assistant",
    icon: "🤖",
    label: "Assistant",
  },

  {
    id: "notifications",
    icon: "🔔",
    label: "Notifications",
  },

  {
    id: "preferences",
    icon: "⚙️",
    label: "Preferences",
  },

  {
    id: "memory",
    icon: "🧠",
    label: "Memory",
  },

  {
    id: "analytics",
    icon: "📊",
    label: "Analytics",
  },

  {
    id: "system",
    icon: "🖥️",
    label: "System",
  },

  {
    id: "briefing",
    icon: "🗞️",
    label: "Briefings",
  },

  {
    id: "smart-notifications",
    icon: "🔔",
    label: "Smart Alerts",
  },

  {
    id: "watchlists",
    icon: "⭐",
    label: "Watchlists",
  },

  {
    id: "smart-news",
    icon: "✨",
    label: "Smart News",
  },

  {
    id: "unified-search",
    icon: "🔎",
    label: "Unified Search",
  },

  {
    id: "code-intelligence",
    icon: "🧑‍💻",
    label: "Code AI",
  },

  {
    id: "personalized",
    icon: "🎯",
    label: "Personalized",
  },

  {
    id: "security",
    icon: "🛡️",
    label: "Security",
  },

  {
    id: "auth",
    icon: "🔐",
    label: "Account",
  },

  {
    id: "voice",
    icon: "🎙️",
    label: "Voice",
  },

  {
    id: "push",
    icon: "📲",
    label: "Push",
  },

];


export default function KanchhiSidebar({
  activeTab,
  setActiveTab,
}: KanchhiSidebarProps) {

  return (

    <>

      {/* DESKTOP */}

      <aside
        className="
          hidden
          lg:flex
          lg:w-72
          lg:shrink-0
          lg:flex-col
          lg:border-r
          lg:border-slate-800
          lg:bg-[#111c2e]
        "
      >

        <div className="p-5">

          <div className="mb-6 flex items-center gap-3">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-blue-600
                font-bold
                shadow-lg
                shadow-blue-600/20
              "
            >
              N
            </div>

            <div>

              <h1 className="text-xl font-bold">
                KANCHHI
              </h1>

              <p className="text-xs text-slate-500">
                Smart information hub
              </p>

            </div>

          </div>

          <nav className="max-h-[calc(100vh-150px)] space-y-1.5 overflow-y-auto pr-1">

            {menuItems.map(
              (item) => (

                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      item.id
                    )
                  }
                  className={`
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-left
                    text-sm
                    transition
                    ${
                      activeTab ===
                      item.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-300 hover:bg-slate-800"
                    }
                  `}
                >

                  <span className="w-6 text-lg">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>

                </button>

              )
            )}

          </nav>

        </div>

        <div className="mt-auto p-5">

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">

            <p className="text-xs text-slate-500">
              KANCHHI
            </p>

            <p className="mt-1 text-sm text-slate-300">
              Personal intelligence system
            </p>

          </div>

        </div>

      </aside>


      {/* MOBILE */}

      <div
        className="
          fixed
          inset-x-0
          bottom-0
          z-50
          border-t
          border-slate-800
          bg-[#111c2e]/95
          backdrop-blur
          lg:hidden
        "
      >

        <nav className="grid grid-cols-5">

          {[
            menuItems.find(
              (item) =>
                item.id ===
                "dashboard"
            ),

            menuItems.find(
              (item) =>
                item.id ===
                "search"
            ),

            menuItems.find(
              (item) =>
                item.id ===
                "assistant"
            ),

            menuItems.find(
              (item) =>
                item.id ===
                "voice"
            ),

            menuItems.find(
              (item) =>
                item.id ===
                "push"
            ),
          ]
            .filter(Boolean)
            .map(
              (item) => (

                <button
                  key={item!.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      item!.id
                    )
                  }
                  className={`
                    flex
                    min-h-16
                    flex-col
                    items-center
                    justify-center
                    gap-1
                    px-2
                    text-[10px]
                    transition
                    ${
                      activeTab ===
                      item!.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-400"
                    }
                  `}
                >

                  <span className="text-lg">
                    {item!.icon}
                  </span>

                  <span className="line-clamp-1">
                    {item!.label}
                  </span>

                </button>

              )
            )}

        </nav>

      </div>

    </>

  );
}