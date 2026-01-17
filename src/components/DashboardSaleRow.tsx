"use client";

import { useRouter } from "next/navigation";

export default function DashboardSaleRow({ sale }: { sale: any }) {
    const router = useRouter();

    return (
        <tr
            onClick={() => router.push(`/sales/${sale.id}`)}
            style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
            className="hover:bg-white/5"
        >
            {/* Merged Date and Name Column */}
            <td suppressHydrationWarning>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, color: 'rgb(var(--foreground-rgb))' }}>
                        {sale.customer.name} {sale.customer.surname}
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, color: 'var(--color-neutral)' }}>
                        {new Date(sale.date).toLocaleDateString('tr-TR')}
                    </span>
                </div>
            </td>

            {/* Amount Column - Right Aligned and Green */}
            <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                <span style={{
                    fontWeight: 700,
                    color: '#22c55e', // Green color
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap'
                }}>
                    ${sale.totalAmount.toLocaleString('en-US')}
                </span>
            </td>
        </tr>
    );
}
