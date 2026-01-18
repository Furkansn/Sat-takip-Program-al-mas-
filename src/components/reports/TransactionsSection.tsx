"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type TransactionsProps = {
    data: {
        sales: any[];
        collections: any[];
        returns: any[];
    };
    month: string; // For filename
};

export default function TransactionsSection({ data, month }: TransactionsProps) {
    const [activeTab, setActiveTab] = useState<'sales' | 'collections' | 'returns'>('sales');

    const handleDownload = () => {
        let exportData: any[] = [];
        let fileName = "";

        // Format for export
        if (activeTab === 'sales') {
            fileName = `Satislar_${month}`;
            exportData = data.sales.map(s => ({
                Tarih: new Date(s.date).toLocaleDateString("tr-TR"),
                Musteri: `${s.customer.name} ${s.customer.surname}`,
                Tutar: s.totalAmount,
                UrunSayisi: s.items?.length || 0
            }));
        } else if (activeTab === 'collections') {
            fileName = `Tahsilatlar_${month}`;
            exportData = data.collections.map(c => ({
                Tarih: new Date(c.date).toLocaleDateString("tr-TR"),
                Musteri: `${c.customer.name} ${c.customer.surname}`,
                Tutar: c.amount,
                Not: c.note || ""
            }));
        } else {
            fileName = `Iadeler_${month}`;
            exportData = data.returns.map(r => ({
                Tarih: new Date(r.date).toLocaleDateString("tr-TR"),
                Musteri: `${r.customer.name} ${r.customer.surname}`,
                Tutar: r.totalAmount,
                UrunSayisi: r.items?.length || 0
            }));
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, activeTab.toUpperCase());
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    };

    return (
        <div className="card mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold">Aylık Hareketler</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownload}
                        className="btn btn-secondary text-xs flex items-center gap-2"
                        title="Excel İndir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Excel
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/50 mb-6">
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sales' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-foreground'}`}
                >
                    Satışlar ({data.sales.length})
                </button>
                <button
                    onClick={() => setActiveTab('collections')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'collections' ? 'border-green-500 text-green-500' : 'border-transparent text-neutral-500 hover:text-foreground'}`}
                >
                    Tahsilatlar ({data.collections.length})
                </button>
                <button
                    onClick={() => setActiveTab('returns')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'returns' ? 'border-orange-500 text-orange-500' : 'border-transparent text-neutral-500 hover:text-foreground'}`}
                >
                    İadeler ({data.returns.length})
                </button>
            </div>

            {/* Content */}
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="table w-full">
                    <thead className="bg-surface/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left">Tarih</th>
                            <th className="px-4 py-3 text-left">Müşteri</th>
                            <th className="px-4 py-3 text-right">Tutar</th>
                            <th className="px-4 py-3 text-left">Detay</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {activeTab === 'sales' && data.sales.map((item: any) => (
                            <tr key={item.id} className="hover:bg-surface/50">
                                <td className="px-4 py-3 text-sm">{new Date(item.date).toLocaleDateString("tr-TR")}</td>
                                <td className="px-4 py-3 text-sm font-medium">{item.customer.name} {item.customer.surname}</td>
                                <td className="px-4 py-3 text-right font-bold text-primary">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' }).format(item.totalAmount)}
                                </td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{item.items?.length} Ürün</td>
                            </tr>
                        ))}
                        {activeTab === 'collections' && data.collections.map((item: any) => (
                            <tr key={item.id} className="hover:bg-surface/50">
                                <td className="px-4 py-3 text-sm">{new Date(item.date).toLocaleDateString("tr-TR")}</td>
                                <td className="px-4 py-3 text-sm font-medium">{item.customer.name} {item.customer.surname}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-500">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' }).format(item.amount)}
                                </td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{item.note}</td>
                            </tr>
                        ))}
                        {activeTab === 'returns' && data.returns.map((item: any) => (
                            <tr key={item.id} className="hover:bg-surface/50">
                                <td className="px-4 py-3 text-sm">{new Date(item.date).toLocaleDateString("tr-TR")}</td>
                                <td className="px-4 py-3 text-sm font-medium">{item.customer.name} {item.customer.surname}</td>
                                <td className="px-4 py-3 text-right font-bold text-orange-500">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' }).format(item.totalAmount)}
                                </td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{item.items?.length} Ürün</td>
                            </tr>
                        ))}
                        {((activeTab === 'sales' && data.sales.length === 0) ||
                            (activeTab === 'collections' && data.collections.length === 0) ||
                            (activeTab === 'returns' && data.returns.length === 0)) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
