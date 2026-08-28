"use client";

import { useEffect, useState } from "react";


export default function OfflineIndicator() {

  const [isOnline, setIsOnline] =
    useState(true);

  const [showStatus, setShowStatus] =
    useState(false);


  // ==========================================================
  // INITIAL ONLINE STATE
  // ==========================================================

  useEffect(() => {

    setIsOnline(
      navigator.onLine
    );


    const handleOnline = () => {

      setIsOnline(true);

      setShowStatus(true);

    };


    const handleOffline = () => {

      setIsOnline(false);

      setShowStatus(true);

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

  }, []);


  // ==========================================================
  // HIDE ONLINE STATUS AFTER A SHORT DELAY
  // ==========================================================

  useEffect(() => {

    if (!showStatus) {
      return;
    }

    if (!isOnline) {
      return;
    }


    const timer =
      window.setTimeout(() => {

        setShowStatus(false);

      }, 4000);


    return () => {

      window.clearTimeout(timer);

    };

  }, [
    showStatus,
    isOnline
  ]);


  // ==========================================================
  // UI
  // ==========================================================

  if (
    isOnline &&
    !showStatus
  ) {

    return null;

  }


  return (

    <div
      className={`
        fixed
        top-4
        right-4
        z-[9999]

        flex
        items-center
        gap-3

        rounded-xl
        border

        px-4
        py-3

        shadow-2xl
        backdrop-blur-xl

        transition-all
        duration-300

        ${
          isOnline
            ? "bg-emerald-950/90 border-emerald-700/50"
            : "bg-amber-950/90 border-amber-700/50"
        }
      `}
    >

      {/* STATUS DOT */}

      <span
        className={`
          w-2.5
          h-2.5
          rounded-full
          shrink-0

          ${
            isOnline
              ? "bg-emerald-400"
              : "bg-amber-400"
          }
        `}
      />


      {/* TEXT */}

      <div>

        <p
          className={`
            text-sm
            font-medium

            ${
              isOnline
                ? "text-emerald-300"
                : "text-amber-300"
            }
          `}
        >

          {isOnline
            ? "Back online"
            : "Offline mode"
          }

        </p>


        <p className="text-xs text-slate-400 mt-0.5">

          {isOnline
            ? "KANCHHI is connected to the internet."
            : "Showing cached information when available."
          }

        </p>

      </div>

    </div>

  );

}