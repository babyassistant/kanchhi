"use client";

import {
  useEffect,
  useState,
} from "react";


import KanchhiSidebar from "@/components/KanchhiSider";


import DashboardPanel from "@/components/dashboard/DashboardPanel";
import SearchPanel from "@/components/search/SearchPanel";
import WeatherPanel from "@/components/weather/WeatherPanel";
import NewsPanel from "@/components/news/NewsPanel";
import CodePanel from "@/components/code/CodePanel";
import AssistantPanel from "@/components/assistant/AssistantPanel";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import PreferencesPanel from "@/components/preferences/PreferencesPanel";
import MemoryPanel from "@/components/memory/MemoryPanel";
import AnalyticsPanel from "@/components/analytics/AnalyticsPanel";
import SystemMonitoringPanel from "@/components/system/SystemMonitoringPanel";
import BriefingPanel from "@/components/briefing/BriefingPanel";
import SmartNotificationsPanel from "@/components/smart-notifications/SmartNotificationsPanel";
import WatchlistsPanel from "@/components/watchlists/WatchlistsPanel";
import SmartNewsPanel from "@/components/smart-news/SmartNewsPanel";
import UnifiedSearchPanel from "@/components/unified-search/UnifiedSearchPanel";
import CodeIntelligencePanel from "@/components/code-intelligence/CodeIntelligencePanel";
import SecurityPanel from "@/components/security/SecurityPanel";
import VoicePanel from "@/components/voice/VoicePanel";
import PushPanel from "@/components/push/PushPanel";
import PersonalizedPanel from "@/components/personalized/PersonalizedPanel";


import AuthGate from "@/components/auth/AuthGate";
import AuthPanel from "@/components/auth/AuthPanel";


import {
  startKanchhiAnalyticsSession,
  endKanchhiAnalyticsSession,
  trackKanchhiEvent,
  trackKanchhiTab,
} from "@/lib/kanchhiAnalytics";


