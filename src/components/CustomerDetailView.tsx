"use client";

import { useState, useEffect } from "react";
import { updateRiskLimit, addCollection, updateCustomer } from "@/actions/customer";
import { createReturn, updateReturn } from "@/actions/return";
import { updateSale, getProducts, cancelSale } from "@/actions/transaction";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CustomerStatusToggle = ({ defaultActive }: { defaultActive: boolean }) => {
    const [isActive, setIsActive] = useState(defaultActive);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isActive ? '#22c55e' : '#94a3b8', minWidth: '40px', textAlign: 'right' }}>
                {isActive ? 'AKTİF' : 'PASİF'}
            </span>
            <div
                onClick={() => setIsActive(!isActive)}
                style={{
                    width: '50px',
                    height: '26px',
                    background: isActive ? '#22c55e' : '#cbd5e1',
                    borderRadius: '13px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                <div style={{
                    width: '22px',
                    height: '22px',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    transform: isActive ? 'translateX(24px)' : 'translateX(0)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
            </div>
            <input
                type="checkbox"
                name="isActive"
                checked={isActive}
                readOnly
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default function CustomerDetailView({ customer }: { customer: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'sales' | 'collections' | 'returns'>('sales');
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [showExportModal, setShowExportModal] = useState(false);

    // Edit Sale State
    const [editingSale, setEditingSale] = useState<any>(null);
    const [editFormItems, setEditFormItems] = useState<any[]>([]);
    const [productList, setProductList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Collection Modal State
    const [collectionMethod, setCollectionMethod] = useState<'cash' | 'transfer' | 'creditCard'>('cash');
    const [commissionRate, setCommissionRate] = useState<number>(0);
    const [collectionAmount, setCollectionAmount] = useState<string>("");

    // Return Form State
    const [returnItems, setReturnItems] = useState<any[]>([{ productName: "", quantity: "", unitPrice: "" }]);

    const addReturnItem = () => {
        setReturnItems([...returnItems, { productName: "", quantity: "", unitPrice: "" }]);
    };

    const removeReturnItem = (index: number) => {
        if (returnItems.length > 1) {
            const newItems = [...returnItems];
            newItems.splice(index, 1);
            setReturnItems(newItems);
        }
    };

    const updateReturnItem = (index: number, field: string, value: any) => {
        const newItems = [...returnItems];
        (newItems[index] as any)[field] = value;
        setReturnItems(newItems);
    };

    const calculateReturnTotal = () => {
        return returnItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    };

    async function onSaveReturn() {
        if (returnItems.some(i => !i.productName || i.quantity <= 0)) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }
        try {
            setLoading(true);
            await createReturn(customer.id, returnItems.map(i => ({
                ...i,
                quantity: Number(i.quantity || 0),
                unitPrice: Number(i.unitPrice || 0)
            })));
            setShowReturnModal(false);
            setReturnItems([{ productName: "", quantity: "", unitPrice: "" }]); // Reset
            router.refresh();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    // Fetch products once
    useEffect(() => {
        getProducts().then(data => setProductList(data.products));
    }, []);

    const openEditModal = (sale: any) => {
        setEditingSale(sale);
        setEditFormItems(sale.items.map((i: any) => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })));
    };

    const handleProductChange = (index: number, productId: string) => {
        const product = productList.find(p => p.id === productId);
        const newItems = [...editFormItems];
        newItems[index].productId = productId;
        if (product) {
            newItems[index].productName = product.name;
            newItems[index].unitPrice = product.price;
        } else {
            newItems[index].productName = "";
            newItems[index].unitPrice = 0;
        }
        setEditFormItems(newItems);
    };

    const updateEditItem = (index: number, field: string, value: any) => {
        const newItems = [...editFormItems];
        (newItems[index] as any)[field] = value;
        setEditFormItems(newItems);
    };

    const addEditItem = () => {
        setEditFormItems([...editFormItems, { productId: "", productName: "", quantity: 1, unitPrice: 0 }]);
    };

    const removeEditItem = (index: number) => {
        if (editFormItems.length > 1) {
            const newItems = [...editFormItems];
            newItems.splice(index, 1);
            setEditFormItems(newItems);
        }
    };

    const calculateEditTotal = () => {
        return editFormItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    async function onSaveSale() {
        if (editFormItems.some(i => !i.productName || i.quantity <= 0)) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }
        try {
            setLoading(true);
            await updateSale(editingSale.id, { items: editFormItems });
            setEditingSale(null);
            router.refresh();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    // Edit Return State
    const [editingReturn, setEditingReturn] = useState<any>(null);
    const [editReturnItems, setEditReturnItems] = useState<any[]>([]);

    const openReturnEditModal = (ret: any) => {
        setEditingReturn(ret);
        setEditReturnItems(ret.items.map((i: any) => ({
            ...i,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice)
        })));
    };

    async function onSaveEditReturn() {
        if (editReturnItems.some(i => !i.productName || i.quantity <= 0)) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }
        try {
            setLoading(true);
            await updateReturn(editingReturn.id, editReturnItems);
            setEditingReturn(null);
            router.refresh();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    // Checking risk status
    const limit = customer.riskLimit;
    const usageRatio = limit > 0 ? (customer.balance / limit) : 0;

    let statusAlert = null;

    if (limit > 0) {
        if (customer.balance > limit) {
            statusAlert = (
                <div className="badge-warning" style={{ marginTop: '1rem', width: '100%', boxSizing: 'border-box', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', whiteSpace: 'normal' }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🛑</span>
                    <span style={{ flex: 1 }}>
                        <strong>Limit Aşıldı:</strong> Müşteri risk limitini ({limit.toLocaleString('en-US')}) aştı.
                    </span>
                </div>
            );
        } else if (usageRatio >= 0.8) {
            statusAlert = (
                <div className="badge-warning" style={{ marginTop: '1rem', width: '100%', boxSizing: 'border-box', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', whiteSpace: 'normal' }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
                    <span style={{ flex: 1 }}>
                        <strong>Kritik Seviye:</strong> Müşteri risk limitine (%{(usageRatio * 100).toFixed(0)}) yaklaştı.
                    </span>
                </div>
            );
        }
    }

    // Segment Badge Logic
    const segment = customer.segment || 'bronze';
    let segmentBadge = null;
    let segmentTitle = "";
    if (segment === 'gold') {
        segmentTitle = "%10 İndirim";
        segmentBadge = <span className="badge" title={segmentTitle} style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)', verticalAlign: 'middle', marginLeft: '0.5rem', fontSize: '0.8rem' }}>GOLD</span>;
    } else if (segment === 'silver') {
        segmentTitle = "%5 İndirim";
        segmentBadge = <span className="badge" title={segmentTitle} style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', verticalAlign: 'middle', marginLeft: '0.5rem', fontSize: '0.8rem' }}>SILVER</span>;
    } else {
        segmentTitle = "İndirim Yok";
        segmentBadge = <span className="badge" title={segmentTitle} style={{ background: 'rgba(180, 83, 9, 0.2)', color: '#b45309', border: '1px solid rgba(180, 83, 9, 0.3)', verticalAlign: 'middle', marginLeft: '0.5rem', fontSize: '0.8rem' }}>BRONZE</span>;
    }

    const createWorkbook = () => {
        const transactions: any[] = [];

        // Add Sales (Flattened by Item)
        customer.sales.forEach((s: any) => {
            // Filter out cancelled sales
            if (s.status === 'cancelled') return;

            s.items.forEach((item: any) => {
                const listPrice = item.listUnitPrice || item.unitPrice; // Fallback
                const discountRate = item.appliedDiscountRate || 0;

                transactions.push({
                    groupId: s.id, // Add groupId for visual grouping
                    date: new Date(s.date),
                    createdAt: new Date(s.createdAt || s.date), // Fallback to date if createdAt missing
                    type: 'Satış',
                    description: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    listPrice: listPrice,
                    discountRate: discountRate,
                    itemTotal: item.quantity * item.unitPrice,
                    debt: item.quantity * item.unitPrice,
                    credit: 0
                });
            });
        });

        // Add Collections
        customer.collections.forEach((c: any) => {
            let typeLabel = 'Tahsilat';
            const note = c.note || '';
            const lowerNote = note.toLowerCase();

            if (lowerNote.startsWith('nakit')) typeLabel = 'Tahsilat - Nakit';
            else if (lowerNote.startsWith('havale')) typeLabel = 'Tahsilat - Havale';
            else if (lowerNote.startsWith('k.kartı')) typeLabel = 'Tahsilat - K.Kartı';

            transactions.push({
                groupId: c.id,
                date: new Date(c.date),
                createdAt: new Date(c.createdAt || c.date),
                type: typeLabel,
                description: c.note || 'Tahsilat',
                quantity: '-',
                unitPrice: '-',
                listPrice: '-',
                discountRate: '-',
                itemTotal: '-',
                debt: 0,
                credit: c.amount
            });
        });

        // Add Returns
        if (customer.returns) {
            customer.returns.forEach((r: any) => {
                r.items.forEach((item: any) => {
                    transactions.push({
                        groupId: r.id,
                        date: new Date(r.date),
                        createdAt: new Date(r.createdAt || r.date),
                        type: 'İade',
                        description: item.productName + ' (İade)',
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        listPrice: '-',
                        discountRate: '-',
                        itemTotal: item.quantity * item.unitPrice,
                        debt: 0,
                        credit: item.quantity * item.unitPrice // Returns are credits
                    });
                });
            });
        }

        // 1. Sort by date ASCENDING (with time) then by createdAt for stable timeline
        transactions.sort((a, b) => {
            const tA = a.date.getTime();
            const tB = b.date.getTime();
            if (tA !== tB) return tA - tB;
            // Tie-break with createdAt
            return (a.createdAt.getTime() || 0) - (b.createdAt.getTime() || 0);
        });

        // 2. Calculate running balance
        let balance = 0;
        transactions.forEach(t => {
            balance += (t.debt - t.credit);
            t.balanceSnapshot = balance;
        });

        // 3. Reverse to show Newest First (Descending)
        transactions.reverse();

        const transactionRows = transactions.map((t, index) => {
            // Check if previous item (which is actually next in time, due to reverse) has same groupId
            // But here checking PREVIOUS index in the REVERSED list means checking standard visual order
            const prev = transactions[index - 1];
            const isSameGroup = prev && prev.groupId === t.groupId;

            return [
                isSameGroup ? '' : t.date.toLocaleDateString('tr-TR'),
                isSameGroup ? '' : t.type,
                t.description,
                t.quantity,
                t.unitPrice !== '-' ? Number(t.unitPrice).toLocaleString('en-US') : '-',
                t.itemTotal !== '-' ? Number(t.itemTotal).toLocaleString('en-US') : '-',
                t.debt > 0 ? t.debt : '',
                t.credit > 0 ? t.credit : '',
                t.balanceSnapshot
            ];
        });

        const totalDebt = transactions.reduce((sum, t) => sum + t.debt, 0);
        const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);

        // Summary Rows (Top of the sheet)
        const summaryRows = [
            ["MÜŞTERİ HESAP EKSTRESİ"],
            [""],
            ["Sayın", `${customer.name} ${customer.surname}`],
            ["Telefon", customer.phone || '-'],
            ["Adres", customer.address || '-'],
            ["İl", customer.city ? customer.city.toLocaleUpperCase('tr-TR') : '-'],
            ["Vergi No", customer.taxId || '-'],
            ["Rapor Tarihi", new Date().toLocaleDateString('tr-TR')],
            [""],
            ["GENEL DURUM"],
            ["Toplam Borç", totalDebt],
            ["Toplam Ödeme", totalCredit],
            ["Güncel Bakiye", customer.balance],
            [""], // Spacer
        ];

        const tableHeader = [
            'Tarih',
            'İşlem Türü',
            'Açıklama / Ürün',
            'Adet',
            'Birim Fiyat',
            'Toplam',
            'Borç ($)',
            'Tahsilat ($)',
            'Bakiye ($)'
        ];

        const footerRow = [
            '', '', 'GENEL TOPLAM', '', '', '',
            totalDebt,
            totalCredit,
            customer.balance
        ];

        // Combine all data
        const wsData = [
            ...summaryRows,
            tableHeader,
            ...transactionRows,
            footerRow
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Customize columns width
        const wscols = [
            { wch: 12 }, // Date
            { wch: 18 }, // Type - Increased
            { wch: 40 }, // Description - Increased
            { wch: 6 },  // Qty
            { wch: 12 }, // Unit Price
            { wch: 15 }, // Item Total
            { wch: 12 }, // Debt
            { wch: 12 }, // Credit - (Tahsilat)
            { wch: 12 }, // Balance
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Hesap Ekstresi");

        return wb;
    };

    const handleDownload = async () => {
        try {
            // Using Client-side generation now, so no need for fetch to API
            // ... actually the function createWorkbook uses local data, so we don't need the API call if we use createWorkbook
            // BUT the original code was:
            // const wb = createWorkbook();
            // XLSX.writeFile(wb, filename);

            // Wait, the original code in view_file showed `const createWorkbook = ...` BUT `handleDownload` was fetching `/api/export-customer`.
            // The `createWorkbook` function I saw in lines 225-379 was NOT being used by `handleDownload` in lines 381-425?
            // Let's re-read the original file content carefully.

            // Ah, looking at the previous view_file output:
            // Line 225 defines createWorkbook.
            // Line 381 defines handleDownload, and it calls fetch('/api/export-customer').

            // Implication: There is seemingly DEAD CODE or alternative code for client-side export (`createWorkbook`) 
            // OR the user wants me to use the client side generation?

            // The USER REQUEST says: "button... basınca açılan menüden alınan excel ve pdf raporlarında".
            // Since `CustomerDetailView` has both logic, and I am editing `CustomerDetailView`, I should probably ensure BOTH paths or the ACTIVE path is updated.

            // However, `handleDownload` (Line 381) calls an API. If I update `createWorkbook` (Line 225), it won't affect the API call.
            // I should check if `createWorkbook` is used anywhere. If not, I might need to update the API route `/api/export-customer` instead!

            // Let's check where `createWorkbook` is called. It might be passed to a child component or used in a different handler.
            // Actually, the button at line 769 calls `setShowExportModal(true)`.
            // I haven't seen the `ExportModal` content yet (it was likely further down in the file).
            // Let's assume the modal has buttons that might call `createWorkbook` (Client Side) or `handleDownload` (Server Side).

            // If I look at `generatePdfDoc` (Line 427), it uses client-side logic and `handlePdfDownload` (Line 631) uses it.
            // `handlePdfDownload` is likely used in the modal.

            // If `handleDownload` (Excel) is using the API, I must find that API route and update it too, OR switch Excel generation to client-side using `createWorkbook` which is already half-implemented there.
            // Given the complexity of sharing code between client/server and the fact that `createWorkbook` is already there (maybe legacy or preferred replacement), 
            // I will update `createWorkbook` AND `generatePdfDoc`. 

            // Then I will check line 769 button triggers `setShowExportModal(true)`.
            // I need to see the Modal code to see what functions it calls.

            // IMPORTANT: I will proceed with updating the CLIENT SIDE logic in `generatePdfDoc` (which I know is used for PDF). 
            // For Excel, if I update `createWorkbook`, I should make sure it is used.
            // If the original `handleDownload` fetches an API, I should probably changing it to use `createWorkbook` instead to ensure consistency and avoid finding/editing hidden API files if client-side is sufficient (and it seems to be given `createWorkbook` presence).
            // Or I can search for the API route.

            // Let's update `generatePdfDoc` first as it is clearly client side. 
            // NOTE: I am replacing `createWorkbook` and `generatePdfDoc` in this tool call.

            // I will replace `handleDownload` to use `createWorkbook` client-side instead of the API, ensuring my changes take effect immediately without hunting for API routes. This is safer and cleaner since I have all data on client.

            const wb = createWorkbook();
            const cleanName = `${customer.name}_${customer.surname}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            XLSX.writeFile(wb, `ekstre_${cleanName}.xlsx`);

        } catch (error: any) {
            console.error("Export failed:", error);
            alert("Dosya indirilemedi: " + error.message);
        }
    };

    const generatePdfDoc = async () => {
        const doc = new jsPDF();

        // 0. Load Turkish Fonts (Roboto Regular & Medium)
        try {
            const fontBaseUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/';

            const [regularBytes, mediumBytes] = await Promise.all([
                fetch(fontBaseUrl + 'Roboto-Regular.ttf').then(res => res.arrayBuffer()),
                fetch(fontBaseUrl + 'Roboto-Medium.ttf').then(res => res.arrayBuffer())
            ]);

            // Browser-safe ArrayBuffer to Base64
            const toBase64 = (buffer: ArrayBuffer) => {
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary);
            };

            doc.addFileToVFS('Roboto-Regular.ttf', toBase64(regularBytes));
            doc.addFileToVFS('Roboto-Medium.ttf', toBase64(mediumBytes));

            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');

            doc.setFont('Roboto');
        } catch (e) {
            console.error("Font loading failed, falling back to default", e);
        }

        // 1. Prepare Data
        const transactions: any[] = [];
        customer.sales.forEach((s: any) => {
            // Filter out cancelled sales
            if (s.status === 'cancelled') return;

            s.items.forEach((item: any) => {
                const listPrice = item.listUnitPrice || item.unitPrice;
                const discountRate = item.appliedDiscountRate || 0;
                transactions.push({
                    groupId: s.id,
                    date: new Date(s.date),
                    createdAt: new Date(s.createdAt || s.date),
                    type: 'Satış',
                    description: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    listPrice: listPrice,
                    discountRate: discountRate,
                    itemTotal: item.quantity * item.unitPrice,
                    debt: item.quantity * item.unitPrice,
                    credit: 0
                });
            });
        });
        customer.collections.forEach((c: any) => {
            let typeLabel = 'Tahsilat';
            const note = c.note || '';
            const lowerNote = note.toLowerCase();

            if (lowerNote.startsWith('nakit')) typeLabel = 'Tahsilat - Nakit';
            else if (lowerNote.startsWith('havale')) typeLabel = 'Tahsilat - Havale';
            else if (lowerNote.startsWith('k.kartı')) typeLabel = 'Tahsilat - K.Kartı';

            transactions.push({
                groupId: c.id,
                date: new Date(c.date),
                createdAt: new Date(c.createdAt || c.date),
                type: typeLabel,
                description: c.note || 'Tahsilat',
                quantity: '-',
                unitPrice: '-',
                listPrice: '-',
                discountRate: '-',
                itemTotal: '-',
                debt: 0,
                credit: c.amount
            });
        });
        if (customer.returns) {
            customer.returns.forEach((r: any) => {
                r.items.forEach((item: any) => {
                    transactions.push({
                        groupId: r.id,
                        date: new Date(r.date),
                        createdAt: new Date(r.createdAt || r.date),
                        type: 'İade',
                        description: item.productName + ' (İade)',
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        listPrice: '-',
                        discountRate: '-',
                        itemTotal: item.quantity * item.unitPrice,
                        debt: 0,
                        credit: item.quantity * item.unitPrice
                    });
                });
            });
        }

        // 1. Sort by date ASCENDING then by createdAt
        transactions.sort((a, b) => {
            const tA = a.date.getTime();
            const tB = b.date.getTime();
            if (tA !== tB) return tA - tB;
            return (a.createdAt.getTime() || 0) - (b.createdAt.getTime() || 0);
        });

        // 2. Calculate running balance
        let runningBalance = 0;
        transactions.forEach(t => {
            runningBalance += (t.debt - t.credit);
            t.balanceSnapshot = runningBalance;
        });

        // 3. Reverse for Display
        transactions.reverse();

        // 2. Generate PDF Content
        doc.setFontSize(18);
        doc.text("MÜŞTERİ HESAP EKSTRESİ", 14, 20);

        // Company Name (Top Right)
        doc.setFontSize(10);
        doc.setTextColor(100);
        const companyName = customer.company?.name || "Satış Takip Sistemi";
        const dateStr = `Tarih: ${new Date().toLocaleDateString('tr-TR')}`;
        doc.text(companyName, 200, 20, { align: 'right' });
        doc.text(dateStr, 200, 28, { align: 'right' });

        // Customer Info Box
        const totalDebt = transactions.reduce((sum, t) => sum + t.debt, 0);
        const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
        const balance = customer.balance;

        doc.setDrawColor(200);
        doc.setFillColor(250, 250, 250);
        doc.rect(14, 35, 182, 35, 'FD'); // Increased height

        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`${customer.name} ${customer.surname}`, 20, 45);
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(`Tel: ${customer.phone || '-'}`, 20, 52);
        doc.text(`İl: ${customer.city ? customer.city.toLocaleUpperCase('tr-TR') : '-'}`, 20, 57);
        doc.text(`Adres: ${customer.address || '-'}`, 20, 62);
        doc.text(`Vergi No: ${customer.taxId || '-'}`, 20, 67);

        // Stats right aligned
        doc.setTextColor(50);
        doc.text(`Toplam Borç: $${totalDebt.toLocaleString('en-US')}`, 120, 45);
        doc.text(`Toplam Tahsilat: $${totalCredit.toLocaleString('en-US')}`, 120, 50);

        // Add Returns to PDF Summary as well if desired, but sticking to basic balance logic
        // user didn't explicitly ask for returns row in PDF header, but consistent with Excel:
        const totalReturns = customer.returns ? customer.returns.reduce((sum: number, r: any) => sum + r.totalAmount, 0) : 0;
        if (totalReturns > 0) {
            doc.setTextColor(220, 20, 60);
            doc.text(`Toplam İade: -$${totalReturns.toLocaleString('en-US')}`, 120, 55);
        }

        doc.setFontSize(11);
        doc.setTextColor(balance > 0 ? 200 : 0, balance > 0 ? 0 : 150, 0);
        // Adjust Y position based on if Returns is shown
        doc.text(`Bakiye: $${balance.toLocaleString('en-US')} ${balance > 0 ? '(Borç)' : '(Alacak)'}`, 120, totalReturns > 0 ? 62 : 57);

        // 3. Table
        const tableBody = transactions.map((t, index) => {
            const prev = transactions[index - 1];
            const isSameGroup = prev && prev.groupId === t.groupId;

            return [
                isSameGroup ? '' : t.date.toLocaleDateString('tr-TR'),
                isSameGroup ? '' : t.type,
                t.description,
                t.quantity !== '-' ? t.quantity : '',
                t.unitPrice !== '-' ? `$${Number(t.unitPrice).toLocaleString('en-US')}` : '',
                t.itemTotal !== '-' ? `$${Number(t.itemTotal).toLocaleString('en-US')}` : '',
                t.debt > 0 ? `$${t.debt.toLocaleString('en-US')}` : '-',
                t.credit > 0 ? `$${t.credit.toLocaleString('en-US')}` : '-',
                `$${t.balanceSnapshot.toLocaleString('en-US')}`,
                // Hidden column for grouping info for hooks if needed, but here leveraging 'content' check or index
                t.groupId
            ];
        });

        // Use autoTable
        autoTable(doc, {
            head: [['Tarih', 'Tür', 'Açıklama', 'Adet', 'Birim', 'Toplam', 'Borç', 'Tahsilat', 'Bakiye']],
            body: tableBody,
            startY: 80,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2, font: 'Roboto' }, // Use Roboto
            columnStyles: {
                0: { cellWidth: 18 }, // Date
                1: { cellWidth: 18 }, // Type - Increased width
                2: { cellWidth: 'auto' }, // Desc
                3: { cellWidth: 10, halign: 'center' }, // Qty
                4: { cellWidth: 15, halign: 'right' }, // Unit
                5: { cellWidth: 18, halign: 'right' }, // Total
                6: { cellWidth: 18, halign: 'right' }, // Debt
                7: { cellWidth: 18, halign: 'right' }, // Credit - (Tahsilat)
                8: { cellWidth: 20, halign: 'right' }, // Balance
            },
            didParseCell: (data) => {
                // Grouping Styling: if empty date/type (meaning same group), style it?
                // Actually, let's alternate background color based on groupId
                // Data has access to row.raw which is the array of data.
                // But autoTable might not pass the full original object, just the array.
                // I added groupId as the last element in tableBody.

                const rawRow = data.row.raw as any[];
                if (rawRow && rawRow.length > 0) {
                    const groupId = rawRow[rawRow.length - 1]; // Last item is groupId
                    // We need a deterministic color for this group ID, or simple alternation.
                    // Since rows are ordered, we can check if groupId changed from previous row?
                    // No, simply: use local variable in closure to track?
                    // Hard since didParseCell is called cell by cell.

                    // Better: Check row index.
                    // But "stripe" theme does it by row index. We want by Group.
                    // Let's settle for "No Stripe" (theme: plain) and manual coloring?
                    // Or just keep the Grid theme but make repeated items clear (which I did by blanking text).

                    // Requirement: "renk veya gösterim şekli ile anlaşılır bir hale getir".
                    // Blanking out Date/Type is a very strong "gösterim şekli" for grouping.
                    // Let's stick with that for now as it's cleaner than rainbow colors.
                    // Additionally, we can add a top border if it's a NEW group.

                    if (data.section === 'body') {
                        const isNewGroup = data.cell.text[0] !== ''; // If text is present in first col, it is header of group
                        if (data.column.index === 0 && !isNewGroup) {
                            // It's a continuation row
                        }

                        // Let's add top border if it is a new group (i.e. first column has text)
                        // This applies to all cells in that row.
                        if (data.column.index === 0) {
                            // Check previous row's groupId
                            const prevRow = data.table.body[data.row.index - 1];
                            const currGroupId = groupId;
                            // Wait, accessing previous row in didParseCell might be tricky if not parsed yet? 
                            // Actually tableBody is fully prepared.

                            // Let's rely on the standard grid. The blank text is sufficient for grouping visualisation.
                            // I will keep the 'grid' theme which puts lines everywhere. 
                            // The user said "renk veya gösterim şekli".
                        }
                    }
                }
            },
            foot: [[
                '',
                '',
                'GENEL TOPLAM',
                '',
                '',
                '',
                `$${totalDebt.toLocaleString('en-US')}`,
                `$${totalCredit.toLocaleString('en-US')}`,
                `$${balance.toLocaleString('en-US')}`
            ]],
            footStyles: {
                fillColor: [240, 240, 240], // Light gray background
                textColor: 50,
                fontStyle: 'bold', // Bold font
                halign: 'right'
            },
            didDrawPage: (data) => {
                // Footer removed as per request
            }
        });

        return doc;
    };

    const handlePdfDownload = async () => {
        const doc = await generatePdfDoc();
        const cleanName = `${customer.name}_${customer.surname}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        doc.save(`ekstre_${cleanName}.pdf`);
    };

    const handleShare = async () => {
        try {
            // Check for Secure Context (Required for Web Share API with files)
            if (!window.isSecureContext) {
                alert("⚠️ Paylaşım özelliği güvenlik nedeniyle sadece HTTPS (Güvenli Bağlantı) veya Localhost üzerinde çalışır.\n\nŞu an yerel bir IP adresi (HTTP) üzerinden bağlandığınız için tarayıcı bu özelliği engelliyor.\n\nLütfen 'PDF Olarak İndir' butonunu kullanın ve dosyayı WhatsApp'tan manuel olarak gönderin.");
                return;
            }

            const doc = await generatePdfDoc();
            const blob = doc.output('blob');
            const cleanName = `${customer.name}_${customer.surname}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const file = new File([blob], `Ekstre_${cleanName}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Hesap Ekstresi - ${customer.name} ${customer.surname}`,
                    text: `Müşteri hesap ekstresi ilişiktedir.`
                });
            } else {
                // Determine plausible reason for failure
                const reason = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
                    ? "iOS üzerinde bu özelliğin çalışması için dosyayı önce 'Dosyalar'a kaydetmeniz gerekebilir."
                    : "Tarayıcınız veya cihazınız web üzerinden doğrudan dosya paylaşımını desteklemiyor olabilir.";

                alert("Cihazınız dosya paylaşımını desteklemiyor.\n\n" + reason + "\n\nAlternatif olarak 'PDF Olarak İndir' butonunu kullanabilirsiniz.");
            }
        } catch (error) {
            console.error("Share failed", error);
            alert("Paylaşım sırasında hata oluştu. Lütfen 'PDF Olarak İndir' seçeneğini deneyin.");
        }
    };

    async function onAddCollection(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;

        const amountVal = parseFloat(collectionAmount);
        if (!collectionAmount || isNaN(amountVal) || amountVal <= 0) {
            alert("Geçerli bir tutar giriniz.");
            return;
        }

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const userNote = formData.get("note") as string;

        let finalAmount = amountVal;
        let finalNote = "";

        if (collectionMethod === 'cash') {
            finalNote = `Nakit${userNote ? ' - ' + userNote : ''}`;
        } else if (collectionMethod === 'transfer') {
            finalNote = `Havale${userNote ? ' - ' + userNote : ''}`;
        } else if (collectionMethod === 'creditCard') {
            const commissionVal = amountVal * (commissionRate / 100);
            const netAmount = amountVal - commissionVal;
            finalAmount = netAmount;

            // Format note
            finalNote = `K.Kartı`;
            if (userNote) finalNote += ` - ${userNote}`;
            if (commissionRate > 0) {
                finalNote += ` (%${commissionRate} Komisyon: ${commissionVal.toLocaleString('en-US')})`;
            }
        }

        try {
            await addCollection(customer.id, finalAmount, finalNote);
            setShowCollectionModal(false);
            setCollectionAmount("");
            setCommissionRate(0);
            setCollectionMethod('cash');
            router.refresh();
        } catch (error: any) {
            alert("Hata: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    async function onUpdateCustomer(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const surname = formData.get("surname") as string;
        const phone = formData.get("phone") as string;
        const address = formData.get("address") as string;
        const city = formData.get("city") as string;
        const taxId = formData.get("taxId") as string;
        const riskLimit = Number(formData.get("riskLimit"));
        const segment = formData.get("segment") as string;
        const isActive = formData.get("isActive") === "on";

        try {
            await updateCustomer(customer.id, { name, surname, phone, address, city, taxId, riskLimit, segment, isActive });
            setShowEditModal(false);
            router.refresh();
        } catch (error: any) {
            alert("Hata: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            {/* Header Section */}
            {/* Header Section */}
            <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '2rem' }}>{customer.name} {customer.surname}</h2>
                            {!customer.isActive && (
                                <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.3)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>PASİF</span>
                            )}
                            {segmentBadge}
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="btn"
                                title="Düzenle"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '1.2rem', height: 'auto', background: 'transparent', border: 'none', color: 'var(--color-neutral)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                •••
                            </button>
                        </div>
                        <div style={{ color: 'var(--color-neutral)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                            <strong style={{ opacity: 0.7, marginRight: '0.5rem' }}>Tel No:</strong> {customer.phone || '-'}
                        </div>
                        {customer.address && (
                            <div style={{ color: 'var(--color-neutral)', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                                <strong style={{ opacity: 0.7, marginRight: '0.5rem' }}>Adres:</strong> {customer.address}
                            </div>
                        )}
                        {customer.city && (
                            <div style={{ color: 'var(--color-neutral)', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                                <strong style={{ opacity: 0.7, marginRight: '0.5rem' }}>İl:</strong> {customer.city.toLocaleUpperCase('tr-TR')}
                            </div>
                        )}
                        {customer.taxId && (
                            <div style={{ color: 'var(--color-neutral)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                                <strong style={{ opacity: 0.7, marginRight: '0.5rem' }}>Vergi No:</strong> {customer.taxId}
                            </div>
                        )}

                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.5rem' }} className={customer.balance > 0 ? "text-debt" : (customer.balance < 0 ? "text-collection" : "")}>
                            ${Math.abs(customer.balance).toLocaleString('en-US')} <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{customer.balance > 0 ? 'Borç' : 'Alacak'}</span>
                        </div>
                        <small style={{ color: 'var(--color-neutral)', fontSize: '1rem' }}>Güncel Bakiye</small>
                        <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', color: 'var(--color-neutral)' }}>
                            <strong style={{ opacity: 0.7, marginRight: '0.5rem' }}>Risk Limiti:</strong> ${customer.riskLimit.toLocaleString('en-US')}
                        </div>
                    </div>
                </div>

                {statusAlert}

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button onClick={() => setShowExportModal(true)} className="btn btn-secondary desk-mobile-export" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        Dışarı Aktar
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('sales')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'sales' ? '2px solid var(--primary-blue)' : '2px solid transparent',
                        color: activeTab === 'sales' ? 'var(--primary-blue)' : 'var(--color-neutral)',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'sales' ? 700 : 500,
                        fontSize: '1rem',
                        transition: 'color 0.2s'
                    }}>
                    Satışlar
                </button>
                <button
                    onClick={() => setActiveTab('collections')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'collections' ? '2px solid var(--primary-blue)' : '2px solid transparent',
                        color: activeTab === 'collections' ? 'var(--primary-blue)' : 'var(--color-neutral)',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'collections' ? 700 : 500,
                        fontSize: '1rem',
                        transition: 'color 0.2s'
                    }}>
                    Tahsilatlar
                </button>
                <button
                    onClick={() => setActiveTab('returns')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'returns' ? '2px solid var(--primary-blue)' : '2px solid transparent',
                        color: activeTab === 'returns' ? 'var(--primary-blue)' : 'var(--color-neutral)',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'returns' ? 700 : 500,
                        fontSize: '1rem',
                        transition: 'color 0.2s'
                    }}>
                    İadeler
                </button>
            </div>

            <div>
                {activeTab === 'collections' && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontSize: '1rem' }}>TAHSİLAT GEÇMİŞİ</h3>
                            <button className="btn btn-primary" onClick={() => setShowCollectionModal(true)}>+ Tahsilat Ekle</button>
                        </div>
                        {customer.collections.length === 0 ? <p style={{ color: 'var(--color-neutral)' }}>Kayıt yok.</p> : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Not</th>
                                        <th style={{ textAlign: 'right' }}>Tutar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customer.collections.map((col: any) => (
                                        <tr key={col.id}>
                                            <td style={{ fontWeight: 600 }}>{new Date(col.date).toLocaleDateString('tr-TR')}</td>
                                            <td>{col.note || '-'}</td>
                                            <td className="text-collection" style={{ textAlign: 'right', fontWeight: 600 }}>${col.amount.toLocaleString('en-US')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="card">
                        <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem', fontSize: '1rem' }}>SATIŞ GEÇMİŞİ</h3>
                        {customer.sales.length === 0 ? <p style={{ color: 'var(--color-neutral)', marginTop: '1rem' }}>Henüz satış yok.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {customer.sales.map((sale: any) => {
                                    const isCancelled = sale.status === 'cancelled';
                                    return (
                                        <div
                                            key={sale.id}
                                            onClick={() => {
                                                if (isCancelled) {
                                                    alert("Bu satış iptal edilmiştir, düzenlenemez.");
                                                    return;
                                                }
                                                openEditModal(sale);
                                            }}
                                            className="sale-card"
                                            style={{
                                                border: '1px solid var(--border)',
                                                padding: '1.25rem',
                                                cursor: isCancelled ? 'not-allowed' : 'pointer',
                                                borderRadius: '12px',
                                                background: isCancelled ? 'rgba(239, 68, 68, 0.05)' : 'var(--surface)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                opacity: isCancelled ? 0.75 : 1
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ background: isCancelled ? '#ef4444' : 'var(--primary-blue)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                        {new Date(sale.date).getDate()} {new Date(sale.date).toLocaleDateString('tr-TR', { month: 'short' })}
                                                    </div>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-neutral)', textDecoration: isCancelled ? 'line-through' : 'none' }}>{new Date(sale.date).getFullYear()}</span>
                                                    {isCancelled && <span className="badge" style={{ fontSize: '0.7em', background: '#fee2e2', color: '#b91c1c' }}>İPTAL EDİLDİ</span>}
                                                    {!isCancelled && sale.discountRateAtTime > 0 && <span className="badge" style={{ fontSize: '0.7em', background: '#ecfccb', color: '#4d7c0f' }}>%{(sale.discountRateAtTime * 100).toFixed(0)} İndirim</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {!isCancelled && <span style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', opacity: 0.8 }}>(Düzenle)</span>}
                                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', textDecoration: isCancelled ? 'line-through' : 'none' }}>${sale.totalAmount.toLocaleString('en-US')}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem', padding: '0 0.5rem' }}>
                                                {sale.items.map((item: any, idx: number) => (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'start',
                                                        fontSize: '0.9rem',
                                                        color: 'var(--color-neutral)',
                                                        padding: '8px 0',
                                                        borderBottom: idx === sale.items.length - 1 ? 'none' : '1px solid var(--border)'
                                                    }}>
                                                        <div style={{ flex: 1, paddingRight: '1rem' }}>
                                                            <span style={{ color: 'rgb(var(--foreground-rgb))', textDecoration: isCancelled ? 'line-through' : 'none' }}>• {item.productName}</span>
                                                        </div>
                                                        <div style={{ whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                                            <span style={{ fontWeight: 500 }}>
                                                                {item.quantity} x ${item.unitPrice.toLocaleString('en-US')}
                                                            </span>
                                                            {!isCancelled && item.appliedDiscountRate > 0 && (
                                                                <span style={{ fontSize: '0.75rem', opacity: 0.7, textDecoration: 'line-through' }}>
                                                                    ${item.listUnitPrice.toLocaleString('en-US')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'returns' && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontSize: '1rem' }}>İADE GEÇMİŞİ</h3>
                            <button className="btn btn-primary" onClick={() => setShowReturnModal(true)}>+ İade Ekle</button>
                        </div>
                        {(!customer.returns || customer.returns.length === 0) ? <p style={{ color: 'var(--color-neutral)' }}>İade kaydı yok.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {customer.returns.map((ret: any) => (
                                    <div
                                        key={ret.id}
                                        onClick={() => openReturnEditModal(ret)}
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            paddingBottom: '1rem',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            background: 'rgba(239, 68, 68, 0.05)',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        className="return-card-hover"
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'rgb(var(--foreground-rgb))' }}>{new Date(ret.date).toLocaleDateString('tr-TR')}</span>
                                                <span className="badge" style={{ fontSize: '0.7em', background: '#fca5a5', color: '#7f1d1d' }}>İADE</span>
                                                <span style={{ fontSize: '0.75rem', color: '#ef4444', opacity: 0.8 }}>(Düzenle)</span>
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444' }}>-${ret.totalAmount.toLocaleString('en-US')}</span>
                                        </div>
                                        <ul style={{ paddingLeft: '1.2rem', color: 'var(--color-neutral)', fontSize: '0.9rem', margin: 0 }}>
                                            {ret.items.map((item: any, idx: number) => (
                                                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                        <span>{item.productName}</span>
                                                        <span style={{ fontWeight: 500 }}>{item.quantity} x ${item.unitPrice}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCollectionModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
                }}>
                    <form onSubmit={onAddCollection} className="card" style={{ width: '90%', maxWidth: '450px', margin: 0 }}>
                        <h3>Tahsilat Ekle</h3>

                        {/* Method Selection */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'var(--surface-hover)', padding: '0.5rem', borderRadius: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setCollectionMethod('cash')}
                                className={collectionMethod === 'cash' ? 'btn btn-primary' : 'btn'}
                                style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
                            >
                                💵 Nakit
                            </button>
                            <button
                                type="button"
                                onClick={() => setCollectionMethod('transfer')}
                                className={collectionMethod === 'transfer' ? 'btn btn-primary' : 'btn'}
                                style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
                            >
                                🏦 Havale
                            </button>
                            <button
                                type="button"
                                onClick={() => setCollectionMethod('creditCard')}
                                className={collectionMethod === 'creditCard' ? 'btn btn-primary' : 'btn'}
                                style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
                            >
                                💳 K.Kartı
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label>Tutar ($)</label>
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                required
                                className="input"
                                autoFocus
                                value={collectionAmount}
                                onChange={(e) => setCollectionAmount(e.target.value)}
                            />
                        </div>

                        {collectionMethod === 'creditCard' && (
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Komisyon Oranı (%)</label>
                                <select
                                    className="select"
                                    value={commissionRate}
                                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                                    style={{ width: '100%' }}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => (
                                        <option key={r} value={r}>%{r}</option>
                                    ))}
                                </select>

                                {collectionAmount && !isNaN(parseFloat(collectionAmount)) && (
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-neutral)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Girilen Tutar:</span>
                                            <span>${parseFloat(collectionAmount).toLocaleString('en-US')}</span>
                                        </div>
                                        {commissionRate > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                                <span>Kesilen Komisyon (%{commissionRate}):</span>
                                                <span>-${(parseFloat(collectionAmount) * (commissionRate / 100)).toLocaleString('en-US')}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed var(--border)', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                                            <span>Tahsil Edilecek Net:</span>
                                            <span>${(parseFloat(collectionAmount) * (1 - (commissionRate / 100))).toLocaleString('en-US')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <label>Not (Opsiyonel)</label>
                            <input name="note" className="input" placeholder="Örn: Kasım bakiyesi..." />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCollectionModal(false)} disabled={loading}>İptal</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Return Modal */}
            {showReturnModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
                        <h3>İade Gir</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            {returnItems.map((item, index) => (
                                <div key={index}
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'var(--surface-hover)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                    <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Ürün</label>
                                        <input
                                            className="input"
                                            placeholder="Ürün adı..."
                                            value={item.productName}
                                            style={{
                                                height: '36px',
                                                fontSize: '0.9rem',
                                                width: '100%',
                                                padding: '0 0.5rem'
                                            }}
                                            onChange={(e) => updateReturnItem(index, 'productName', e.target.value)}
                                        />
                                    </div>

                                    <div style={{ width: '80px', flexShrink: 0 }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Adet</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.quantity}
                                            min="1"
                                            onChange={(e) => updateReturnItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                                            style={{ textAlign: 'center', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ width: '100px', flexShrink: 0 }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Birim Fiyat ($)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.unitPrice}
                                            onChange={(e) => updateReturnItem(index, 'unitPrice', e.target.value === '' ? '' : Number(e.target.value))}
                                            style={{ textAlign: 'right', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ flex: '0 0 auto', textAlign: 'right', minWidth: '80px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-neutral)', marginBottom: '0.2rem' }}>Toplam</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString('en-US')}</div>
                                    </div>

                                    <div style={{ width: '30px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                                        <button type="button" onClick={() => removeReturnItem(index)} className="btn" style={{ padding: 0, color: 'var(--color-neutral)', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addReturnItem} className="btn" style={{ border: '1px dashed var(--border)', width: '100%', marginTop: '1rem', color: 'var(--color-neutral)' }}>
                            + İade Ürünü Ekle
                        </button>

                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                Toplam İade: ${calculateReturnTotal().toLocaleString('en-US')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowReturnModal(false)}
                                    disabled={loading}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={onSaveReturn}
                                    disabled={loading}
                                >
                                    {loading && <span className="spinner"></span>}
                                    {loading ? "Kaydediliyor..." : "İadeyi Gir"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', margin: 0, textAlign: 'center', padding: '2rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Hesap Ekstresi Oluştur</h3>
                            <p style={{ color: 'var(--color-neutral)', marginBottom: '0' }}>
                                {customer.name} {customer.surname} için güncel hesap ekstresi hazırlanacak.
                            </p>
                        </div>

                        <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Toplam Borç:</span>
                                <strong>${customer.sales.filter((s: any) => s.status !== 'cancelled').reduce((sum: number, s: any) => sum + s.totalAmount, 0).toLocaleString('en-US')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Toplam Tahsilat:</span>
                                <strong>${customer.collections.reduce((sum: number, c: any) => sum + c.amount, 0).toLocaleString('en-US')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Toplam İade:</span>
                                <strong style={{ color: '#ef4444' }}>-${(customer.returns ? customer.returns.reduce((sum: number, r: any) => sum + r.totalAmount, 0) : 0).toLocaleString('en-US')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                <span>Güncel Bakiye:</span>
                                <strong className={customer.balance > 0 ? "text-debt" : "text-collection"}>
                                    ${Math.abs(customer.balance).toLocaleString('en-US')} {customer.balance > 0 ? '(Borç)' : '(Alacak)'}
                                </strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button onClick={handleDownload} className="btn btn-primary" style={{ padding: '0.8rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span>⬇️</span> Excel Olarak İndir
                            </button>

                            <button onClick={handlePdfDownload} className="btn" style={{ padding: '0.8rem', fontSize: '1rem', background: '#e74c3c', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span>📄</span> PDF Olarak İndir
                            </button>

                            <button onClick={handleShare} className="btn" style={{ padding: '0.8rem', fontSize: '1rem', background: '#25D366', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span>📱</span> WhatsApp ile Paylaş
                            </button>

                            <button onClick={() => setShowExportModal(false)} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
                }}>
                    <form onSubmit={onUpdateCustomer} className="card" style={{
                        width: '90%',
                        maxWidth: '500px',
                        margin: 0,
                        padding: '1.5rem',
                        paddingBottom: '5rem',
                        maxHeight: '70vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Müşteri Bilgilerini Düzenle</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ad</label>
                            <input name="name" defaultValue={customer.name} required className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Soyad</label>
                            <input name="surname" defaultValue={customer.surname} required className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Telefon</label>
                            <input name="phone" defaultValue={customer.phone} className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Adres</label>
                            <input name="address" defaultValue={customer.address} className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>İl</label>
                            <input name="city" defaultValue={customer.city} className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Vergi No</label>
                            <input name="taxId" defaultValue={customer.taxId} className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Risk Limiti ($)</label>
                            <input name="riskLimit" type="number" step="0.01" defaultValue={customer.riskLimit} required className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Müşteri Segmenti</label>
                            <select name="segment" defaultValue={customer.segment || 'bronze'} className="select" style={{ width: '100%' }}>
                                <option value="bronze">Bronze (İndirim Yok)</option>
                                <option value="silver">Silver (%5 İndirim)</option>
                                <option value="gold">Gold (%10 İndirim)</option>
                            </select>
                            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--color-warning)', lineHeight: 1.4 }}>
                                ⚠️ Segment değişikliği yalnızca <strong>yeni satışlara</strong> uygulanır. Geçmiş satışlar etkilenmez.
                            </small>
                        </div>

                        <div style={{ marginBottom: '1.5rem', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontWeight: 600, display: 'block' }}>Müşteri Durumu</label>
                                <CustomerStatusToggle defaultActive={customer.isActive} />
                            </div>
                            <small style={{ color: 'var(--color-neutral)' }}>Pasif müşteriler listelerde varsayılan olarak gizlenir ancak raporlarda görünmeye devam eder.</small>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={loading}>İptal</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? "Güncelleniyor..." : "Güncelle"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {editingSale && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '70vh', margin: 0, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                            <h3 style={{ margin: 0, textAlign: 'center' }}>Satışı Düzenle</h3>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {editFormItems.map((item, index) => (
                                <div key={index}
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'var(--surface-hover)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                    <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Ürün</label>
                                        <select
                                            className="select"
                                            value={item.productId || ""}
                                            onChange={(e) => handleProductChange(index, e.target.value)}
                                            style={{ width: '100%', height: '36px', fontSize: '0.9rem', padding: '0 0.5rem' }}
                                        >
                                            <option value="">Seçiniz</option>
                                            {productList.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        {!item.productId && (
                                            <input
                                                className="input"
                                                placeholder="Ürün adı..."
                                                value={item.productName}
                                                style={{
                                                    marginTop: '0.25rem',
                                                    height: '30px',
                                                    fontSize: '0.8rem',
                                                    width: '100%',
                                                    maxWidth: '300px'
                                                }}
                                                onChange={(e) => updateEditItem(index, 'productName', e.target.value)}
                                            />
                                        )}
                                    </div>

                                    <div style={{ width: '80px', flexShrink: 0 }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Adet</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.quantity}
                                            min="1"
                                            onChange={(e) => updateEditItem(index, 'quantity', Number(e.target.value))}
                                            style={{ textAlign: 'center', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ width: '100px', flexShrink: 0 }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Birim</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.unitPrice}
                                            onChange={(e) => updateEditItem(index, 'unitPrice', Number(e.target.value))}
                                            style={{ textAlign: 'right', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ flex: '0 0 auto', textAlign: 'right', minWidth: '80px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-neutral)', marginBottom: '0.2rem' }}>Toplam</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>${(item.quantity * item.unitPrice).toLocaleString('en-US')}</div>
                                    </div>

                                    <div style={{ width: '30px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                                        <button type="button" onClick={() => removeEditItem(index)} className="btn" style={{ padding: 0, color: 'var(--color-neutral)', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={addEditItem} className="btn" style={{ border: '1px dashed var(--border)', width: '100%', marginTop: '0.5rem', color: 'var(--color-neutral)' }}>
                                + Kalem Ekle
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface)', flexShrink: 0 }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', alignSelf: 'flex-start' }}>
                                Toplam: ${calculateEditTotal().toLocaleString('en-US')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={async () => {
                                        if (confirm("Bu satışı İPTAL etmek istediğinize emin misiniz? Stoklar geri yüklenecek ve satış raporlardan kaldırılacak.")) {
                                            try {
                                                setLoading(true);
                                                await cancelSale(editingSale.id);
                                                setEditingSale(null);
                                                router.refresh();
                                            } catch (e: any) {
                                                alert(e.message);
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    disabled={loading}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        color: '#ef4444',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        fontWeight: 600,
                                        fontSize: '0.8rem'
                                    }}
                                    title="Satışı İptal Et"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                    <span>İPTAL</span>
                                </button>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setEditingSale(null)}
                                        disabled={loading}
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={onSaveSale}
                                        disabled={loading}
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    >
                                        {loading ? "..." : "Kaydet"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Return Modal */}
            {editingReturn && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
                        <h3>İadeyi Düzenle</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            {editReturnItems.map((item, index) => (
                                <div key={index}
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'var(--surface-hover)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                    <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Ürün</label>
                                        <input
                                            className="input"
                                            placeholder="Ürün adı..."
                                            value={item.productName}
                                            style={{
                                                height: '36px',
                                                fontSize: '0.9rem',
                                                width: '100%',
                                                padding: '0 0.5rem'
                                            }}
                                            onChange={(e) => {
                                                const newItems = [...editReturnItems];
                                                newItems[index].productName = e.target.value;
                                                setEditReturnItems(newItems);
                                            }}
                                        />
                                    </div>

                                    <div style={{ width: '80px', flexShrink: 0 }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Adet</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.quantity}
                                            min="1"
                                            onChange={(e) => {
                                                const newItems = [...editReturnItems];
                                                newItems[index].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                setEditReturnItems(newItems);
                                            }}
                                            style={{ textAlign: 'center', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ width: '100px', flexShrink: 0 }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Birim Fiyat ($)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.unitPrice}
                                            onChange={(e) => {
                                                const newItems = [...editReturnItems];
                                                newItems[index].unitPrice = e.target.value === '' ? '' : Number(e.target.value);
                                                setEditReturnItems(newItems);
                                            }}
                                            style={{ textAlign: 'right', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ flex: '0 0 auto', textAlign: 'right', minWidth: '80px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-neutral)', marginBottom: '0.2rem' }}>Toplam</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString('en-US')}</div>
                                    </div>

                                    <div style={{ width: '30px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                                        <button type="button" onClick={() => {
                                            if (editReturnItems.length > 1) {
                                                const newItems = [...editReturnItems];
                                                newItems.splice(index, 1);
                                                setEditReturnItems(newItems);
                                            }
                                        }} className="btn" style={{ padding: 0, color: 'var(--color-neutral)', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={() => setEditReturnItems([...editReturnItems, { productName: "", quantity: "", unitPrice: "" }])} className="btn" style={{ border: '1px dashed var(--border)', width: '100%', marginTop: '1rem', color: 'var(--color-neutral)' }}>
                            + İade Ürünü Ekle
                        </button>

                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                Toplam İade: ${editReturnItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0).toLocaleString('en-US')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setEditingReturn(null)}
                                    disabled={loading}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={onSaveEditReturn}
                                    disabled={loading}
                                >
                                    {loading && <span className="spinner"></span>}
                                    {loading ? "Kaydediliyor..." : "Güncelle"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
