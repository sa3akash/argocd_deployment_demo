import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { eq, desc, or, ilike, and, sql } from "drizzle-orm";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";
import { posts, Post, NewPost, CommandStep, comments, Comment, NewComment } from "./schema";
import { logger } from "@/lib/logger";

export * from "./schema";

let pool: Pool | null = null;
let drizzleDb: NodePgDatabase<typeof schema> | null = null;
let isInitialized = false;

// Rich seed posts with multi-step commands
const seedPosts: Post[] = [
  {
    id: 1,
    title: "Zero-Downtime GitOps: Deploying Next.js with ArgoCD & Traefik",
    slug: "zero-downtime-gitops-argocd-traefik",
    excerpt: "A comprehensive guide on deploying autoscaling Next.js 16 applications on Kubernetes using Helm and ArgoCD GitOps.",
    content: "GitOps is an operational framework that takes DevOps best practices used for application development—like version control, collaboration, compliance, and CI/CD—and applies them to infrastructure automation. In this guide, we walk through configuring Traefik Ingress, configuring GitHub Actions for automated GHCR container pushes, and letting ArgoCD handle self-healing zero-downtime rollouts.",
    author: "Shakil Ahmed",
    category: "DevOps",
    tags: "Kubernetes,ArgoCD,Traefik,GitOps,Helm",
    published: true,
    views: 1240,
    likes: 89,
    commentsCount: 2,
    readTime: "4 min read",
    steps: JSON.stringify([
      {
        step: 1,
        title: "Clone the GitOps Repository",
        command: "git clone https://github.com/sa3akash/argocd_deployment_demo.git\ncd argocd_deployment_demo",
        description: "Pull the repository containing Next.js source code, Helm charts, and ArgoCD application manifests.",
      },
      {
        step: 2,
        title: "Create Kubernetes Production Secret",
        command: "kubectl create secret generic nextjs-secrets \\\n  --from-literal=DATABASE_URL=\"postgresql://user:pass@host:5432/blogdb\" \\\n  -n production",
        description: "Securely inject database credentials without committing them to public Git.",
      },
      {
        step: 3,
        title: "Apply ArgoCD Application",
        command: "kubectl apply -f argocd/application-production.yaml",
        description: "Instructs ArgoCD to watch the repository and auto-sync Helm manifests to the production namespace.",
      },
      {
        step: 4,
        title: "Verify Deployment & Ingress Status",
        command: "kubectl get pods -n production\nkubectl get ingress -n production",
        description: "Confirm your Next.js pods are 1/1 Running and Traefik bound your domain.",
      },
    ] as CommandStep[]),
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: 2,
    title: "Type-Safe PostgreSQL with Drizzle ORM in Next.js 16",
    slug: "typesafe-postgres-drizzle-orm-nextjs",
    excerpt: "Learn how to build resilient Server Actions and REST APIs using Drizzle ORM, connection pooling, and in-memory fallbacks.",
    content: "Drizzle ORM is a lightweight TypeScript ORM that lets you write SQL with zero runtime overhead and maximum type safety. Unlike heavy ORMs that require binary engines, Drizzle runs cleanly inside Alpine Docker containers and serverless environments. In this article, we cover pool management, auto-table migrations, and structured request tracing.",
    author: "Dev Team",
    category: "Next.js",
    tags: "Next.js,Drizzle,PostgreSQL,TypeScript",
    published: true,
    views: 856,
    likes: 62,
    commentsCount: 1,
    readTime: "3 min read",
    steps: JSON.stringify([
      {
        step: 1,
        title: "Install Drizzle ORM & PostgreSQL Client",
        command: "bun add drizzle-orm pg\nbun add -d drizzle-kit @types/pg",
        description: "Install Drizzle runtime alongside node-postgres driver and Drizzle Kit CLI.",
      },
      {
        step: 2,
        title: "Define Drizzle Schema",
        command: "cat << 'EOF' > src/db/schema.ts\nimport { pgTable, serial, varchar, text } from 'drizzle-orm/pg-core';\nexport const posts = pgTable('posts', {\n  id: serial('id').primaryKey(),\n  title: varchar('title', { length: 255 }).notNull()\n});\nEOF",
        description: "Write declarative table definitions in pure TypeScript.",
      },
      {
        step: 3,
        title: "Run Next.js Build Verification",
        command: "bun run build",
        description: "Validate all queries, server actions, and API routes compile with strict type checking.",
      },
    ] as CommandStep[]),
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 3,
    title: "Horizontal Pod Autoscaling (HPA) for High Traffic",
    slug: "horizontal-pod-autoscaling-hpa-guide",
    excerpt: "Scale your application from 2 to 5 replicas dynamically based on CPU and memory utilization thresholds.",
    content: "Horizontal Pod Autoscaler (HPA) automatically adjusts the number of pod replicas in a deployment based on observed metrics like CPU and Memory. With Kubernetes metrics-server running, HPA continuously checks utilization against target percentages, keeping your costs low during off-peak hours while handling sudden traffic spikes effortlessly.",
    author: "Platform SRE",
    category: "Architecture",
    tags: "Kubernetes,HPA,Autoscaling,SRE",
    published: true,
    views: 610,
    likes: 41,
    commentsCount: 1,
    readTime: "5 min read",
    steps: JSON.stringify([
      {
        step: 1,
        title: "Check Cluster Metrics Server",
        command: "kubectl top nodes\nkubectl top pods -n production",
        description: "Verify that metrics-server is active and returning CPU/Memory statistics.",
      },
      {
        step: 2,
        title: "Inspect HPA Resource",
        command: "kubectl get hpa -n production",
        description: "View current replica count, minimum/maximum boundaries, and utilization percentages.",
      },
      {
        step: 3,
        title: "Simulate Traffic Load",
        command: "kubectl run load-test --rm -it --image=busybox -- /bin/sh -c \\\n  \"while true; do wget -q -O- https://my.sa3avro.eu.cc; done\"",
        description: "Generate synthetic HTTP load to observe automatic pod scale-out.",
      },
    ] as CommandStep[]),
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
];

const seedComments: Comment[] = [
  {
    id: 1,
    postId: 1,
    author: "DevOps Engineer",
    content: "The wait-for-postgres initContainer approach completely solved our pod crashlooping issue on initial deployments! Huge help.",
    likes: 12,
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 2,
    postId: 1,
    author: "SRE Lead",
    content: "ArgoCD auto-sync combined with Traefik ingress is rock-solid. Zero downtime observed during rollouts.",
    likes: 7,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 3,
    postId: 2,
    author: "Backend Developer",
    content: "Drizzle ORM's lightweight footprint is amazing compared to heavier ORMs. Cold starts dropped significantly.",
    likes: 15,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 4,
    postId: 3,
    author: "Infrastructure Lead",
    content: "The HPA configuration with CPU and Memory thresholds scales up fast when synthetic load is triggered.",
    likes: 5,
    createdAt: new Date(Date.now() - 3600000 * 4),
  },
];

let inMemoryPosts: Post[] = [...seedPosts];
let inMemoryComments: Comment[] = [...seedComments];

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
      // 1. Sync schema using Drizzle ORM migrator
      const drizzleDirs = [
        path.resolve(process.cwd(), "drizzle"),
        path.resolve(process.cwd(), ".next/standalone/drizzle"),
      ];
      const migrationsDir = drizzleDirs.find((d) => fs.existsSync(d));

      if (migrationsDir) {
        await migrate(db, { migrationsFolder: migrationsDir });
        logger.info("Drizzle: Applied migrations via Drizzle migrator", { migrationsDir }, traceId);
      } else {
        // Fallback schema ensure
        await client.query(`
          CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT DEFAULT '' NOT NULL,
            author VARCHAR(100) DEFAULT 'Admin' NOT NULL,
            category VARCHAR(50) DEFAULT 'General' NOT NULL,
            tags TEXT DEFAULT 'DevOps,Cloud' NOT NULL,
            published BOOLEAN DEFAULT true NOT NULL,
            views INTEGER DEFAULT 0 NOT NULL,
            likes INTEGER DEFAULT 0 NOT NULL,
            read_time VARCHAR(50) DEFAULT '3 min read' NOT NULL,
            steps TEXT DEFAULT '[]' NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          );
        `);
      }

      // Seed if empty
      const existing = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(posts);
      if (existing[0]?.count === 0) {
        for (const p of seedPosts) {
          await db.insert(posts).values({
            title: p.title,
            slug: p.slug,
            content: p.content,
            excerpt: p.excerpt,
            author: p.author,
            category: p.category,
            tags: p.tags,
            published: p.published,
            views: p.views,
            likes: p.likes,
            readTime: p.readTime,
            steps: p.steps,
          });
        }
        logger.info("Drizzle: Seeded initial rich blog posts to PostgreSQL", undefined, traceId);
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

export async function syncDatabase(traceId?: string): Promise<{
  success: boolean;
  message: string;
  mode: "postgres" | "in-memory";
  table: string;
  rowCount: number;
  durationMs: number;
}> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (!isPostgres || !db || !pool) {
    return {
      success: true,
      message: "Using in-memory storage (set DATABASE_URL to sync to real PostgreSQL)",
      mode: "in-memory",
      table: "posts",
      rowCount: inMemoryPosts.length,
      durationMs: Math.round(performance.now() - start),
    };
  }

  try {
    const client = await pool.connect();
    try {
      // 1. Sync schema using Drizzle ORM migrator
      const drizzleDirs = [
        path.resolve(process.cwd(), "drizzle"),
        path.resolve(process.cwd(), ".next/standalone/drizzle"),
      ];
      const migrationsDir = drizzleDirs.find((d) => fs.existsSync(d));

      if (migrationsDir) {
        await migrate(db, { migrationsFolder: migrationsDir });
        logger.info("Drizzle: Synced database using Drizzle ORM migrator", { migrationsDir }, traceId);
      } else {
        await client.query(`
          CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT DEFAULT '' NOT NULL,
            author VARCHAR(100) DEFAULT 'Admin' NOT NULL,
            category VARCHAR(50) DEFAULT 'General' NOT NULL,
            tags TEXT DEFAULT 'DevOps,Cloud' NOT NULL,
            published BOOLEAN DEFAULT true NOT NULL,
            views INTEGER DEFAULT 0 NOT NULL,
            likes INTEGER DEFAULT 0 NOT NULL,
            read_time VARCHAR(50) DEFAULT '3 min read' NOT NULL,
            steps TEXT DEFAULT '[]' NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          );
        `);
      }

      const countRes = await client.query("SELECT COUNT(*) FROM posts;");
      const count = parseInt(countRes.rows[0].count, 10);
      const duration = Math.round(performance.now() - start);

      isInitialized = true;
      logger.info("Drizzle ORM: Database schema synchronized successfully", { count, durationMs: duration }, traceId, duration);

      return {
        success: true,
        message: `Drizzle ORM schema synchronized successfully! Table 'posts' verified with ${count} records.`,
        mode: "postgres",
        table: "posts",
        rowCount: count,
        durationMs: duration,
      };
    } finally {

      client.release();
    }
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    logger.error("Database schema sync failed", err, undefined, traceId, duration);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Schema synchronization failed",
      mode: "postgres",
      table: "posts",
      rowCount: 0,
      durationMs: duration,
    };
  }
}

