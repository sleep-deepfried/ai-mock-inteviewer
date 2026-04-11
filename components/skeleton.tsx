/** Animated skeleton placeholder for loading states */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/10 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a stat card value */
export function StatSkeleton({ wide = false }: { wide?: boolean }) {
  return <Skeleton className={`h-8 ${wide ? "w-32" : "w-12"}`} />;
}

/** Skeleton for a single interview list item */
export function InterviewItemSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="ml-4 h-6 w-8" />
    </div>
  );
}

/** Skeleton for the recent interviews list */
export function InterviewListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <InterviewItemSkeleton key={i} />
      ))}
    </div>
  );
}
