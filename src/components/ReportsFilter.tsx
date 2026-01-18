"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function ReportsFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Default to current month YYYY-MM
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const [selectedMonth, setSelectedMonth] = useState(searchParams.get("month") || getCurrentMonth());

    useEffect(() => {
        const currentParam = searchParams.get("month");
        if (currentParam && currentParam !== selectedMonth) {
            setSelectedMonth(currentParam);
        }
    }, [searchParams]);

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSelectedMonth(val);

        const params = new URLSearchParams(searchParams);
        if (val) {
            params.set("month", val);
        } else {
            params.delete("month");
        }
        router.push(`/reports?${params.toString()}`);
    };

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 py-4 mb-8">
            <div className="container flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
                    Raporlar
                </h1>

                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-neutral-500">Dönem Seç:</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        className="input h-10 w-40 font-medium"
                    />
                </div>
            </div>
        </div>
    );
}
