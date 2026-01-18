"use client";

import { useState } from "react";
import Link from "next/link";
import { createCompany, updateCompany } from "@/actions/admin";

type Company = {
    id: string;
    name: string;
    isActive: boolean;
    reportsEnabled: boolean;
    createdAt: Date;
};

export default function CompanyManagement({ initialCompanies }: { initialCompanies: Company[] }) {
    const [companies, setCompanies] = useState(initialCompanies);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setMessage("");

        try {
            let result;
            if (editingCompany) {
                formData.append("id", editingCompany.id);
                result = await updateCompany(null, formData);
            } else {
                result = await createCompany(null, formData);
            }

            if (result.success) {
                setMessage(result.message);
                setTimeout(() => {
                    setIsModalOpen(false);
                    setEditingCompany(null);
                    window.location.reload();
                }, 1000);
            } else {
                setMessage(result.message || "Hata oluştu");
                setIsLoading(false);
            }
        } catch (error) {
            setMessage("Bir hata oluştu.");
            setIsLoading(false);
        }
    };

    const openNewModal = () => {
        setEditingCompany(null);
        setMessage("");
        setIsModalOpen(true);
    };

    const openEditModal = (company: Company) => {
        setEditingCompany(company);
        setMessage("");
        setIsModalOpen(true);
    };

    return (
        <main className="container pb-24">
            {/* Header Section (Unified) */}
            <div className="admin-companies-header">
                {/* Left: Action Button */}
                <button
                    onClick={openNewModal}
                    className="btn btn-primary h-10 px-6 whitespace-nowrap flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Yeni Firma
                </button>

                {/* Right: Toggle Switch */}
                <div className="admin-companies-right">
                    <Link
                        href="/admin/companies"
                        className="btn btn-primary text-white shadow-lg shadow-blue-500/20 h-10 px-4 text-sm font-semibold flex items-center justify-center no-underline"
                        style={{ textDecoration: 'none' }}
                    >
                        Firmalar
                    </Link>
                    <Link
                        href="/admin/users"
                        className="btn btn-secondary bg-transparent border-white/10 text-neutral-400 h-10 px-4 text-sm font-semibold flex items-center justify-center no-underline hover:text-white"
                        style={{ textDecoration: 'none' }}
                    >
                        Kullanıcılar
                    </Link>
                    <Link
                        href="/admin/bulk-import"
                        className="btn btn-secondary bg-transparent border-white/10 text-neutral-400 h-10 px-4 text-sm font-semibold flex items-center justify-center no-underline hover:text-white"
                        style={{ textDecoration: 'none' }}
                    >
                        Veri Yükleme
                    </Link>
                </div>
            </div>


            {/* Content Panel */}
            <div className="card !p-0 overflow-hidden">
                {/* Search & Filter Row */}
                <div className="p-4 md:p-6 border-b border-border/50 flex flex-col md:flex-row gap-4 items-start md:items-center bg-surface/50">
                    <div className="relative w-full md:max-w-xs">
                        <input
                            type="text"
                            placeholder="Firma ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input h-11 w-full pr-10 pl-3"
                        />
                        <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-neutral-400">

                        </div>
                    </div>
                    {/* Add more filters here if needed in future */}
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead className="bg-surface/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">Firma Adı</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">Durum</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">Oluşturulma Tarihi</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">


                            {filteredCompanies.map(c => (
                                <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap" data-label="Firma Adı">
                                        <div className="font-medium text-foreground">{c.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap" data-label="Durum">
                                        <span className={`badge ${c.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                            {c.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap text-sm text-neutral-500" data-label="Oluşturulma Tarihi">
                                        {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap text-right" data-label="Aksiyon">
                                        <button
                                            onClick={() => openEditModal(c)}
                                            className="btn btn-secondary !p-2 h-9 w-9 inline-flex items-center justify-center hover:text-blue-500 hover:border-blue-500/30 transition-all"
                                            title="Düzenle"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCompanies.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 rounded-full bg-surface border border-border/50">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                </svg>
                                            </div>
                                            <p className="font-medium">Kayıt bulunamadı.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 duration-200">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />

                    <div className="card w-full max-w-lg relative z-10 !m-0 !p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-surface/50">
                            <h2 className="text-lg font-bold text-foreground m-0">
                                {editingCompany ? 'Firmayı Düzenle' : 'Yeni Firma Ekle'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-neutral-400 hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {message && (
                                <div className={`mb-6 p-4 rounded-lg text-sm font-medium flex items-center gap-3 ${message.includes('Hata') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                    {message.includes('Hata') ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    )}
                                    {message}
                                </div>
                            )}

                            <form action={handleSubmit} id="companyForm">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-400 mb-2">Firma Adı <span className="text-red-500">*</span></label>
                                        <input
                                            name="name"
                                            defaultValue={editingCompany?.name || ""}
                                            className="input h-11"
                                            placeholder="Örn: Acme Corp."
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-400 mb-2">Durum</label>
                                        <div className="relative">
                                            <select
                                                name="isActive"
                                                defaultValue={editingCompany?.isActive ?? true ? "true" : "false"}
                                                className="input h-11 appearance-none"
                                            >
                                                <option value="true">Aktif</option>
                                                <option value="false">Pasif</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-400 mb-2">Raporlama Modülü (Ücretli)</label>
                                        <div className="relative">
                                            <select
                                                name="reportsEnabled"
                                                defaultValue={editingCompany?.reportsEnabled ?? false ? "true" : "false"}
                                                className="input h-11 appearance-none"
                                            >
                                                <option value="true">Aktif</option>
                                                <option value="false">Pasif</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-border/50 bg-surface/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="btn btn-secondary h-11 px-6"
                                disabled={isLoading}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                form="companyForm"
                                className="btn btn-primary h-11 px-6 min-w-[100px]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Kaydediliyor...
                                    </span>
                                ) : (
                                    'Kaydet'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
