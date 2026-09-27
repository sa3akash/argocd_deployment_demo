import { getBlogPosts, fetchDbHealth } from "@/lib/actions";
import BlogManager from "@/components/BlogManager";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { posts, traceId } = await getBlogPosts();
  const health = await fetchDbHealth();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CloudOps & GitOps Engineering Journal",
    url: "https://my.sa3avro.eu.cc",
    description:
      "Enterprise DevOps, Kubernetes Autoscaling, ArgoCD GitOps, and Next.js 16 Tutorials",
    publisher: {
      "@type": "Organization",
      name: "CloudOps Engineering",
      url: "https://my.sa3avro.eu.cc",
    },
    hasPart: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://my.sa3avro.eu.cc/posts/${p.slug}`,
      datePublished: p.createdAt,
      author: {
        "@type": "Person",
        name: p.author,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <BlogManager
        initialPosts={posts}
        initialHealth={health}
        initialTraceId={traceId}
      />
    </>
  );
}
