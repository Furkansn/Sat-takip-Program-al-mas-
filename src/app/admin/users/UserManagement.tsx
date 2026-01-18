"use client";

import { useState } from "react";
import Link from "next/link";
import { createUser, updateUser } from "@/actions/admin";

type Company = {
    id: string;
    name: string;
};

type User = {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isActive: boolean;
    companyId: string | null;
    company: Company | null;
};

const ROLES = [
    { value: "company_admin", label: "Firma Yetkilisi" },
    { value: "accountant", label: "Muhasebe" }
];

export default function UserManagement({ initialUsers, companies }: { initialUsers: User[], companies: Company[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCompany, setFilterCompany] = useState("");
    const [filterRole, setFilterRole] = useState("");

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())));
        const matchesCompany = filterCompany ? u.companyId === filterCompany : true;
        const matchesRole = filterRole ? u.role === filterRole : true;
        return matchesSearch && matchesCompany && matchesRole;
    });

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setMessage("");

        try {
            let result;
            if (editingUser) {
                formData.append("id", editingUser.id);
                result = await updateUser(null, formData);
            } else {
                result = await createUser(null, formData);
            }

            if (result.success) {
                setMessage(result.message);
                setTimeout(() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    window.location.reload();
                }, 1000);
            } else {
                setMessage(result.message || "Hata oluştu");
                setIsLoading(false);
            }
        } catch (error) {
            setMessage("Bir hata oluştu.");
            setIsLoading(false);
        }
    };

    const getRoleLabel = (role: string) => {
        if (role === 'super_admin') return 'Sistem Yöneticisi';
        return ROLES.find(r => r.value === role)?.label || role;
    };

    const openNewModal = () => {
        setEditingUser(null);
        setMessage("");
        setIsModalOpen(true);
    }

    return (
        <main className="container pb-24">

            {/* Header (Unified) */}
            <div className="admin-companies-header">
                {/* Left: Action Button */}
                <button
                    onClick={openNewModal}
                    className="btn btn-primary h-10 px-6 whitespace-nowrap flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Yeni Kullanıcı
                </button>

                {/* Right: Toggle Switch */}
                <div className="admin-companies-right">
                    <Link
                        href="/admin/companies"
                        className="btn btn-secondary bg-transparent border-white/10 text-neutral-400 h-10 px-4 text-sm font-semibold flex items-center justify-center no-underline hover:text-white"
                        style={{ textDecoration: 'none' }}
                    >
                        Firmalar
                    </Link>
                    <Link
                        href="/admin/users"
                        className="btn btn-primary text-white shadow-lg shadow-blue-500/20 h-10 px-4 text-sm font-semibold flex items-center justify-center no-underline"
                        style={{ textDecoration: 'none' }}
                    >
                        Kullanıcılar
                    </Link>
                </div>
            </div>

            {/* Content Panel */}
            <div className="card !p-0 overflow-hidden border border-white/5">
                {/* Filters Row */}
                <div className="p-4 md:p-6 border-b border-white/5 bg-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-3 relative">
                            <select
                                className="input h-11 w-full appearance-none pr-10 truncate"
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                            >
                                <option value="">Tüm Firmalar</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                        </div>

                        <div className="md:col-span-3 relative">
                            <select
                                className="input h-11 w-full appearance-none pr-10 truncate"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="">Tüm Roller</option>
                                {ROLES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                                <option value="super_admin">Sistem Yöneticisi</option>
                            </select>

                        </div>

                        <div className="md:col-span-6 relative">
                            <input
                                type="text"
                                placeholder="İsim veya E-posta ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input h-11 w-full pr-10 pl-3"
                            />
                            <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-neutral-400">

                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="table w-full">

                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 whitespace-nowrap text-left">E-posta</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 whitespace-nowrap text-left">İsim</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 whitespace-nowrap text-left">Firma</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 whitespace-nowrap text-left">Rol</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 whitespace-nowrap text-left">Durum</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400 whitespace-nowrap">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap" data-label="E-posta">
                                        <span className="font-medium text-white break-all md:break-normal">{u.email}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap" data-label="İsim">
                                        <span className="text-neutral-300">{u.fullName || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap text-sm text-neutral-300" data-label="Firma">
                                        {u.role === 'super_admin' ? (
                                            <span className="text-neutral-500 italic">Global</span>
                                        ) : (
                                            u.company?.name || '-'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap" data-label="Rol">
                                        <span className={`badge ${u.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                            u.role === 'company_admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                            }`}>
                                            {getRoleLabel(u.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap" data-label="Durum">
                                        <span className={`badge ${u.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                            {u.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap text-right" data-label="Aksiyon">
                                        {u.role !== 'super_admin' ? (
                                            <button
                                                onClick={() => { setEditingUser(u); setIsModalOpen(true); setMessage(""); }}
                                                className="btn btn-secondary !p-2 h-9 w-9 inline-flex items-center justify-center hover:text-blue-400 hover:border-blue-500/30 transition-all opacity-80 group-hover:opacity-100"
                                                title="Düzenle"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-500 border border-neutral-500/10 select-none">
                                                <svg className="mr-1.5 opacity-70" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                Kilitli
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 rounded-full bg-white/5 border border-white/10">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                </svg>
                                            </div>
                                            <p className="font-medium">Kullanıcı bulunamadı.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 duration-200">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />

                    <div className="card w-full max-w-lg relative z-10 !m-0 !p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-surface/50">
                            <h2 className="text-lg font-bold text-foreground m-0">
                                {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-neutral-400 hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {message && (
                                <div className={`mb-6 p-4 rounded-lg text-sm font-medium flex items-center gap-3 ${message.includes('Hata') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                    {message.includes('Hata') ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    )}
                                    {message}
                                </div>
                            )}

                            <form action={handleSubmit} id="userForm">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-400 mb-2">Ad Soyad</label>
                                        <input
                                            name="fullName"
                                            type="text"
                                            defaultValue={editingUser?.fullName || ""}
                                            className="input h-11"
                                            placeholder="Ad Soyad"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-400 mb-2">Email <span className="text-red-500">*</span></label>
                                        <input
                                            name="email"
                                            type="email"
                                            defaultValue={editingUser?.email || ""}
                                            className="input h-11"
                                            placeholder="ornek@sirket.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-400 mb-2">
                                            {editingUser ? 'Yeni Şifre (Boş bırakılabilir)' : 'Şifre'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name={editingUser ? "newPassword" : "password"}
                                            type="password"
                                            className="input h-11"
                                            required={!editingUser}
                                            minLength={6}
                                            placeholder={editingUser ? "Değiştirmek için girin" : "En az 6 karakter"}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-400 mb-2">Bağlı Firma <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    name="companyId"
                                                    defaultValue={editingUser?.companyId || ""}
                                                    className="input h-11 appearance-none"
                                                    required
                                                >
                                                    <option value="" disabled>Seçiniz</option>
                                                    {companies.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>

                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-400 mb-2">Rol</label>
                                            <div className="relative">
                                                <select
                                                    name="role"
                                                    defaultValue={editingUser?.role || "company_admin"}
                                                    className="input h-11 appearance-none"
                                                >
                                                    {ROLES.map(r => (
                                                        <option key={r.value} value={r.value}>{r.label}</option>
                                                    ))}
                                                </select>

                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-400 mb-2">Durum</label>
                                        <div className="relative">
                                            <select
                                                name="isActive"
                                                defaultValue={editingUser?.isActive ?? true ? "true" : "false"}
                                                className="input h-11 appearance-none"
                                            >
                                                <option value="true">Aktif</option>
                                                <option value="false">Pasif</option>
                                            </select>
                                            <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-neutral-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-border/50 bg-surface/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="btn btn-secondary h-11 px-6"
                                disabled={isLoading}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                form="userForm"
                                className="btn btn-primary h-11 px-6 min-w-[100px]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Kaydediliyor...
                                    </span>
                                ) : (
                                    'Kaydet'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
