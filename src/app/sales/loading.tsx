"use client";

export default function SalesLoading() {
    return (
        <main className="container">
            <div className="dashboard-header">
                <div style={{ height: '40px', width: '150px', background: 'var(--surface)', borderRadius: '12px' }} className="skeleton" />
                <div style={{ height: '40px', width: '120px', background: 'var(--surface)', borderRadius: '12px' }} className="skeleton" />
            </div>

            <div className="card" style={{ height: '100px', marginBottom: '1.5rem', background: 'var(--glass-bg)' }} />

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ height: '20px', width: '100%', background: 'var(--surface)', borderRadius: '4px' }} className="skeleton" />
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ height: '20px', width: '30%', background: 'var(--surface)', borderRadius: '4px' }} className="skeleton" />
                        <div style={{ height: '20px', width: '20%', background: 'var(--surface)', borderRadius: '4px' }} className="skeleton" />
                    </div>
                ))}
            </div>

            <style jsx global>{`
                .skeleton {
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </main>
    );
}
