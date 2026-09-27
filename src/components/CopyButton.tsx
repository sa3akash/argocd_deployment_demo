"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-mono text-indigo-300 flex items-center gap-1.5 transition-all"
      aria-label="Copy command to clipboard"
    >
      <span>{copied ? "✓ Copied" : "📋 Copy"}</span>
    </button>
  );
}
