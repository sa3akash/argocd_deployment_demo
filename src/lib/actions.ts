"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  initDb,
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getDbHealth,
  Post,
} from "./db";
import { logger } from "./logger";

async function getTraceId(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
}

export async function getBlogPosts(search?: string, category?: string): Promise<{ posts: Post[]; traceId: string }> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const posts = await getAllPosts(search, category, traceId);
  return { posts, traceId };
}

export async function getSinglePost(id: number): Promise<{ post: Post | null; traceId: string }> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const post = await getPostById(id, traceId);
  return { post, traceId };
}

export async function createNewPost(formData: FormData): Promise<{ success: boolean; post?: Post; error?: string; traceId: string }> {
  const traceId = await getTraceId();
  try {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const author = (formData.get("author") as string) || "Admin";
    const category = (formData.get("category") as string) || "General";

    if (!title || !title.trim()) {
      return { success: false, error: "Title is required", traceId };
    }
    if (!content || !content.trim()) {
      return { success: false, error: "Content is required", traceId };
    }

    await initDb(traceId);
    const post = await createPost(
      {
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        category: category.trim(),
        published: true,
      },
      traceId
    );

    logger.info("Server Action createNewPost succeeded", { id: post.id, title: post.title }, traceId);
    revalidatePath("/");
    return { success: true, post, traceId };
  } catch (err) {
    logger.error("Server Action createNewPost failed", err, undefined, traceId);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create post",
      traceId,
    };
  }
}

export async function updateExistingPost(
  id: number,
  formData: FormData
): Promise<{ success: boolean; post?: Post; error?: string; traceId: string }> {
  const traceId = await getTraceId();
  try {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const author = formData.get("author") as string;
    const category = formData.get("category") as string;

    await initDb(traceId);
    const updated = await updatePost(
      id,
      {
        title: title ? title.trim() : undefined,
        content: content ? content.trim() : undefined,
        author: author ? author.trim() : undefined,
        category: category ? category.trim() : undefined,
      },
      traceId
    );

    if (!updated) {
      return { success: false, error: "Post not found", traceId };
    }

    logger.info("Server Action updateExistingPost succeeded", { id }, traceId);
    revalidatePath("/");
    return { success: true, post: updated, traceId };
  } catch (err) {
    logger.error(`Server Action updateExistingPost failed for id ${id}`, err, undefined, traceId);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update post",
      traceId,
    };
  }
}

export async function deleteExistingPost(id: number): Promise<{ success: boolean; error?: string; traceId: string }> {
  const traceId = await getTraceId();
  try {
    await initDb(traceId);
    const success = await deletePost(id, traceId);
    logger.info("Server Action deleteExistingPost completed", { id, success }, traceId);
    revalidatePath("/");
    return { success, traceId };
  } catch (err) {
    logger.error(`Server Action deleteExistingPost failed for id ${id}`, err, undefined, traceId);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete post",
      traceId,
    };
  }
}

export async function fetchDbHealth(): Promise<{
  status: "connected" | "disconnected";
  mode: "postgres" | "in-memory";
  count: number;
  latencyMs?: number;
  traceId: string;
}> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const health = await getDbHealth(traceId);
  return { ...health, traceId };
}
