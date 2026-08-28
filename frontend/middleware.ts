import {
  NextRequest,
  NextResponse,
} from "next/server";

export function middleware(
  request: NextRequest,
) {
  const response =
    NextResponse.next();

  response.headers.set(
    "X-Content-Type-Options",
    "nosniff",
  );

  response.headers.set(
    "X-Frame-Options",
    "DENY",
  );

  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );

  /*
   * Microphone must be allowed for the KANCHHI page.
   * Geolocation is also required by WeatherPanel.
   */
  response.headers.set(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=(self)",
      "geolocation=(self)",
      "payment=()",
      "usb=()",
      "serial=()",
      "bluetooth=()",
    ].join(", "),
  );

  response.headers.set(
    "X-XSS-Protection",
    "0",
  );

  if (
    request.nextUrl.pathname.startsWith(
      "/api/",
    )
  ) {
    response.headers.set(
      "Cache-Control",
      "no-store",
    );
  }

  if (
    request.nextUrl.protocol ===
    "https:"
  ) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};