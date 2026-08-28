"use client";

import { useState } from "react";


export default function CodePanel() {

  const [code, setCode] =
    useState("");

  const [codeOutput, setCodeOutput] =
    useState("");


  const handleRunCode = async () => {

    try {

      setCodeOutput("Running...");


      const response =
        await fetch(
          "http://localhost:8000/api/code/run",
          {
            method: "POST",
          }
        );


      const data =
        await response.json();


      setCodeOutput(
        data.output ||
        "No output returned."
      );


    } catch (error) {

      console.error(
        "Code execution failed:",
        error
      );


      setCodeOutput(
        "Could not connect to the backend."
      );

    }

  };


  return (
    <section className="p-8 lg:p-10">

      <div className="max-w-7xl mx-auto">

        <p className="text-blue-400 text-sm font-medium mb-2">
          KANCHHI CODE
        </p>

        <h2 className="text-4xl font-bold mb-2">
          Code Environment
        </h2>

        <p className="text-slate-400 mb-8">
          Write and run code inside KANCHHI.
        </p>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


          {/* EDITOR */}

          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#111c2e]">

            <div className="px-5 py-4 border-b border-slate-800 flex justify-between">

              <span className="font-medium">
                Python
              </span>

              <span className="text-xs text-slate-500">
                editor
              </span>

            </div>


            <textarea
              className="w-full h-96 p-5 bg-[#080d17] text-green-400 font-mono text-sm resize-none outline-none"
              placeholder="Write your Python code here..."
              value={code}
              onChange={(e) =>
                setCode(e.target.value)
              }
            />

          </div>


          {/* TERMINAL */}

          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#111c2e]">

            <div className="px-5 py-4 border-b border-slate-800">

              <span className="font-medium">
                Terminal Output
              </span>

            </div>


            <div className="h-96 p-5 bg-black font-mono text-sm text-slate-300 overflow-auto">

              <p className="text-blue-400 mb-3">
                $ kanchhi
              </p>

              <p className="whitespace-pre-wrap">
                {codeOutput ||
                  "Output will appear here..."}
              </p>

            </div>

          </div>

        </div>


        <button
          onClick={handleRunCode}
          className="mt-6 px-7 py-3 rounded-xl bg-green-600 hover:bg-green-500 font-semibold transition"
        >
          ▶ Run Code
        </button>

      </div>

    </section>
  );
}