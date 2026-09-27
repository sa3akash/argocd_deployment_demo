import { NextRequest, NextResponse } from "next/server";
import { initDb, getAllPosts, createPost } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const traceId = request.headers.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
  const startTime = performance.now();
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;

  try {
    await initDb(traceId);
    const posts = await getAllPosts(search, category, traceId);
    const duration = performance.now() - startTime;

    logger.info("REST API GET /api/posts", { count: posts.length, durationMs: duration }, traceId, duration);

    return NextResponse.json(
      {
        success: true,
        traceId,
        count: posts.length,
        durationMs: Math.round(duration),
        data: posts,
      },
      {
        status: 200,
        headers: {
          "x-trace-id": traceId,
          "x-response-time": `${Math.round(duration)}ms`,
        },
      }
    );
  } catch (err) {
    logger.error("REST API GET /api/posts error", err, undefined, traceId);
    return NextResponse.json(
      { success: false, traceId, error: "Internal Server Error" },
      { status: 500, headers: { "x-trace-id": traceId } }
    );
  }
}

export async function POST(request: NextRequest) {
  const traceId = request.headers.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
  const startTime = performance.now();

  try {
    const body = await request.json();
    const { title, content, author, category, published } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, traceId, error: "Title is required" },
        { status: 400, headers: { "x-trace-id": traceId } }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, traceId, error: "Content is required" },
        { status: 400, headers: { "x-trace-id": traceId } }
      );
    }

    await initDb(traceId);
    const post = await createPost(
      {
        title: title.trim(),
        content: content.trim(),
        author: typeof author === "string" ? author.trim() : "API User",
        category: typeof category === "string" ? category.trim() : "General",
        published: published !== undefined ? Boolean(published) : true,
      },
      traceId
    );

    const duration = performance.now() - startTime;
    logger.info("REST API POST /api/posts created post", { id: post.id }, traceId, duration);

    return NextResponse.json(
      {
        success: true,
        traceId,
        durationMs: Math.round(duration),
        data: post,
      },
      {
        status: 201,
        headers: {
          "x-trace-id": traceId,
          "x-response-time": `${Math.round(duration)}ms`,
        },
      }
    );
  } catch (err) {
    logger.error("REST API POST /api/posts error", err, undefined, traceId);
    return NextResponse.json(
      { success: false, traceId, error: "Invalid JSON or server error" },
      { status: 500, headers: { "x-trace-id": traceId } }
    );
  }
}