// ---------------- CRUD Operations via Drizzle ORM ----------------

export async function getAllPosts(search?: string, category?: string, includeDrafts = true, traceId?: string): Promise<Post[]> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const conditions = [];

      if (!includeDrafts) {
        conditions.push(eq(posts.published, true));
      }

      if (search) {
        conditions.push(
          or(
            ilike(posts.title, `%${search}%`),
            ilike(posts.content, `%${search}%`),
            ilike(posts.excerpt, `%${search}%`),
            ilike(posts.author, `%${search}%`),
            ilike(posts.tags, `%${search}%`)
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
  if (!includeDrafts) {
    result = result.filter((p) => p.published);
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.content.toLowerCase().includes(s) ||
        p.excerpt.toLowerCase().includes(s) ||
        p.author.toLowerCase().includes(s) ||
        p.tags.toLowerCase().includes(s)
    );
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

export async function getPostBySlug(slug: string, traceId?: string): Promise<Post | null> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
      const duration = performance.now() - start;
      if (result.length === 0) {
        logger.warn(`Drizzle: Post slug ${slug} not found`, undefined, traceId, duration);
        return null;
      }
      return result[0];
    } catch (err) {
      logger.error(`Drizzle: Error querying post by slug ${slug}`, err, undefined, traceId);
    }
  }

  const found = inMemoryPosts.find((p) => p.slug === slug) || null;
  const duration = performance.now() - start;
  logger.info(`Fetched post by slug ${slug} (in-memory)`, { found: !!found }, traceId, duration);
  return found;
}

