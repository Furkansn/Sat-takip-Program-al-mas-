"use client";

import Link from "next/link";
import { getPaginationItems } from "@/lib/pagination";
import { useRouter } from "next/navigation";
import { useRef } from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    searchParams?: any;
    baseUrl: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    searchParams = {},
    baseUrl
}: PaginationProps) {
    const router = useRouter();
    const prefetchedPages = useRef(new Set<number>());

    if (totalPages <= 1) return null;

    const items = getPaginationItems(currentPage, totalPages);

    const createLinkObj = (page: number) => {
        // Construct the URL string manually to ensure prefetch works correctly
        const query = new URLSearchParams();
        if (searchParams) {
            Object.entries(searchParams).forEach(([key, value]) => {
                if (value) query.set(key, String(value));
            });
        }
        query.set('page', String(page));
        return `${baseUrl}?${query.toString()}`;
    };

    const handlePrefetch = (page: number) => {
        if (page > 0 && page <= totalPages && !prefetchedPages.current.has(page)) {
            const url = createLinkObj(page);
            router.prefetch(url);
            prefetchedPages.current.add(page);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            marginTop: '2rem',
            width: '100%',
            maxWidth: '100%'
        }}>
            {/* Prev Button */}
            <Link
                href={currentPage > 1 ? createLinkObj(currentPage - 1) : '#'}
                aria-disabled={currentPage <= 1}
                className={`btn btn-secondary`}
                onMouseEnter={() => handlePrefetch(currentPage - 1)}
                onTouchStart={() => handlePrefetch(currentPage - 1)}
                style={{
                    padding: '0.5rem 1rem',
                    textDecoration: 'none',
                    pointerEvents: currentPage <= 1 ? 'none' : 'auto',
                    opacity: currentPage <= 1 ? 0.5 : 1,
                    cursor: currentPage <= 1 ? 'default' : 'pointer'
                }}
            >
                « Prev
            </Link>

            {/* Page Numbers */}
            {items.map((item, idx) => {
                if (item === 'ellipsis') {
                    return (
                        <span
                            key={`ellipsis-${idx}`}
                            style={{
                                padding: '0.5rem',
                                alignSelf: 'center',
                                userSelect: 'none'
                            }}
                        >
                            ...
                        </span>
                    );
                }

                return (
                    <Link
                        key={item}
                        href={createLinkObj(item)}
                        className={`btn ${item === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                        onMouseEnter={() => handlePrefetch(item)}
                        onTouchStart={() => handlePrefetch(item)}
                        style={{
                            padding: '0.5rem 1rem',
                            textDecoration: 'none'
                        }}
                    >
                        {item}
                    </Link>
                );
            })}

            {/* Next Button */}
            <Link
                href={currentPage < totalPages ? createLinkObj(currentPage + 1) : '#'}
                aria-disabled={currentPage >= totalPages}
                className={`btn btn-secondary`}
                onMouseEnter={() => handlePrefetch(currentPage + 1)}
                onTouchStart={() => handlePrefetch(currentPage + 1)}
                style={{
                    padding: '0.5rem 1rem',
                    textDecoration: 'none',
                    pointerEvents: currentPage >= totalPages ? 'none' : 'auto',
                    opacity: currentPage >= totalPages ? 0.5 : 1,
                    cursor: currentPage >= totalPages ? 'default' : 'pointer'
                }}
            >
                Next »
            </Link>
        </div>
    );
}
