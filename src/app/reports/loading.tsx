"use client";

export default function Loading() {
    return (
        <div style={{
            display: 'flex',
            width: '100%',
            height: '60vh',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .custom-spinner {
                        width: 48px; 
                        height: 48px;
                        border-radius: 50%;
                        border: 4px solid #e5e7eb;
                        border-top-color: #2563eb;
                        animation: spin 1s linear infinite;
                    }
                `}</style>
                <div className="custom-spinner"></div>

                <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#6b7280', // neutral-500
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}>
                    Raporlar Hazırlanıyor...
                </span>
            </div>
        </div>
    );
}
