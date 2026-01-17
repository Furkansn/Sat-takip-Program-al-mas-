"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/lib/actions";

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="btn btn-primary"
            aria-disabled={pending}
            style={{ width: '100%', justifyContent: 'center' }}
        >
            {pending ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
    );
}

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <h1 style={{ marginBottom: '0.75rem', textAlign: 'center', fontSize: '1.8rem' }}>Giriş Yap</h1>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-dark))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.25rem',
                        letterSpacing: '-1px',
                        boxShadow: '0 0 20px var(--primary-glow)',
                        border: '2px solid rgba(255,255,255,0.1)'
                    }}>
                        ST
                    </div>
                </div>
                <form action={dispatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-neutral)' }}>
                            Email
                        </label>
                        <input
                            className="input"
                            type="email"
                            name="email"
                            placeholder="ornek@sirket.com"
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-neutral)' }}>
                            Şifre
                        </label>
                        <input
                            className="input"
                            type="password"
                            name="password"
                            placeholder="******"
                            required
                            minLength={6}
                        />
                    </div>

                    {errorMessage && (
                        <div style={{
                            color: 'var(--color-debt)',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            {errorMessage}
                        </div>
                    )}

                    <div style={{ marginTop: '1rem' }}>
                        <LoginButton />
                    </div>
                </form>
            </div>
        </main>
    );
}
