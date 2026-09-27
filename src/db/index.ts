import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, or, ilike, and, sql } from "drizzle-orm";
import * as schema from "./schema";
import { posts, Post, NewPost } from "./schema";
import { logger } from "@/lib/logger";

export * from "./schema";

let pool: Pool | null = null;
let drizzleDb: NodePgDatabase<typeof schema> | null = null;
let isInitialized = false;

// Fallback in-memory posts if DATABASE_URL is not set
let inMemoryPosts: Post[] = [
  {
    id: 1,
    title: "Deploying Next.js with Kubernetes, Helm, and ArgoCD",
    slug: "deploying-nextjs-with-kubernetes-helm-and-argocd",
    content: "GitOps deployment pipelines using GitHub Actions, Helm charts, and ArgoCD on Kubernetes.",
    author: "Shakil Ahmed",
    category: "DevOps",
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 2,
    title: "Drizzle ORM with Next.js 16 Server Actions",
    slug: "drizzle-orm-with-nextjs-16-server-actions",
    content: "Drizzle ORM provides lightweight, type-safe SQL queries without heavy runtime overhead.",
    author: "Dev Team",
    category: "Next.js",
    published: true,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 3,
    title: "Request Tracing and Observability with Correlation IDs",
    slug: "request-tracing-and-observability",
    content: "Structured logging with unique trace IDs (x-trace-id) enables easy tracking of requests.",
    author: "Platform SRE",
    category: "Architecture",
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

export function getDrizzleDb(): { db: NodePgDatabase<typeof schema> | null; isPostgres: boolean } {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { db: null, isPostgres: false };
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl:
        connectionString.includes("sslmode=require") ||
        connectionString.includes("neon.tech") ||
        connectionString.includes("supabase.co")
          ? { rejectUnauthorized: false }
          : false,
    });

    pool.on("error", (err) => {
      logger.error("Unexpected error on idle PostgreSQL client", err);
    });

    drizzleDb = drizzle(pool, { schema });
  }

  return { db: drizzleDb, isPostgres: true };
}

export async function initDb(traceId?: string): Promise<{ connected: boolean; mode: "postgres" | "in-memory"; error?: string }> {
  const { db, isPostgres } = getDrizzleDb();
  if (!isPostgres || !db || !pool) {
    logger.warn("DATABASE_URL is not set. Running in in-memory mode.", undefined, traceId);
    return { connected: false, mode: "in-memory" };
  }

  if (isInitialized) {
    return { connected: true, mode: "postgres" };
  }

  const start = performance.now();
  try {
    const client = await pool.connect();
    try {
      // Auto-create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          content TEXT NOT NULL,
          author VARCHAR(100) DEFAULT 'Admin' NOT NULL,
          category VARCHAR(50) DEFAULT 'General' NOT NULL,
          published BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);

      // Seed initial sample data if table is empty
      const existing = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(posts);
      if (existing[0]?.count === 0) {
        for (const p of inMemoryPosts) {
          await db.insert(posts).values({
            title: p.title,
            slug: p.slug,
            content: p.content,
            author: p.author,
            category: p.category,
            published: p.published,
          });
        }
        logger.info("Drizzle: Seeded initial blog posts to PostgreSQL", undefined, traceId);
      }

      isInitialized = true;
      const duration = performance.now() - start;
      logger.info("Connected to PostgreSQL via Drizzle ORM", { durationMs: duration }, traceId, duration);
      return { connected: true, mode: "postgres" };
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error("Failed to connect to PostgreSQL with Drizzle ORM", err, undefined, traceId);
    return { connected: false, mode: "in-memory", error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------- CRUD Operations via Drizzle ORM ----------------

export async function getAllPosts(search?: string, category?: string, traceId?: string): Promise<Post[]> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(posts.title, `%${search}%`),
            ilike(posts.content, `%${search}%`),
            ilike(posts.author, `%${search}%`)
          )
        );
      }

      if (category && category !== "All") {
        conditions.push(eq(posts.category, category));
      }

      const query = db
        .select()
        .from(posts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(posts.createdAt));

      const result = await query;
      const duration = performance.now() - start;
      logger.info("Drizzle: Fetched posts from PostgreSQL", { count: result.length, search, category }, traceId, duration);
      return result;
    } catch (err) {
      logger.error("Drizzle: Error fetching posts from PostgreSQL, using fallback", err, undefined, traceId);
    }
  }

  // In-memory fallback
  let result = [...inMemoryPosts];
  if (search) {
    const s = search.toLowerCase();
    result = result.filter((p) => p.title.toLowerCase().includes(s) || p.content.toLowerCase().includes(s));
  }
  if (category && category !== "All") {
    result = result.filter((p) => p.category === category);
  }

  const duration = performance.now() - start;
  logger.info("Fetched posts (in-memory mode)", { count: result.length, search, category }, traceId, duration);
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPostById(id: number, traceId?: string): Promise<Post | null> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      const duration = performance.now() - start;
      if (result.length === 0) {
        logger.warn(`Drizzle: Post id ${id} not found`, undefined, traceId, duration);
        return null;
      }
      logger.info(`Drizzle: Post id ${id} found`, undefined, traceId, duration);
      return result[0];
    } catch (err) {
      logger.error(`Drizzle: Error querying post ${id}`, err, undefined, traceId);
    }
  }

  const found = inMemoryPosts.find((p) => p.id === id) || null;
  const duration = performance.now() - start;
  logger.info(`Fetched post id ${id} (in-memory)`, { found: !!found }, traceId, duration);
  return found;
}

