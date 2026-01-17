"use client";

import { useEffect, useState } from "react";

type CurrencyData = {
    Satış: string;
    Değişim: string;
};

type ApiResponse = {
    [key: string]: CurrencyData;
};

export default function CurrencyTicker() {
    const [rates, setRates] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch("/api/currency");
                const data = await res.json();
                setRates(data);
            } catch (error) {
                console.error("Currency fetch failed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
        // Refresh every 5 minutes
        const interval = setInterval(fetchRates, 300000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={{ fontSize: '0.8rem', color: 'var(--color-neutral)' }}>Yükleniyor...</div>;
    if (!rates) return <div style={{ fontSize: '0.8rem', color: 'var(--color-neutral)' }}>Bağlantı hatası.</div>;

    // console.log("Currency Rates:", rates); 
    if ((rates as any).error) {
        return <div style={{ fontSize: '0.8rem', color: 'var(--color-neutral)' }}>{(rates as any).details || (rates as any).error}</div>;
    }

    // Validate that we actually have the keys we need
    if (!rates['USD'] && !rates['EUR']) {
        return <div style={{ fontSize: '0.8rem', color: 'var(--color-neutral)' }}>Veri yok.</div>;
    }

    const renderItem = (key: string, label: string, icon: string, className: string = "") => {
        const item = rates[key];

        if (!item) return null;

        const price = item.Satış;
        const change = item.Değişim;

        const isUp = change && !change.includes("-");
        const changeColor = isUp ? '#10b981' : '#ef4444'; // Green or Red

        return (
            <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                <span style={{ opacity: 0.8 }}>{icon}</span>
                <span style={{ color: 'rgb(var(--foreground-rgb))' }}>{price}</span>
                <span style={{ color: changeColor, fontSize: '0.75rem' }}>{change}</span>
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex',
            gap: '1.5rem',
            background: 'var(--surface)',
            padding: '0.3rem 1rem',
            borderRadius: '99px',
            border: '1px solid var(--border)'
        }}>
            {renderItem("USD", "USD", "$")}
            {renderItem("EUR", "EUR", "€")}
            {renderItem("gram-altin", "Gram", "🟡", "desktop-only")}
        </div>
    );
}
