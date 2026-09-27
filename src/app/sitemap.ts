import { MetadataRoute } from "next";
import { getAllPosts, initDb, Post } from "@/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://my.sa3avro.eu.cc";

  let posts: Post[] = [];
  try {
    await initDb();
    posts = await getAllPosts(undefined, undefined, false);
  } catch {
    posts = [];
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...postEntries,
  ];
}
