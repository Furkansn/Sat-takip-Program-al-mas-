import Link from "next/link";
import React from "react";
import { getSales, getProducts } from "@/actions/transaction";
import { getCustomers } from "@/actions/customer";
import SalesFilter from "@/components/SalesFilter";
import SalesList from "@/components/SalesList";

export default async function SalesPage({
    searchParams,
}: {
    searchParams?: {
        customerId?: string;
        productId?: string;
        date?: string;
        page?: string;
    };
}) {
    const page = Number(searchParams?.page) || 1;

    // 1. Fetch data in parallel
    const [salesData, customers, productsData] = await Promise.all([
        getSales({
            customerId: searchParams?.customerId,
            productId: searchParams?.productId,
            date: searchParams?.date,
            page,
            limit: 10
        }),
        getCustomers(),
        getProducts()
    ]);

    const { sales, totalPages } = salesData;

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Satışlar</h1>
                <Link href="/sales/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ Satış Gir</Link>
            </div>

            {/* Filter Component */}
            <React.Suspense fallback={<div className="card" style={{ height: '100px' }}>Yükleniyor...</div>}>
                <SalesFilter customers={customers} products={productsData.products} />
            </React.Suspense>

            <div style={{ padding: 0 }}>
                {sales.length === 0 ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-neutral)' }}>
                        {(searchParams?.customerId || searchParams?.productId || searchParams?.date)
                            ? 'Filtrelere uygun satış bulunamadı.'
                            : 'Henüz satış yok.'}
                    </p>
                ) : (
                    <>
                        <SalesList sales={sales} />

                        {/* Pagination */}
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={{
                                        pathname: '/sales',
                                        query: { ...searchParams, page: p }
                                    }}
                                    className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        opacity: p === page ? 1 : 0.7,
                                        textDecoration: 'none'
                                    }}
                                >
                                    {p}
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}
