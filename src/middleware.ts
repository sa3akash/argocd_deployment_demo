import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Generate a unique trace ID if not already present
  const traceId = request.headers.get("x-trace-id") || `tr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  const startTime = Date.now();

  // Clone request headers and inject trace ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-trace-id", traceId);

  // Structured request log to console
  const method = request.method;
  const path = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";

  if (!path.startsWith("/_next") && !path.includes(".")) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        type: "HTTP_REQUEST",
        method,
        path,
        ip,
        traceId,
      })
    );
  }

  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Inject tracing and timing headers on the response
  response.headers.set("x-trace-id", traceId);
  response.headers.set("x-response-time", `${Date.now() - startTime}ms`);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
