"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedGroup, setSelectedGroup] = useState(searchParams.get("group") || "");

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedGroup) {
            params.set("group", selectedGroup);
        } else {
            params.delete("group");
        }

        // Reset page to 1 on filter change
        if (searchParams.get("group") !== selectedGroup) {
            params.set("page", "1");
        }

        router.push(`/products?${params.toString()}`);
    }, [selectedGroup, router, searchParams]);

    return (
        <select
            className="input"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{
                height: '42px',
                minWidth: '150px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0 1rem'
            }}
        >
            <option value="">Tüm Gruplar</option>
            <option value="Ekran">Ekran</option>
            <option value="Ekran Koruma">Ekran Koruma</option>
            <option value="Kumanda">Kumanda</option>
            <option value="LGP">LGP</option>
            <option value="Led">Led</option>
            <option value="Diğer">Diğer</option>
        </select>
    );
}
