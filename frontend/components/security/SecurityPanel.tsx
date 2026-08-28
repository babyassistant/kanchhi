"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  changeKanchhiPassword,
  deleteKanchhiAccount,
  getKanchhiPasswordRequirements,
  getKanchhiSecurityState,
  logoutKanchhi,
  type KanchhiSecurityState,
} from "@/lib/kanchhiSecurity";

function formatDate(
  timestamp: number | null,
): string {
  if (!timestamp) {
    return "--";
  }

  return new Date(timestamp).toLocaleString();
}

function notifyAuthChanged(): void {
  window.dispatchEvent(
    new Event("kanchhi-auth-changed"),
  );
}

export default function SecurityPanel() {
  const [security, setSecurity] =
    useState<KanchhiSecurityState>(
      getKanchhiSecurityState(),
    );

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  function refresh() {
    setSecurity(
      getKanchhiSecurityState(),
    );
  }

  useEffect(() => {
    refresh();

    const handleAuthChanged = () => {
      refresh();
    };

    window.addEventListener(
      "kanchhi-auth-changed",
      handleAuthChanged,
    );

    return () => {
      window.removeEventListener(
        "kanchhi-auth-changed",
        handleAuthChanged,
      );
    };
  }, []);

  async function handlePasswordChange(
    event: FormEvent,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "Fill in all password fields.",
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "The new passwords do not match.",
      );
      return;
    }

    setLoading(true);

    try {
      await changeKanchhiPassword(
        currentPassword,
        newPassword,
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password changed successfully. Your current session has been renewed.",
      );

      refresh();
      notifyAuthChanged();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change password.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLock() {
    logoutKanchhi();

    refresh();
    notifyAuthChanged();
  }

  function handleDeleteAccount() {
    const confirmed =
      window.confirm(
        "Delete the KANCHHI local account? Authentication data will be removed from this browser. Your application data will remain.",
      );

    if (!confirmed) {
      return;
    }

    deleteKanchhiAccount();

    refresh();
    notifyAuthChanged();
  }

  return (
    <section className="min-h-screen bg-[#0b1220] p-6 md:p-8">
      <div className="mx-auto w-full max-w-5xl">

        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-wider text-blue-400">
            KANCHHI SECURITY
          </div>

          <h1 className="mt-1 text-3xl font-semibold text-white">
            Security & Authentication
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage your KANCHHI local account, password, and browser session.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="text-xs uppercase tracking-wider text-slate-600">
                SECURITY STATUS
              </div>

              <div className="mt-2 text-xl font-semibold text-white">
                {security.authenticated
                  ? "KANCHHI is protected"
                  : "KANCHHI is locked"}
              </div>

              <div className="mt-1 text-sm text-slate-500">
                Account:{" "}
                {security.username ||
                  "Not configured"}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-5 py-4">
              <div className="text-xs uppercase tracking-wider text-emerald-500">
                LOCAL AUTH
              </div>

              <div className="mt-1 text-sm font-medium text-emerald-300">
                PBKDF2 password verification
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-slate-800 bg-[#0d1728] p-4">
              <div className="text-xs text-slate-600">
                Account created
              </div>

              <div className="mt-2 text-sm text-slate-300">
                {formatDate(
                  security.createdAt,
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0d1728] p-4">
              <div className="text-xs text-slate-600">
                Session started
              </div>

              <div className="mt-2 text-sm text-slate-300">
                {formatDate(
                  security.sessionCreatedAt,
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0d1728] p-4">
              <div className="text-xs text-slate-600">
                Session expires
              </div>

              <div className="mt-2 text-sm text-slate-300">
                {formatDate(
                  security.sessionExpiresAt,
                )}
              </div>
            </div>

          </div>
        </div>

        <form
          onSubmit={handlePasswordChange}
          className="mt-5 rounded-2xl border border-slate-800 bg-[#111c2e] p-6"
        >
          <div>
            <div className="text-xs uppercase tracking-wider text-blue-400">
              AUTHENTICATION
            </div>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Change password
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your password is verified locally in this browser.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value,
                )
              }
              placeholder="Current password"
              autoComplete="current-password"
              className="rounded-xl border border-slate-700 bg-[#0d1728] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value,
                )
              }
              placeholder="New password"
              autoComplete="new-password"
              className="rounded-xl border border-slate-700 bg-[#0d1728] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="rounded-xl border border-slate-700 bg-[#0d1728] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 text-sm text-emerald-300">
              {message}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="text-xs text-slate-600">
              {getKanchhiPasswordRequirements().join(
                " • ",
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading
                ? "Changing..."
                : "Change Password"}
            </button>
          </div>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

          <div className="text-xs uppercase tracking-wider text-slate-500">
            SESSION
          </div>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Lock KANCHHI
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Immediately end the current browser session.
          </p>

          <button
            type="button"
            onClick={handleLock}
            className="mt-5 rounded-xl border border-amber-900/60 bg-amber-950/20 px-5 py-3 text-sm font-medium text-amber-300 transition hover:bg-amber-950/40"
          >
            🔒 Lock KANCHHI
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-red-900/40 bg-[#111c2e] p-6">

          <div className="text-xs uppercase tracking-wider text-red-400">
            DANGER ZONE
          </div>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Delete local account
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Removes the KANCHHI authentication configuration from this browser.
          </p>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="mt-5 rounded-xl border border-red-900 bg-red-950/40 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-950/60"
          >
            Delete Local Account
          </button>
        </div>

        <div className="mt-6 text-xs leading-5 text-slate-700">
          KANCHHI Security • Local browser authentication
        </div>

      </div>
    </section>
  );
}