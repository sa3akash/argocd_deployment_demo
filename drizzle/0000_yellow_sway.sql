CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"author" varchar(100) DEFAULT 'Admin' NOT NULL,
	"category" varchar(50) DEFAULT 'General' NOT NULL,
	"tags" text DEFAULT 'DevOps,Cloud' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"read_time" varchar(50) DEFAULT '3 min read' NOT NULL,
	"steps" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
