import { getBlogPosts, fetchDbHealth } from "@/lib/actions";
import Navbar from "@/components/Navbar";
import FeaturedArticle from "@/components/FeaturedArticle";
import InteractiveArticles from "@/components/InteractiveArticles";
import InteractiveRunbooks from "@/components/InteractiveRunbooks";
import EcosystemResources from "@/components/EcosystemResources";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { posts, traceId } = await getBlogPosts();
  const health = await fetchDbHealth();

  const featuredPost = posts[0];
  const postsWithSteps = posts.filter((p) => p.steps && p.steps !== "[]");
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CloudOps & GitOps Engineering Journal",
    url: "https://my.sa3avro.eu.cc",
    description:
      "Enterprise DevOps, Kubernetes Autoscaling (HPA), ArgoCD GitOps, Drizzle ORM migrations, and Next.js 16 Tutorials.",
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
    <div className="min-h-screen bg-[#05070e] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Top Navbar */}
      <Navbar health={health} posts={posts} traceId={traceId} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Hero Section with SEO H1 Heading */}
        <section className="text-center sm:text-left space-y-5 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Production Edition 2026 • Automated with ArgoCD</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            The CloudOps &amp; Modern GitOps Journal
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-3xl leading-relaxed">
            Architectural breakdowns, automated Kubernetes deployment pipelines,
            type-safe Drizzle ORM migrations, and resilient cloud-native engineering.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Reads
              </span>
              <span className="text-2xl font-black text-indigo-400 mt-1 block">
                {totalViews.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Published Articles
              </span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block">
                {posts.length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Database Engine
              </span>
              <span className="text-sm font-bold text-emerald-400 mt-2 block">
                {health.mode === "postgres" ? "PostgreSQL 16" : "In-Memory"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Deployment Mode
              </span>
              <span className="text-sm font-bold text-indigo-300 mt-2 block">
                ArgoCD GitOps
              </span>
            </div>
          </div>
        </section>

        {/* Featured Cover Story */}
        {featuredPost && <FeaturedArticle post={featuredPost} />}

        {/* Latest Technical Publications Grid (with H2 Heading and internal links) */}
        <section id="articles" aria-labelledby="latest-articles-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-400">
                Technical Dispatches
              </span>
              <h2
                id="latest-articles-heading"
                className="text-2xl font-bold tracking-tight text-white mt-1"
              >
                Latest Engineering Publications
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Explore tutorials, post-mortems, and deployment guides.
            </p>
          </div>

          <InteractiveArticles initialPosts={posts} />
        </section>

        {/* Interactive Production Runbooks Section (with H2 Heading) */}
        {postsWithSteps.length > 0 && (
          <section id="runbooks" aria-labelledby="runbooks-heading" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-400">
                  Interactive CLI
                </span>
                <h2
                  id="runbooks-heading"
                  className="text-2xl font-bold tracking-tight text-white mt-1"
                >
                  Production Runbooks &amp; Command Sequences
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Follow hands-on command sequences directly inside your terminal.
              </p>
            </div>

            <InteractiveRunbooks postsWithSteps={postsWithSteps} />
          </section>
        )}

        {/* Cloud Native Ecosystem & Authoritative References (with H2 Heading and external links) */}
        <EcosystemResources />
      </main>

      {/* Semantic Footer with Internal and External Links */}
      <Footer />
    </div>
  );
}
