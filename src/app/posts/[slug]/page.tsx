import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSinglePostBySlug, getSinglePost, fetchPostComments, recordPostView } from "@/lib/actions";
import { CommandStep } from "@/db";
import PostEngagement from "@/components/PostEngagement";
import CopyButton from "@/components/CopyButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let { post } = await getSinglePostBySlug(slug);

  if (!post && !isNaN(Number(slug))) {
    const res = await getSinglePost(Number(slug));
    post = res.post;
  }

  if (!post) {
    return {
      title: "Article Not Found",
      description: "The requested technical article could not be found.",
    };
  }

  const tags = post.tags ? post.tags.split(",").map((t) => t.trim()) : [];

  return {
    title: post.title,
    description: post.excerpt || post.content.slice(0, 160),
    keywords: tags,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `/posts/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.slice(0, 160),
      url: `/posts/${post.slug}`,
      type: "article",
      publishedTime: new Date(post.createdAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [post.author],
      tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.content.slice(0, 160),
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  let { post } = await getSinglePostBySlug(slug);

  if (!post && !isNaN(Number(slug))) {
    const res = await getSinglePost(Number(slug));
    post = res.post;
  }

  if (!post) {
    notFound();
  }

  // Record view count
  await recordPostView(post.id);

  // Fetch comments
  const { comments } = await fetchPostComments(post.id);

  let steps: CommandStep[] = [];
  try {
    steps = JSON.parse(post.steps || "[]");
  } catch {
    steps = [];
  }

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: post.title,
    description: post.excerpt || post.content.slice(0, 160),
    author: {
      "@type": "Person",
      name: post.author,
    },
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    publisher: {
      "@type": "Organization",
      name: "CloudOps Engineering Journal",
      url: "https://my.sa3avro.eu.cc",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://my.sa3avro.eu.cc/posts/${post.slug}`,
    },
    keywords: post.tags,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#030712] text-slate-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto space-y-8">
          {/* Breadcrumbs & Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400">
            <Link
              href="/"
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <span>← Back to Journal</span>
            </Link>
            <span>/</span>
            <span className="text-indigo-400 font-semibold">{post.category}</span>
          </nav>

          {/* Article Header */}
          <header className="space-y-4 pb-6 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                {post.category}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{post.readTime}</span>
              <span className="text-xs text-slate-500">•</span>
              <time dateTime={new Date(post.createdAt).toISOString()} className="text-xs text-slate-400">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Author & Stats Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-indigo-500/20">
                  {post.author.charAt(0)}
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-200">{post.author}</span>
                  <span className="block text-[11px] text-slate-400">Cloud & Platform Engineer</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                <span title="Views">👁️ {post.views}</span>
                <span>•</span>
                <span title="Likes">❤️ {post.likes}</span>
                <span>•</span>
                <span title="Comments">💬 {comments.length}</span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm sm:text-base space-y-5">
            <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
              {post.excerpt || post.content.slice(0, 180)}
            </p>
            <p className="whitespace-pre-line">{post.content}</p>
          </div>

          {/* Multi-Step Execution Sequence */}
          {steps.length > 0 && (
            <section className="mt-8 pt-8 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>⚡ Interactive Execution Sequence</span>
                </h2>
                <span className="text-xs text-indigo-400 font-mono">{steps.length} Steps</span>
              </div>

              <div className="space-y-4">
                {steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-indigo-300">
                        Step {st.step}: {st.title}
                      </span>
                      <CopyButton text={st.command} />
                    </div>

                    {st.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">{st.description}</p>
                    )}

                    <pre className="p-3 sm:p-4 rounded-xl bg-black border border-slate-800 font-mono text-[11px] sm:text-xs text-emerald-400 overflow-x-auto">
                      <code>{st.command}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Interactive Likes & Discussion (Client Island) */}
          <PostEngagement
            postId={post.id}
            initialLikes={post.likes}
            initialComments={comments}
          />

          {/* Footer Navigation */}
          <footer className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 transition-all"
            >
              <span>← All Articles</span>
            </Link>

            <span className="text-[11px] text-slate-500 font-mono">
              Next.js 16 • Drizzle ORM • GitOps
            </span>
          </footer>
        </article>
      </div>
    </>
  );
}
