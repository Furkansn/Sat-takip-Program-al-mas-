export default function Loading() {
    return (
        <div className="container animate-in fade-in zoom-in-95 duration-300">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-200/50 animate-pulse"></div>
                    <div>
                        <div className="h-8 w-48 bg-neutral-200/50 rounded-lg animate-pulse mb-2"></div>
                        <div className="h-4 w-32 bg-neutral-200/50 rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                    <div className="h-10 w-24 bg-neutral-200/50 rounded-lg animate-pulse"></div>
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card p-6 h-32 flex flex-col justify-between">
                        <div className="h-4 w-24 bg-neutral-200/50 rounded animate-pulse"></div>
                        <div className="h-8 w-32 bg-neutral-200/50 rounded animate-pulse self-end"></div>
                    </div>
                ))}
            </div>

            {/* Tabs & Content Skeleton */}
            <div className="card h-[400px]">
                <div className="border-b border-border/50 pb-4 mb-4 flex gap-4">
                    <div className="h-8 w-24 bg-neutral-200/50 rounded animate-pulse"></div>
                    <div className="h-8 w-24 bg-neutral-200/50 rounded animate-pulse"></div>
                    <div className="h-8 w-24 bg-neutral-200/50 rounded animate-pulse"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 w-full bg-neutral-200/30 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
