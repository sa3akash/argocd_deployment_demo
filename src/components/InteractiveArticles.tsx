"use client";

import { useState } from "react";
import Link from "next/link";
import { Post } from "@/db";
import { recordPostLike } from "@/lib/actions";

interface Props {
  initialPosts: Post[];
}

export default function InteractiveArticles({ initialPosts }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});

  const categories = ["All", "DevOps", "Kubernetes", "Next.js", "Architecture"];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase()) ||
      (post.tags && post.tags.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" ||
      post.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic toggle
    setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + (likedPosts[postId] ? -1 : 1) } : p
      )
    );

    await recordPostLike(postId);
  };

  return (
    <div className="space-y-8">
      {/* Category Pills & Live Search Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search articles, commands, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Article Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/30 border border-slate-800/80">
          <p className="text-slate-400 text-sm">
            No articles found matching &quot;{search}&quot;. Try another query or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            let stepCount = 0;
            try {
              stepCount = JSON.parse(post.steps || "[]").length;
            } catch {
              stepCount = 0;
            }

            return (
              <article
                key={post.id}
                className="group relative flex flex-col justify-between p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all duration-300 shadow-xl shadow-black/20 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Category & Date Byline */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-semibold tracking-wide">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <span>{post.readTime}</span>
                      <span>•</span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Semantic Heading & Clickable Link */}
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="focus:outline-none focus:underline"
                    >
                      {post.title}
                    </Link>
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt || post.content}
                  </p>

                  {/* Multi-step Runbook Badge */}
                  {stepCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono">
                      <span>⚡</span>
                      <span>{stepCount} Step Command Runbook</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Author & Engagement */}
                <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-[10px] text-white">
                      {post.author.charAt(0)}
                    </div>
                    <span className="text-slate-300 font-medium text-[11px]">
                      {post.author}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]" title="Article Views">
                      <span>👁️</span>
                      <span>{post.views}</span>
                    </span>

                    <button
                      onClick={(e) => handleLike(e, post.id)}
                      className={`flex items-center gap-1 text-[11px] transition-all ${
                        likedPosts[post.id]
                          ? "text-rose-400 font-bold scale-110"
                          : "hover:text-rose-400"
                      }`}
                      title="Like this article"
                    >
                      <span>❤️</span>
                      <span>{post.likes}</span>
                    </button>

                    <Link
                      href={`/posts/${post.slug}#comments`}
                      className="flex items-center gap-1 text-[11px] hover:text-indigo-400"
                      title="Discussion comments"
                    >
                      <span>💬</span>
                      <span>{post.commentsCount || 0}</span>
                    </Link>

                    <Link
                      href={`/posts/${post.slug}`}
                      className="ml-1 p-1 rounded-md text-indigo-400 hover:text-white hover:bg-indigo-600/30 transition-all font-bold"
                      title="Read Article"
                    >
                      →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
