
import { getSale } from "@/actions/transaction";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
    const sale = await getSale(params.id);

    if (!sale) {
        notFound();
    }

    return (
        <main className="container" style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'var(--color-neutral)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    ← Geri Dön
                </Link>
                <h1>Satış Detayı</h1>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>#{sale.id.slice(0, 8)}</h2>
                        <div style={{ color: 'var(--color-neutral)' }}>
                            {new Date(sale.date).toLocaleDateString('tr-TR')} {new Date(sale.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-neutral)' }}>Toplam Tutar</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>${sale.totalAmount.toLocaleString('en-US')}</div>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-neutral)', marginBottom: '0.5rem' }}>MÜŞTERİ</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            {sale.customer.name} {sale.customer.surname}
                        </div>
                        <Link href={`/customers/${sale.customer.id}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>
                            Müşteriye Git
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-neutral)', marginBottom: '0.5rem' }}>ÜRÜNLER</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {sale.items.map((item: any) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-neutral)', marginTop: '0.25rem' }}>
                                        {item.quantity} x ${item.unitPrice.toLocaleString('en-US')}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700 }}>
                                    ${(item.quantity * item.unitPrice).toLocaleString('en-US')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
