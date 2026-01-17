"use client";

export default function Loading() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            color: 'var(--primary-blue)'
        }}>
            <div className="spinner"></div>
            <style jsx>{`
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(59, 130, 246, 0.3);
                    border-radius: 50%;
                    border-top-color: var(--primary-blue);
                    animation: spin 1s ease-in-out infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
