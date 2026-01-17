"use client";

import { createCustomer } from "@/actions/customer";
import Link from "next/link";

export default function NewCustomerPage() {
    return (
        <main className="container" style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/customers" style={{ textDecoration: 'none', color: 'var(--color-neutral)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    ← Geri Dön
                </Link>
                <h1>Yeni Müşteri</h1>
            </div>

            <form action={createCustomer} className="card">
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
                    <input name="phone" className="input" placeholder="555..." />
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

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Kaydet</button>
            </form>
        </main>
    );
}
