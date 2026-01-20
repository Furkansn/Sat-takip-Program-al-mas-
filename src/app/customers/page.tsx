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
        showInactive?: string;
        page?: string;
    };
}) {
    const query = searchParams?.query || "";
    const showInactive = searchParams?.showInactive === "true";
    const page = Number(searchParams?.page) || 1;
    const limit = 10;

    const { customers, totalPages } = await getCustomers(query, showInactive, page, limit);

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

            <Search placeholder="İsim, soyisim veya telefon ile ara..." />

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
                                    {query ? 'Eşleşen müşteri bulunamadı.' : 'Henüz müşteri yok.'}
                                </td>
                            </tr>
                        ) : customers.map((c) => (
                            <CustomerRow key={c.id} customer={c} />
                        ))}
                    </tbody>
                </table>
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
