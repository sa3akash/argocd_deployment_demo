import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Internal probes, health checks, and Kubernetes traffic must NEVER be redirected
  if (pathname === "/api/health" || pathname.startsWith("/api/health/")) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") || request.nextUrl.host;
  const userAgent = request.headers.get("user-agent") || "";
  const proto = request.headers.get("x-forwarded-proto");

  // Identify internal cluster traffic and kubelet probe requests
  const isKubeProbe = userAgent.toLowerCase().includes("kube-probe");
  const isInternal =
    /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|localhost)/.test(host);

  // 1. Force HTTPS redirect ONLY for public external host requests over HTTP
  if (
    !isKubeProbe &&
    !isInternal &&
    proto === "http" &&
    !host.includes("localhost")
  ) {
    const httpsUrl = `https://${host}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Generate a unique trace ID if not already present
  const traceId =
    request.headers.get("x-trace-id") ||
    `tr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  const startTime = Date.now();

  // Clone request headers and inject trace ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-trace-id", traceId);

  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Inject tracing, timing, and security headers on the response
  response.headers.set("x-trace-id", traceId);
  response.headers.set("x-response-time", `${Date.now() - startTime}ms`);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files, image optimizations, and internal health checks
     */
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
