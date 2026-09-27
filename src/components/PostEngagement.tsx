"use client";

import { useState } from "react";
import { Comment } from "@/db";
import { recordPostLike, addCommentToPost, recordCommentLike } from "@/lib/actions";

interface Props {
  postId: number;
  initialLikes: number;
  initialComments: Comment[];
}

export default function PostEngagement({ postId, initialLikes, initialComments }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLikePost = async () => {
    if (hasLiked) return;
    setLikes((prev) => prev + 1);
    setHasLiked(true);
    showNotification("Thank you for reacting! ❤️");
    await recordPostLike(postId);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const author = authorName.trim() || "Cloud Architect";
    const res = await addCommentToPost(postId, author, commentText);
    setIsSubmitting(false);

    if (res.success && res.comment) {
      setComments((prev) => [res.comment!, ...prev]);
      setCommentText("");
      showNotification("Comment published! 💬");
    } else {
      showNotification(res.error || "Failed to post comment");
    }
  };

  const handleLikeComment = async (commentId: number) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
    );
    await recordCommentLike(commentId);
  };

  return (
    <div className="space-y-8 pt-8 border-t border-slate-800">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-medium text-xs shadow-2xl shadow-indigo-600/40 animate-bounce">
          {notification}
        </div>
      )}

      {/* Like Post Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">Find this article helpful?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            React to support the authors and community contributors.
          </p>
        </div>

        <button
          onClick={handleLikePost}
          disabled={hasLiked}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
            hasLiked
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-default"
              : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 shadow-lg shadow-rose-500/10"
          }`}
        >
          <span>❤️</span>
          <span>{hasLiked ? "Liked!" : "Like Article"}</span>
          <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono">{likes}</span>
        </button>
      </div>

      {/* Community Discussion Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="text-base font-bold text-white">Community Discussion</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              {comments.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Drizzle ORM</span>
        </div>

        {/* New Comment Form */}
        <form
          onSubmit={handleAddComment}
          className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Your name or handle (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="sm:w-1/3 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Share your thoughts, suggestions, or questions..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>{isSubmitting ? "Posting..." : "Comment 🚀"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-slate-950/30 border border-dashed border-slate-800/60 text-xs text-slate-500">
            No comments yet. Share your experience or feedback above!
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
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
      </section>
    </div>
  );
}
