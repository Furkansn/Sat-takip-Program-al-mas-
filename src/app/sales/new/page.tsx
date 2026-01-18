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

            const calculatedPrice = product.price * (1 - discountRate);
            // Safe Price Check (Cost Rule)
            const safePrice = (product.cost && product.cost > 0)
                ? Math.max(calculatedPrice, product.cost)
                : calculatedPrice;

            newItems[index].unitPrice = safePrice;
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
        <main className="container" style={{ maxWidth: '1200px' }}>
            <style jsx>{`
                .sale-grid {
                    display: grid;
                    grid-template-columns: minmax(200px, 4fr) 100px 120px 120px 40px;
                    gap: 1rem;
                    align-items: start;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border);
                }

                @media (max-width: 768px) {
                    .sale-grid {
                        grid-template-columns: 1fr 1fr;
                        grid-template-areas: 
                            "product product"
                            "qty price"
                            "total remove";
                        gap: 0.75rem;
                        background: rgba(255,255,255,0.03);
                        padding: 1rem;
                        border-radius: 8px;
                    }
                    .area-product { grid-area: product; }
                    .area-qty { grid-area: qty; }
                    .area-price { grid-area: price; }
                    .area-total { grid-area: total; display: flex; align-items: center; gap: 0.5rem; }
                    .area-remove { grid-area: remove; justify-self: end; }
                    
                    
                }
            `}</style>

            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/sales" style={{ textDecoration: 'none', color: 'var(--color-neutral)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    ← Geri Dön
                </Link>
                <h1>Yeni Satış Gir</h1>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Müşteri</label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <select
                            className="select"
                            value={selectedCustomerId}
                            onChange={(e) => {
                                setSelectedCustomerId(e.target.value);
                            }}
                            style={{ flex: 1, minWidth: '250px' }}
                        >
                            <option value="">Müşteri Seç...</option>
                            {customerList.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.surname} {c.segment && c.segment !== 'bronze' ? `(${c.segment.toUpperCase()} - %${(c.segment === 'gold' ? 10 : 5)})` : ''}
                                </option>
                            ))}
                        </select>
                        {discountRate > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', flexShrink: 0 }}>
                                <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                    %{(discountRate * 100).toFixed(0)} İNDİRİM
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Ürünler</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((item, index) => {
                        const product = productList.find(p => p.id === item.productId);
                        const remaining = product ? product.stock - item.quantity : 0;
                        const isInsufficient = product && remaining < 0;

                        return (
                            <div key={index} className="sale-grid">
                                <div className="area-product">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block' }}>Ürün</label>
                                    <select
                                        className="select"
                                        value={item.productId}
                                        onChange={(e) => handleProductChange(index, e.target.value)}
                                        style={{ width: '100%', height: '42px' }}
                                    >
                                        <option value="">Seçiniz</option>
                                        {productList.map(p => {
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
                                            style={{ marginTop: '0.5rem', width: '100%' }}
                                            onChange={(e) => updateItem(index, 'productName', e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="area-qty" style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block', textAlign: 'center' }}>Adet</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={item.quantity}
                                        min="1"
                                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                        style={{
                                            textAlign: 'center',
                                            height: '42px',
                                            width: '100%',
                                            borderColor: isInsufficient ? '#ef4444' : undefined,
                                            color: isInsufficient ? '#ef4444' : undefined,
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem'
                                        }}
                                    />
                                    {product && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            fontSize: '0.7rem',
                                            color: isInsufficient ? '#ef4444' : '#eab308',
                                            fontWeight: 'bold',
                                            marginTop: '4px',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center'
                                        }}>
                                            {isInsufficient ? 'Yetersiz!' : `Kalan: ${remaining}`}
                                        </div>
                                    )}
                                </div>

                                <div className="area-price">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-neutral)', marginBottom: '0.25rem', display: 'block', textAlign: 'right' }}>Birim ($)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                                        onBlur={() => {
                                            if (product && product.cost && product.cost > 0) {
                                                if (item.unitPrice < product.cost) {
                                                    updateItem(index, 'unitPrice', product.cost);
                                                }
                                            }
                                        }}
                                        style={{ textAlign: 'right', height: '42px', width: '100%' }}
                                    />
                                    {/* Cost Warning Badge */}
                                    {product && product.cost > 0 && (product.price * (1 - discountRate)) < product.cost && (
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: '#854d0e', // Dark yellow/brown
                                            background: '#fef9c3', // Light yellow
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            marginTop: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            fontWeight: 600,
                                            border: '1px solid #fde047'
                                        }}>
                                            <span style={{ marginRight: '4px' }}>⚠️</span>
                                            min tutar: ${product.cost}
                                        </div>
                                    )}

                                    {item.listUnitPrice > item.unitPrice && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginTop: '2px', textAlign: 'right', textDecoration: 'line-through' }}>
                                            Liste: ${item.listUnitPrice}
                                        </div>
                                    )}
                                </div>

                                <div className="area-total" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', paddingTop: '1.5rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-neutral)', marginBottom: '0.2rem' }}>Toplam</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>${(item.quantity * item.unitPrice).toLocaleString()}</div>
                                </div>

                                <div className="area-remove" style={{ paddingTop: '1.5rem' }}>
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
                                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button type="button" onClick={addItem} className="btn" style={{ border: '2px dashed var(--border)', width: '100%', marginTop: '1.5rem', padding: '1rem', color: 'var(--color-neutral)', fontWeight: 600 }}>
                    + Yeni Ürün Satırı Ekle
                </button>

                <div style={{ borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        {discountRate > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', color: 'var(--color-neutral)', fontSize: '1.1rem' }}>
                                <span>Liste Toplamı:</span>
                                <span>${calculateListTotal().toLocaleString()}</span>
                            </div>
                        )}
                        {discountRate > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', color: '#16a34a', fontSize: '1.1rem' }}>
                                <span>İndirim Tutarı:</span>
                                <span>-${(calculateListTotal() - calculateTotal()).toLocaleString()}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                            <div>Genel Toplam:</div>
                            <div>${calculateTotal().toLocaleString()}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}
                        >
                            {loading ? "Kaydediliyor..." : "Satışı Tamamla ✓"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