export async function createPost(
  input: {
    title: string;
    content: string;
    excerpt?: string;
    author?: string;
    category?: string;
    tags?: string;
    published?: boolean;
    readTime?: string;
    steps?: string;
  },
  traceId?: string
): Promise<Post> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();
  const slug = slugify(input.title);
  const author = input.author?.trim() || "Admin";
  const category = input.category?.trim() || "General";
  const tags = input.tags?.trim() || "DevOps,Cloud";
  const excerpt = input.excerpt?.trim() || input.content.slice(0, 160) + "...";
  const published = input.published !== undefined ? input.published : true;
  const readTime = input.readTime || `${Math.max(1, Math.ceil(input.content.split(" ").length / 180))} min read`;
  const steps = input.steps || "[]";

  if (isPostgres && db && isInitialized) {
    try {
      const inserted = await db
        .insert(posts)
        .values({
          title: input.title.trim(),
          slug,
          content: input.content.trim(),
          excerpt,
          author,
          category,
          tags,
          published,
          views: 0,
          likes: 0,
          commentsCount: 0,
          readTime,
          steps,
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
    excerpt,
    author,
    category,
    tags,
    published,
    views: 0,
    likes: 0,
    commentsCount: 0,
    readTime,
    steps,
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
  input: Partial<{
    title: string;
    content: string;
    excerpt: string;
    author: string;
    category: string;
    tags: string;
    published: boolean;
    commentsCount: number;
    readTime: string;
    steps: string;
  }>,
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
      if (updated.length === 0) return null;
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
  return inMemoryPosts.length < initialLen;
}

export async function incrementPostViews(id: number, traceId?: string): Promise<number> {
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const updated = await db
        .update(posts)
        .set({ views: sql`${posts.views} + 1` })
        .where(eq(posts.id, id))
        .returning({ views: posts.views });
      return updated[0]?.views ?? 0;
    } catch (err) {
      logger.error(`Failed to increment views for post ${id}`, err, undefined, traceId);
    }
  }

  const found = inMemoryPosts.find((p) => p.id === id);
  if (found) {
    found.views += 1;
    return found.views;
  }
  return 0;
}

export async function incrementPostLikes(id: number, traceId?: string): Promise<number> {
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const updated = await db
        .update(posts)
        .set({ likes: sql`${posts.likes} + 1` })
        .where(eq(posts.id, id))
        .returning({ likes: posts.likes });
      return updated[0]?.likes ?? 0;
    } catch (err) {
      logger.error(`Failed to increment likes for post ${id}`, err, undefined, traceId);
    }
  }

  const found = inMemoryPosts.find((p) => p.id === id);
  if (found) {
    found.likes += 1;
    return found.likes;
  }
  return 0;
}

