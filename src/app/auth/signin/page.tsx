"use client";

// import { signIn } from "next-auth/react";

export default function LoginPage() {
    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '1rem',
            textAlign: 'center'
        }}>
            <h1 style={{ color: 'var(--primary-blue)', marginBottom: '2rem' }}>SatışApp</h1>

            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 style={{ marginBottom: '1rem' }}>Giriş Yap</h2>
                <p style={{ color: 'var(--color-neutral)', marginBottom: '2rem' }}>
                    Devam etmek için kurumsal Gmail hesabınızla giriş yapın.
                </p>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem' }}
                // onClick={() => signIn('google', { callbackUrl: '/' })}
                >
                    Google ile Giriş Yap
                </button>
            </div>
        </main>
    );
}
