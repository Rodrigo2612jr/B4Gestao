export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="b4-card p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-b4-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-b4-surface-2" />
              <div className="h-6 w-12 animate-pulse rounded bg-b4-surface-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="b4-card overflow-hidden">
      <div className="border-b border-b4-line bg-b4-surface-2 px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-b4-surface-2" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-b4-line px-4 py-4 last:border-0">
          <div className="h-4 w-20 animate-pulse rounded bg-b4-surface-2" />
          <div className="h-4 flex-1 animate-pulse rounded bg-b4-surface-2" />
          <div className="h-4 w-24 animate-pulse rounded bg-b4-surface-2" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-b4-surface-2" />
        </div>
      ))}
    </div>
  );
}
