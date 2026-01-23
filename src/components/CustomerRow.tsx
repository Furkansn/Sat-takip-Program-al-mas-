"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function CustomerRow({ customer }: { customer: any }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const prefetched = useRef(false);

    const totalSales = customer.sales.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
    const totalColl = customer.collections.reduce((sum: number, col: any) => sum + col.amount, 0);
    const totalReturns = customer.returns ? customer.returns.reduce((sum: number, r: any) => sum + r.totalAmount, 0) : 0;
    const balance = totalSales - (totalColl + totalReturns);
    const limit = customer.riskLimit;
    const usageRatio = limit > 0 ? (balance / limit) : 0;

    let statusBadge = <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>Normal</span>;

    if (!customer.isActive) {
        statusBadge = <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.3)' }}>PASİF</span>;
    } else if (limit > 0) {
        if (balance >= limit) {
            statusBadge = <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Limit Aşıldı</span>;
        } else if (usageRatio >= 0.8) {
            statusBadge = <span className="badge badge-warning">Kritik</span>;
        }
    }

    const segment = customer.segment || 'bronze';
    let segmentBadge = null;
    if (segment === 'gold') {
        segmentBadge = <span className="badge" title="%10 İndirim" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)', marginLeft: '0.5rem', fontSize: '0.65rem' }}>GOLD</span>;
    } else if (segment === 'silver') {
        segmentBadge = <span className="badge" title="%5 İndirim" style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', marginLeft: '0.5rem', fontSize: '0.65rem' }}>SILVER</span>;
    } else {
        segmentBadge = <span className="badge" title="İndirim Yok" style={{ background: 'rgba(180, 83, 9, 0.2)', color: '#b45309', border: '1px solid rgba(180, 83, 9, 0.3)', marginLeft: '0.5rem', fontSize: '0.65rem' }}>BRONZE</span>;
    }

    const targetUrl = `/customers/${customer.id}`;

    const handlePrefetch = () => {
        if (!prefetched.current) {
            router.prefetch(targetUrl);
            prefetched.current = true;
        }
    };

    const handleClick = () => {
        if (isLoading) return;
        setIsLoading(true);
        router.push(targetUrl);
    };

    return (
        <tr
            onClick={handleClick}
            onMouseEnter={handlePrefetch}
            onTouchStart={handlePrefetch}
            onPointerDown={handlePrefetch}
            style={{
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.7 : (customer.isActive ? 1 : 0.6),
                backgroundColor: isLoading ? 'var(--surface-hover)' : (!customer.isActive ? 'rgba(0,0,0,0.02)' : undefined),
                position: 'relative',
                transform: isLoading ? 'scale(0.995)' : 'none'
            }}
            className="hover:bg-white/5"
        >
            <td data-label="Müşteri">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isLoading && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>}
                    <span style={{ fontWeight: 500 }}>{customer.name} {customer.surname}</span>
                    {segmentBadge}
                </div>
            </td>
            <td data-label="Telefon">{customer.phone || '-'}</td>
            <td data-label="İl">{customer.city ? customer.city.toLocaleUpperCase('tr-TR') : '-'}</td>
            <td data-label="Durum">{statusBadge}</td>
            <td data-label="Bakiye" style={{ textAlign: 'right', fontWeight: 'bold' }} className={balance > 0 ? "text-debt" : (balance < 0 ? "text-collection" : "")}>
                ${Math.abs(balance).toLocaleString('en-US')} {balance > 0 ? '(Borç)' : balance < 0 ? '(Alacak)' : ''}
            </td>
        </tr>
    );
}
