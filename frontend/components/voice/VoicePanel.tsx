"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createKanchhiSpeechRecognition,
  getKanchhiVoiceSupport,
  speakKanchhi,
  stopKanchhiSpeaking,
  type KanchhiVoiceSupport,
  type SpeechRecognitionInstance,
} from "@/lib/kanchhiVoice";

type VoicePanelProps = {
  onTranscript?: (
    transcript: string,
  ) => void;

  lastResponse?: string;
};

function getVoiceErrorMessage(
  code: string,
): string {
  switch (code) {
    case "not-allowed":
      return (
        "Microphone access was denied. Enable microphone access for localhost in your browser settings, then reload KANCHHI."
      );

    case "service-not-allowed":
      return (
        "The browser speech-recognition service is not allowed for this page."
      );

    case "audio-capture":
      return (
        "KANCHHI could not access the microphone. Check the selected microphone and your operating-system microphone permission."
      );

    case "no-speech":
      return (
        "No speech was detected. Please speak again."
      );

    case "network":
      return (
        "The browser speech-recognition service reported a network problem."
      );

    case "language-not-supported":
      return (
        "The selected speech language is not supported."
      );

    case "aborted":
      return "";

    default:
      return (
        `Voice recognition failed${
          code
            ? ` (${code})`
            : ""
        }.`
      );
  }
}

