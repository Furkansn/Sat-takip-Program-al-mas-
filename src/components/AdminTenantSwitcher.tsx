
"use client";

import { useState } from "react";
import { switchAdminTenant } from "@/lib/admin-actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Company = {
    id: string;
    name: string;
};

export default function AdminTenantSwitcher({
    companies,
    activeCompanyId
}: {
    companies: Company[],
    activeCompanyId: string
}) {
    const [isOpen, setIsOpen] = useState(false);

    const { update } = useSession();
    const router = useRouter();

    // Find active company name
    const activeCompany = companies.find(c => c.id === activeCompanyId);

    const handleSwitch = async (companyId: string) => {
        // 1. Update session token via NextAuth (Client -> Server -> Cookie)
        await update({ companyId });

        // 2. Also set the dedicated cookie via Server Action (Backup/Middleware)
        await switchAdminTenant(companyId);

        setIsOpen(false);

        // 3. Refresh the page data
        window.location.reload();
    };


    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: 0
                }}
            >
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-dark))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    boxShadow: '0 0 10px var(--primary-glow)',
                    border: '2px solid rgba(255,255,255,0.2)'
                }}>
                    ST
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '0.5rem' }}>
                    {(activeCompany || companies.find(c => c.id === activeCompanyId)) ? (
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#333' }}>
                            {(activeCompany || companies.find(c => c.id === activeCompanyId))?.name}
                        </span>
                    ) : (
                        <span style={{ fontSize: '0.7rem', color: 'red' }}>
                            {activeCompanyId ? 'Yükleniyor...' : 'Seçim Yapınız'}
                        </span>
                    )}
                </div>
                <span style={{ marginLeft: '0.2rem', color: '#666', fontSize: '0.8rem' }}>▾</span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.5rem',
                    background: 'var(--background-color)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    width: '200px',
                    zIndex: 50,
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-secondary)'
                    }}>
                        FİRMA SEÇİNİZ
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {companies.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleSwitch(c.id)}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    background: activeCompanyId === c.id ? 'var(--primary-light)' : 'transparent',
                                    color: activeCompanyId === c.id ? 'var(--primary-blue)' : 'var(--text-primary)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
