"use client";

export default function TopProductsChart({ data }: { data: any[] }) {
    if (data.length === 0) return <div style={{ color: 'var(--color-neutral)', textAlign: 'center', padding: '2rem' }}>Henüz veri yok</div>;

    const maxTotal = Math.max(...data.map(d => d.total));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                            <span style={{ color: 'var(--color-neutral)', fontSize: '0.85rem' }}>{item.quantity} adet</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${(item.total / maxTotal) * 100}%`,
                                backgroundColor: 'var(--primary-blue)',
                                borderRadius: '3px'
                            }} />
                        </div>
                    </div>
                    <div style={{ fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                        ${item.total.toLocaleString('en-US')}
                    </div>
                </div>
            ))}
        </div>
    );
}