export async function createPost(
  input: { title: string; content: string; author?: string; category?: string; published?: boolean },
  traceId?: string
): Promise<Post> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();
  const slug = slugify(input.title);
  const author = input.author?.trim() || "Admin";
  const category = input.category?.trim() || "General";
  const published = input.published !== undefined ? input.published : true;

  if (isPostgres && db && isInitialized) {
    try {
      const inserted = await db
        .insert(posts)
        .values({
          title: input.title.trim(),
          slug,
          content: input.content.trim(),
          author,
          category,
          published,
        })
        .returning();

      const duration = performance.now() - start;
      logger.info("Drizzle: Created post in PostgreSQL", { id: inserted[0].id, title: input.title }, traceId, duration);
      return inserted[0];
    } catch (err) {
      logger.error("Drizzle: Failed to insert post into PostgreSQL", err, undefined, traceId);
    }
  }

  const newPost: Post = {
    id: Date.now(),
    title: input.title,
    slug,
    content: input.content,
    author,
    category,
    published,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryPosts.unshift(newPost);
  const duration = performance.now() - start;
  logger.info("Created post (in-memory)", { id: newPost.id, title: newPost.title }, traceId, duration);
  return newPost;
}

export async function updatePost(
  id: number,
  input: Partial<{ title: string; content: string; author: string; category: string; published: boolean }>,
  traceId?: string
): Promise<Post | null> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const updated = await db
        .update(posts)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, id))
        .returning();

      const duration = performance.now() - start;
      if (updated.length === 0) {
        logger.warn(`Drizzle: Post id ${id} not found for update`, undefined, traceId, duration);
        return null;
      }
      logger.info(`Drizzle: Updated post id ${id} in PostgreSQL`, undefined, traceId, duration);
      return updated[0];
    } catch (err) {
      logger.error(`Drizzle: Failed to update post ${id}`, err, undefined, traceId);
    }
  }

  const idx = inMemoryPosts.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  inMemoryPosts[idx] = {
    ...inMemoryPosts[idx],
    ...input,
    updatedAt: new Date(),
  };

  const duration = performance.now() - start;
  logger.info(`Updated post id ${id} (in-memory)`, undefined, traceId, duration);
  return inMemoryPosts[idx];
}

export async function deletePost(id: number, traceId?: string): Promise<boolean> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const deleted = await db.delete(posts).where(eq(posts.id, id)).returning();
      const duration = performance.now() - start;
      const success = deleted.length > 0;
      logger.info(`Drizzle: Deleted post id ${id} from PostgreSQL`, { success }, traceId, duration);
      return success;
    } catch (err) {
      logger.error(`Drizzle: Failed to delete post ${id}`, err, undefined, traceId);
    }
  }

  const initialLen = inMemoryPosts.length;
  inMemoryPosts = inMemoryPosts.filter((p) => p.id !== id);
  const success = inMemoryPosts.length < initialLen;
  const duration = performance.now() - start;
  logger.info(`Deleted post id ${id} (in-memory)`, { success }, traceId, duration);
  return success;
}

export async function getDbHealth(traceId?: string): Promise<{
  status: "connected" | "disconnected";
  mode: "postgres" | "in-memory";
  count: number;
  latencyMs?: number;
}> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized && pool) {
    try {
      const ping = await pool.query("SELECT 1;");
      const countRes = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(posts);
      const latency = performance.now() - start;
      return {
        status: ping.rowCount ? "connected" : "disconnected",
        mode: "postgres",
        count: countRes[0]?.count ?? 0,
        latencyMs: Math.round(latency),
      };
    } catch (err) {
      logger.error("Drizzle: DB Health check failed", err, undefined, traceId);
    }
  }

  return {
    status: "disconnected",
    mode: "in-memory",
    count: inMemoryPosts.length,
    latencyMs: Math.round(performance.now() - start),
  };
}
