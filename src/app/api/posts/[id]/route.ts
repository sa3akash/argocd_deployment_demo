import { NextRequest, NextResponse } from "next/server";
import { initDb, getPostById, updatePost, deletePost } from "@/lib/db";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const traceId = request.headers.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
  const startTime = performance.now();
  const { id } = await context.params;
  const numId = parseInt(id, 10);

  if (isNaN(numId)) {
    return NextResponse.json({ success: false, traceId, error: "Invalid post ID" }, { status: 400 });
  }

  try {
    await initDb(traceId);
    const post = await getPostById(numId, traceId);
    const duration = performance.now() - startTime;

    if (!post) {
      return NextResponse.json({ success: false, traceId, error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      traceId,
      durationMs: Math.round(duration),
      data: post,
    });
  } catch (err) {
    logger.error(`REST API GET /api/posts/${id} failed`, err, undefined, traceId);
    return NextResponse.json({ success: false, traceId, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const traceId = request.headers.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
  const startTime = performance.now();
  const { id } = await context.params;
  const numId = parseInt(id, 10);

  if (isNaN(numId)) {
    return NextResponse.json({ success: false, traceId, error: "Invalid post ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    await initDb(traceId);
    const updated = await updatePost(numId, body, traceId);
    const duration = performance.now() - startTime;

    if (!updated) {
      return NextResponse.json({ success: false, traceId, error: "Post not found" }, { status: 404 });
    }

    logger.info(`REST API PUT /api/posts/${id} succeeded`, undefined, traceId, duration);
    return NextResponse.json({
      success: true,
      traceId,
      durationMs: Math.round(duration),
      data: updated,
    });
  } catch (err) {
    logger.error(`REST API PUT /api/posts/${id} failed`, err, undefined, traceId);
    return NextResponse.json({ success: false, traceId, error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const traceId = request.headers.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
  const startTime = performance.now();
  const { id } = await context.params;
  const numId = parseInt(id, 10);

  if (isNaN(numId)) {
    return NextResponse.json({ success: false, traceId, error: "Invalid post ID" }, { status: 400 });
  }

  try {
    await initDb(traceId);
    const success = await deletePost(numId, traceId);
    const duration = performance.now() - startTime;

    if (!success) {
      return NextResponse.json({ success: false, traceId, error: "Post not found" }, { status: 404 });
    }

    logger.info(`REST API DELETE /api/posts/${id} succeeded`, undefined, traceId, duration);
    return NextResponse.json({
      success: true,
      traceId,
      durationMs: Math.round(duration),
      message: `Post ${id} deleted successfully`,
    });
  } catch (err) {
    logger.error(`REST API DELETE /api/posts/${id} failed`, err, undefined, traceId);
    return NextResponse.json({ success: false, traceId, error: "Failed to delete post" }, { status: 500 });
  }
}
