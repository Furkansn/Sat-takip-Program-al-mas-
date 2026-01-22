"use client";

import { createCustomer } from "@/actions/customer";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;

        setLoading(true);
        const formData = new FormData(event.currentTarget);

        try {
            await createCustomer(formData);
            // Router automatic redirection might happen in server action, 
            // but if we preventDefault, we might need to handle navigation unless createCustomer does redirect properly.
            // Usually createCustomer server action with 'use server' might redirect. 
            // If it returns, we can assume success or handle response.
            // Assuming createCustomer redirects on success or we need to redirect.
            // Existing code didn't have redirect logic here, it was `action={createCustomer}`. 
            // Standard server actions with `redirect()` inside work fine with `action={}`.
            // When calling programmatically, `redirect()` inside server action throws NEXT_REDIRECT error which is caught by Next.js.
            // So we should be fine just awaiting it.
        } catch (error) {
            console.error(error);
            // If error is not a redirect
            setLoading(false);
        }
    }

    return (
        <main className="container" style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/customers" style={{ textDecoration: 'none', color: 'var(--color-neutral)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    ← Geri Dön
                </Link>
                <h1>Yeni Müşteri</h1>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ad</label>
                    <input name="name" required className="input" placeholder="Örn: Ali" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Soyad</label>
                    <input name="surname" required className="input" placeholder="Örn: Veli" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Telefon</label>
                    <input name="phone" required className="input" placeholder="555..." />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Adres</label>
                    <input name="address" className="input" placeholder="Adres..." />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>İl</label>
                    <input name="city" className="input" placeholder="İstanbul" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Vergi No</label>
                    <input name="taxId" className="input" placeholder="Vergi No..." />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Risk Limiti ($)</label>
                    <input name="riskLimit" type="number" step="0.01" defaultValue={0} className="input" />
                    <small style={{ color: 'var(--color-neutral)' }}>Limiti 0 bırakırsanız uyarı verilmez.</small>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Segment (Müşteri Sınıfı)</label>
                    <select name="segment" className="select" defaultValue="bronze">
                        <option value="bronze">Bronze (İndirimsiz)</option>
                        <option value="silver">Silver (%5 İndirim)</option>
                        <option value="gold">Gold (%10 İndirim)</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    disabled={loading}
                >
                    {loading && <span className="spinner"></span>}
                    {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
            </form>
        </main>
    );
}
