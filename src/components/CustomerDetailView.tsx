"use client";

import { useState, useEffect } from "react";
import { updateRiskLimit, addCollection, updateCustomer } from "@/actions/customer";
import { createReturn } from "@/actions/return";
import { updateSale, getProducts } from "@/actions/transaction";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    // Return Form State
    const [returnItems, setReturnItems] = useState([{ productName: "", quantity: 1, unitPrice: 0 }]);

    const addReturnItem = () => {
        setReturnItems([...returnItems, { productName: "", quantity: 1, unitPrice: 0 }]);
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
        return returnItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    async function onSaveReturn() {
        if (returnItems.some(i => !i.productName || i.quantity <= 0)) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }
        try {
            setLoading(true);
            await createReturn(customer.id, returnItems);
            setShowReturnModal(false);
            setReturnItems([{ productName: "", quantity: 1, unitPrice: 0 }]); // Reset
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
            s.items.forEach((item: any) => {
                const listPrice = item.listUnitPrice || item.unitPrice; // Fallback
                const discountRate = item.appliedDiscountRate || 0;

                transactions.push({
                    date: new Date(s.date),
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
            transactions.push({
                date: new Date(c.date),
                type: 'Tahsilat',
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
                        date: new Date(r.date),
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

        // Sort by date ascending
        transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate running balance and prepare rows
        let balance = 0;
        const transactionRows = transactions.map(t => {
            balance += (t.debt - t.credit);
            return [
                t.date.toLocaleDateString('tr-TR'),
                t.type,
                t.description,
                t.quantity,
                t.listPrice !== '-' ? Number(t.listPrice).toLocaleString('en-US') : '-',
                t.discountRate !== '-' ? `%${(Number(t.discountRate) * 100).toFixed(0)}` : '-',
                t.unitPrice !== '-' ? Number(t.unitPrice).toLocaleString('en-US') : '-',
                t.itemTotal !== '-' ? Number(t.itemTotal).toLocaleString('en-US') : '-',
                t.debt > 0 ? t.debt : '',
                t.credit > 0 ? t.credit : '',
                balance
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
            'Liste Fiyatı',
            'İndirim',
            'Birim Fiyat',
            'Toplam',
            'Borç ($)',
            'Tahsilat ($)',
            'Bakiye ($)'
        ];

        const footerRow = [
            '', '', 'GENEL TOPLAM', '', '', '', '', '',
            totalDebt,
            totalCredit,
            balance
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
            { wch: 15 }, // Type - Increased
            { wch: 30 }, // Description
            { wch: 6 },  // Qty
            { wch: 10 }, // List Price
            { wch: 10 }, // Discount
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
            const response = await fetch(`/api/export-customer?id=${customer.id}`);

            if (!response.ok) {
                // Try to read error message
                const errorText = await response.text();
                throw new Error(errorText || `Sunucu hatası: ${response.status}`);
            }

            const blob = await response.blob();

            // Generate filename fallback
            const cleanName = `${customer.name}_${customer.surname}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            let filename = `ekstre_${cleanName}.xlsx`;

            // Try to get filename from header with more robust regex
            const disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.setAttribute('download', filename); // Explicitly set download attribute
            document.body.appendChild(anchor);
            anchor.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(anchor);
                window.URL.revokeObjectURL(url);
                setShowExportModal(false);
            }, 100);
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
            s.items.forEach((item: any) => {
                const listPrice = item.listUnitPrice || item.unitPrice;
                const discountRate = item.appliedDiscountRate || 0;
                transactions.push({
                    date: new Date(s.date),
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
            transactions.push({
                date: new Date(c.date),
                type: 'Tahsilat',
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
                        date: new Date(r.date),
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
        transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

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
        let runningBalance = 0;
        const tableBody = transactions.map(t => {
            runningBalance += (t.debt - t.credit);
            return [
                t.date.toLocaleDateString('tr-TR'),
                t.type,
                t.description,
                t.quantity !== '-' ? t.quantity : '',
                t.listPrice !== '-' ? `$${Number(t.listPrice).toLocaleString('en-US')}` : '',
                t.discountRate !== '-' && t.discountRate > 0 ? `%${(t.discountRate * 100).toFixed(0)}` : '',
                t.unitPrice !== '-' ? `$${Number(t.unitPrice).toLocaleString('en-US')}` : '',
                t.itemTotal !== '-' ? `$${Number(t.itemTotal).toLocaleString('en-US')}` : '',
                t.debt > 0 ? `$${t.debt.toLocaleString('en-US')}` : '-',
                t.credit > 0 ? `$${t.credit.toLocaleString('en-US')}` : '-',
                `$${runningBalance.toLocaleString('en-US')}`
            ];
        });

        // Use autoTable
        autoTable(doc, {
            head: [['Tarih', 'Tür', 'Açıklama', 'Adet', 'Liste', 'İnd.', 'Birim', 'Toplam', 'Borç', 'Tahsilat', 'Bakiye']],
            body: tableBody,
            startY: 80,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2, font: 'Roboto' }, // Use Roboto
            columnStyles: {
                0: { cellWidth: 18 }, // Date
                1: { cellWidth: 15 }, // Type - Increased width
                2: { cellWidth: 'auto' }, // Desc
                3: { cellWidth: 10, halign: 'center' }, // Qty
                4: { cellWidth: 15, halign: 'right' }, // List
                5: { cellWidth: 10, halign: 'center' }, // Disc
                6: { cellWidth: 15, halign: 'right' }, // Unit
                7: { cellWidth: 18, halign: 'right' }, // Total
                8: { cellWidth: 18, halign: 'right' }, // Debt
                9: { cellWidth: 18, halign: 'right' }, // Credit - (Tahsilat)
                10: { cellWidth: 20, halign: 'right' }, // Balance
            },
            foot: [[
                '',
                '',
                'GENEL TOPLAM',
                '',
                '',
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
                // Footer Logo "ST"
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

                doc.setFillColor(41, 128, 185);
                doc.circle(pageWidth - 20, pageHeight - 20, 8, 'F');
                doc.setTextColor(255);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold'); // ST logo is simple, helvetica fits
                doc.text("ST", pageWidth - 20, pageHeight - 17, { align: 'center', baseline: 'middle' });
                doc.setFont('Roboto', 'normal'); // Switch back
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

    async function onAddCollection(formData: FormData) {
        const amount = Number(formData.get("amount"));
        const note = formData.get("note") as string;
        await addCollection(customer.id, amount, note);
        setShowCollectionModal(false);
        router.refresh();
    }

    async function onUpdateCustomer(formData: FormData) {
        const name = formData.get("name") as string;
        const surname = formData.get("surname") as string;
        const phone = formData.get("phone") as string;
        const address = formData.get("address") as string;
        const city = formData.get("city") as string;
        const taxId = formData.get("taxId") as string;
        const riskLimit = Number(formData.get("riskLimit"));
        const segment = formData.get("segment") as string;

        await updateCustomer(customer.id, { name, surname, phone, address, city, taxId, riskLimit, segment });
        setShowEditModal(false);
        router.refresh(); // Important to reflect Name changes in header
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
                                {customer.sales.map((sale: any) => (
                                    <div
                                        key={sale.id}
                                        onClick={() => openEditModal(sale)}
                                        className="sale-card"
                                        style={{
                                            border: '1px solid var(--border)',
                                            padding: '1.25rem',
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            background: 'var(--surface)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ background: 'var(--primary-blue)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                    {new Date(sale.date).getDate()} {new Date(sale.date).toLocaleDateString('tr-TR', { month: 'short' })}
                                                </div>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--color-neutral)' }}>{new Date(sale.date).getFullYear()}</span>
                                                {sale.discountRateAtTime > 0 && <span className="badge" style={{ fontSize: '0.7em', background: '#ecfccb', color: '#4d7c0f' }}>%{(sale.discountRateAtTime * 100).toFixed(0)} İndirim</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', opacity: 0.8 }}>(Düzenle)</span>
                                                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>${sale.totalAmount.toLocaleString('en-US')}</span>
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
                                                        <span style={{ color: 'rgb(var(--foreground-rgb))' }}>• {item.productName}</span>
                                                    </div>
                                                    <div style={{ whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                        <span style={{ fontWeight: 500 }}>
                                                            {item.quantity} x ${item.unitPrice.toLocaleString('en-US')}
                                                        </span>
                                                        {item.appliedDiscountRate > 0 && (
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.7, textDecoration: 'line-through' }}>
                                                                ${item.listUnitPrice.toLocaleString('en-US')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
                                    <div key={ret.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'rgb(var(--foreground-rgb))' }}>{new Date(ret.date).toLocaleDateString('tr-TR')}</span>
                                                <span className="badge" style={{ fontSize: '0.7em', background: '#fca5a5', color: '#7f1d1d' }}>İADE</span>
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444' }}>-${ret.totalAmount.toLocaleString('en-US')}</span>
                                        </div>
                                        <ul style={{ paddingLeft: '1.2rem', color: 'var(--color-neutral)', fontSize: '0.9rem', margin: 0 }}>
                                            {ret.items.map((item: any, idx: number) => (
                                                <li key={idx}>
                                                    {item.productName} — {item.quantity} x ${item.unitPrice}
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
                    <form action={onAddCollection} className="card" style={{ width: '90%', maxWidth: '400px', margin: 0 }}>
                        <h3>Tahsilat Ekle</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Tutar ($)</label>
                            <input name="amount" type="number" step="0.01" required className="input" autoFocus />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Not (Opsiyonel)</label>
                            <input name="note" className="input" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCollectionModal(false)}>İptal</button>
                            <button type="submit" className="btn btn-primary">Kaydet</button>
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
                                            onChange={(e) => updateReturnItem(index, 'quantity', Number(e.target.value))}
                                            style={{ textAlign: 'center', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ width: '100px', flexShrink: 0 }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Birim Fiyat ($)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.unitPrice}
                                            onChange={(e) => updateReturnItem(index, 'unitPrice', Number(e.target.value))}
                                            style={{ textAlign: 'right', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ flex: '0 0 auto', textAlign: 'right', minWidth: '80px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-neutral)', marginBottom: '0.2rem' }}>Toplam</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>${(item.quantity * item.unitPrice).toLocaleString('en-US')}</div>
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
                                <strong>${customer.sales.reduce((sum: number, s: any) => sum + s.totalAmount, 0).toLocaleString('en-US')}</strong>
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
                    <form action={onUpdateCustomer} className="card" style={{
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

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>İptal</button>
                            <button type="submit" className="btn btn-primary">Güncelle</button>
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

                        <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', flexShrink: 0 }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                Toplam: ${calculateEditTotal().toLocaleString('en-US')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setEditingSale(null)}
                                    disabled={loading}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={onSaveSale}
                                    disabled={loading}
                                >
                                    {loading ? "Kaydediliyor..." : "Kaydet"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
