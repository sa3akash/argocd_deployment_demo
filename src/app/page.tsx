import { getBlogPosts, fetchDbHealth } from "@/lib/actions";
import BlogManager from "@/components/BlogManager";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { posts, traceId } = await getBlogPosts();
  const health = await fetchDbHealth();

  return (
    <BlogManager
      initialPosts={posts}
      initialHealth={health}
      initialTraceId={traceId}
    />
  );
}
