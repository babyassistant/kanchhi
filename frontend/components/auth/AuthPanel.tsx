"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  createKanchhiAccount,
  getKanchhiPasswordRequirements,
  hasKanchhiAccount,
  loginKanchhi,
} from "@/lib/kanchhiSecurity";


// ============================================================
// COMPONENT
// ============================================================

type AuthPanelProps = {

  onAuthenticated:
    () => void;

};


export default function AuthPanel({
  onAuthenticated,
}: AuthPanelProps) {

  const [
    mode,
    setMode,
  ] = useState<
    "login" | "setup"
  >(
    hasKanchhiAccount()
      ? "login"
      : "setup"
  );


  const [
    username,
    setUsername,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const handleSubmit =
    async (
      event: FormEvent
    ) => {

      event.preventDefault();

      setError("");

      if (
        !username.trim()
      ) {

        setError(
          "Enter your username."
        );

        return;

      }


      if (
        !password
      ) {

        setError(
          "Enter your password."
        );

        return;

      }


      if (
        mode ===
        "setup" &&
        password !==
        confirmPassword
      ) {

        setError(
          "The passwords do not match."
        );

        return;

      }


      setLoading(
        true
      );

      try {

        if (
          mode ===
          "setup"
        ) {

          await createKanchhiAccount(
            username,
            password
          );

        } else {

          await loginKanchhi(
            username,
            password
          );

        }


        onAuthenticated();

      } catch (
        authError
      ) {

        setError(
          authError instanceof
          Error
            ? authError.message
            : "Authentication failed."
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  return (

    <main className="flex min-h-screen items-center justify-center bg-[#07101d] p-6 text-white">

      <div className="w-full max-w-md">

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold shadow-lg shadow-blue-600/20">
            N
          </div>

          <div className="mt-5 text-xs font-medium uppercase tracking-[0.25em] text-blue-400">
            KANCHHI SECURITY
          </div>

          <h1 className="mt-2 text-3xl font-semibold">
            {mode ===
            "setup"
              ? "Create your KANCHHI account"
              : "Welcome back"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">

            {mode ===
            "setup"
              ? "Your password stays in this browser."
              : "Unlock your local KANCHHI workspace."}

          </p>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6 shadow-2xl"
        >

          <label className="block">

            <span className="text-xs uppercase tracking-wider text-slate-600">
              Username
            </span>

            <input
              value={
                username
              }
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-[#0d1728] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              placeholder="Your KANCHHI username"
            />

          </label>


          <label className="mt-5 block">

            <span className="text-xs uppercase tracking-wider text-slate-600">
              Password
            </span>

            <input
              type="password"
              value={
                password
              }
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete={
                mode ===
                "setup"
                  ? "new-password"
                  : "current-password"
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-[#0d1728] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              placeholder="Password"
            />

          </label>


          {mode ===
            "setup" && (

            <label className="mt-5 block">

              <span className="text-xs uppercase tracking-wider text-slate-600">
                Confirm password
              </span>

              <input
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-[#0d1728] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                placeholder="Confirm password"
              />

            </label>

          )}


          {mode ===
            "setup" && (

            <div className="mt-5 rounded-xl border border-slate-800 bg-[#0d1728] p-4">

              <p className="text-xs font-medium text-slate-400">
                Password requirements
              </p>

              <div className="mt-3 space-y-1">

                {getKanchhiPasswordRequirements().map(
                  (
                    requirement
                  ) => (

                    <div
                      key={
                        requirement
                      }
                      className="text-xs text-slate-600"
                    >
                      • {requirement}
                    </div>

                  )
                )}

              </div>

            </div>

          )}


          {error && (

            <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>

          )}


          <button
            type="submit"
            disabled={
              loading
            }
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading
              ? "Checking..."
              : mode ===
                  "setup"
                ? "Create Account"
                : "Unlock KANCHHI"}

          </button>


          <button
            type="button"
            onClick={() => {

              setMode(
                mode ===
                  "setup"
                  ? "login"
                  : "setup"
              );

              setError("");

              setPassword("");

              setConfirmPassword("");

            }}
            className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >

            {mode ===
            "setup"
              ? "I already have an account"
              : "Create a local account"}

          </button>

        </form>


        <p className="mt-5 text-center text-xs leading-5 text-slate-700">

          KANCHHI local security • Password verification stays in your browser

        </p>

      </div>

    </main>

  );

}