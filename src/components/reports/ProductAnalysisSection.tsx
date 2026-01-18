"use client";

import * as XLSX from "xlsx";

type ProductProps = {
    data: any[];
    month: string;
};

export default function ProductAnalysisSection({ data, month }: ProductProps) {

    const handleDownload = () => {
        const exportData = data.map(p => ({
            Urun: p.name,
            Adet: p.quantity,
            Ciro: p.revenue,
            Maliyet: p.cost > 0 ? p.cost : "Bilgi Yok",
            Kar: p.profit !== null ? p.profit : "Hesaplanamadı"
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "UrunAnalizi");
        XLSX.writeFile(wb, `Urun_Analizi_${month}.xlsx`);
    };

    return (
        <div className="card mb-8 animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">En Çok Satan Ürünler & Kâr Analizi</h2>
                    <p className="text-xs text-neutral-400 mt-1">* Kâr hesabı için ürün maliyet bilgisi girilmiş olmalıdır.</p>
                </div>
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
                            <th className="px-4 py-3 text-left">Ürün</th>
                            <th className="px-4 py-3 text-right">Adet</th>
                            <th className="px-4 py-3 text-right">Ciro</th>
                            <th className="px-4 py-3 text-right">Kâr</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {data.map((item: any, idx) => (
                            <tr key={idx} className="hover:bg-surface/50">
                                <td className="px-4 py-3 font-medium text-sm">{item.name}</td>
                                <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                                <td className="px-4 py-3 text-right font-medium">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' }).format(item.revenue)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {item.profit !== null ? (
                                        <span className={`font-bold ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' }).format(item.profit)}
                                        </span>
                                    ) : (
                                        <span className="text-neutral-400" title="Maliyet girilirse hesaplanır">---</span>
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
