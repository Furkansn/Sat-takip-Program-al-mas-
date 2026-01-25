export default function Loading() {
    return (
        <div className="container animate-in fade-in zoom-in-95 duration-300">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-4">
                <div className="h-8 w-32 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                <div className="flex gap-2">
                    <div className="h-10 w-32 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                    <div className="h-10 w-24 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                </div>
            </div>

            {/* Filter Skeleton */}
            <div className="flex gap-4 mb-4">
                <div className="h-10 flex-1 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                <div className="h-10 w-48 bg-neutral-200/50 rounded-lg animate-pulse"></div>
            </div>

            {/* Table Skeleton */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border/50 animate-pulse">
                        <div className="w-10 h-10 rounded bg-neutral-200/50"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-48 bg-neutral-200/50 rounded"></div>
                            <div className="h-3 w-24 bg-neutral-200/30 rounded"></div>
                        </div>
                        <div className="w-24 h-6 bg-neutral-200/50 rounded"></div>
                        <div className="w-8 h-8 rounded bg-neutral-200/50"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
