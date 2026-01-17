"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSale, getProducts } from "@/actions/transaction";
import { getCustomers } from "@/actions/customer";
import Link from "next/link";

export default function NewSalePage() {
    const router = useRouter();

    // Data for selects
    const [productList, setProductList] = useState<any[]>([]);
    const [customerList, setCustomerList] = useState<any[]>([]);

    // Form State
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [items, setItems] = useState<any[]>([{ productId: "", productName: "", quantity: 1, unitPrice: 0, listUnitPrice: 0, appliedDiscountRate: 0 }]);
    const [loading, setLoading] = useState(false);

    // Derived State
    const selectedCustomer = customerList.find(c => c.id === selectedCustomerId);
    const segment = selectedCustomer?.segment || 'bronze';

    let discountRate = 0;
    if (segment === 'gold') discountRate = 0.10;
    else if (segment === 'silver') discountRate = 0.05;

    // Fetch initial data
    useEffect(() => {
        getProducts().then(data => setProductList(data.products));
        getCustomers().then(setCustomerList);
    }, []);

    const handleProductChange = (index: number, productId: string) => {
        const product = productList.find(p => p.id === productId);
        const newItems = [...items];
        newItems[index].productId = productId;

        if (product) {
            newItems[index].productName = product.name;
            newItems[index].listUnitPrice = product.price;
            newItems[index].appliedDiscountRate = discountRate;
            newItems[index].unitPrice = product.price * (1 - discountRate);
        } else {
            // Reset if empty
            newItems[index].productName = "";
            newItems[index].unitPrice = 0;
            newItems[index].listUnitPrice = 0;
            newItems[index].appliedDiscountRate = 0;
        }
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: 0, listUnitPrice: 0, appliedDiscountRate: discountRate }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const calculateListTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * (item.listUnitPrice || item.unitPrice)), 0);
    };

    const handleSubmit = async () => {
        if (!selectedCustomerId) {
            alert("Lütfen müşteri seçin.");
            return;
        }
        if (items.some(i => !i.productName || i.quantity <= 0)) {
            alert("Lütfen ürün bilgilerini eksiksiz girin.");
            return;
        }

        // Final Stock Check
        for (const item of items) {
            if (item.productId) {
                const product = productList.find(p => p.id === item.productId);
                if (product && item.quantity > product.stock) {
                    alert(`Stok yetersiz: ${product.name} (Mevcut: ${product.stock}, İstenen: ${item.quantity})`);
                    return;
                }
            }
        }

        try {
            setLoading(true);
            await createSale({
                customerId: selectedCustomerId,
                segmentAtTime: segment,
                discountRateAtTime: discountRate,
                items
            });
            router.push("/sales");
        } catch (e: any) {
            alert("Hata: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/sales" style={{ textDecoration: 'none', color: 'var(--color-neutral)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    ← Geri Dön
                </Link>
                <h1>Yeni Satış Gir</h1>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Müşteri</label>
                    <select
                        className="select"
                        value={selectedCustomerId}
                        onChange={(e) => {
                            setSelectedCustomerId(e.target.value);
                        }}
                        style={{ width: '100%' }}
                    >
                        <option value="">Müşteri Seç...</option>
                        {customerList.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.surname} {c.segment && c.segment !== 'bronze' ? `(${c.segment.toUpperCase()} - %${(c.segment === 'gold' ? 10 : 5)})` : ''}
                            </option>
                        ))}
                    </select>
                    {discountRate > 0 && (
                        <div style={{ marginTop: '0.5rem', color: '#16a34a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                %{(discountRate * 100).toFixed(0)} İNDİRİM AKTİF
                            </span>
                            <span>(Liste fiyatları üzerinden otomatik düşülür)</span>
                        </div>
                    )}
                </div>

                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Ürünler</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((item, index) => {
                        const product = productList.find(p => p.id === item.productId);
                        // User Request: Show remaining stock in yellow (or red if insufficient)
                        const remaining = product ? product.stock - item.quantity : 0;
                        const isInsufficient = product && remaining < 0;

                        return (
                            <div key={index} style={{
                                display: 'grid',
                                // Using grid to layout: Product(Flexible), Qty(70px), Price(90px), Total(90px), Delete(30px)
                                gridTemplateColumns: 'minmax(0, 1fr) 70px 90px minmax(70px, 90px) 30px',
                                gap: '10px',
                                alignItems: 'start',
                                paddingBottom: '1rem',
                                borderBottom: '1px solid var(--border)'
                            }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Ürün</label>
                                    <select
                                        className="select"
                                        value={item.productId}
                                        onChange={(e) => handleProductChange(index, e.target.value)}
                                        style={{ width: '100%', height: '36px', fontSize: '0.9rem', padding: '0 0.5rem' }}
                                    >
                                        <option value="">Seçiniz</option>
                                        {productList.map(p => {
                                            // User Request: Hide out of stock items entirely
                                            if (p.stock <= 0) return null;
                                            return (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (Stok: {p.stock} | ${p.price})
                                                </option>
                                            )
                                        })}
                                    </select>
                                    {!item.productId && (
                                        <input
                                            className="input"
                                            placeholder="Ürün adı..."
                                            value={item.productName}
                                            style={{ marginTop: '0.25rem', height: '30px', fontSize: '0.8rem', width: '100%' }}
                                            onChange={(e) => updateItem(index, 'productName', e.target.value)}
                                        />
                                    )}
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block', textAlign: 'center' }}>Adet</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={item.quantity}
                                        min="1"
                                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                        style={{
                                            textAlign: 'center',
                                            height: '36px',
                                            padding: '0 0.25rem',
                                            width: '100%',
                                            borderColor: isInsufficient ? '#ef4444' : undefined,
                                            color: isInsufficient ? '#ef4444' : undefined
                                        }}
                                    />
                                    {product && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            fontSize: '0.65rem',
                                            color: isInsufficient ? '#ef4444' : '#eab308',
                                            fontWeight: 'bold',
                                            marginTop: '2px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            textAlign: 'center'
                                        }}>
                                            {isInsufficient ? 'Yetersiz!' : `Kalan: ${remaining}`}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block', textAlign: 'right' }}>Birim ($)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                                        style={{ textAlign: 'right', height: '36px', padding: '0 0.25rem', width: '100%' }}
                                    />
                                    {item.listUnitPrice > item.unitPrice && (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-neutral)', marginTop: '2px', textAlign: 'right', textDecoration: 'line-through' }}>
                                            Liste: ${item.listUnitPrice}
                                        </div>
                                    )}
                                </div>

                                <div style={{ textAlign: 'right', marginTop: '1.4rem' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--color-neutral)', marginBottom: '0.2rem', display: 'none' }}>Toplam</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>${(item.quantity * item.unitPrice).toLocaleString()}</div>
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="btn"
                                        title="Sil"
                                        style={{
                                            padding: 0,
                                            color: 'var(--color-neutral)',
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '50%',
                                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: 'none',
                                            cursor: 'pointer',
                                            marginTop: '1.2rem'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button type="button" onClick={addItem} className="btn" style={{ border: '1px dashed var(--border)', width: '100%', marginTop: '1rem', color: 'var(--color-neutral)' }}>
                    + Kalem Ekle
                </button>

                <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>

                    {discountRate > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-neutral)' }}>
                            <span>Ara Toplam (Liste):</span>
                            <span>${calculateListTotal().toLocaleString()}</span>
                        </div>
                    )}
                    {discountRate > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#16a34a' }}>
                            <span>Segment İndirimi (%{(discountRate * 100).toFixed(0)}):</span>
                            <span>-${(calculateListTotal() - calculateTotal()).toLocaleString()}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        <div>Genel Toplam:</div>
                        <div>${calculateTotal().toLocaleString()}</div>
                    </div>

                    <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{ minWidth: '150px' }}
                        >
                            {loading ? "Kaydediliyor..." : "Satışı Tamamla"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
