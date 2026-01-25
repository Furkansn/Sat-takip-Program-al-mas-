"use client";

import { useState, useEffect } from "react";
import { updateSale, getProducts, cancelSale } from "@/actions/transaction";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";

export default function SalesList({ sales }: { sales: any[] }) {
    const router = useRouter();
    const [productList, setProductList] = useState<any[]>([]);
    const [editingSale, setEditingSale] = useState<any>(null);
    const [editFormItems, setEditFormItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch products only when user starts editing
        if (editingSale) {
            getProducts().then(res => setProductList(res.products || []));
        }
    }, [editingSale]);

    const openEditModal = (sale: any) => {
        if (sale.status === 'cancelled') {
            alert("İptal edilen satışlar düzenlenemez.");
            return;
        }
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

    return (
        <>
            <table className="table table-separated">
                <thead>
                    <tr>
                        <th>Tarih</th>
                        <th>Müşteri</th>
                        <th>Kapsam</th>
                        <th style={{ textAlign: 'right' }}>Toplam</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => {
                        const isCancelled = sale.status === 'cancelled';
                        return (
                            <tr
                                key={sale.id}
                                onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('a')) return;
                                    openEditModal(sale);
                                }}
                                style={{
                                    cursor: isCancelled ? 'not-allowed' : 'pointer',
                                    opacity: isCancelled ? 0.6 : 1,
                                    background: isCancelled ? 'rgba(239, 68, 68, 0.05)' : undefined
                                }}
                                className="hover:bg-white/5"
                            >
                                <td data-label="Tarih" suppressHydrationWarning style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                    {new Date(sale.date).toLocaleDateString('tr-TR')} {new Date(sale.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    {isCancelled && <span style={{ marginLeft: '8px', fontSize: '0.8em', color: '#ef4444', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}>(İPTAL)</span>}
                                </td>
                                <td data-label="Müşteri">
                                    <Link href={`/customers/${sale.customerId}`} style={{ color: 'inherit', fontWeight: 500, textDecoration: isCancelled ? 'line-through' : 'none' }} onClick={(e) => e.stopPropagation()}>
                                        {sale.customer.name} {sale.customer.surname}
                                    </Link>
                                </td>
                                <td data-label="Kapsam" style={{ color: 'var(--color-neutral)', fontSize: '0.9rem', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                    {sale.items.slice(0, 2).map((i: any) => i.productName).join(', ')}
                                    {sale.items.length > 2 && ` ve ${sale.items.length - 2} diğer`}
                                </td>
                                <td data-label="Toplam" style={{ textAlign: 'right', fontWeight: 'bold', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                    ${sale.totalAmount.toLocaleString('en-US')}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {editingSale && typeof document !== 'undefined' && document.body && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', margin: 0, position: 'relative', transform: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Satışı Düzenle</h3>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-neutral)' }}>
                                {editingSale.customer.name} {editingSale.customer.surname}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
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
                                                style={{ marginTop: '0.25rem', height: '30px', fontSize: '0.8rem', width: '100%' }}
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
                        </div>

                        <button type="button" onClick={addEditItem} className="btn" style={{ border: '1px dashed var(--border)', width: '100%', marginTop: '1rem', color: 'var(--color-neutral)' }}>
                            + Kalem Ekle
                        </button>

                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                </div>,
                document.body
            )}
        </>
    );
}
