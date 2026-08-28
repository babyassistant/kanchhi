"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getKanchhiPushState,
  initializeKanchhiPush,
  sendKanchhiTestPush,
  subscribeKanchhiPush,
  unsubscribeKanchhiPush,
  type KanchhiPushState,
} from "@/lib/kanchhiPush";


const initialState:
  KanchhiPushState = {

  supported:
    false,

  permission:
    "unsupported",

  subscribed:
    false,

  configured:
    false,
};


export default function PushPanel() {

  const [
    state,
    setState,
  ] = useState<KanchhiPushState>(
    initialState
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    message,
    setMessage,
  ] = useState("");


  const refresh =
    useCallback(
      async () => {

        try {

          const next =
            await getKanchhiPushState();

          setState(next);

        } catch (refreshError) {

          console.error(
            "KANCHHI push state error:",
            refreshError
          );

          setState(
            initialState
          );

        } finally {

          setLoading(false);

        }

      },
      []
    );


  useEffect(() => {

    initializeKanchhiPush()
      .catch(
        (error) => {

          console.warn(
            "KANCHHI service worker initialization:",
            error
          );

        }
      )
      .finally(
        refresh
      );

  }, [
    refresh,
  ]);


  async function enablePush() {

    setLoading(true);

    setError("");

    setMessage("");


    try {

      await initializeKanchhiPush();

      await subscribeKanchhiPush();


      setMessage(
        "KANCHHI push notifications are enabled."
      );


      await refresh();

    } catch (requestError) {

      console.error(
        "KANCHHI push enable error:",
        requestError
      );


      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to enable push notifications."
      );


      await refresh();

    } finally {

      setLoading(false);

    }

  }


  async function disablePush() {

    setLoading(true);

    setError("");

    setMessage("");


    try {

      await unsubscribeKanchhiPush();


      setMessage(
        "KANCHHI push notifications are disabled."
      );


      await refresh();

    } catch (requestError) {

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to disable push notifications."
      );

    } finally {

      setLoading(false);

    }

  }


  async function testPush() {

    setLoading(true);

    setError("");

    setMessage("");


    try {

      await sendKanchhiTestPush();


      setMessage(
        "KANCHHI test notification was sent."
      );

    } catch (requestError) {

      console.error(
        "KANCHHI test push error:",
        requestError
      );


      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send test notification."
      );

    } finally {

      setLoading(false);

    }

  }


  return (

    <section className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

      <div className="flex flex-col gap-5">

        <div>

          <p className="text-xs uppercase tracking-wider text-blue-400">
            KANCHHI NOTIFICATIONS
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Push Notifications
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Receive KANCHHI alerts even when the app is not open.
          </p>

        </div>


        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">

          <div className="flex items-center justify-between gap-4">

            <span className="text-sm text-slate-400">
              Browser support
            </span>

            <span
              className={
                state.supported
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            >
              {state.supported
                ? "Supported"
                : "Unavailable"}
            </span>

          </div>


          <div className="mt-3 flex items-center justify-between gap-4">

            <span className="text-sm text-slate-400">
              Backend configuration
            </span>

            <span
              className={
                state.configured
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            >
              {state.configured
                ? "Configured"
                : "Unavailable"}
            </span>

          </div>


          <div className="mt-3 flex items-center justify-between gap-4">

            <span className="text-sm text-slate-400">
              Permission
            </span>

            <span className="capitalize text-slate-200">
              {state.permission}
            </span>

          </div>


          <div className="mt-3 flex items-center justify-between gap-4">

            <span className="text-sm text-slate-400">
              Subscription
            </span>

            <span
              className={
                state.subscribed
                  ? "text-emerald-400"
                  : "text-slate-500"
              }
            >
              {state.subscribed
                ? "Active"
                : "Inactive"}
            </span>

          </div>

        </div>


        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          <button
            type="button"
            onClick={
              state.subscribed
                ? disablePush
                : enablePush
            }
            disabled={
              loading ||
              !state.supported ||
              !state.configured
            }
            className={`rounded-xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              state.subscribed
                ? "border border-red-900 bg-red-950/40 text-red-300 hover:bg-red-950/60"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >

            {loading
              ? "Working..."
              : state.subscribed
                ? "Disable Push"
                : "Enable Push"}

          </button>


          <button
            type="button"
            onClick={
              testPush
            }
            disabled={
              loading ||
              !state.subscribed
            }
            className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send Test Notification
          </button>

        </div>


        {message && (

          <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            {message}
          </div>

        )}


        {error && (

          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm leading-6 text-red-300">
            {error}
          </div>

        )}

      </div>

    </section>

  );

}