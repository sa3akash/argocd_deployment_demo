"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Post, CommandStep, Comment } from "@/db";
import {
  createNewPost,
  updateExistingPost,
  deleteExistingPost,
  recordPostView,
  recordPostLike,
  syncDatabaseAction,
  fetchPostComments,
  addCommentToPost,
  recordCommentLike,
} from "@/lib/actions";

interface Props {
  initialPosts: Post[];
  initialHealth: {
    status: "connected" | "disconnected";
    mode: "postgres" | "in-memory";
    count: number;
    totalViews: number;
    latencyMs?: number;
  };
  initialTraceId: string;
}

export default function BlogManager({ initialPosts, initialHealth, initialTraceId }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<"reader" | "admin" | "commands">("reader");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentTraceId, setCurrentTraceId] = useState(initialTraceId);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Selected post for reader modal & comments
  const [readingPost, setReadingPost] = useState<Post | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedCommandIndex, setCopiedCommandIndex] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Admin Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editorData, setEditorData] = useState({
    title: "",
    content: "",
    excerpt: "",
    author: "Shakil Ahmed",
    category: "DevOps",
    tags: "Kubernetes,ArgoCD,GitOps",
    published: true,
  });
  const [editorSteps, setEditorSteps] = useState<CommandStep[]>([
    { step: 1, title: "Initialize Environment", command: "kubectl get nodes", description: "Verify Kubernetes cluster connectivity." },
  ]);
  const [editorError, setEditorError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const categories = ["All", "DevOps", "Next.js", "Architecture", "Kubernetes", "General"];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    startTransition(async () => {
      const res = await syncDatabaseAction();
      setIsSyncing(false);
      setCurrentTraceId(res.traceId);
      showToast(res.message);
    });
  };

  // Open Post Reader, Increment View, and Load Comments
  const handleOpenReader = (post: Post) => {
    setReadingPost(post);
    setIsLoadingComments(true);
    // Optimistic view increment
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, views: p.views + 1 } : p))
    );
    startTransition(async () => {
      const res = await recordPostView(post.id);
      setCurrentTraceId(res.traceId);
      const commentsRes = await fetchPostComments(post.id);
      setPostComments(commentsRes.comments);
      setIsLoadingComments(false);
    });
  };

  // Add Comment to current reading post
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readingPost || !newCommentText.trim()) return;

    setIsSubmittingComment(true);
    const author = newCommentAuthor.trim() || "Cloud Explorer";
    const res = await addCommentToPost(readingPost.id, author, newCommentText);
    setIsSubmittingComment(false);

    if (res.success && res.comment) {
      setPostComments((prev) => [res.comment!, ...prev]);
      setNewCommentText("");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === readingPost.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
        )
      );
      setReadingPost((prev) =>
        prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null
      );
      showToast("Comment published! 💬");
    } else {
      showToast(res.error || "Failed to submit comment");
    }
  };

  // Like a comment
  const handleLikeComment = async (commentId: number) => {
    setPostComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
    );
    await recordCommentLike(commentId);
  };

  // Like a post
  const handleLike = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likes: p.likes + 1 } : p))
    );
    if (readingPost && readingPost.id === post.id) {
      setReadingPost({ ...readingPost, likes: readingPost.likes + 1 });
    }
    startTransition(async () => {
      const res = await recordPostLike(post.id);
      setCurrentTraceId(res.traceId);
      showToast("Thank you for reacting! ❤️");
    });
  };

  // Copy command to clipboard
  const handleCopyCommand = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCommandIndex(index);
    showToast("Command copied to clipboard! 📋");
    setTimeout(() => setCopiedCommandIndex(null), 2000);
  };

  // Admin: Open Create Modal
  const handleOpenCreate = () => {
    setEditingPostId(null);
    setEditorData({
      title: "",
      content: "",
      excerpt: "",
      author: "Shakil Ahmed",
      category: "DevOps",
      tags: "Kubernetes,GitOps",
      published: true,
    });
    setEditorSteps([
      { step: 1, title: "Step 1", command: "echo 'Step 1'", description: "First operation" },
    ]);
    setEditorError("");
    setIsEditorOpen(true);
  };

  // Admin: Open Edit Modal
  const handleOpenEdit = (post: Post) => {
    setEditingPostId(post.id);
    let parsedSteps: CommandStep[] = [];
    try {
      parsedSteps = JSON.parse(post.steps || "[]");
    } catch {
      parsedSteps = [];
    }
    setEditorData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      category: post.category,
      tags: post.tags,
      published: post.published,
    });
    setEditorSteps(parsedSteps.length ? parsedSteps : [
      { step: 1, title: "Step 1", command: "kubectl get pods", description: "Verify pods" }
    ]);
    setEditorError("");
    setIsEditorOpen(true);
  };

  // Admin: Save Post
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorData.title.trim()) {
      setEditorError("Title is required");
      return;
    }
    if (!editorData.content.trim()) {
      setEditorError("Content is required");
      return;
    }

    const payload = new FormData();
    payload.append("title", editorData.title);
    payload.append("content", editorData.content);
    payload.append("excerpt", editorData.excerpt);
    payload.append("author", editorData.author);
    payload.append("category", editorData.category);
    payload.append("tags", editorData.tags);
    payload.append("published", String(editorData.published));
    payload.append("steps", JSON.stringify(editorSteps));

    startTransition(async () => {
      if (editingPostId) {
        const res = await updateExistingPost(editingPostId, payload);
        if (res.success && res.post) {
          setCurrentTraceId(res.traceId);
          setPosts((prev) => prev.map((p) => (p.id === editingPostId ? res.post! : p)));
          setIsEditorOpen(false);
          showToast(`Post updated! (Trace: ${res.traceId})`);
        } else {
          setEditorError(res.error || "Failed to update");
        }
      } else {
        const res = await createNewPost(payload);
        if (res.success && res.post) {
          setCurrentTraceId(res.traceId);
          setPosts((prev) => [res.post!, ...prev]);
          setIsEditorOpen(false);
          showToast(`Post published! (Trace: ${res.traceId})`);
        } else {
          setEditorError(res.error || "Failed to create");
        }
      }
    });
  };

  // Admin: Delete Post
  const handleDeletePost = (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    startTransition(async () => {
      const res = await deleteExistingPost(id);
      if (res.success) {
        setCurrentTraceId(res.traceId);
        setPosts((prev) => prev.filter((p) => p.id !== id));
        showToast("Post deleted successfully!");
      } else {
        showToast(res.error || "Failed to delete");
      }
    });
  };

  // Step Builder Helper
  const addEditorStep = () => {
    setEditorSteps([
      ...editorSteps,
      {
        step: editorSteps.length + 1,
        title: `Step ${editorSteps.length + 1}`,
        command: "kubectl get pods -n production",
        description: "",
      },
    ]);
  };

  const removeEditorStep = (index: number) => {
    setEditorSteps(editorSteps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, step: idx + 1 })));
  };

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 border border-indigo-500/40 text-indigo-200 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Modern Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#07090e]/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Platform Tag */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-xl shadow-indigo-600/30 shrink-0">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                    DevOps Pulse
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                    GitOps + Drizzle
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">
                  Kubernetes GitOps • Multi-Step Commands • Observability
                </p>
              </div>
            </div>

            {/* Quick Mobile Action Buttons */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={handleSyncDatabase}
                disabled={isSyncing}
                title="Sync Database"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-indigo-400 hover:text-white"
              >
                {isSyncing ? "⏳" : "🔄"}
              </button>
              <button
                onClick={handleOpenCreate}
                title="Create Article"
                className="p-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Mobile-Friendly Responsive) */}
          <nav className="w-full md:w-auto flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab("reader")}
              className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === "reader"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>📰 Articles</span>
            </button>
            <button
              onClick={() => setActiveTab("commands")}
              className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === "commands"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>⚡ Step Runner</span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>⚙️ Admin Studio</span>
            </button>
          </nav>

          {/* Status & Action (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  initialHealth.mode === "postgres" ? "bg-emerald-400" : "bg-amber-400"
                } animate-pulse`}
              />
              <span className="text-slate-400 font-medium">DB:</span>
              <span className="font-semibold text-slate-200">
                {initialHealth.mode === "postgres" ? "PostgreSQL" : "In-Memory"}
              </span>
              {initialHealth.latencyMs !== undefined && (
                <span className="text-slate-500 font-mono text-[10px]">({initialHealth.latencyMs}ms)</span>
              )}
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white font-medium text-xs transition-all shadow-lg shadow-indigo-600/30"
            >
              <span>+ New Article</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Real-Time Metrics Header Banner */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 shadow-xl shadow-black/20">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Views</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-400">{totalViews.toLocaleString()}</span>
              <span className="text-xs text-emerald-400 font-medium">👁️ real-time</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 shadow-xl shadow-black/20">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Articles</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-cyan-400">{posts.length}</span>
              <span className="text-xs text-slate-400">published</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 shadow-xl shadow-black/20">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reactions</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-400">{totalLikes}</span>
              <span className="text-xs text-rose-400/80">❤️ likes</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 shadow-xl shadow-black/20">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Request Trace ID</span>
            <div className="mt-2 truncate font-mono text-sm text-cyan-300 font-semibold" title={currentTraceId}>
              {currentTraceId}
            </div>
          </div>
        </section>

        {/* ======================= TAB 1: READER MODE ======================= */}
        {activeTab === "reader" && (
          <div className="space-y-8 animate-fade-in">
            {/* Search & Categories Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search articles, commands, tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3.5 top-3 text-xs text-slate-400">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Post Grid */}
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
                    onClick={() => handleOpenReader(post)}
                    className="group relative cursor-pointer flex flex-col justify-between p-7 rounded-3xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all duration-300 shadow-xl shadow-black/30 hover:-translate-y-1"
                  >
                    <div className="space-y-4">
                      {/* Category & Read Time */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-semibold tracking-wide">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <span>{post.readTime}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>

                      {/* Title & Direct Route Link */}
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h2>
                        <Link
                          href={`/posts/${post.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-300 transition-all shrink-0"
                          title="Open dedicated article page"
                        >
                          <span className="text-xs">↗</span>
                        </Link>
                      </div>

                      {/* Excerpt */}
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                        {post.excerpt || post.content}
                      </p>

                      {/* Multi-step Command Badge */}
                      {stepCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-medium">
                          <span>⚡</span>
                          <span>{stepCount} Step Command Sequence</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Stats & Author */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white">
                          {post.author.charAt(0)}
                        </div>
                        <span className="text-slate-300 font-medium">{post.author}</span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-400">
                        <span className="flex items-center gap-1" title="Views">
                          <span>👁️</span>
                          <span className="font-semibold text-slate-300">{post.views}</span>
                        </span>
                        <button
                          onClick={(e) => handleLike(post, e)}
                          className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                          title="Likes"
                        >
                          <span>❤️</span>
                          <span className="font-semibold text-slate-300">{post.likes}</span>
                        </button>
                        <span className="flex items-center gap-1 text-slate-400" title="Comments">
                          <span>💬</span>
                          <span className="font-semibold text-slate-300">{post.commentsCount || 0}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB 2: STEP RUNNER ======================= */}
        {activeTab === "commands" && (
          <div className="space-y-8 animate-fade-in">
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚡ Interactive Multi-Step Command Runner</span>
              </h2>
              <p className="text-sm text-slate-400">
                Execute deployment and configuration workflows step-by-step. Click copy on each command and mark completed as you progress.
              </p>
            </div>

            <div className="space-y-6">
              {posts.map((post) => {
                let steps: CommandStep[] = [];
                try {
                  steps = JSON.parse(post.steps || "[]");
                } catch {
                  steps = [];
                }
                if (!steps.length) return null;

                return (
                  <div key={post.id} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Tutorial Workflow</span>
                        <h3 className="text-lg font-bold text-white">{post.title}</h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-mono text-cyan-300">
                        {steps.length} Steps
                      </span>
                    </div>

                    <div className="space-y-4">
                      {steps.map((st, sIdx) => {
                        const stepKey = `${post.id}-${sIdx}`;
                        const isDone = !!completedSteps[stepKey];

                        return (
                          <div
                            key={sIdx}
                            className={`p-4 rounded-2xl border transition-all ${
                              isDone
                                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                                : "bg-slate-950 border-slate-800/80"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    setCompletedSteps({ ...completedSteps, [stepKey]: !isDone })
                                  }
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                                    isDone
                                      ? "bg-emerald-500 text-slate-950"
                                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                  }`}
                                >
                                  {isDone ? "✓" : st.step}
                                </button>
                                <div>
                                  <h4 className="font-bold text-sm text-slate-100">{st.title}</h4>
                                  {st.description && (
                                    <p className="text-xs text-slate-400 mt-0.5">{st.description}</p>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleCopyCommand(st.command, sIdx)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-mono text-indigo-300 flex items-center gap-1.5 transition-all shrink-0"
                              >
                                <span>{copiedCommandIndex === sIdx ? "✓ Copied" : "📋 Copy"}</span>
                              </button>
                            </div>

                            {/* Command Terminal Block */}
                            <pre className="mt-3 p-3 rounded-xl bg-black/60 border border-slate-800/80 font-mono text-xs text-emerald-400 overflow-x-auto">
                              <code>{st.command}</code>
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: ADMIN STUDIO ======================= */}
        {activeTab === "admin" && (
          <div className="space-y-8 animate-fade-in">
            {/* Admin Header with Create Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
              <div>
                <h2 className="text-2xl font-black text-white">Admin Studio</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage publication content, drafts, multi-step commands, and database metrics.
                </p>
              </div>

              <button
                onClick={handleOpenCreate}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2"
              >
                <span>+ Create Article</span>
              </button>
            </div>

            {/* Post Manager Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/60">
                  <tr>
                    <th className="py-4 px-6">Title</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Author</th>
                    <th className="py-4 px-4">Views</th>
                    <th className="py-4 px-4">Likes</th>
                    <th className="py-4 px-4">Comments</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-100 max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 font-medium">
                          {post.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{post.author}</td>
                      <td className="py-4 px-4 text-indigo-400 font-bold">{post.views}</td>
                      <td className="py-4 px-4 text-rose-400 font-bold">{post.likes}</td>
                      <td className="py-4 px-4 text-cyan-400 font-bold">{post.commentsCount || 0}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md font-semibold text-[10px] uppercase tracking-wider ${
                            post.published
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {post.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ======================= ARTICLE READER MODAL ======================= */}
      {readingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl my-auto rounded-3xl bg-[#0b0e14] border border-slate-800 shadow-2xl p-5 sm:p-10 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  {readingPost.category}
                </span>
                <Link
                  href={`/posts/${readingPost.slug}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <span>Open Full Page ↗</span>
                </Link>
              </div>
              <button
                onClick={() => setReadingPost(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {readingPost.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>By {readingPost.author}</span>
                <span>•</span>
                <span>{readingPost.readTime}</span>
                <span>•</span>
                <span>👁️ {readingPost.views} views</span>
                <span>•</span>
                <span>❤️ {readingPost.likes} likes</span>
                <span>•</span>
                <span>💬 {readingPost.commentsCount || postComments.length} comments</span>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm sm:text-base space-y-4">
              <p>{readingPost.content}</p>
            </div>

            {/* Multi-Step Commands Section */}
            {(() => {
              let steps: CommandStep[] = [];
              try {
                steps = JSON.parse(readingPost.steps || "[]");
              } catch {
                steps = [];
              }
              if (!steps.length) return null;

              return (
                <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>⚡ Step-by-Step Execution Sequence</span>
                  </h3>

                  <div className="space-y-3">
                    {steps.map((st, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400">
                            Step {st.step}: {st.title}
                          </span>
                          <button
                            onClick={() => handleCopyCommand(st.command, idx)}
                            className="text-xs text-slate-400 hover:text-indigo-300 font-mono"
                          >
                            {copiedCommandIndex === idx ? "✓ Copied" : "📋 Copy"}
                          </button>
                        </div>
                        {st.description && <p className="text-xs text-slate-400">{st.description}</p>}
                        <pre className="p-3 rounded-xl bg-black border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                          <code>{st.command}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Interactive Comments & Community Discussion Section */}
            <div className="mt-8 pt-6 border-t border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <h3 className="text-base font-bold text-white">Community Discussion</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
                    {postComments.length}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Drizzle ORM</span>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Shakil or SRE Lead)"
                    value={newCommentAuthor}
                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                    className="sm:w-1/3 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write your feedback, comment, or query..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      required
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newCommentText.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <span>{isSubmittingComment ? "Posting..." : "Comment 🚀"}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
                  Loading discussion comments...
                </div>
              ) : postComments.length === 0 ? (
                <div className="py-6 text-center rounded-2xl bg-slate-950/30 border border-dashed border-slate-800/60 text-xs text-slate-500">
                  No comments yet. Share your experience or thoughts above!
                </div>
              ) : (
                <div className="space-y-3">
                  {postComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700/80 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                            {comment.author.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-slate-200">{comment.author}</span>
                          <span className="text-[10px] text-slate-500">
                            • {new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-rose-400 active:scale-95 transition-all"
                        >
                          <span>❤️</span>
                          <span className="font-semibold text-slate-300">{comment.likes}</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={(e) => handleLike(readingPost, e)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all text-xs font-semibold"
              >
                <span>❤️ Like this Article ({readingPost.likes})</span>
              </button>

              <button
                onClick={() => setReadingPost(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= ADMIN CREATE / EDIT MODAL ======================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-[#0b0e14] border border-slate-800 shadow-2xl p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">
                {editingPostId ? "Edit Article" : "Create New Article"}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {editorError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {editorError}
              </div>
            )}

            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editorData.title}
                  onChange={(e) => setEditorData({ ...editorData, title: e.target.value })}
                  placeholder="e.g. Zero-Downtime Deployment with ArgoCD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={editorData.category}
                    onChange={(e) => setEditorData({ ...editorData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Author</label>
                  <input
                    type="text"
                    value={editorData.author}
                    onChange={(e) => setEditorData({ ...editorData, author: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={editorData.tags}
                  onChange={(e) => setEditorData({ ...editorData, tags: e.target.value })}
                  placeholder="Kubernetes, Helm, ArgoCD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Content *</label>
                <textarea
                  required
                  rows={5}
                  value={editorData.content}
                  onChange={(e) => setEditorData({ ...editorData, content: e.target.value })}
                  placeholder="Article markdown or text content..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100"
                />
              </div>

              {/* Multi-Step Command Sequence Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-300">
                    ⚡ Multi-Step Command Sequence
                  </label>
                  <button
                    type="button"
                    onClick={addEditorStep}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editorSteps.map((st, sIdx) => (
                    <div key={sIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400">Step {sIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeEditorStep(sIdx)}
                          className="text-rose-400 text-xs hover:text-rose-300"
                        >
                          ✕ Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Step Title (e.g. Apply manifest)"
                        value={st.title}
                        onChange={(e) => {
                          const updated = [...editorSteps];
                          updated[sIdx].title = e.target.value;
                          setEditorSteps(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Shell Command (e.g. kubectl apply -f ...)"
                        value={st.command}
                        onChange={(e) => {
                          const updated = [...editorSteps];
                          updated[sIdx].command = e.target.value;
                          setEditorSteps(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishedToggle"
                  checked={editorData.published}
                  onChange={(e) => setEditorData({ ...editorData, published: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="publishedToggle" className="text-xs text-slate-300 font-medium">
                  Publish immediately (Uncheck to save as draft)
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 text-xs font-semibold rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isPending && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{editingPostId ? "Save Changes" : "Publish Article"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
