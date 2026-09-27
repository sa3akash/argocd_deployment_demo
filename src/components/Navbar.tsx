"use client";

import { useState } from "react";
import Link from "next/link";
import { Post } from "@/db";
import AdminStudioModal from "./AdminStudioModal";

interface Props {
  health: {
    status: "connected" | "disconnected";
    mode: "postgres" | "in-memory";
    count: number;
    totalViews: number;
    latencyMs?: number;
  };
  posts: Post[];
  traceId: string;
}

export default function Navbar({ health, posts, traceId }: Props) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#05070e]/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-black text-lg text-white shadow-xl shadow-indigo-600/30 group-hover:scale-105 transition-all">
                ⚡
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  CloudOps Dispatch
                </span>
                <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium">
                  GitOps • Kubernetes • Systems Journal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link
              href="/#featured"
              className="hover:text-indigo-400 transition-colors"
            >
              Featured
            </Link>
            <Link
              href="/#articles"
              className="hover:text-indigo-400 transition-colors"
            >
              Articles
            </Link>
            <Link
              href="/#runbooks"
              className="hover:text-cyan-400 transition-colors"
            >
              CLI Runbooks
            </Link>
            <Link
              href="/#ecosystem"
              className="hover:text-indigo-400 transition-colors"
            >
              Ecosystem
            </Link>
            <Link
              href="/sitemap.xml"
              className="hover:text-slate-100 transition-colors text-slate-400"
            >
              Sitemap
            </Link>
          </nav>

          {/* Status & Actions */}
          <div className="flex items-center gap-3">
            {/* Cluster DB Status Pill */}
            <div
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px]"
              title={`Distributed Trace ID: ${traceId}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health.mode === "postgres" ? "bg-emerald-400" : "bg-amber-400"
                } animate-pulse`}
              />
              <span className="text-slate-400">DB:</span>
              <span className="font-semibold text-slate-200">
                {health.mode === "postgres" ? "PostgreSQL 16" : "In-Memory"}
              </span>
              {health.latencyMs !== undefined && (
                <span className="text-slate-500 font-mono text-[10px]">
                  ({health.latencyMs}ms)
                </span>
              )}
            </div>

            {/* GitHub External Project Link */}
            <a
              href="https://github.com/sa3akash/argocd_deployment_demo"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
              title="View Source on GitHub"
            >
              <span>⭐</span>
              <span>GitHub</span>
            </a>

            {/* Admin / Author Studio Trigger */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>+</span>
              <span>Author Studio</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs border border-slate-800"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#090d16] px-4 py-3 space-y-2 text-xs font-semibold">
            <Link
              href="/#featured"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-300 hover:text-white"
            >
              Featured Story
            </Link>
            <Link
              href="/#articles"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-300 hover:text-white"
            >
              All Articles
            </Link>
            <Link
              href="/#runbooks"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-cyan-400 hover:text-white"
            >
              Production Runbooks
            </Link>
            <Link
              href="/#ecosystem"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-300 hover:text-white"
            >
              Ecosystem & CNCF
            </Link>
            <a
              href="https://github.com/sa3akash/argocd_deployment_demo"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 text-indigo-400 hover:text-white"
            >
              GitHub Repository ↗
            </a>
          </div>
        )}
      </header>

      {/* Admin Modal */}
      <AdminStudioModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        posts={posts}
        currentTraceId={traceId}
      />
    </>
  );
}
