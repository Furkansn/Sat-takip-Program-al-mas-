import Link from "next/link";
import { getProducts } from "@/actions/transaction";
import ProductsClient from "@/components/ProductsClient";
import SearchInput from "@/components/SearchInput";
import ProductFilter from "@/components/ProductFilter";
import Pagination from "@/components/Pagination";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams?: {
        search?: string;
        page?: string;
        group?: string; // Add group param
    };
}) {
    const page = Number(searchParams?.page) || 1;
    const search = searchParams?.search || "";
    const group = searchParams?.group || undefined;
    const limit = 10;

    const { products, totalPages } = await getProducts({
        search,
        page,
        limit,
        productGroup: group, // Pass filter to action
        fullDetails: true // We need image and details for the popup
    });

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0 }}>Ürünler</h1>
            </div>

            <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <SearchInput placeholder="Ürün ara..." />
                </div>
                <div style={{ flexShrink: 0 }}>
                    <ProductFilter />
                </div>
            </div>

            <ProductsClient products={products} />

            {/* Pagination */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                searchParams={searchParams}
                baseUrl="/products"
            />
        </main>
    );
}
