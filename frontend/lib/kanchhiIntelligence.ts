"use client";

import {
  buildKanchhiContext,
  toApiContext,
  type KanchhiContext,
} from "./kanchhiContext";


// ============================================================
// CONSTANTS
// ============================================================

const BACKEND_URL =
  "http://localhost:8000";


// ============================================================
// TYPES
// ============================================================

export type BriefingType =
  | "morning"
  | "evening";


export type AIModel =
  | "auto"
  | "flash"
  | "pro"
  | "lite";


export type AIResponse = {

  reply?: string;

  model?: string;

  model_key?: string;

  fallback?: boolean;

};


export type RouteResponse = {

  success?: boolean;

  requested_model?: string;

  selected_model?: string;

  reason?: string;

};


export type BriefingResponse = {

  success?: boolean;

  type?: BriefingType;

  briefing?: string;

  model?: string;

  model_key?: string;

  fallback?: boolean;

};


// ============================================================
// CONTEXT
// ============================================================

export async function getKanchhiContext():

  Promise<KanchhiContext> {

  return buildKanchhiContext();

}


// ============================================================
// ROUTE MODEL
// ============================================================

export async function routeKanchhiModel(
  message: string,
  model: AIModel = "auto"
): Promise<RouteResponse> {

  const context =
    await buildKanchhiContext();


  const response =
    await fetch(

      `${BACKEND_URL}/api/intelligence/route`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            message,

            requested_model:
              model,

            context: {

              location:
                context.location,

              weather:
                context.weather,

              news:
                context.news,

              memory:
                context.memory,

              preferences:
                context.preferences,

            },

          }),

      }

    );


  if (!response.ok) {

    throw new Error(
      "Unable to determine KANCHHI AI model."
    );

  }


  return response.json();

}


// ============================================================
// MORNING BRIEFING
// ============================================================

export async function generateMorningBriefing(
  style:
    | "concise"
    | "normal"
    | "detailed" = "normal"
): Promise<BriefingResponse> {

  const context =
    await buildKanchhiContext();


  const response =
    await fetch(

      `${BACKEND_URL}/api/intelligence/briefing/morning`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            style,

            context:
              toApiContext(
                context
              ),

          }),

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(

      data?.detail ||
      "Morning briefing failed."

    );

  }


  return data;

}


// ============================================================
// EVENING SUMMARY
// ============================================================

export async function generateEveningBriefing(
  style:
    | "concise"
    | "normal"
    | "detailed" = "normal"
): Promise<BriefingResponse> {

  const context =
    await buildKanchhiContext();


  const response =
    await fetch(

      `${BACKEND_URL}/api/intelligence/briefing/evening`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            style,

            context:
              toApiContext(
                context
              ),

          }),

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(

      data?.detail ||
      "Evening summary failed."

    );

  }


  return data;

}