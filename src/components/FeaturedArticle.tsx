import Link from "next/link";
import { Post, CommandStep } from "@/db";

interface Props {
  post: Post;
}

export default function FeaturedArticle({ post }: Props) {
  let steps: CommandStep[] = [];
  try {
    steps = JSON.parse(post.steps || "[]");
  } catch {
    steps = [];
  }

  return (
    <section id="featured" aria-labelledby="featured-heading" className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h2 id="featured-heading" className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Featured Cover Publication
          </h2>
        </div>
        <span className="text-xs text-slate-500">Editor&apos;s Pick</span>
      </div>

      <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-[#0b0f19] border border-indigo-500/30 p-8 sm:p-10 shadow-2xl shadow-indigo-950/30 transition-all duration-300 hover:border-indigo-500/50">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/20 transition-all" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30">
                {post.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 font-medium">
                {post.readTime}
              </span>
              <span className="text-slate-500">
                Published {new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight group-hover:text-indigo-200 transition-colors">
              <Link href={`/posts/${post.slug}`} className="focus:outline-none focus:underline">
                {post.title}
              </Link>
            </h3>

            {/* Excerpt */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
              {post.excerpt || post.content}
            </p>

            {/* Author Byline & Metrics */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-white shadow-md">
                  {post.author.charAt(0)}
                </div>
                <div>
                  <span className="font-semibold text-white block">
                    {post.author}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Lead Systems & SRE Architect
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
                <span className="flex items-center gap-1.5" title="Total Views">
                  <span>👁️</span>
                  <span>{post.views.toLocaleString()} reads</span>
                </span>
                <span className="flex items-center gap-1.5" title="Reactions">
                  <span>❤️</span>
                  <span>{post.likes} reactions</span>
                </span>
                <span className="flex items-center gap-1.5" title="Comments">
                  <span>💬</span>
                  <span>{post.commentsCount || 0} comments</span>
                </span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-3">
              <Link
                href={`/posts/${post.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all hover:scale-102 active:scale-98"
              >
                <span>Read Full Technical Publication</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Side Box: Quick Runbook Highlights */}
          <div className="lg:col-span-4 bg-black/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
                <span>⚡</span>
                <span>Runbook Preview</span>
              </span>
              <span className="text-slate-500 text-[11px]">
                {steps.length} Production Steps
              </span>
            </div>

            <div className="space-y-2">
              {steps.slice(0, 3).map((st) => (
                <div key={st.step} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
                  <div className="text-[11px] font-bold text-slate-200">
                    Step {st.step}: {st.title}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-emerald-400 truncate">
                    $ {st.command}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/#runbooks"
              className="block text-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-1"
            >
              Open Interactive CLI Runner ↓
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
