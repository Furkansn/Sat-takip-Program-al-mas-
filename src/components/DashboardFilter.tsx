"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function DashboardFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentFilter = searchParams.get("filter") || "all";

    const changeFilter = (filter: string) => {
        router.replace(`/?filter=${filter}`, { scroll: false });
    };

    const styles = {
        container: {
            display: 'flex',
            gap: '0.5rem',
            background: 'var(--glass-bg)',
            padding: '0.5rem',
            borderRadius: '12px',
            width: 'fit-content',
            border: '1px solid var(--glass-border)'
        },
        button: (isActive: boolean) => ({
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: isActive ? 'var(--primary-blue)' : 'transparent',
            color: isActive ? 'white' : 'var(--color-neutral)',
        })
    };

    return (
        <div style={styles.container}>
            <button
                onClick={() => changeFilter("all")}
                style={styles.button(currentFilter === "all")}
            >
                Hepsi
            </button>
            <button
                onClick={() => changeFilter("month")}
                style={styles.button(currentFilter === "month")}
            >
                Bu Ay
            </button>
            <button
                onClick={() => changeFilter("today")}
                style={styles.button(currentFilter === "today")}
            >
                Bugün
            </button>
        </div>
    );
}
