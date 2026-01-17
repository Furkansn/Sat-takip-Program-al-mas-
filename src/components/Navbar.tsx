"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import CurrencyTicker from "./CurrencyTicker";
import ThemeToggle from "./ThemeToggle";

import AdminTenantSwitcher from "./AdminTenantSwitcher";
import { handleSignOut } from "@/lib/actions";
import { useEffect, useState } from "react";
// Since AdminTenantSwitcher needs companies, we might need to fetch them.
// For now, let's assume we fetch them here or pass them. 
// Ideally, Navbar should be server component, but it has interactivity.
// We can fetch companies in a useEffect if admin.

export default function Navbar({ initialTenantId }: { initialTenantId?: string }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [companies, setCompanies] = useState<any[]>([]);


    const [persistedRole, setPersistedRole] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user) {
            const user = session.user as any;
            setPersistedRole(user.role);
            if (user.companyName) {
                setCompanyName(user.companyName);
            }
        }
        // console.log("Navbar companies:", companies.length);
        // console.log("Current companyId:", (session?.user as any)?.companyId);
    }, [session, companies]);

    const role = (session?.user as any)?.role || persistedRole;
    const companyId = initialTenantId || (session?.user as any)?.companyId; // Prioritize initialTenantId passed from server cookie
    // Force isAdmin calculation from session role directly
    const isAdmin = role === 'super_admin' || (session?.user as any)?.role === 'super_admin';
    const isCompanyAdmin = role === 'company_admin';

    useEffect(() => {
        // Fetch companies regardless of persisted role if user is really admin in session
        const userIsAdmin = (session?.user as any)?.role === 'super_admin';

        if (userIsAdmin) {
            fetch('/api/companies')
                .then(res => res.json())
                .then(data => {
                    // console.log("Fetched companies:", data); 
                    if (Array.isArray(data)) {
                        setCompanies(data);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [session]);

    if (pathname.startsWith('/login')) return null;

    const navItems = [
        {
            name: "Ana Sayfa",
            href: "/",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            )
        },
        {
            name: "Müşteriler",
            href: "/customers",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            )
        },
        {
            name: "Satışlar",
            href: "/sales",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
            )
        },
        {
            name: "Ürünler",
            href: "/products",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            )
        },
    ];

    // Only super_admin can see and access admin pages
    if (isAdmin) {
        navItems.push({
            name: "Admin",
            href: "/admin/companies",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                    <path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"></path>
                </svg>
            )
        });
    }

    return (
        <>
            {/* Top Navigation Bar */}
            <nav className="navbar-glass" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* DEBUG PANEL REMOVED */}

                    {isAdmin ? (
                        <AdminTenantSwitcher companies={companies} activeCompanyId={companyId} />

                    ) : (
                        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-dark))',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '1rem',
                                letterSpacing: '-1px',
                                boxShadow: '0 0 20px var(--primary-glow)',
                                border: '2px solid rgba(255,255,255,0.1)'
                            }}>
                                ST
                            </div>



                            {/* Company Name for Non-Admin */}
                            {companyName && (
                                <span
                                    className="truncate max-w-[150px] sm:max-w-[250px]"
                                    style={{
                                        color: 'rgb(var(--foreground-rgb))',
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        letterSpacing: '-0.5px',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        transition: 'color 0.3s ease'
                                    }}
                                    title={companyName}
                                >
                                    {companyName}
                                </span>
                            )}
                        </Link>
                    )}
                </div>



                {/* Currency Ticker - Centered Absolutely on Desktop */}
                <div className="ticker-wrapper desktop-only">
                    <CurrencyTicker />
                </div>

                {/* Right Side Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <ThemeToggle />

                    {/* Desktop Links */}
                    <div className="desktop-only" style={{ gap: '1rem' }}>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    textDecoration: 'none',
                                    color: pathname === item.href ? 'var(--primary-blue)' : 'var(--color-neutral)',
                                    fontWeight: pathname === item.href ? 'bold' : 'normal',
                                    transition: 'color 0.2s'
                                }}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>




                    <form action={handleSignOut}>
                        <button
                            type="submit"
                            className="btn"
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.8rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            Çıkış
                        </button>
                    </form>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="mobile-bottom-nav">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="mobile-nav-icon">{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
