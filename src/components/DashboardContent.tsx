
import Link from "next/link";
import { getDashboardStats, getLatestSales, getTopProducts } from "@/actions/dashboard";
import TopProductsChart from "@/components/TopProductsChart";
import DashboardSaleRow from "@/components/DashboardSaleRow";

export default async function DashboardContent({ filter }: { filter: 'all' | 'month' | 'today' }) {
    // 1. Parallel Data Fetching
    const [stats, latestSales, topProducts] = await Promise.all([
        getDashboardStats(filter),
        getLatestSales(filter),
        getTopProducts(filter)
    ]);

    const getFilterLabel = () => {
        if (filter === 'today') return 'Bugün';
        if (filter === 'month') return 'Bu Ay';
        return 'Toplam';
    };

    return (
        <>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                    <h3>{getFilterLabel()} Satış</h3>
                    <div className="stat-value">
                        ${stats.sales.toLocaleString('en-US')}
                    </div>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                    <h3>{getFilterLabel()} Tahsilat</h3>
                    <div className="stat-value" style={{ color: 'var(--color-collection)' }}>
                        ${stats.collection.toLocaleString('en-US')}
                    </div>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                    <h3>Açık Bakiye (Genel)</h3>
                    <div className="stat-value" style={{ color: 'var(--color-debt)' }}>
                        ${stats.balance.toLocaleString('en-US')}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Latest Sales */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem' }}>Son Satışlar</h2>
                    {latestSales.length === 0 ? (
                        <p style={{ color: 'var(--color-neutral)' }}>Bu dönemde satış yok.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Müşteri / Tarih</th>
                                    <th style={{ textAlign: 'right' }}>Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestSales.map(sale => (
                                    <DashboardSaleRow key={sale.id} sale={sale} />
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link href="/sales" style={{ color: 'var(--primary-blue)', textDecoration: 'none', fontWeight: 500 }}>
                            Tüm Satışları Gör →
                        </Link>
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem' }}>Çok Satan Ürünler</h2>
                    <TopProductsChart data={topProducts} />
                </div>
            </div>
        </>
    );
}
