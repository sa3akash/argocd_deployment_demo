export default function Loading() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 sm:w-64 bg-slate-800/80 rounded-xl" />
            <div className="h-4 w-32 sm:w-48 bg-slate-900 rounded-lg" />
          </div>
          <div className="h-9 w-24 bg-slate-800/80 rounded-xl" />
        </div>

        {/* Tab Skeleton */}
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-slate-800/80 rounded-xl" />
          <div className="h-9 w-32 bg-slate-900 rounded-xl" />
          <div className="h-9 w-28 bg-slate-900 rounded-xl" />
        </div>

        {/* Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4"
            >
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-slate-800 rounded-md" />
                <div className="h-4 w-20 bg-slate-800 rounded-md" />
              </div>
              <div className="h-6 w-3/4 bg-slate-800 rounded-lg" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-800/60 rounded" />
                <div className="h-3 w-5/6 bg-slate-800/60 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between">
                <div className="h-5 w-20 bg-slate-800 rounded-md" />
                <div className="h-5 w-16 bg-slate-800 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
