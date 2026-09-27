import { pgTable, serial, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export interface CommandStep {
  step: number;
  title: string;
  command: string;
  description?: string;
}

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").default("").notNull(),
  author: varchar("author", { length: 100 }).default("Admin").notNull(),
  category: varchar("category", { length: 50 }).default("General").notNull(),
  tags: text("tags").default("DevOps,Cloud").notNull(),
  published: boolean("published").default(true).notNull(),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  readTime: varchar("read_time", { length: 50 }).default("3 min read").notNull(),
  steps: text("steps").default("[]").notNull(), // JSON array string of CommandStep[]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  author: varchar("author", { length: 100 }).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
