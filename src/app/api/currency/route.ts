
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await fetch('https://finans.truncgil.com/today.json', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error("Currency external fetch failed:", response.status, response.statusText);
            return NextResponse.json({ error: `External API error: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Currency route error:", error);
        return NextResponse.json({ error: "Fetch failed", details: String(error) }, { status: 500 });
    }
}
