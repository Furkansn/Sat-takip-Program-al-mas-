export default function Loading() {
    return (
        <div className="container animate-in fade-in zoom-in-95 duration-300">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="h-8 w-32 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                    <div className="h-10 w-32 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                </div>
            </div>

            {/* Filter Skeleton */}
            <div className="card h-24 mb-6 bg-neutral-200/50 animate-pulse"></div>

            {/* List Skeleton */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-surface rounded-xl border border-border/50 animate-pulse">
                        <div className="flex-1 space-y-2 w-full">
                            <div className="h-4 w-32 bg-neutral-200/50 rounded"></div>
                        </div>
                        <div className="flex-1 space-y-2 w-full">
                            <div className="h-4 w-48 bg-neutral-200/50 rounded"></div>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="h-4 w-24 bg-neutral-200/50 rounded"></div>
                        </div>
                        <div className="w-24 h-6 bg-neutral-200/50 rounded self-end md:self-center"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
