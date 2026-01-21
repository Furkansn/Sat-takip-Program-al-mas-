"use client";

export default function DashboardSkeleton() {
    return (
        <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="card" style={{ marginBottom: 0, minHeight: '120px' }}>
                        <div style={{ height: '20px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1rem' }} />
                        <div style={{ height: '40px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ minHeight: '300px' }}>
                    <div style={{ height: '24px', width: '30%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1.5rem' }} />
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{ height: '60px', width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '1rem' }} />
                    ))}
                </div>
                <div className="card" style={{ minHeight: '300px' }}>
                    <div style={{ height: '24px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1.5rem' }} />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ height: '40px', width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '1rem' }} />
                    ))}
                </div>
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
}
