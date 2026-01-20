
import Link from "next/link";
import { getPaginationItems } from "@/lib/pagination";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    searchParams?: any; // Using any for flexibility with Next.js searchParams types
    baseUrl: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    searchParams = {},
    baseUrl
}: PaginationProps) {
    // If we only have 1 page, typically we don't show pagination, 
    // but the logic "totalPages <= 7 ... render 1..totalPages" implies we might show it?
    // The existing code did `{totalPages > 1 && ...}`. I will keep that logic in the parent usage 
    // OR handle it here. If I handle it here, I should return null if <= 1.
    // However, user said "totalPages <= 7 ise zaten hepsini göster (1..totalPages)".
    // Usually if totalPages is 1, we don't need pagination.
    if (totalPages <= 1) return null;

    const items = getPaginationItems(currentPage, totalPages);

    const createLink = (page: number) => ({
        pathname: baseUrl,
        query: { ...searchParams, page }
    });

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
                href={currentPage > 1 ? createLink(currentPage - 1) : '#'}
                aria-disabled={currentPage <= 1}
                className={`btn btn-secondary`}
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
                        href={createLink(item)}
                        className={`btn ${item === currentPage ? 'btn-primary' : 'btn-secondary'}`}
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
                href={currentPage < totalPages ? createLink(currentPage + 1) : '#'}
                aria-disabled={currentPage >= totalPages}
                className={`btn btn-secondary`}
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
