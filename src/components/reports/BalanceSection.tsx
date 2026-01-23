"use client";

import * as XLSX from "xlsx";

type BalanceProps = {
    data: any[];
    month: string;
};

export default function BalanceSection({ data, month }: BalanceProps) {

    const handleDownload = () => {
        const exportData = data.map(c => ({
            Musteri: `${c.name} ${c.surname}`,
            RiskLimiti: c.riskLimit,
            Bakiye: c.balance
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bakiyeler");
        XLSX.writeFile(wb, `Musteri_Bakiyeler_${month}.xlsx`);
    };

    return (
        <div className="card mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Müşteri Bakiyeleri</h2>
                <button
                    onClick={handleDownload}
                    className="btn btn-secondary text-xs flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Excel
                </button>
            </div>

            <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="table w-full">
                    <thead className="bg-surface/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left">Müşteri</th>
                            <th className="px-4 py-3 text-right">Risk Limiti</th>
                            <th className="px-4 py-3 text-right">Bakiye</th>
                            <th className="px-4 py-3 text-center">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {data.map((item: any) => (
                            <tr key={item.id} className="hover:bg-surface/50">
                                <td className="px-4 py-3 font-medium">{item.name} {item.surname}</td>
                                <td className="px-4 py-3 text-right text-neutral-500">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' }).format(item.riskLimit)}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${item.balance > 0 ? 'text-red-500' : item.balance < 0 ? 'text-green-500' : 'text-neutral-500'}`}>
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' }).format(item.balance)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {item.riskLimit > 0 && item.balance > item.riskLimit ? (
                                        <span className="badge bg-red-500/10 text-red-500 border border-red-500/20 text-xs">Risk Aşıldı</span>
                                    ) : item.balance < 0 ? (
                                        <span className="badge bg-green-500/10 text-green-500 border border-green-500/20 text-xs">Alacaklı</span>
                                    ) : (
                                        <span className="badge bg-neutral-100 text-neutral-500 border border-neutral-200 text-xs">Normal</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
