import { Suspense } from "react";
import DashboardFilter from "@/components/DashboardFilter";
import DashboardContent from "@/components/DashboardContent";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export const dynamic = 'force-dynamic';

export default function DashboardPage({
    searchParams,
}: {
    searchParams?: { filter?: 'all' | 'month' | 'today' };
}) {
    const filter = searchParams?.filter || 'today';

    return (
        <main className="container">
            <div className="dashboard-header">
                <h1 style={{ marginBottom: 0 }}>Genel Bakış</h1>
                <div className="dashboard-filter-wrapper">
                    <DashboardFilter />
                </div>
            </div>

            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent filter={filter} />
            </Suspense>
        </main>
    );
}
