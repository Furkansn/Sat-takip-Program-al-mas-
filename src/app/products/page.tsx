import Link from "next/link";
import { getProducts } from "@/actions/transaction";
import ProductsClient from "@/components/ProductsClient";
import SearchInput from "@/components/SearchInput";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams?: {
        search?: string;
        page?: string;
    };
}) {
    const page = Number(searchParams?.page) || 1;
    const search = searchParams?.search || "";
    const limit = 10;

    const { products, totalPages } = await getProducts({
        search,
        page,
        limit
    });

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0 }}>Ürünler</h1>
            </div>

            <SearchInput placeholder="Ürün ara..." />

            <ProductsClient products={products} />

            {/* Pagination - Reuse logic from SalesPage, maybe componentize later */}
            {totalPages > 1 && (
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Link
                            key={p}
                            href={{
                                pathname: '/products',
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
            )}
        </main>
    );
}
