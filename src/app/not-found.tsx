import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 mx-auto flex items-center justify-center text-3xl font-black">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white">Article Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page or tutorial you are looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
          >
            <span>← Return to Journal Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
