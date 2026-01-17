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
            <td suppressHydrationWarning>{new Date(sale.date).toLocaleDateString('tr-TR')}</td>
            <td>{sale.customer.name} {sale.customer.surname}</td>
            <td style={{ textAlign: 'right', fontWeight: 600 }}>${sale.totalAmount.toLocaleString('en-US')}</td>
        </tr>
    );
}
