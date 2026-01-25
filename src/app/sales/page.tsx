import Link from "next/link";
import React from "react";
import { getSales, getProducts } from "@/actions/transaction";
import { getCustomers, getActiveCustomersLite } from "@/actions/customer";
import SalesFilter from "@/components/SalesFilter";
import SalesList from "@/components/SalesList";
import Pagination from "@/components/Pagination";

import { getCurrentCompany } from "@/actions/company";

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
    const [salesData, customersLite, productsData, company] = await Promise.all([
        getSales({
            customerId: searchParams?.customerId,
            productId: searchParams?.productId,
            date: searchParams?.date,
            page,
            limit: 10
        }),
        getActiveCustomersLite(), // Optimized for dropdowns
        getProducts(), // Already optimized for dropdowns when no paging params
        getCurrentCompany()
    ]);

    const { sales, totalPages } = salesData;

    return (
        <main className="container">
            {/* Header Row: Full width, Flex, Space Between */}
            {/* Header Row: Full width, Flex, Space Between */}
            {/* Header Row: Full width, Guaranteed Layout via CSS Classes */}
            <div className="page-header">
                {/* Left: Title */}
                <h1 className="page-title">Satışlar</h1>

                {/* Right: Actions */}
                <div className="page-actions">
                    {company?.reportsEnabled && (
                        <Link
                            href="/reports"
                            className="btn btn-primary reports-btn reports-desktop-only"
                            style={{ textDecoration: 'none' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            Raporlar
                        </Link>
                    )}
                    <Link
                        href="/sales/new"
                        className="btn btn-primary"
                        style={{ textDecoration: 'none' }}
                    >
                        + Satış Gir
                    </Link>
                </div>
            </div>

            {/* Filter Component */}
            <React.Suspense fallback={<div className="card" style={{ height: '100px' }}>Yükleniyor...</div>}>
                <SalesFilter customers={customersLite} products={productsData.products} />
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
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            searchParams={searchParams}
                            baseUrl="/sales"
                        />
                    </>
                )}
            </div>
        </main>
    )
}