export async function getDbHealth(traceId?: string): Promise<{
  status: "connected" | "disconnected";
  mode: "postgres" | "in-memory";
  count: number;
  totalViews: number;
  latencyMs?: number;
}> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized && pool) {
    try {
      const ping = await pool.query("SELECT 1;");
      const stats = await db
        .select({
          count: sql<number>`cast(count(*) as int)`,
          views: sql<number>`cast(coalesce(sum(${posts.views}), 0) as int)`,
        })
        .from(posts);
      const latency = performance.now() - start;
      return {
        status: ping.rowCount ? "connected" : "disconnected",
        mode: "postgres",
        count: stats[0]?.count ?? 0,
        totalViews: stats[0]?.views ?? 0,
        latencyMs: Math.round(latency),
      };
    } catch (err) {
      logger.error("Drizzle: DB Health check failed", err, undefined, traceId);
    }
  }

  const totalViews = inMemoryPosts.reduce((acc, p) => acc + p.views, 0);
  return {
    status: "disconnected",
    mode: "in-memory",
    count: inMemoryPosts.length,
    totalViews,
    latencyMs: Math.round(performance.now() - start),
  };
}

// ---------------- Comments Operations via Drizzle ORM ----------------

export async function getPostComments(postId: number, traceId?: string): Promise<Comment[]> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const results = await db
        .select()
        .from(comments)
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));

      const duration = performance.now() - start;
      logger.info(`Drizzle: Fetched ${results.length} comments for post ${postId}`, undefined, traceId, duration);
      return results;
    } catch (err) {
      logger.error(`Drizzle: Error querying comments for post ${postId}`, err, undefined, traceId);
    }
  }

  const filtered = inMemoryComments
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const duration = performance.now() - start;
  logger.info(`Fetched comments (in-memory) for post ${postId}`, { count: filtered.length }, traceId, duration);
  return filtered;
}

