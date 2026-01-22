import Link from "next/link";
import { getCustomers } from "@/actions/customer";
import Search from "@/components/Search";
import CustomerRow from "@/components/CustomerRow";
import Pagination from "@/components/Pagination";

export default async function CustomersPage({
    searchParams,
}: {
    searchParams?: {
        query?: string;
        status?: string;
        page?: string;
    };
}) {
    const query = searchParams?.query || "";
    // Default to 'active', validate input to be one of the allowed values
    const statusParam = searchParams?.status;
    const status: 'active' | 'passive' | 'all' = (statusParam === 'active' || statusParam === 'passive' || statusParam === 'all')
        ? statusParam
        : 'active';

    const page = Number(searchParams?.page) || 1;
    const limit = 10;

    const { customers, totalPages } = await getCustomers(query, status, page, limit);

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Müşteriler</h1>
                <div>
                    <Link href="/customers/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        + Yeni Müşteri
                    </Link>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Search placeholder="İsim, soyisim veya telefon ile ara..." />

                <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    background: 'var(--surface-hover)',
                    padding: '0.25rem',
                    borderRadius: '999px',
                    width: 'fit-content',
                    margin: '0',
                    fontSize: '0.85rem'
                }}>
                    <Link
                        href={{ query: { ...searchParams, status: 'active', page: 1 } }}
                        className={`tab-link ${status === 'active' ? 'active' : ''}`}
                        style={{
                            padding: '0.4rem 1rem',
                            textDecoration: 'none',
                            borderRadius: '999px',
                            transition: 'all 0.2s ease',
                            color: status === 'active' ? 'white' : 'var(--color-neutral)',
                            backgroundColor: status === 'active' ? 'var(--primary-blue)' : 'transparent',
                            fontWeight: status === 'active' ? 600 : 500,
                            lineHeight: 1
                        }}
                    >
                        Aktif
                    </Link>
                    <Link
                        href={{ query: { ...searchParams, status: 'passive', page: 1 } }}
                        className={`tab-link ${status === 'passive' ? 'active' : ''}`}
                        style={{
                            padding: '0.4rem 1rem',
                            textDecoration: 'none',
                            borderRadius: '999px',
                            transition: 'all 0.2s ease',
                            color: status === 'passive' ? 'white' : 'var(--color-neutral)',
                            backgroundColor: status === 'passive' ? 'var(--primary-blue)' : 'transparent',
                            fontWeight: status === 'passive' ? 600 : 500,
                            lineHeight: 1
                        }}
                    >
                        Pasif
                    </Link>
                    <Link
                        href={{ query: { ...searchParams, status: 'all', page: 1 } }}
                        className={`tab-link ${status === 'all' ? 'active' : ''}`}
                        style={{
                            padding: '0.4rem 1rem',
                            textDecoration: 'none',
                            borderRadius: '999px',
                            transition: 'all 0.2s ease',
                            color: status === 'all' ? 'white' : 'var(--color-neutral)',
                            backgroundColor: status === 'all' ? 'var(--primary-blue)' : 'transparent',
                            fontWeight: status === 'all' ? 600 : 500,
                            lineHeight: 1
                        }}
                    >
                        Hepsi
                    </Link>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table table-separated">
                        <thead>
                            <tr>
                                <th>Ad Soyad</th>
                                <th>Telefon</th>
                                <th>İl</th>
                                <th>Durum</th>
                                <th style={{ textAlign: 'right' }}>Bakiye</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-neutral)' }}>
                                        {query ? 'Eşleşen müşteri bulunamadı.' : (status === 'passive' ? 'Pasif müşteri yok.' : 'Henüz müşteri yok.')}
                                    </td>
                                </tr>
                            ) : customers.map((c) => (
                                <CustomerRow key={c.id} customer={c} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                searchParams={searchParams}
                baseUrl="/customers"
            />
        </main>
    );
}
