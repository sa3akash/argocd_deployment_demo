"use client";

import { useState, useTransition } from "react";
import { Post } from "@/lib/db";
import { createNewPost, updateExistingPost, deleteExistingPost } from "@/lib/actions";

interface Props {
  initialPosts: Post[];
  initialHealth: {
    status: "connected" | "disconnected";
    mode: "postgres" | "in-memory";
    count: number;
    latencyMs?: number;
  };
  initialTraceId: string;
}

export default function BlogManager({ initialPosts, initialHealth, initialTraceId }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentTraceId, setCurrentTraceId] = useState(initialTraceId);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "Shakil Ahmed",
    category: "DevOps",
  });
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Expanded API details view for a post
  const [expandedApiPostId, setExpandedApiPostId] = useState<number | null>(null);

  const categories = ["All", "DevOps", "Next.js", "Architecture", "Kubernetes", "General"];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      content: "",
      author: "Shakil Ahmed",
      category: "DevOps",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      author: post.author,
      category: post.category,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!formData.content.trim()) {
      setFormError("Content is required");
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("content", formData.content);
    payload.append("author", formData.author);
    payload.append("category", formData.category);

    startTransition(async () => {
      if (editingPost) {
        // Update existing
        const res = await updateExistingPost(editingPost.id, payload);
        if (res.success && res.post) {
          setCurrentTraceId(res.traceId);
          setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? res.post! : p)));
          setIsModalOpen(false);
          showToast(`Post updated successfully! (Trace ID: ${res.traceId})`);
        } else {
          setFormError(res.error || "Failed to update");
        }
      } else {
        // Create new
        const res = await createNewPost(payload);
        if (res.success && res.post) {
          setCurrentTraceId(res.traceId);
          setPosts((prev) => [res.post!, ...prev]);
          setIsModalOpen(false);
          showToast(`Post created successfully! (Trace ID: ${res.traceId})`);
        } else {
          setFormError(res.error || "Failed to create post");
        }
      }
    });
  };

  const handleDeletePost = (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    startTransition(async () => {
      const res = await deleteExistingPost(id);
      if (res.success) {
        setCurrentTraceId(res.traceId);
        setPosts((prev) => prev.filter((p) => p.id !== id));
        showToast(`Post deleted! (Trace ID: ${res.traceId})`);
      } else {
        showToast(res.error || "Failed to delete post");
      }
    });
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 border border-indigo-500/40 text-indigo-200 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
              B
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                CloudBlog
              </span>
              <span className="ml-2 text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                PostgreSQL + GitOps
              </span>
            </div>
          </div>

          {/* Database & Tracing Badges */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  initialHealth.mode === "postgres" ? "bg-emerald-400 shadow-emerald-500/50" : "bg-amber-400 shadow-amber-500/50"
                } shadow-sm animate-pulse`}
              />
              <span className="text-slate-400">Database:</span>
              <span className="font-semibold text-slate-200">
                {initialHealth.mode === "postgres" ? "PostgreSQL Active" : "In-Memory Fallback"}
              </span>
              {initialHealth.latencyMs !== undefined && (
                <span className="text-slate-500 text-[10px]">({initialHealth.latencyMs}ms)</span>
              )}
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
              <span className="text-slate-500">Trace:</span>
              <span className="text-cyan-400 truncate max-w-[120px]" title={currentTraceId}>
                {currentTraceId}
              </span>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Post</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner if Database URL is not yet configured */}
        {initialHealth.mode === "in-memory" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                ℹ️
              </div>
              <div>
                <p className="font-semibold text-amber-100">Running with In-Memory Demo Storage</p>
                <p className="text-xs text-amber-300/80">
                  To connect PostgreSQL, set the <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">DATABASE_URL</code> environment variable via Kubernetes secret or Helm.
                </p>
              </div>
            </div>
            <code className="text-xs bg-black/40 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-200 font-mono">
              DATABASE_URL=postgresql://user:pass@host:5432/db
            </code>
          </div>
        )}

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Blog Posts & CRUD Service
            </h1>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl">
              Production Next.js application powered by PostgreSQL, Server Actions, REST APIs, and structured distributed tracing.
            </p>
          </div>

          {/* Metrics summary */}
          <div className="flex items-center gap-4 text-xs">
            <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-slate-400">Total Posts</span>
              <span className="text-xl font-bold text-indigo-400">{posts.length}</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-slate-400">Engine</span>
              <span className="text-xl font-bold text-cyan-400">Next.js 16</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-slate-400">Storage</span>
              <span className="text-xl font-bold text-emerald-400">
                {initialHealth.mode === "postgres" ? "Postgres" : "Memory"}
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Categories Tab */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Post Grid */}
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-base">No posts found matching your query.</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all duration-300 shadow-xl shadow-black/20"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
                      {post.category}
                    </span>
                    <time className="text-slate-500">
                      {new Date(post.createdAt || (post as unknown as { created_at?: string }).created_at || Date.now()).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-300 font-semibold">
                      {post.author.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{post.author}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setExpandedApiPostId(expandedApiPostId === post.id ? null : post.id)
                      }
                      title="View API JSON & Trace details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(post)}
                      title="Edit post"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      title="Delete post"
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* API JSON Inspector */}
                {expandedApiPostId === post.id && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 space-y-2">
                    <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                      <span>REST Endpoint:</span>
                      <span className="text-white">GET /api/posts/{post.id}</span>
                    </div>
                    <pre className="overflow-x-auto text-[10px] text-slate-300">
                      {JSON.stringify(post, null, 2)}
                    </pre>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* REST API & Tracing Documentation Section */}
        <section className="mt-12 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h3 className="text-base font-bold text-white">REST API & Tracing Reference</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every request passes through Next.js middleware, injecting an <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">x-trace-id</code> header for end-to-end distributed tracing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold">GET</span>
                <span className="text-slate-500">/api/posts</span>
              </div>
              <p className="text-[11px] text-slate-400">List all posts or filter by search/category query params.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-bold">POST</span>
                <span className="text-slate-500">/api/posts</span>
              </div>
              <p className="text-[11px] text-slate-400">Create new post with JSON body (title, content, author, category).</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold">GET</span>
                <span className="text-slate-500">/api/health</span>
              </div>
              <p className="text-[11px] text-slate-400">Returns PostgreSQL connection status, latency, and uptime.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Create / Edit Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingPost ? "Edit Blog Post" : "Create New Post"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern DevOps with ArgoCD"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Post Content *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Write post content here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isPending && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{editingPost ? "Save Changes" : "Create Post"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
