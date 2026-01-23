"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSale, getProducts } from "@/actions/transaction";
import { getCustomers, getAllActiveCustomers } from "@/actions/customer";
import Link from "next/link";


const ProductCombobox = ({
    products,
    selectedId,
    onSelect
}: {
    products: any[];
    selectedId: string;
    onSelect: (id: string) => void;
}) => {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync query with selected product name
    useEffect(() => {
        const selected = products.find(p => p.id === selectedId);
        if (selected) {
            setQuery(selected.name);
        } else {
            // Keep query if typing, but if selectedId becomes empty externally, we might want to clear?
            // However, logic below handles query->selectedId. 
            // If selectedId is empty, it implies no product selected.
            // But we might be in the middle of typing.
            // So only clear if query matches a product that is NO LONGER selected?
            // Safer: if selectedId is empty, DON'T force clear query immediately to allow typing,
            // UNLESS query matches a product name strictly.
            // Actually, simplest: if selectedId empty, and query matched a product, clear it?
            // Let's just trust onBlur to reset/clear.
        }
    }, [selectedId, products]);

    // BUT we need to initialize query on mount if value exists or when value changes 
    // AND we are not currently typing (document.activeElement check?)
    // This sync is tricky. Let's try:
    // If selectedId changes, update query to name.

    useEffect(() => {
        const selected = products.find(p => p.id === selectedId);
        if (selected) {
            setQuery(selected.name);
        }
        // If !selected, do not force clear, user might be typing "App"
    }, [selectedId, products]);


    const filteredProducts = useMemo(() => {
        // Always filter logic
        const lowerQuery = query.toLowerCase();
        return products.filter(p => {
            if (p.stock <= 0) return false;
            // If query is empty, allow all? Or nothing?
            // User: "Dropdown aç/kapa focus... list allows select"
            // Usually empty query -> show all.
            if (!query) return true;

            const matchName = p.name?.toLowerCase().includes(lowerQuery);
            const matchSku = p.sku?.toLowerCase().includes(lowerQuery);
            return matchName || matchSku;
        });
    }, [products, query]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);

                // On blur/close without selection:
                const selected = products.find(p => p.id === selectedId);
                if (selected) {
                    setQuery(selected.name); // Revert to selected name
                } else {
                    setQuery(""); // Clear if invalid
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedId, products, query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                setIsOpen(true);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % filteredProducts.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + filteredProducts.length) % filteredProducts.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredProducts.length > 0) {
                const product = filteredProducts[highlightedIndex];
                if (product) {
                    onSelect(product.id);
                    setIsOpen(false);
                    inputRef.current?.blur();
                }
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="combo" ref={containerRef}>
            <input
                ref={inputRef}
                className="input combo-input"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (!isOpen) setIsOpen(true);
                    setHighlightedIndex(0);
                    if (e.target.value === "") {
                        onSelect(""); // Clear selection
                    }
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Ürün ara..."
                onKeyDown={handleKeyDown}
                style={{ width: '100%', height: '42px' }}
                autoComplete="off"
            />
            {isOpen && (
                <ul className="combo-list">
                    {filteredProducts.length === 0 ? (
                        <li className="combo-empty">Sonuç yok</li>
                    ) : (
                        filteredProducts.map((p, index) => (
                            <li
                                key={p.id}
                                className={`combo-item ${index === highlightedIndex ? 'active' : ''}`}
                                onClick={() => {
                                    onSelect(p.id);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                {p.name} <span style={{ opacity: 0.7, fontSize: '0.85em' }}>(Stok: {p.stock} | ${p.price})</span>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default function NewSalePage() {
    const router = useRouter();

    // Data for selects
    const [productList, setProductList] = useState<any[]>([]);
    const [customerList, setCustomerList] = useState<any[]>([]);

    // Form State
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [items, setItems] = useState<any[]>([{ productId: "", productName: "", quantity: "", unitPrice: "", listUnitPrice: 0, appliedDiscountRate: 0 }]);
    const [loading, setLoading] = useState(false);

    // Derived State
    const selectedCustomer = customerList.find(c => c.id === selectedCustomerId);
    const segment = selectedCustomer?.segment || 'bronze';

    let discountRate = 0;
    if (segment === 'gold') discountRate = 0.10;
    else if (segment === 'silver') discountRate = 0.05;

    // Calculate Balance
    let customerBalance = 0;
    if (selectedCustomer) {
        const totalSales = selectedCustomer.sales?.reduce((acc: number, s: any) => acc + s.totalAmount, 0) || 0;
        const totalColl = selectedCustomer.collections?.reduce((acc: number, c: any) => acc + c.amount, 0) || 0;
        const totalReturns = selectedCustomer.returns?.reduce((acc: number, r: any) => acc + r.totalAmount, 0) || 0;
        customerBalance = totalSales - (totalColl + totalReturns);
    }

    // Fetch initial data
    useEffect(() => {
        getProducts().then(data => setProductList(data.products));
        getAllActiveCustomers().then(data => setCustomerList(data));
    }, []);

    // Recalculate prices when discount rate (customer segment) changes
    useEffect(() => {
        setItems(prevItems => prevItems.map(item => {
            if (!item.productId) return item;

            const product = productList.find(p => p.id === item.productId);
            if (!product) return item;

            const listPrice = item.listUnitPrice || product.price;
            const calculatedPrice = listPrice * (1 - discountRate);

            // Safe Price Check (Cost Rule)
            const safePrice = (product.cost && product.cost > 0)
                ? Math.max(calculatedPrice, product.cost)
                : calculatedPrice;

            return {
                ...item,
                unitPrice: safePrice,
                appliedDiscountRate: discountRate
            };
        }));
    }, [discountRate, productList]);

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
            newItems[index].productName = "";
            newItems[index].unitPrice = "";
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
        setItems([...items, { productId: "", productName: "", quantity: "", unitPrice: "", listUnitPrice: 0, appliedDiscountRate: discountRate }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    };

    const calculateListTotal = () => {
        return items.reduce((sum, item) => sum + (Number(item.quantity || 0) * (item.listUnitPrice || Number(item.unitPrice || 0))), 0);
    };

    const handleSubmit = async () => {
        if (loading) return;

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
                items: items.map(i => ({
                    ...i,
                    quantity: Number(i.quantity || 0),
                    unitPrice: Number(i.unitPrice || 0)
                }))
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
            {/* ... styles ... */}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: 600 }}>Müşteri</label>
                        {selectedCustomer && (
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: customerBalance > 0 ? '#ef4444' : '#16a34a'
                            }}>
                                Bakiye: ${Math.abs(customerBalance).toLocaleString('en-US')} {customerBalance > 0 ? '(Borç)' : customerBalance < 0 ? '(Alacak)' : ''}
                            </span>
                        )}
                    </div>
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
                    {/* Risk Warning */}
                    {selectedCustomer && selectedCustomer.riskLimit > 0 && (
                        <>
                            {customerBalance >= selectedCustomer.riskLimit ? (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', width: 'fit-content' }}>
                                    <span>🛑</span>
                                    <span><strong>Limit Aşıldı!</strong> Mevcut borç risk limitini (${selectedCustomer.riskLimit.toLocaleString()}) aştı.</span>
                                </div>
                            ) : (customerBalance / selectedCustomer.riskLimit) >= 0.8 ? (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', width: 'fit-content' }}>
                                    <span>⚠️</span>
                                    <span><strong>Dikkat:</strong> Risk limitine (%{((customerBalance / selectedCustomer.riskLimit) * 100).toFixed(0)}) yaklaşıldı. Limit: ${selectedCustomer.riskLimit.toLocaleString()}</span>
                                </div>
                            ) : null}
                        </>
                    )}
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
                                    <ProductCombobox
                                        products={productList}
                                        selectedId={item.productId}
                                        onSelect={(id) => handleProductChange(index, id)}
                                    />
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
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
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
                                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value === '' ? '' : Number(e.target.value))}
                                        onBlur={() => {
                                            if (product && product.cost && product.cost > 0) {
                                                if (Number(item.unitPrice) < product.cost) {
                                                    updateItem(index, 'unitPrice', product.cost);
                                                }
                                            }
                                        }}
                                        style={{ textAlign: 'right', height: '42px', width: '100%' }}
                                    />
                                    {/* Valid Price Warning Badge */}
                                    {product && product.cost > 0 && Number(item.unitPrice) < product.cost && (
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: '#ef4444',
                                            padding: '2px 0',
                                            textAlign: 'right',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: '4px',
                                            opacity: 0.8
                                        }}>
                                            <span>⚠️</span>
                                            <span>Min: ${product.cost.toLocaleString()}</span>
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '1.2rem', color: 'var(--color-neutral)', marginTop: '0.5rem' }}>
                            <div>Toplam Adet:</div>
                            <div>{items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                        </div>
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
                            style={{ padding: '1rem 3rem', fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {loading && <span className="spinner"></span>}
                            {loading ? "Kaydediliyor..." : "Satışı Tamamla ✓"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
