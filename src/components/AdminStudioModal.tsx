"use client";

import { useState, useTransition } from "react";
import { Post, CommandStep } from "@/db";
import {
  createNewPost,
  updateExistingPost,
  deleteExistingPost,
  syncDatabaseAction,
} from "@/lib/actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onPostsChange?: (posts: Post[]) => void;
  currentTraceId: string;
}

export default function AdminStudioModal({
  isOpen,
  onClose,
  posts,
  onPostsChange,
  currentTraceId,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create">("list");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    author: "Shakil Ahmed",
    category: "DevOps",
    tags: "Kubernetes,ArgoCD,GitOps",
    published: true,
  });

  const [steps, setSteps] = useState<CommandStep[]>([
    {
      step: 1,
      title: "Initialize Cluster Context",
      command: "kubectl get nodes -o wide",
      description: "Ensure the local or remote Kubernetes cluster is reachable.",
    },
  ]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSyncDb = async () => {
    setIsSyncing(true);
    startTransition(async () => {
      const res = await syncDatabaseAction();
      setIsSyncing(false);
      showToast(res.message);
    });
  };

  const resetForm = () => {
    setEditingPostId(null);
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      author: "Shakil Ahmed",
      category: "DevOps",
      tags: "Kubernetes,ArgoCD,GitOps",
      published: true,
    });
    setSteps([
      {
        step: 1,
        title: "Initialize Cluster Context",
        command: "kubectl get nodes -o wide",
        description: "Ensure the local or remote Kubernetes cluster is reachable.",
      },
    ]);
    setErrorMsg("");
  };

  const startEdit = (post: Post) => {
    setEditingPostId(post.id);
    let parsed: CommandStep[] = [];
    try {
      parsed = JSON.parse(post.steps || "[]");
    } catch {
      parsed = [];
    }
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      category: post.category,
      tags: post.tags,
      published: post.published,
    });
    setSteps(
      parsed.length
        ? parsed
        : [
            {
              step: 1,
              title: "Step 1",
              command: "kubectl get pods",
              description: "Inspect running pods",
            },
          ]
    );
    setActiveSubTab("create");
  };

  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        title: `Step ${prev.length + 1}`,
        command: "echo 'Execute task'",
        description: "Task description",
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, idx) => ({ ...s, step: idx + 1 }))
    );
  };

  const handleUpdateStep = (
    index: number,
    field: keyof CommandStep,
    value: string
  ) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg("Title is required");
      return;
    }
    if (!formData.content.trim()) {
      setErrorMsg("Content is required");
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("content", formData.content);
    payload.append("excerpt", formData.excerpt);
    payload.append("author", formData.author);
    payload.append("category", formData.category);
    payload.append("tags", formData.tags);
    payload.append("published", String(formData.published));
    payload.append("steps", JSON.stringify(steps));

    startTransition(async () => {
      if (editingPostId) {
        const res = await updateExistingPost(editingPostId, payload);
        if (res.success && res.post) {
          showToast("Article updated successfully! ✨");
          if (onPostsChange) {
            onPostsChange(
              posts.map((p) => (p.id === res.post!.id ? res.post! : p))
            );
          }
          resetForm();
          setActiveSubTab("list");
        } else {
          setErrorMsg(res.error || "Failed to update article");
        }
      } else {
        const res = await createNewPost(payload);
        if (res.success && res.post) {
          showToast("Article published to PostgreSQL! 🚀");
          if (onPostsChange) {
            onPostsChange([res.post!, ...posts]);
          }
          resetForm();
          setActiveSubTab("list");
        } else {
          setErrorMsg(res.error || "Failed to create article");
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this technical article?"))
      return;
    startTransition(async () => {
      const res = await deleteExistingPost(id);
      if (res.success) {
        showToast("Article deleted.");
        if (onPostsChange) {
          onPostsChange(posts.filter((p) => p.id !== id));
        }
      } else {
        showToast(res.error || "Failed to delete article");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-indigo-950 border border-indigo-500/60 text-indigo-100 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 font-mono text-sm border border-indigo-500/30">
              ⚡
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                Author Studio & Database Sync
              </h2>
              <p className="text-[11px] text-slate-400">
                Trace ID:{" "}
                <span className="font-mono text-cyan-300">
                  {currentTraceId}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncDb}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-indigo-300 transition-all"
            >
              <span>{isSyncing ? "⏳" : "🔄"}</span>
              <span>{isSyncing ? "Syncing..." : "Sync DB"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/60 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveSubTab("list");
              resetForm();
            }}
            className={`pb-3 border-b-2 transition-all ${
              activeSubTab === "list"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            All Articles ({posts.length})
          </button>
          <button
            onClick={() => setActiveSubTab("create")}
            className={`pb-3 border-b-2 transition-all ${
              activeSubTab === "create"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {editingPostId ? "Edit Article" : "+ Create New Article"}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSubTab === "list" ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {post.excerpt || post.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(post)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 text-xs font-medium border border-rose-500/20 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Zero-Downtime Next.js 16 with ArgoCD"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="DevOps">DevOps</option>
                    <option value="Kubernetes">Kubernetes</option>
                    <option value="Next.js">Next.js</option>
                    <option value="Architecture">Architecture</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Article Excerpt
                </label>
                <input
                  type="text"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  placeholder="Short engaging summary for social previews and cards"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Content (Markdown / Detailed Text) *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Write the full technical article body..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono leading-relaxed"
                />
              </div>

              {/* Multi-Step Commands Section */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Interactive CLI Command Steps
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Step-by-step terminal execution guides for readers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-medium border border-indigo-500/30"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-3">
                  {steps.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-cyan-400">
                          Step #{idx + 1}
                        </span>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="text-slate-500 hover:text-rose-400 text-xs"
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) =>
                            handleUpdateStep(idx, "title", e.target.value)
                          }
                          placeholder="Step Title"
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                        <input
                          type="text"
                          value={st.description || ""}
                          onChange={(e) =>
                            handleUpdateStep(idx, "description", e.target.value)
                          }
                          placeholder="Short description"
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={st.command}
                        onChange={(e) =>
                          handleUpdateStep(idx, "command", e.target.value)
                        }
                        placeholder="Terminal command (e.g. kubectl apply -f ...)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-emerald-300 placeholder-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveSubTab("list");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {isPending
                    ? "Saving..."
                    : editingPostId
                    ? "Update Publication"
                    : "Publish Article"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
