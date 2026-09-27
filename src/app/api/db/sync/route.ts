import { NextRequest, NextResponse } from "next/server";
import { syncDatabase } from "@/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const traceId = request.headers.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
  logger.info("Triggering database schema synchronization via API", undefined, traceId);

  try {
    const result = await syncDatabase(traceId);
    return NextResponse.json(
      {
        ...result,
        traceId,
      },
      {
        status: result.success ? 200 : 500,
        headers: { "x-trace-id": traceId },
      }
    );
  } catch (err) {
    logger.error("Database schema sync API failed", err, undefined, traceId);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Schema synchronization failed",
        traceId,
      },
      { status: 500, headers: { "x-trace-id": traceId } }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET as well for simple browser checks or health probes
  return POST(request);
}
