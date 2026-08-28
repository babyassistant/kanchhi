"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";


// ============================================================
// CONSTANTS
// ============================================================

const EXPORT_VERSION =
  1;

const AUTH_KEYS = new Set([
  "kanchhi-security-auth",
  "kanchhi-security-session",
]);


// ============================================================
// TYPES
// ============================================================

type KanchhiExportPayload = {

  version: number;

  exportedAt: string;

  application: string;

  source: string;

  localStorage: Record<
    string,
    string
  >;

};


// ============================================================
// HELPERS
// ============================================================

function isAllowedKey(
  key: string
): boolean {

  if (
    AUTH_KEYS.has(
      key
    )
  ) {

    return false;

  }

  return (
    key.startsWith(
      "kanchhi-"
    )
  );

}


function buildExportPayload():
  KanchhiExportPayload {

  const localStorageData:
    Record<string, string> = {};


  for (
    let index = 0;
    index <
    localStorage.length;
    index += 1
  ) {

    const key =
      localStorage.key(
        index
      );

    if (
      !key
    ) {

      continue;

    }


    if (
      !isAllowedKey(
        key
      )
    ) {

      continue;

    }


    const value =
      localStorage.getItem(
        key
      );

    if (
      value !==
      null
    ) {

      localStorageData[
        key
      ] =
        value;

    }

  }


  return {

    version:
      EXPORT_VERSION,

    exportedAt:
      new Date().toISOString(),

    application:
      "KANCHHI",

    source:
      "local-browser",

    localStorage:
      localStorageData,

  };

}