export default function VoicePanel({
  onTranscript,
  lastResponse = "",
}: VoicePanelProps) {
  const [
    support,
    setSupport,
  ] = useState<KanchhiVoiceSupport>({
    recognition: false,
    synthesis: false,
  });

  const [
    listening,
    setListening,
  ] = useState(false);

  const [
    speaking,
    setSpeaking,
  ] = useState(false);

  const [
    transcript,
    setTranscript,
  ] = useState("");

  const [
    interimTranscript,
    setInterimTranscript,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    permissionState,
    setPermissionState,
  ] = useState<
    "unknown" |
    "granted" |
    "denied" |
    "prompt"
  >("unknown");

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null,
    );

  const speakingTimerRef =
    useRef<number | null>(
      null,
    );

  const intentionalStopRef =
    useRef(false);

  useEffect(() => {
    setSupport(
      getKanchhiVoiceSupport(),
    );

    if (
      typeof navigator !==
        "undefined" &&
      "permissions" in navigator
    ) {
      try {
        const permissions =
          navigator.permissions;

        permissions
          .query({
            name: "microphone" as PermissionName,
          })
          .then(
            (result) => {
              setPermissionState(
                result.state as
                  | "granted"
                  | "denied"
                  | "prompt",
              );

              result.onchange = () => {
                setPermissionState(
                  result.state as
                    | "granted"
                    | "denied"
                    | "prompt",
                );
              };
            },
          )
          .catch(() => {
            setPermissionState(
              "unknown",
            );
          });
      } catch {
        setPermissionState(
          "unknown",
        );
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      intentionalStopRef.current =
        true;

      recognitionRef.current?.abort();

      stopKanchhiSpeaking();

      if (
        speakingTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          speakingTimerRef.current,
        );
      }
    };
  }, []);

  const combinedTranscript =
    useMemo(
      () =>
        `${transcript} ${interimTranscript}`
          .trim(),
      [
        transcript,
        interimTranscript,
      ],
    );

  async function requestMicrophone():
    Promise<boolean> {
    if (
      typeof navigator ===
      "undefined"
    ) {
      return false;
    }

    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      /*
       * Some browser speech APIs handle microphone
       * permission internally.
       */
      return true;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          },
        );

      stream
        .getTracks()
        .forEach(
          (track) =>
            track.stop(),
        );

      setPermissionState(
        "granted",
      );

      return true;
    } catch (
      permissionError
    ) {
      console.error(
        "KANCHHI microphone permission error:",
        permissionError,
      );

      setPermissionState(
        "denied",
      );

      setError(
        "Microphone access is blocked. In your browser, open site settings for localhost:3000 and allow Microphone. Also make sure macOS allows your browser to use the microphone.",
      );

      return false;
    }
  }

  async function startListening() {
    setError("");

    if (
      !support.recognition
    ) {
      setError(
        "Voice input is not supported by this browser. Google Chrome or Microsoft Edge is recommended.",
      );
      return;
    }

    const permissionOk =
      await requestMicrophone();

    if (!permissionOk) {
      return;
    }

    if (listening) {
      return;
    }

    const recognition =
      createKanchhiSpeechRecognition(
        "en-US",
      );

    if (!recognition) {
      setError(
        "KANCHHI could not initialize speech recognition.",
      );
      return;
    }

    intentionalStopRef.current =
      false;

    setTranscript("");
    setInterimTranscript("");

    recognitionRef.current =
      recognition;

    recognition.onstart =
      () => {
        setListening(true);
        setError("");
      };

    recognition.onresult =
      (event) => {
        let finalText = "";
        let interimText = "";

        for (
          let index = 0;
          index <
          event.results.length;
          index += 1
        ) {
          const result =
            event.results[index];

          const text =
            result[0]?.transcript ??
            "";

          if (
            result.isFinal
          ) {
            finalText +=
              `${text} `;
          } else {
            interimText +=
              `${text} `;
          }
        }

        if (
          finalText.trim()
        ) {
          setTranscript(
            finalText.trim(),
          );
        }

        setInterimTranscript(
          interimText.trim(),
        );
      };

    recognition.onerror =
      (event) => {
        const code =
          event?.error || "";

        const message =
          event?.message || "";

        /*
         * `aborted` is normal when the user stops recognition
         * or when the recognition session ends intentionally.
         */
        if (
          code === "aborted"
        ) {
          setListening(false);
          return;
        }

        console.error(
          "KANCHHI voice recognition error:",
          {
            code,
            message,
          },
        );

        setListening(false);

        const friendly =
          getVoiceErrorMessage(
            code,
          );

        if (friendly) {
          setError(
            friendly,
          );
        } else if (
          message
        ) {
          setError(
            message,
          );
        }
      };

    recognition.onend =
      () => {
        setListening(false);

        /*
         * Preserve whatever final text has already been captured.
         */
      };

    try {
      recognition.start();
    } catch (
      startError
    ) {
      console.error(
        "KANCHHI voice start error:",
        startError,
      );

      setListening(false);

      setError(
        "Voice recognition could not be started. Check microphone permission and try again.",
      );
    }
  }

  function stopListening() {
    intentionalStopRef.current =
      true;

    recognitionRef.current?.stop();

    setListening(false);

    /*
     * Use final transcript only. Don't send interim text
     * unless the browser has already committed it.
     */
    const finalText =
      transcript.trim();

    if (
      finalText &&
      onTranscript
    ) {
      onTranscript(
        finalText,
      );
    }
  }

  function sendTranscript() {
    const text =
      combinedTranscript.trim();

    if (!text) {
      setError(
        "No recognized speech is available.",
      );
      return;
    }

    if (onTranscript) {
      onTranscript(
        text,
      );
    }
  }

  function handleSpeak() {
    setError("");

    if (
      !support.synthesis
    ) {
      setError(
        "Voice output is not supported by this browser.",
      );
      return;
    }

    if (
      !lastResponse.trim()
    ) {
      setError(
        "There is no KANCHHI response available to speak yet.",
      );
      return;
    }

    if (speaking) {
      stopKanchhiSpeaking();

      setSpeaking(false);

      if (
        speakingTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          speakingTimerRef.current,
        );

        speakingTimerRef.current =
          null;
      }

      return;
    }

    const started =
      speakKanchhi(
        lastResponse,
      );

    if (!started) {
      setError(
        "KANCHHI could not start voice output.",
      );
      return;
    }

    setSpeaking(true);

    speakingTimerRef.current =
      window.setTimeout(
        () => {
          setSpeaking(false);
          speakingTimerRef.current =
            null;
        },
        Math.max(
          1500,
          lastResponse.length *
            45,
        ),
      );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#111c2e] p-6">
      <div className="flex flex-col gap-5">

        <div>
          <p className="text-xs uppercase tracking-wider text-blue-400">
            KANCHHI VOICE
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Voice Control
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Talk to KANCHHI and hear responses aloud.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-400">
              Microphone permission
            </span>

            <span className="text-sm text-slate-300">
              {permissionState}
            </span>
          </div>

          {permissionState ===
            "denied" && (
            <p className="mt-3 text-xs leading-5 text-amber-300">
              Allow microphone access for localhost:3000 in browser site settings and ensure your operating system permits microphone access.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          <button
            type="button"
            onClick={
              listening
                ? stopListening
                : startListening
            }
            disabled={
              !support.recognition
            }
            className={`rounded-xl border px-5 py-4 text-left transition ${
              listening
                ? "border-red-500/40 bg-red-500/10"
                : "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <div className="text-2xl">
              {listening
                ? "⏹️"
                : "🎙️"}
            </div>

            <p className="mt-2 font-medium text-white">
              {listening
                ? "Stop Listening"
                : "Start Voice Input"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {support.recognition
                ? "Speak naturally to KANCHHI."
                : "Browser voice input unavailable."}
            </p>
          </button>

          <button
            type="button"
            onClick={
              handleSpeak
            }
            disabled={
              !support.synthesis ||
              !lastResponse.trim()
            }
            className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-4 text-left transition hover:bg-purple-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="text-2xl">
              {speaking
                ? "⏹️"
                : "🔊"}
            </div>

            <p className="mt-2 font-medium text-white">
              {speaking
                ? "Stop Speaking"
                : "Speak Response"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {support.synthesis
                ? lastResponse.trim()
                  ? "Read the latest KANCHHI response aloud."
                  : "Ask KANCHHI something first."
                : "Browser voice output unavailable."}
            </p>
          </button>

        </div>

        {combinedTranscript && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Recognized Speech
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
              {combinedTranscript}
            </p>

            {onTranscript && (
              <div className="mt-4 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={
                    sendTranscript
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
                >
                  Send to KANCHHI
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTranscript("");
                    setInterimTranscript("");
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Clear
                </button>

              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm leading-6 text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">

          <p className="text-xs uppercase tracking-wider text-slate-600">
            Voice Support
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">

            <div>
              <p className="text-slate-600">
                Input
              </p>

              <p className="mt-1 text-slate-300">
                {support.recognition
                  ? "Available"
                  : "Unavailable"}
              </p>
            </div>

            <div>
              <p className="text-slate-600">
                Output
              </p>

              <p className="mt-1 text-slate-300">
                {support.synthesis
                  ? "Available"
                  : "Unavailable"}
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}