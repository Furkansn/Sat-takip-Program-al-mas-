"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedGroup, setSelectedGroup] = useState(searchParams.get("group") || "");

    // Sync state with URL params when navigating (e.g. back button, or direct URL access)
    useEffect(() => {
        const groupFromUrl = searchParams.get("group") || "";
        if (groupFromUrl !== selectedGroup) {
            setSelectedGroup(groupFromUrl);
        }
    }, [searchParams]);

    const handleGroupChange = (newGroup: string) => {
        setSelectedGroup(newGroup);
        const params = new URLSearchParams(searchParams.toString());

        if (newGroup) {
            params.set("group", newGroup);
        } else {
            params.delete("group");
        }

        // Always reset to page 1 when filtering changes
        params.set("page", "1");

        router.push(`/products?${params.toString()}`);
    };

    return (
        <select
            className="input"
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
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
