"use client";

import { useEffect } from "react";

/* ============================================================
   GOOGLE PROGRAMMABLE SEARCH
============================================================ */

const GOOGLE_CSE_ID =
  "f182a0ef022414eac";

const GOOGLE_CSE_SCRIPT =
  "https://cse.google.com/cse.js?cx=" +
  encodeURIComponent(
    GOOGLE_CSE_ID
  );


/* ============================================================
   GOOGLE CSE GLOBAL TYPES
============================================================ */

declare global {
  interface Window {
    __gcse?: {
      parsetags?: string;
    };

    google?: {
      search?: {
        cse?: {
          element?: {
            render?: (
              options: {
                div: string;
                tag?: string;
                gname?: string;
              }
            ) => void;

            getElement?: (
              name: string
            ) => unknown;
          };
        };
      };
    };
  }
}


/* ============================================================
   SEARCH PANEL
============================================================ */

export default function SearchPanel() {

  /* ==========================================================
     LOAD GOOGLE CSE
  ========================================================== */

  useEffect(() => {

    /*
     * Explicit rendering prevents Google CSE from trying
     * to automatically render multiple instances.
     */

    window.__gcse = {
      parsetags:
        "explicit",
    };


    /*
     * Check whether Google's CSE script is already loaded.
     */

    const existingScript =
      document.querySelector(
        'script[src^="https://cse.google.com/cse.js"]'
      );


    /*
     * Google script already exists.
     *
     * We still allow the existing script to finish loading.
     */

    if (existingScript) {
      renderGoogleSearch();
      return;
    }


    /*
     * Create Google CSE script.
     */

    const script =
      document.createElement(
        "script"
      );

    script.src =
      GOOGLE_CSE_SCRIPT;

    script.async = true;


    /*
     * When the script finishes loading,
     * render the search element explicitly.
     */

    script.onload = () => {
      renderGoogleSearch();
    };


    document.head.appendChild(
      script
    );


    /*
     * Cleanup intentionally does not remove
     * Google's global script.
     */

    return () => {
      // Keep Google CSE available for future navigation.
    };

  }, []);


  /* ==========================================================
     REMOVE GOOGLE HASH
  ========================================================== */

  useEffect(() => {

    const removeGoogleHash = () => {

      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }


      const hash =
        window.location.hash;


      /*
       * Google CSE commonly creates hashes such as:
       *
       * #gsc.tab=0
       * #gsc.tab=1
       *
       * Remove only Google CSE hashes.
       */

      if (
        hash.startsWith(
          "#gsc."
        )
      ) {

        const cleanUrl =
          window.location.pathname +
          window.location.search;

        window.history.replaceState(
          null,
          "",
          cleanUrl
        );
      }
    };


    /*
     * Run immediately.
     */

    removeGoogleHash();


    /*
     * Google can add the hash after
     * the widget initializes.
     *
     * Watch for that briefly.
     */

    const interval =
      window.setInterval(
        removeGoogleHash,
        300
      );


    /*
     * Also catch direct hash changes.
     */

    window.addEventListener(
      "hashchange",
      removeGoogleHash
    );


    return () => {

      window.clearInterval(
        interval
      );

      window.removeEventListener(
        "hashchange",
        removeGoogleHash
      );

    };

  }, []);


  /* ==========================================================
     UI
  ========================================================== */

  return (

    <section className="
      min-h-screen
      bg-[#0b1220]
      p-6
      md:p-8
    ">

      <div className="
        mx-auto
        max-w-6xl
      ">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="
          mb-8
        ">

          <p className="
            text-sm
            font-medium
            uppercase
            tracking-wider
            text-blue-400
          ">
            KANCHHI SEARCH
          </p>


          <h1 className="
            mt-2
            text-4xl
            font-bold
          ">
            Search the web
          </h1>


          <p className="
            mt-2
            text-slate-400
          ">
            Search powered by KANCHHI Web Search.
          </p>

        </div>


        {/* ==================================================
            GOOGLE SEARCH CARD
        ================================================== */}

        <div className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-800
          bg-[#111c2e]
          p-6
        ">

          <div
            id="kanchhi-google-search"
            className="gcse-search"
            data-gname="kanchhi-search"
          />

        </div>

      </div>

    </section>

  );
}


/* ============================================================
   GOOGLE SEARCH RENDERER
============================================================ */

function renderGoogleSearch() {

  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }


  /*
   * Google may not have initialized yet.
   *
   * Retry shortly.
   */

  const render =
    window.google
      ?.search
      ?.cse
      ?.element
      ?.render;


  if (
    typeof render !==
    "function"
  ) {

    window.setTimeout(
      renderGoogleSearch,
      300
    );

    return;
  }


  const container =
    document.getElementById(
      "kanchhi-google-search"
    );


  if (!container) {
    return;
  }


  /*
   * Prevent duplicate rendering.
   */

  if (
    container.dataset.googleRendered ===
    "true"
  ) {
    return;
  }


  try {

    render({
      div:
        "kanchhi-google-search",

      tag:
        "search",

      gname:
        "kanchhi-search",
    });


    container.dataset.googleRendered =
      "true";

  } catch (
    error
  ) {

    console.warn(
      "KANCHHI Google Search render error:",
      error
    );

  }
}