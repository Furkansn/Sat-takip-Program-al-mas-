import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Satışını Takip Et !",
    description: "Müşteri ve Satış Takip Sistemi",

};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/context/ThemeContext";

import { Providers } from "@/components/Providers";
import { auth } from "@/lib/auth"; // Correct import path for V5
import NextTopLoader from "nextjs-toploader";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth(); // Using auth() instead of getServerSession in V5

    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const adminTenantId = cookieStore.get('admin_tenant_id')?.value;

    return (
        <html lang="tr">
            <body className={inter.className}>
                <NextTopLoader
                    color="#2563eb"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px #2563eb,0 0 5px #2563eb"
                />
                <Providers session={session}>
                    <ThemeProvider>
                        <Navbar initialTenantId={adminTenantId} />
                        {children}
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    );
}
