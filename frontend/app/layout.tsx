import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

export const metadata:
  Metadata = {

  title:
    "KANCHHI",

  description:
    "KANCHHI Smart Information Hub",

  applicationName:
    "KANCHHI",

  manifest:
    "/manifest.webmanifest",

  appleWebApp: {
    capable:
      true,

    title:
      "KANCHHI",

    statusBarStyle:
      "black-translucent",
  },
};


export const viewport:
  Viewport = {

  width:
    "device-width",

  initialScale:
    1,

  maximumScale:
    1,

  userScalable:
    false,

  viewportFit:
    "cover",

  themeColor:
    "#0b1220",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (

    <html lang="en">

      <body
        className="
          min-h-screen
          bg-[#0b1220]
          text-white
          antialiased
        "
      >

        {children}

      </body>

    </html>

  );

}