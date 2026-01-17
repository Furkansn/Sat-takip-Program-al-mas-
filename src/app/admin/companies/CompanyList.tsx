"use client";

import { useState } from "react";
// We will implement server actions for update later

export default function CompanyList({ initialCompanies }: { initialCompanies: any[] }) {
    const [companies, setCompanies] = useState(initialCompanies);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const startEdit = (c: any) => {
        setEditingId(c.id);
        setEditName(c.name);
    };

    const saveEdit = async () => {
        if (!editingId) return;

        // Optimistic update
        setCompanies(companies.map(c => c.id === editingId ? { ...c, name: editName } : c));

        try {
            await fetch('/api/companies', {
                method: 'PUT', // We'll need to handle this in API or robust server action
                body: JSON.stringify({ id: editingId, name: editName }),
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error("Failed to update company name", error);
            // Revert if needed
        }

        setEditingId(null);
    };

    return (
        <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '1rem' }}>Firma Adı</th>
                        <th style={{ padding: '1rem' }}>Durum</th>
                        <th style={{ padding: '1rem' }}>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {companies.map((company) => (
                        <tr key={company.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '1rem' }}>
                                {editingId === company.id ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="input"
                                        autoFocus
                                    />
                                ) : (
                                    company.name
                                )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <span className={`badge ${company.isActive ? 'badge-success' : 'badge-danger'}`}>
                                    {company.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                {editingId === company.id ? (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={saveEdit} className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Kaydet</button>
                                        <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>İptal</button>
                                    </div>
                                ) : (
                                    <button onClick={() => startEdit(company)} className="icon-btn">
                                        ✎ Düzenle
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