export async function createComment(
  postId: number,
  author: string,
  content: string,
  traceId?: string
): Promise<Comment> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();
  const cleanAuthor = author.trim() || "Anonymous";
  const cleanContent = content.trim();

  if (isPostgres && db && isInitialized) {
    try {
      const inserted = await db
        .insert(comments)
        .values({
          postId,
          author: cleanAuthor,
          content: cleanContent,
          likes: 0,
        })
        .returning();

      // Increment commentsCount in post
      await db
        .update(posts)
        .set({ commentsCount: sql`${posts.commentsCount} + 1` })
        .where(eq(posts.id, postId));

      const duration = performance.now() - start;
      logger.info(`Drizzle: Created comment for post ${postId}`, { id: inserted[0].id }, traceId, duration);
      return inserted[0];
    } catch (err) {
      logger.error(`Drizzle: Error creating comment for post ${postId}`, err, undefined, traceId);
    }
  }

  const newComment: Comment = {
    id: Date.now(),
    postId,
    author: cleanAuthor,
    content: cleanContent,
    likes: 0,
    createdAt: new Date(),
  };

  inMemoryComments.unshift(newComment);
  const targetPost = inMemoryPosts.find((p) => p.id === postId);
  if (targetPost) {
    targetPost.commentsCount = (targetPost.commentsCount || 0) + 1;
  }

  const duration = performance.now() - start;
  logger.info(`Created comment (in-memory) for post ${postId}`, { id: newComment.id }, traceId, duration);
  return newComment;
}

export async function likeComment(commentId: number, traceId?: string): Promise<number> {
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const updated = await db
        .update(comments)
        .set({ likes: sql`${comments.likes} + 1` })
        .where(eq(comments.id, commentId))
        .returning({ likes: comments.likes });
      return updated[0]?.likes ?? 0;
    } catch (err) {
      logger.error(`Failed to like comment ${commentId}`, err, undefined, traceId);
    }
  }

  const found = inMemoryComments.find((c) => c.id === commentId);
  if (found) {
    found.likes += 1;
    return found.likes;
  }
  return 0;
}

export async function deleteComment(commentId: number, traceId?: string): Promise<boolean> {
  const start = performance.now();
  const { db, isPostgres } = getDrizzleDb();

  if (isPostgres && db && isInitialized) {
    try {
      const deleted = await db.delete(comments).where(eq(comments.id, commentId)).returning();
      const duration = performance.now() - start;
      return deleted.length > 0;
    } catch (err) {
      logger.error(`Failed to delete comment ${commentId}`, err, undefined, traceId);
    }
  }

  const initialLen = inMemoryComments.length;
  inMemoryComments = inMemoryComments.filter((c) => c.id !== commentId);
  return inMemoryComments.length < initialLen;
}