export default function KanchhiHome() {

  // ==========================================================
  // ACTIVE TAB
  // ==========================================================

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "dashboard"
  );


  // ==========================================================
  // VOICE COMMAND
  // ==========================================================

  const [
    voiceCommand,
    setVoiceCommand,
  ] = useState("");


  // ==========================================================
  // LATEST AI RESPONSE
  // ==========================================================

  const [
    lastAssistantResponse,
    setLastAssistantResponse,
  ] = useState("");


  // ==========================================================
  // ANALYTICS SESSION
  // ==========================================================

  useEffect(() => {

    startKanchhiAnalyticsSession();


    const handleOffline =
      () => {

        trackKanchhiEvent(
          "offline"
        );

      };


    const handleOnline =
      () => {

        trackKanchhiEvent(
          "online"
        );

      };


    window.addEventListener(
      "offline",
      handleOffline
    );


    window.addEventListener(
      "online",
      handleOnline
    );


    return () => {

      window.removeEventListener(
        "offline",
        handleOffline
      );


      window.removeEventListener(
        "online",
        handleOnline
      );


      endKanchhiAnalyticsSession();

    };

  }, []);


  // ==========================================================
  // TAB ANALYTICS
  // ==========================================================

  useEffect(() => {

    trackKanchhiTab(
      activeTab
    );


    if (
      activeTab ===
      "voice"
    ) {

      trackKanchhiEvent(
        "assistant_used",
        {
          mode:
            "voice",
        }
      );

    }

  }, [
    activeTab,
  ]);


  // ==========================================================
  // VOICE -> ASSISTANT
  // ==========================================================

  useEffect(() => {

    if (
      !voiceCommand.trim()
    ) {

      return;

    }


    setActiveTab(
      "assistant"
    );

  }, [
    voiceCommand,
  ]);


  // ==========================================================
  // CLEAR VOICE COMMAND AFTER ASSISTANT
  // ==========================================================

  useEffect(() => {

    if (
      activeTab !==
      "assistant"
    ) {

      return;

    }


    /*
     * Give AssistantPanel time to receive the command.
     * The component handles submission itself.
     */

    const timer =
      window.setTimeout(
        () => {

          setVoiceCommand(
            ""
          );

        },
        1500
      );


    return () => {

      window.clearTimeout(
        timer
      );

    };

  }, [
    activeTab,
    voiceCommand,
  ]);


  // ==========================================================
  // AUTHENTICATED APPLICATION
  // ==========================================================

  return (

    <AuthGate>

      <div className="
        min-h-screen
        bg-[#0b1220]
        text-white
      ">

        <div className="
          flex
          min-h-screen
        ">

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <KanchhiSidebar
            activeTab={
              activeTab
            }
            setActiveTab={
              setActiveTab
            }
          />


          {/* =================================================
              MAIN
          ================================================= */}

          <main className="
            min-w-0
            flex-1
            pb-20
            lg:pb-0
          ">


            {/* =================================================
                DASHBOARD
            ================================================= */}

            {activeTab ===
              "dashboard" && (

              <DashboardPanel />

            )}


            {/* =================================================
                SEARCH
            ================================================= */}

            {activeTab ===
              "search" && (

              <SearchPanel />

            )}


            {/* =================================================
                WEATHER
            ================================================= */}

            {activeTab ===
              "weather" && (

              <WeatherPanel />

            )}


            {/* =================================================
                NEWS
            ================================================= */}

            {activeTab ===
              "news" && (

              <NewsPanel />

            )}


            {/* =================================================
                CODE
            ================================================= */}

            {activeTab ===
              "code" && (

              <CodePanel />

            )}


            {/* =================================================
                ASSISTANT
            ================================================= */}

            {activeTab ===
              "assistant" && (

              <AssistantPanel
                initialMessage={
                  voiceCommand
                }
                onResponse={
                  setLastAssistantResponse
                }
              />

            )}


            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            {activeTab ===
              "notifications" && (

              <NotificationsPanel />

            )}


            {/* =================================================
                PREFERENCES
            ================================================= */}

            {activeTab ===
              "preferences" && (

              <PreferencesPanel />

            )}


            {/* =================================================
                MEMORY
            ================================================= */}

            {activeTab ===
              "memory" && (

              <MemoryPanel />

            )}


            {/* =================================================
                ANALYTICS
            ================================================= */}

            {activeTab ===
              "analytics" && (

              <AnalyticsPanel />

            )}


            {/* =================================================
                SYSTEM
            ================================================= */}

            {activeTab ===
              "system" && (

              <SystemMonitoringPanel />

            )}


            {/* =================================================
                BRIEFING
            ================================================= */}

            {activeTab ===
              "briefing" && (

              <BriefingPanel />

            )}


            {/* =================================================
                SMART NOTIFICATIONS
            ================================================= */}

            {activeTab ===
              "smart-notifications" && (

              <SmartNotificationsPanel />

            )}


            {/* =================================================
                WATCHLISTS
            ================================================= */}

            {activeTab ===
              "watchlists" && (

              <WatchlistsPanel />

            )}


            {/* =================================================
                SMART NEWS
            ================================================= */}

            {activeTab ===
              "smart-news" && (

              <SmartNewsPanel />

            )}


            {/* =================================================
                UNIFIED SEARCH
            ================================================= */}

            {activeTab ===
              "unified-search" && (

              <UnifiedSearchPanel />

            )}


            {/* =================================================
                CODE INTELLIGENCE
            ================================================= */}

            {activeTab ===
              "code-intelligence" && (

              <CodeIntelligencePanel />

            )}


            {/* =================================================
                PERSONALIZED
            ================================================= */}

            {activeTab ===
              "personalized" && (

              <PersonalizedPanel />

            )}


            {/* =================================================
                SECURITY
            ================================================= */}

            {activeTab ===
              "security" && (

              <SecurityPanel
                onLogout={() => {

                  window.dispatchEvent(
                    new Event(
                      "kanchhi-auth-changed"
                    )
                  );

                }}
              />

            )}

            {/* =================================================
                  ACCOUNT
              ================================================= */}

              {activeTab === "auth" && (
                <AuthPanel
                  onAuthenticated={() => {
                    window.dispatchEvent(new Event("kanchhi-auth-changed"));
                  }}
                />
              )}


            {/* =================================================
                VOICE
            ================================================= */}

            {activeTab ===
              "voice" && (

              <section className="
                min-h-screen
                p-5
                md:p-8
              ">

                <div className="
                  mx-auto
                  max-w-4xl
                ">

                  <div className="
                    mb-6
                  ">

                    <p className="
                      text-xs
                      uppercase
                      tracking-wider
                      text-blue-400
                    ">
                      PHASE 11
                    </p>


                    <h1 className="
                      mt-2
                      text-3xl
                      font-bold
                    ">
                      KANCHHI Voice
                    </h1>


                    <p className="
                      mt-2
                      text-sm
                      text-slate-500
                    ">
                      Voice input and voice output for KANCHHI.
                    </p>

                  </div>


                  <VoicePanel
                    onTranscript={
                      setVoiceCommand
                    }
                    lastResponse={
                      lastAssistantResponse
                    }
                  />

                </div>

              </section>

            )}


            {/* =================================================
                PUSH
            ================================================= */}

            {activeTab ===
              "push" && (

              <section className="
                min-h-screen
                p-5
                md:p-8
              ">

                <div className="
                  mx-auto
                  max-w-4xl
                ">

                  <div className="
                    mb-6
                  ">

                    <p className="
                      text-xs
                      uppercase
                      tracking-wider
                      text-blue-400
                    ">
                      PHASE 12
                    </p>


                    <h1 className="
                      mt-2
                      text-3xl
                      font-bold
                    ">
                      KANCHHI Push
                    </h1>


                    <p className="
                      mt-2
                      text-sm
                      text-slate-500
                    ">
                      Control browser push notifications.
                    </p>

                  </div>


                  <PushPanel />

                </div>

              </section>

            )}

          </main>

        </div>

      </div>

    </AuthGate>

  );
}