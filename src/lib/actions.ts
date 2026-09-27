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
  incrementPostViews,
  incrementPostLikes,
  getDbHealth,
  syncDatabase,
  getPostComments,
  createComment,
  likeComment,
  Post,
  Comment,
} from "@/db";
import { logger } from "./logger";

async function getTraceId(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-trace-id") || `tr_${Date.now().toString(36)}`;
}

export async function getBlogPosts(search?: string, category?: string, includeDrafts = true): Promise<{ posts: Post[]; traceId: string }> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const posts = await getAllPosts(search, category, includeDrafts, traceId);
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
    const excerpt = (formData.get("excerpt") as string) || "";
    const author = (formData.get("author") as string) || "Admin";
    const category = (formData.get("category") as string) || "General";
    const tags = (formData.get("tags") as string) || "DevOps,Cloud";
    const published = formData.get("published") === "true";
    const steps = (formData.get("steps") as string) || "[]";

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
        excerpt: excerpt.trim() || content.trim().slice(0, 160) + "...",
        author: author.trim(),
        category: category.trim(),
        tags: tags.trim(),
        published,
        steps,
      },
      traceId
    );

    logger.info("Server Action: Created post", { id: post.id, title: post.title }, traceId);
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
    const excerpt = formData.get("excerpt") as string;
    const author = formData.get("author") as string;
    const category = formData.get("category") as string;
    const tags = formData.get("tags") as string;
    const published = formData.has("published") ? formData.get("published") === "true" : undefined;
    const steps = formData.get("steps") as string;

    await initDb(traceId);
    const updated = await updatePost(
      id,
      {
        title: title ? title.trim() : undefined,
        content: content ? content.trim() : undefined,
        excerpt: excerpt !== undefined ? excerpt.trim() : undefined,
        author: author ? author.trim() : undefined,
        category: category ? category.trim() : undefined,
        tags: tags ? tags.trim() : undefined,
        published,
        steps: steps !== undefined ? steps : undefined,
      },
      traceId
    );

    if (!updated) {
      return { success: false, error: "Post not found", traceId };
    }

    logger.info(`Server Action: Updated post ${id}`, undefined, traceId);
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
    logger.info(`Server Action: Deleted post ${id}`, { success }, traceId);
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

export async function recordPostView(id: number): Promise<{ views: number; traceId: string }> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const views = await incrementPostViews(id, traceId);
  return { views, traceId };
}

export async function recordPostLike(id: number): Promise<{ likes: number; traceId: string }> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const likes = await incrementPostLikes(id, traceId);
  return { likes, traceId };
}

export async function fetchDbHealth(): Promise<{
  status: "connected" | "disconnected";
  mode: "postgres" | "in-memory";
  count: number;
  totalViews: number;
  latencyMs?: number;
  traceId: string;
}> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const health = await getDbHealth(traceId);
  return { ...health, traceId };
}

export async function syncDatabaseAction(): Promise<{
  success: boolean;
  message: string;
  mode: "postgres" | "in-memory";
  rowCount: number;
  durationMs: number;
  traceId: string;
}> {
  const traceId = await getTraceId();
  const res = await syncDatabase(traceId);
  revalidatePath("/");
  return { ...res, traceId };
}

export async function fetchPostComments(postId: number): Promise<{ comments: Comment[]; traceId: string }> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const comments = await getPostComments(postId, traceId);
  return { comments, traceId };
}

export async function addCommentToPost(
  postId: number,
  author: string,
  content: string
): Promise<{ success: boolean; comment?: Comment; error?: string; traceId: string }> {
  const traceId = await getTraceId();
  if (!content || !content.trim()) {
    return { success: false, error: "Comment content cannot be empty", traceId };
  }
  await initDb(traceId);
  const comment = await createComment(postId, author, content, traceId);
  revalidatePath("/");
  return { success: true, comment, traceId };
}

export async function recordCommentLike(commentId: number): Promise<{ likes: number; traceId: string }> {
  const traceId = await getTraceId();
  await initDb(traceId);
  const likes = await likeComment(commentId, traceId);
  return { likes, traceId };
}
