"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";


type AssistantPanelProps = {
  initialMessage?: string;

  onResponse?: (
    response: string
  ) => void;
};


type ChatResponse = {
  reply?: string;
  error?: string;
  detail?: string;
  model?: string;
  model_key?: string;
  fallback?: boolean;
};


const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";


export default function AssistantPanel({
  initialMessage = "",
  onResponse,
}: AssistantPanelProps) {

  const [
    message,
    setMessage,
  ] = useState("");


  const [
    response,
    setResponse,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const processedVoiceMessageRef =
    useRef("");


  const responseRef =
    useRef<HTMLDivElement | null>(
      null
    );


  // ==========================================================
  // RECEIVE VOICE COMMAND
  // ==========================================================

  useEffect(() => {

    const command =
      initialMessage.trim();

    if (!command) {
      return;
    }


    setMessage(
      command
    );


    /*
     * Prevent repeatedly submitting the exact same
     * voice command caused by React re-renders.
     */

    if (
      processedVoiceMessageRef.current ===
      command
    ) {
      return;
    }


    processedVoiceMessageRef.current =
      command;


    void sendMessageText(
      command
    );

  }, [
    initialMessage,
  ]);


  // ==========================================================
  // SCROLL RESPONSE
  // ==========================================================

  useEffect(() => {

    if (
      responseRef.current
    ) {

      responseRef.current.scrollTop =
        responseRef.current.scrollHeight;

    }

  }, [
    response,
  ]);


  // ==========================================================
  // SEND TEXT
  // ==========================================================

  async function sendMessageText(
    text: string
  ) {

    const trimmed =
      text.trim();

    if (!trimmed) {

      setError(
        "Enter a message first."
      );

      return;

    }


    setLoading(
      true
    );

    setError("");


    try {

      const httpResponse =
        await fetch(
          `${BACKEND_URL}/api/ai/chat`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache:
              "no-store",

            body:
              JSON.stringify({
                message:
                  trimmed,
              }),
          }
        );


      let data:
        ChatResponse = {};


      try {

        data =
          (
            await httpResponse.json()
          ) as ChatResponse;

      } catch {

        throw new Error(
          `KANCHHI returned invalid JSON (HTTP ${httpResponse.status}).`
        );

      }


      if (
        !httpResponse.ok
      ) {

        throw new Error(
          data.detail ||
          data.error ||
          `KANCHHI returned HTTP ${httpResponse.status}.`
        );

      }


      if (
        data.reply ===
        undefined ||
        !data.reply.trim()
      ) {

        throw new Error(
          "KANCHHI returned an empty response."
        );

      }


      const reply =
        data.reply.trim();


      setResponse(
        reply
      );


      /*
       * Critical:
       * page.tsx receives the latest response.
       * VoicePanel can then speak it.
       */

      onResponse?.(
        reply
      );


      window.dispatchEvent(
        new CustomEvent(
          "kanchhi-assistant-response",
          {
            detail: {
              text:
                reply,
            },
          }
        )
      );


      /*
       * Clear the input after a voice command.
       */

      if (
        initialMessage.trim() ===
        trimmed
      ) {

        setMessage("");

      }


    } catch (
      requestError
    ) {

      console.error(
        "KANCHHI AI error:",
        requestError
      );


      setError(
        requestError instanceof
        Error
          ? requestError.message
          : "KANCHHI AI request failed."
      );


    } finally {

      setLoading(
        false
      );

    }

  }


  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  async function sendMessage(
    event?: FormEvent
  ) {

    event?.preventDefault();

    await sendMessageText(
      message
    );

  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  function clearConversation() {

    setMessage("");

    setResponse("");

    setError("");

    processedVoiceMessageRef.current =
      "";

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section className="
      min-h-screen
      bg-[#0b1220]
      p-6
      md:p-8
    ">

      <div className="
        mx-auto
        max-w-5xl
      ">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="
          mb-8
        ">

          <p className="
            text-xs
            uppercase
            tracking-wider
            text-blue-400
          ">
            KANCHHI AI
          </p>


          <h1 className="
            mt-2
            text-4xl
            font-bold
          ">
            AI Assistant
          </h1>


          <p className="
            mt-2
            text-slate-400
          ">
            Ask KANCHHI questions using the configured AI backend.
          </p>

        </div>


        {/* ==================================================
            GRID
        ================================================== */}

        <div className="
          grid
          gap-6
          lg:grid-cols-2
        ">


          {/* =================================================
              INPUT
          ================================================= */}

          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-6
          ">

            <form
              onSubmit={
                sendMessage
              }
            >

              <div className="
                flex
                items-center
                justify-between
                gap-3
              ">

                <label className="
                  text-xs
                  uppercase
                  tracking-wider
                  text-slate-500
                ">
                  Message
                </label>


                {message && (

                  <button
                    type="button"
                    onClick={() =>
                      setMessage("")
                    }
                    className="
                      text-xs
                      text-slate-500
                      hover:text-slate-300
                    "
                  >
                    Clear
                  </button>

                )}

              </div>


              <textarea
                value={
                  message
                }
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder="Ask KANCHHI anything..."
                className="
                  mt-2
                  h-[320px]
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-slate-700
                  bg-[#080d17]
                  p-4
                  text-sm
                  leading-6
                  text-white
                  outline-none
                  placeholder:text-slate-600
                  focus:border-blue-500
                "
              />


              {error && (

                <div className="
                  mt-4
                  rounded-xl
                  border
                  border-red-900/60
                  bg-red-950/30
                  p-4
                  text-sm
                  leading-6
                  text-red-300
                ">
                  {error}
                </div>

              )}


              <button
                type="submit"
                disabled={
                  loading ||
                  !message.trim()
                }
                className="
                  mt-5
                  w-full
                  rounded-xl
                  bg-blue-600
                  px-5
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {loading
                  ? "KANCHHI is thinking..."
                  : "Send to KANCHHI"}

              </button>

            </form>

          </div>


          {/* =================================================
              RESPONSE
          ================================================= */}

          <div className="
            rounded-2xl
            border
            border-slate-800
            bg-[#111c2e]
            p-6
          ">

            <div className="
              flex
              items-center
              justify-between
              gap-4
            ">

              <div>

                <p className="
                  text-xs
                  uppercase
                  tracking-wider
                  text-blue-400
                ">
                  KANCHHI RESPONSE
                </p>

                <h2 className="
                  mt-1
                  text-xl
                  font-semibold
                ">
                  Intelligence
                </h2>

              </div>


              {response && (

                <button
                  type="button"
                  onClick={
                    clearConversation
                  }
                  className="
                    text-xs
                    text-slate-500
                    hover:text-slate-300
                  "
                >
                  Clear
                </button>

              )}

            </div>


            <div
              ref={
                responseRef
              }
              className="
                mt-5
                min-h-[390px]
                max-h-[580px]
                overflow-auto
                whitespace-pre-wrap
                rounded-xl
                border
                border-slate-800
                bg-[#080d17]
                p-5
                text-sm
                leading-7
                text-slate-300
              "
            >

              {response ? (

                response

              ) : (

                <div className="
                  flex
                  min-h-[340px]
                  items-center
                  justify-center
                  text-center
                  text-slate-600
                ">

                  <div>

                    <div className="
                      text-4xl
                    ">
                      🤖
                    </div>


                    <p className="
                      mt-3
                    ">
                      KANCHHI's response will appear here.
                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </section>

  );
}