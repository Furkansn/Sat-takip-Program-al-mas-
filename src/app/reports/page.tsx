import { getCurrentCompany } from "@/actions/company";
import { getReportsSummary, getMonthlyTransactions, getCustomerBalances, getTopProducts } from "@/actions/reports";
import ReportsFilter from "@/components/ReportsFilter";
import TransactionsSection from "@/components/reports/TransactionsSection";
import BalanceSection from "@/components/reports/BalanceSection";
import ProductAnalysisSection from "@/components/reports/ProductAnalysisSection";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: { month?: string };
}) {
    // 1. Permission Check
    const company = await getCurrentCompany();

    if (!company?.reportsEnabled) {
        // Pretty unauthorized view
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="8.01"></line><line x1="12" y1="12" x2="12" y2="16"></line></svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Erişim Engellendi</h1>
                    <p className="text-neutral-500 mb-6">
                        Bu özellik firmanız için aktif değil. Kullanmak için sistem yöneticiniz ile iletişime geçin.
                    </p>
                    <Link href="/" className="btn btn-secondary">Ana Sayfaya Dön</Link>
                </div>
            </div>
        );
    }

    // 2. Fetch Data
    const summary = await getReportsSummary(searchParams.month);
    const transactions = await getMonthlyTransactions(searchParams.month);
    const balances = await getCustomerBalances();
    const topProducts = await getTopProducts(searchParams.month);

    const activeMonth = searchParams.month || new Date().toISOString().slice(0, 7);

    return (
        <main>
            {/* Web-Only Notice (Visible only on mobile via CSS) */}
            <div className="webonly-notice">
                <div className="webonly-notice-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Sadece Web'de Kullanılabilir</h2>
                <p className="text-neutral-500 text-sm">
                    Bu modül detaylı analizler içerdiği için geniş ekranlarda görüntülenmelidir.
                </p>
                <Link href="/sales" className="btn btn-secondary w-full justify-center mt-4">
                    Satışlara Dön
                </Link>
            </div>

            {/* Main Content */}
            <div className="container pb-24 hidden md:block">
                {/* Page Header */}
                <div className="page-header mb-8">
                    <div className="flex items-center gap-4">
                        <ReportsFilter />
                    </div>

                    <div className="page-actions">
                        <Link href="/sales" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                            Satışlara Dön
                        </Link>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="report-kpi-grid">
                    <SummaryCard
                        title="Toplam Satış"
                        subtitle="Seçili ay"
                        value={summary.totalSales}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
                        valueColorClass="kpi-sales"
                    />
                    <SummaryCard
                        title="Tahsilat"
                        subtitle="Toplam"
                        value={summary.totalCollections}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        valueColorClass="kpi-collection"
                    />
                    <SummaryCard
                        title="İade"
                        subtitle="Toplam"
                        value={summary.totalReturns}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>}
                        valueColorClass="kpi-return"
                    />
                    <SummaryCard
                        title="Net Durum"
                        subtitle="Kalan"
                        value={summary.netStatus}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>}
                        valueColorClass="kpi-net"
                    />
                </div>

                <TransactionsSection data={transactions} month={activeMonth} />
                <BalanceSection data={balances} month={activeMonth} />
                <ProductAnalysisSection data={topProducts} month={activeMonth} />
            </div>
        </main>
    );
}

function SummaryCard({ title, subtitle, value, icon, valueColorClass }: { title: string, subtitle?: string, value: number, icon: React.ReactNode, valueColorClass: string }) {
    return (
        <div className="report-kpi-card">
            <div className="report-kpi-left">
                <div className="report-kpi-title-row">
                    <div className="report-kpi-title">{title}</div>
                    <div className="report-kpi-icon">{icon}</div>
                </div>
                {subtitle && <div className="report-kpi-subtitle">{subtitle}</div>}
            </div>

            <div className="report-kpi-right">
                <div className={`report-kpi-value ${valueColorClass}`}>
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)}
                </div>
            </div>
        </div>
    );
}
