"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

type Company = {
    id: string;
    name: string;
};

type ImportResult = {
    success: boolean;
    importedCount: number;
    errorCount: number;
    errors: Array<{ row: number; error: string; data: any }>;
    message?: string;
};

export default function BulkImportWizard({ companies }: { companies: Company[] }) {
    const [step, setStep] = useState(1);
    const [importType, setImportType] = useState<'customers' | 'products' | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleDownloadTemplate = () => {
        if (!importType) return;
        window.open(`/api/admin/bulk-import/template?type=${importType}`, '_blank');
    };

    const handleFileUpload = async () => {
        if (!file || !selectedCompanyId || !importType) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", selectedCompanyId);
        formData.append("type", importType);

        try {
            const res = await fetch("/api/admin/bulk-import", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
            setResult({ success: false, importedCount: 0, errorCount: 1, errors: [], message: "Bağlantı hatası" });
        } finally {
            setUploading(false);
        }
    };

    const downloadErrorReport = () => {
        if (!result || !result.errors.length) return;

        const errorsForSheet = result.errors.map(e => ({
            "Satır": e.row,
            "Hata Mesajı": e.error,
            "Veri": JSON.stringify(e.data)
        }));

        const worksheet = XLSX.utils.json_to_sheet(errorsForSheet);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Hatalar");
        XLSX.writeFile(workbook, "Hata_Raporu.xlsx");
    };

    const reset = () => {
        setStep(1);
        setImportType(null);
        setFile(null);
        setResult(null);
    }

    return (
        <main className="container pb-24">
            {/* 1) Page Header Standard */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Toplu Veri Yükleme</h1>
                    <p className="text-neutral-400 text-sm mt-1">Excel şablonları ile hızlı veri aktarımı</p>
                </div>

                <div className="page-actions hidden md:flex">
                    <Link
                        href="/admin/companies"
                        className="btn btn-secondary no-underline"
                    >
                        Firmalar
                    </Link>
                    <Link
                        href="/admin/users"
                        className="btn btn-secondary no-underline"
                    >
                        Kullanıcılar
                    </Link>
                    <div className="btn btn-primary cursor-default">
                        Veri Yükleme
                    </div>
                </div>
            </div>

            {/* 2) Main Content Card */}
            <div className="card">


                {/* Horizontal Stepper */}
                {!result && (
                    <div className="bulk-stepper">
                        {[
                            { id: 1, label: "İşlem Tipi" },
                            { id: 2, label: "Firma Seçimi" },
                            { id: 3, label: "Yükleme" }
                        ].map((s, idx, arr) => {
                            const isDone = step > s.id;
                            const isActive = step === s.id;
                            let statusClass = "bulk-step-idle";
                            if (isActive) statusClass = "bulk-step-active";
                            if (isDone) statusClass = "bulk-step-done";

                            return (
                                <div key={s.id} style={{ display: 'contents' }}>
                                    <div className={`bulk-step ${statusClass}`}>
                                        <div className="bulk-step-icon">
                                            {isDone ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : (
                                                s.id
                                            )}
                                        </div>
                                        <span>{s.label}</span>
                                    </div>
                                    {idx !== arr.length - 1 && (
                                        <div className={`bulk-step-connector ${step > s.id ? 'done' : ''}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Step 1: Type Selection */}
                {step === 1 && !result && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-lg font-bold mb-6">Ne tür bir işlem yapmak istiyorsunuz?</h2>

                        <div className="bulk-import-grid">
                            <div
                                onClick={() => setImportType('customers')}
                                className={`bulk-import-choice ${importType === 'customers' ? 'selected' : ''}`}
                            >
                                <div className="choice-header">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    Müşteri Yükleme
                                </div>
                                <div className="choice-desc">
                                    Excel listesi kullanarak sisteme toplu müşteri kaydı oluşturun. Vergi numarası veya İsim+Telefon kontrolü yapılır.
                                </div>
                            </div>

                            <div
                                onClick={() => setImportType('products')}
                                className={`bulk-import-choice ${importType === 'products' ? 'selected' : ''}`}
                            >
                                <div className="choice-header">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                    Ürün Yükleme
                                </div>
                                <div className="choice-desc">
                                    Stok kartlarını ve ürün özelliklerini toplu içeri aktarın. SKU veya ürün adı eşleşmesi kontrol edilir.
                                </div>
                            </div>
                        </div>

                        <div className="bulk-import-actions justify-end">
                            <button
                                onClick={() => setStep(2)}
                                disabled={!importType}
                                className="btn btn-primary px-8"
                            >
                                Devam Et &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Company Selection */}
                {step === 2 && !result && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
                        <h2 className="text-lg font-bold mb-6">Hedef Firma Seçimi</h2>

                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-neutral-400">Hangi firma için veri yüklenecek?</label>
                            <div className="relative">
                                <select
                                    className="input h-12 w-full appearance-none"
                                    value={selectedCompanyId}
                                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                                >
                                    <option value="" disabled>Firma Seçiniz</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-sm text-neutral-500 italic">
                                * Seçtiğiniz firmaya ait mevcut veriler güncellenmez, sadece yeni kayıtlar eklenir.
                            </p>
                        </div>

                        <div className="bulk-import-actions">
                            <button
                                onClick={() => setStep(1)}
                                className="btn btn-secondary"
                            >
                                &larr; Geri
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!selectedCompanyId}
                                className="btn btn-primary px-8"
                            >
                                Devam Et &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Upload */}
                {step === 3 && !result && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Instructions */}
                            <div className="lg:col-span-1 space-y-6">
                                <div>
                                    <h3 className="mb-2">1. Hazırlık</h3>
                                    <p className="text-sm text-neutral-400 mb-4">
                                        Doğru formatı kullanmak için şablonumuzu indirin.
                                    </p>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="btn btn-secondary w-full justify-center border-blue-500/30 text-blue-500 hover:bg-blue-500/5 group"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        Şablon İndir (.xlsx)
                                    </button>
                                </div>

                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-yellow-600/90 text-sm">
                                    <p className="font-bold mb-2 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        Kritik Kurallar
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 opacity-90 text-xs">
                                        {importType === 'customers' ? (
                                            <>
                                                <li><b>name</b> alanı zorunludur.</li>
                                                <li><b>tax_number</b> benzersiz olmalıdır.</li>
                                            </>
                                        ) : (
                                            <>
                                                <li><b>name</b> alanı zorunludur.</li>
                                                <li><b>led_code</b> (SKU) benzersiz olmalıdır.</li>
                                                <li><b>led_st_code, product_group...</b> eklenebilir.</li>
                                            </>
                                        )}
                                        <li>İlk satır (başlıklar) silinmemelidir.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right: Dropzone */}
                            <div className="lg:col-span-2">
                                <h3 className="mb-2">2. Dosya Yükleme</h3>
                                <div className="bulk-import-dropzone relative">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 z-10 transition-opacity bg-surface/50 backdrop-blur-[1px] rounded-[14px]">
                                        <span className="btn btn-primary">Dosya Seç</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-4">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${file ? 'bg-green-500/10 text-green-500' : 'bg-surface border border-border text-neutral-400'}`}>
                                            {file ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                            )}
                                        </div>
                                        <div>
                                            {file ? (
                                                <div className="text-center">
                                                    <p className="font-bold text-lg text-foreground">{file.name}</p>
                                                    <p className="text-sm text-neutral-400">{(file.size / 1024).toFixed(1)} KB - Hazır</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="font-semibold text-foreground">Dosyayı buraya sürükleyin</p>
                                                    <p className="text-sm text-neutral-400 mt-1">veya tıklayarak seçin (.xlsx, .csv)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bulk-import-actions">
                            <button
                                onClick={() => setStep(2)}
                                className="btn btn-secondary"
                                disabled={uploading}
                            >
                                &larr; Geri
                            </button>
                            <button
                                onClick={handleFileUpload}
                                disabled={!file || uploading}
                                className="btn btn-primary px-8 min-w-[150px]"
                            >
                                {uploading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        İşleniyor...
                                    </span>
                                ) : (
                                    "Yüklemeyi Başlat"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Success / Error Result View */}
                {result && (
                    <div className="animate-in zoom-in-95 duration-300 py-8 px-4 text-center max-w-2xl mx-auto">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${result.importedCount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {result.importedCount > 0 ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            )}
                        </div>

                        <h2 className="text-2xl font-bold mb-2">İşlem Tamamlandı</h2>
                        <p className="text-neutral-400 mb-8">
                            Veri yükleme işlemi sona erdi. Aşağıdaki özeti inceleyebilirsiniz.
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="p-4 rounded-xl bg-surface border border-border/50">
                                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Toplam</div>
                                <div className="text-2xl font-black text-foreground">{result.importedCount + result.errorCount}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                <div className="text-xs font-bold uppercase tracking-wider text-green-600/70 mb-1">Başarılı</div>
                                <div className="text-2xl font-black text-green-500">{result.importedCount}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                <div className="text-xs font-bold uppercase tracking-wider text-red-600/70 mb-1">Hatalı</div>
                                <div className="text-2xl font-black text-red-500">{result.errorCount}</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            {result.errorCount > 0 && (
                                <button
                                    onClick={downloadErrorReport}
                                    className="btn btn-secondary text-red-400 hover:text-red-500 hover:bg-red-500/5 border-red-500/20"
                                >
                                    ⚠️ Hata Raporunu İndir (.xlsx)
                                </button>
                            )}
                            <button onClick={reset} className="btn btn-primary px-8">
                                Yeni İşlem Yap
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
