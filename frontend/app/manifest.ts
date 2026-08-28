import type { MetadataRoute } from "next";

export default function manifest():
  MetadataRoute.Manifest {

  return {

    name:
      "KANCHHI Smart Information Hub",

    short_name:
      "KANCHHI",

    description:
      "Personal AI information and intelligence hub.",

    start_url:
      "/",

    scope:
      "/",

    display:
      "standalone",

    background_color:
      "#0b1220",

    theme_color:
      "#0b1220",

    orientation:
      "portrait-primary",

    categories: [
      "productivity",
      "utilities",
      "news",
    ],

    icons: [
      {
        src:
          "/icons/icon-192.png",
        sizes:
          "192x192",
        type:
          "image/png",
      },
      {
        src:
          "/icons/icon-512.png",
        sizes:
          "512x512",
        type:
          "image/png",
      },
    ],
  };
}