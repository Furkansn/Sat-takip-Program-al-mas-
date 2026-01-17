"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();


    const navItems = [
        { name: "Firma Yönetimi", href: "/admin/companies" },
        { name: "Kullanıcı Yönetimi", href: "/admin/users" },
    ];


    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside className="hidden md:flex w-64 bg-slate-900 border-r border-white/10 p-6 flex-col text-white flex-shrink-0 h-screen sticky top-0">
                <div className="mb-8 text-xl font-bold border-b border-white/10 pb-4">
                    Admin Paneli
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    {/* Sidebar navigation links removed */}
                </nav>

                {/* Logout button removed as requested */}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Top Navigation (Visible on Mobile & Desktop) */}
                <div className="sticky top-0 z-40 w-full bg-slate-900 border-b border-white/10 px-4 py-4 shadow-xl flex justify-center items-center">
                    <div className="flex gap-3 w-full max-w-md">
                        <Link
                            href="/admin/companies"
                            className={`flex-1 flex items-center justify-center h-10 rounded-xl text-sm font-semibold transition-all no-underline btn ${pathname === '/admin/companies'
                                ? 'btn-primary text-white shadow-lg shadow-blue-500/20'
                                : 'btn-secondary bg-transparent border-white/10 text-neutral-400'
                                }`}
                            style={{ textDecoration: 'none' }}
                        >
                            Firmalar
                        </Link>
                        <Link
                            href="/admin/users"
                            className={`flex-1 flex items-center justify-center h-10 rounded-xl text-sm font-semibold transition-all no-underline btn ${pathname === '/admin/users'
                                ? 'btn-primary text-white shadow-lg shadow-blue-500/20'
                                : 'btn-secondary bg-transparent border-white/10 text-neutral-400'
                                }`}
                            style={{ textDecoration: 'none' }}
                        >
                            Kullanıcılar
                        </Link>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
