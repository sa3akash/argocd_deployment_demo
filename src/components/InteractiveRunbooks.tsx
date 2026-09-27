"use client";

import { useState } from "react";
import { Post, CommandStep } from "@/db";

interface Props {
  postsWithSteps: Post[];
}

export default function InteractiveRunbooks({ postsWithSteps }: Props) {
  const [activePostId, setActivePostId] = useState<number>(
    postsWithSteps[0]?.id || 1
  );
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const activePost =
    postsWithSteps.find((p) => p.id === activePostId) || postsWithSteps[0];

  let steps: CommandStep[] = [];
  if (activePost && activePost.steps) {
    try {
      steps = JSON.parse(activePost.steps);
    } catch {
      steps = [];
    }
  }

  const toggleStepCompleted = (stepNumber: number) => {
    const key = `${activePost.id}-${stepNumber}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const completedCount = steps.filter(
    (s) => completedSteps[`${activePost?.id}-${s.step}`]
  ).length;

  const progressPercent = steps.length
    ? Math.round((completedCount / steps.length) * 100)
    : 0;

  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">
              Active Runbook: {activePost?.title}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Follow the live execution steps directly in your terminal.
          </p>
        </div>

        {/* Post Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {postsWithSteps.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePostId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activePostId === p.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {p.category} Guide
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between gap-4 bg-slate-950/20">
        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-cyan-400 whitespace-nowrap">
          {completedCount} / {steps.length} Steps ({progressPercent}%)
        </span>
      </div>

      {/* Steps List */}
      <div className="p-6 space-y-4">
        {steps.map((st, idx) => {
          const isDone = completedSteps[`${activePost.id}-${st.step}`];

          return (
            <div
              key={st.step}
              className={`p-4 rounded-2xl border transition-all ${
                isDone
                  ? "bg-slate-900/30 border-emerald-500/30 opacity-75"
                  : "bg-slate-950/70 border-slate-800/90 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleStepCompleted(st.step)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                        : "border border-slate-700 hover:border-slate-500 text-transparent"
                    }`}
                    title={isDone ? "Mark incomplete" : "Mark step complete"}
                  >
                    ✓
                  </button>
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        isDone ? "line-through text-slate-500" : "text-slate-200"
                      }`}
                    >
                      Step {st.step}: {st.title}
                    </h4>
                    {st.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {st.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(st.command, idx)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>{copiedIndex === idx ? "✓" : "📋"}</span>
                  <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Terminal Code Box */}
              <div className="mt-3 p-3 rounded-xl bg-black/60 border border-slate-800/80 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre">
                <span className="text-slate-600 select-none">$ </span>
                {st.command}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
