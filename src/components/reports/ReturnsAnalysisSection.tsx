"use client";

import * as XLSX from "xlsx";

type ReturnsAnalysisProps = {
    data: any[];
    month: string;
};

export default function ReturnsAnalysisSection({ data, month }: ReturnsAnalysisProps) {

    const handleDownload = () => {
        const exportData = data.map(c => ({
            Musteri: `${c.customer.name} ${c.customer.surname}`,
            IadeSayisi: c.count,
            ToplamIadeTutari: c.totalAmount
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "IadeOzet");
        XLSX.writeFile(wb, `Iade_Analizi_${month}.xlsx`);
    };

    return (
        <div className="card mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">İade Girilen Müşteriler</h2>
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
                            <th className="px-4 py-3 text-center">İade Adedi</th>
                            <th className="px-4 py-3 text-right">Toplam İade Tutarı</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {(!data || data.length === 0) ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                                    Bu dönemde iade kaydı bulunmuyor.
                                </td>
                            </tr>
                        ) : data.map((item: any) => (
                            <tr key={item.customer.id} className="hover:bg-surface/50">
                                <td className="px-4 py-3 font-medium">{item.customer.name} {item.customer.surname}</td>
                                <td className="px-4 py-3 text-center text-neutral-500">
                                    {item.count}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-red-500">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' }).format(item.totalAmount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
