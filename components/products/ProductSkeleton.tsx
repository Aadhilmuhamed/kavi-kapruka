export default function ProductSkeleton() {
  return (
    <div className="flex gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-52 flex-shrink-0 rounded-3xl bg-white border border-outline-variant/30 overflow-hidden"
        >
          <div className="aspect-square m-3 mb-0 rounded-2xl bg-surface-container animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-surface-container rounded animate-pulse" />
            <div className="h-3 bg-surface-container rounded w-2/3 animate-pulse" />
            <div className="h-9 bg-surface-container rounded-xl animate-pulse mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
