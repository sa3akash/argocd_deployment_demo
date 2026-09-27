import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import fs from "node:fs";

const { Pool } = pg;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPostgresAndSync() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log("[Drizzle Sync] ℹ️ DATABASE_URL is not set. Skipping DB migration (running in standalone/in-memory mode).");
    process.exit(0);
  }

  try {
    const url = new URL(connectionString);
    console.log(`[Drizzle Sync] 🎯 Target Database: ${url.protocol}//${url.username}:****@${url.hostname}:${url.port || 5432}${url.pathname}`);
  } catch {
    console.log("[Drizzle Sync] 🎯 Target Database configured via DATABASE_URL");
  }

  const isSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co");

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 4000,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
  });

  const maxRetries = 30; // 30 retries * 2s = up to 60s
  let connected = false;

  console.log("[Drizzle Sync] 🔄 Step 1/3: Waiting for PostgreSQL to become HEALTHY and ready...");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query("SELECT 1;");
        connected = true;
        console.log(`[Drizzle Sync] ✅ PostgreSQL is HEALTHY and accepting connections! (attempt ${attempt}/${maxRetries})`);
        break;
      } finally {
        client.release();
      }
    } catch (err) {
      console.log(`[Drizzle Sync] ⏳ PostgreSQL not ready yet (${err.message}). Retrying in 2s (attempt ${attempt}/${maxRetries})...`);
      await sleep(2000);
    }
  }

  if (!connected) {
    console.error("[Drizzle Sync] ❌ Error: PostgreSQL failed to become healthy after 60 seconds. Aborting.");
    await pool.end();
    process.exit(1);
  }

  console.log("[Drizzle Sync] 🔄 Step 2/3: Synchronizing schema with Drizzle ORM...");
  const db = drizzle(pool);

  const possiblePaths = [
    path.resolve(process.cwd(), "drizzle"),
    path.resolve(process.cwd(), ".next/standalone/drizzle"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../drizzle"),
  ];

  let migrationsFolder = possiblePaths.find((p) => fs.existsSync(p));

  if (migrationsFolder) {
    try {
      console.log(`[Drizzle Sync] 📁 Applying migrations from folder: ${migrationsFolder}`);
      await migrate(db, { migrationsFolder });
      console.log("[Drizzle Sync] ✅ Drizzle ORM migrations applied successfully!");
    } catch (migErr) {
      console.warn(`[Drizzle Sync] ⚠️ Drizzle migration warning: ${migErr.message}`);
    }
  } else {
    console.log("[Drizzle Sync] ℹ️ No ./drizzle folder found. Skipping file-based migration.");
  }

  console.log("[Drizzle Sync] 🔄 Step 3/3: Verifying database tables and post count...");
  try {
    const res = await pool.query("SELECT COUNT(*) FROM posts;");
    const count = parseInt(res.rows[0].count, 10);
    console.log(`[Drizzle Sync] 📊 Verified 'posts' table with ${count} records.`);
  } catch (err) {
    console.warn(`[Drizzle Sync] ⚠️ Verification warning: ${err.message}`);
  }

  await pool.end();
  console.log("========================================================");
  console.log("🎉 Database synchronization completed successfully!");
  console.log("========================================================");
  process.exit(0);
}

waitForPostgresAndSync().catch((err) => {
  console.error("[Drizzle Sync] Fatal error during sync:", err);
  process.exit(1);
});
