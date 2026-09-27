import { NextRequest, NextResponse } from "next/server";
import { getDbHealth } from "@/lib/db";

export async function GET(request: NextRequest) {
  const traceId = request.headers.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
  const health = await getDbHealth(traceId);

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    traceId,
    database: health,
    environment: process.env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
  });
}