function downloadJson(
  filename: string,
  data: unknown
): void {

  const json =
    JSON.stringify(
      data,
      null,
      2
    );

  const blob =
    new Blob(
      [
        json,
      ],
      {
        type:
          "application/json",
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    url;

  anchor.download =
    filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  window.setTimeout(
    () => {
      URL.revokeObjectURL(
        url
      );
    },
    1000
  );

}


// ============================================================
// VALIDATE IMPORT
// ============================================================

function validateImport(
  value: unknown
): KanchhiExportPayload {

  if (
    !value ||
    typeof value !==
      "object"
  ) {

    throw new Error(
      "The selected file is not a valid KANCHHI export."
    );

  }


  const record =
    value as Record<
      string,
      unknown
    >;


  if (
    record.application !==
    "KANCHHI"
  ) {

    throw new Error(
      "The selected file is not a KANCHHI backup."
    );

  }


  if (
    record.version !==
    EXPORT_VERSION
  ) {

    throw new Error(
      `Unsupported KANCHHI export version: ${String(
        record.version
      )}`
    );

  }


  if (
    !record.localStorage ||
    typeof record.localStorage !==
      "object" ||
    Array.isArray(
      record.localStorage
    )
  ) {

    throw new Error(
      "The KANCHHI export does not contain a valid local-data section."
    );

  }


  return record as unknown as
    KanchhiExportPayload;

}


// ============================================================
// COMPONENT
// ============================================================

export default function DataTransferPanel() {

  const [
    message,
    setMessage,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    replacing,
    setReplacing,
  ] = useState(false);


  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );


  const handleExport =
    () => {

      setMessage("");

      setError("");


      try {

        const payload =
          buildExportPayload();

        const timestamp =
          new Date()
            .toISOString()
            .replace(
              /[:.]/g,
              "-"
            );


        downloadJson(
          `kanchhi-backup-${timestamp}.json`,
          payload
        );


        const count =
          Object.keys(
            payload.localStorage
          ).length;


        setMessage(
          `KANCHHI backup exported successfully. ${count} application data entries were included.`
        );

      } catch (
        exportError
      ) {

        setError(
          exportError instanceof
          Error
            ? exportError.message
            : "Unable to export KANCHHI data."
        );

      }

    };


  const handleImportFile =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        event.target.files?.[0];


      if (
        !file
      ) {

        return;

      }


      setMessage("");

      setError("");


      try {

        if (
          file.size >
          20 * 1024 * 1024
        ) {

          throw new Error(
            "The selected backup is larger than 20 MB."
          );

        }


        const text =
          await file.text();


        const parsed =
          JSON.parse(
            text
          );


        const payload =
          validateImport(
            parsed
          );


        if (
          replacing
        ) {

          for (
            let index = 0;
            index <
            localStorage.length;
            index += 1
          ) {

            const key =
              localStorage.key(
                index
              );

            if (
              key &&
              isAllowedKey(
                key
              )
            ) {

              localStorage.removeItem(
                key
              );

            }

          }

        }


        const entries =
          Object.entries(
            payload.localStorage
          );


        let importedCount =
          0;


        for (
          const [
            key,
            value,
          ]
          of entries
        ) {

          if (
            !isAllowedKey(
              key
            )
          ) {

            continue;

          }


          if (
            typeof value !==
            "string"
          ) {

            continue;

          }


          // Prevent accidental oversized individual values.
          if (
            value.length >
            5_000_000
          ) {

            continue;

          }


          localStorage.setItem(
            key,
            value
          );

          importedCount +=
            1;

        }


        setMessage(
          `KANCHHI data imported successfully. ${importedCount} application entries were restored.`
        );


        // Notify open components.
        window.dispatchEvent(
          new StorageEvent(
            "storage",
            {
              key: null,
            }
          )
        );


      } catch (
        importError
      ) {

        setError(
          importError instanceof
          Error
            ? importError.message
            : "Unable to import KANCHHI data."
        );

      } finally {

        if (
          fileInputRef.current
        ) {

          fileInputRef.current.value =
            "";

        }

      }

    };


  const handleClearApplicationData =
    () => {

      const confirmed =
        window.confirm(
          "Clear all exported application data stored by KANCHHI? Authentication will remain intact."
        );


      if (
        !confirmed
      ) {

        return;

      }


      let removed =
        0;


      for (
        let index = 0;
        index <
        localStorage.length;
        index += 1
      ) {

        const key =
          localStorage.key(
            index
          );

        if (
          key &&
          isAllowedKey(
            key
          )
        ) {

          localStorage.removeItem(
            key
          );

          removed +=
            1;

        }

      }


      setMessage(
        `${removed} KANCHHI application data entries were cleared. Authentication remains active.`
      );


      window.location.reload();

    };


  return (

    <section className="min-h-screen bg-[#0b1220] p-6 md:p-8">

      <div className="mx-auto w-full max-w-5xl">

        <div className="mb-8">

          <div className="text-xs font-medium uppercase tracking-wider text-blue-400">
            PHASE 10
          </div>

          <h1 className="mt-1 text-3xl font-semibold text-white">
            Data Export & Import
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">

            Back up and restore KANCHHI's local application data.
            Authentication secrets are never included.

          </p>

        </div>


        {/* ==================================================
            EXPORT
        ================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="text-xs uppercase tracking-wider text-blue-400">
                EXPORT
              </div>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Create a KANCHHI backup
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">

                The backup includes KANCHHI application localStorage
                data such as preferences, analytics, caches, watchlists,
                and related local state.

              </p>

            </div>


            <button
              type="button"
              onClick={
                handleExport
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              ↓ Export KANCHHI Data
            </button>

          </div>

        </div>


        {/* ==================================================
            IMPORT
        ================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#111c2e] p-6">

          <div>

            <div className="text-xs uppercase tracking-wider text-blue-400">
              IMPORT
            </div>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Restore a KANCHHI backup
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Only KANCHHI application keys are restored.
              Authentication configuration is ignored.
            </p>

          </div>


          <div className="mt-6 rounded-xl border border-slate-800 bg-[#0d1728] p-5">

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-6 py-10 text-center transition hover:border-blue-500/50 hover:bg-slate-900/50">

              <div className="text-3xl">
                📦
              </div>

              <div className="mt-3 text-sm font-medium text-slate-200">
                Choose a KANCHHI JSON backup
              </div>

              <div className="mt-1 text-xs text-slate-600">
                Maximum 20 MB
              </div>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="application/json,.json"
                onChange={
                  handleImportFile
                }
                className="hidden"
              />

            </label>


            <label className="mt-5 flex items-center gap-3 text-sm text-slate-400">

              <input
                type="checkbox"
                checked={
                  replacing
                }
                onChange={(event) =>
                  setReplacing(
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600"
              />

              Replace existing application data before importing

            </label>

          </div>

        </div>


        {/* ==================================================
            CLEAR
        ================================================== */}

        <div className="mt-5 rounded-2xl border border-red-900/40 bg-[#111c2e] p-6">

          <div>

            <div className="text-xs uppercase tracking-wider text-red-400">
              DATA MANAGEMENT
            </div>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Clear application data
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">

              Removes KANCHHI application data from this browser.
              Your authentication account remains intact.

            </p>

          </div>


          <button
            type="button"
            onClick={
              handleClearApplicationData
            }
            className="mt-5 rounded-xl border border-red-900 bg-red-950/30 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-950/50"
          >
            Clear Application Data
          </button>

        </div>


        {/* ==================================================
            STATUS
        ================================================== */}

        {message && (

          <div className="mt-5 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 text-sm text-emerald-300">
            {message}
          </div>

        )}


        {error && (

          <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>

        )}


        <div className="mt-6 text-xs leading-5 text-slate-700">

          Authentication secrets, password verifiers, salts,
          and session tokens are intentionally excluded from exports.

        </div>

      </div>

    </section>

  );

}