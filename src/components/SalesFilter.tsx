"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function SalesFilter({ customers, products }: { customers: any[], products: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [customerId, setCustomerId] = useState(searchParams.get("customerId") || "");
    const [productId, setProductId] = useState(searchParams.get("productId") || "");

    const handleFilter = useDebouncedCallback((newCustomerId, newProductId) => {
        const params = new URLSearchParams();
        if (newCustomerId) params.set("customerId", newCustomerId);
        if (newProductId) params.set("productId", newProductId);

        router.replace(`/sales?${params.toString()}`, { scroll: false });
    }, 300);

    // Initial sync
    useEffect(() => {
        const c = searchParams.get("customerId") || "";
        const p = searchParams.get("productId") || "";

        if (c !== customerId) setCustomerId(c);
        if (p !== productId) setProductId(p);
    }, [searchParams, customerId, productId, handleFilter]);

    const onChange = (cId: string, pId: string) => {
        setCustomerId(cId);
        setProductId(pId);
        handleFilter(cId, pId);
    };

    const clearFilters = () => {
        setCustomerId("");
        setProductId("");
        router.replace("/sales", { scroll: false });
    };

    return (
        <div className="card sales-filter-card">
            <div className="sales-filter-grid">
                {/* Customer Filter */}
                <div className="filter-group">
                    <label>Müşteri</label>
                    <select
                        className="filter-control"
                        value={customerId}
                        onChange={(e) => onChange(e.target.value, productId)}
                    >
                        <option value="">Tümü</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.surname}</option>
                        ))}
                    </select>
                </div>

                {/* Product Filter */}
                <div className="filter-group">
                    <label>Ürün</label>
                    <select
                        className="filter-control"
                        value={productId}
                        onChange={(e) => onChange(customerId, e.target.value)}
                    >
                        <option value="">Tümü</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Actions (Clear) */}
                <div className="filter-actions">
                    {(customerId || productId) ? (
                        <button onClick={clearFilters} className="filter-clear-btn" title="Filtreleri Sıfırla">
                            Temizle
                        </button>
                    ) : (
                        <div></div>
                    )}
                </div>
            </div>
        </div>
    );
}
