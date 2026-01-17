"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function SearchInput({ placeholder }: { placeholder: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        router.replace(`?${params.toString()}`);
    }, 300);

    return (
        <div className="search-input-wrapper" style={{ marginBottom: '1rem', width: '100%', maxWidth: '400px' }}>
            <input
                className="input"
                placeholder={placeholder}
                defaultValue={searchParams.get('search')?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: '100%' }}
            />
        </div>
    );
}
