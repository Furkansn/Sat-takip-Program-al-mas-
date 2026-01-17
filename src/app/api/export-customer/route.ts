
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("id");

        if (!customerId) {
            return new Response("Customer ID required", { status: 400 });
        }

        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return new Response("Unauthorized", { status: 401 });
        }

        let companyId = (session.user as any).companyId as string;

        // Handle Admin Tenant Switch
        if ((session.user as any).role === 'super_admin') {
            const cookieStore = cookies();
            const adminTenantId = cookieStore.get('admin_tenant_id')?.value;
            if (adminTenantId) {
                companyId = adminTenantId;
            }
        }

        const user = { companyId }; // Mimic user object structure for query

        // Use Prisma directly to avoid 'use server' conflicts if any, and ensure clean data fetch
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, companyId: user.companyId },
            include: {
                sales: { orderBy: { date: 'desc' }, include: { items: true } },
                collections: { orderBy: { date: 'desc' } },
                returns: { orderBy: { date: 'desc' }, include: { items: true } }
            }
        });

        if (!customer) {
            return new Response("Customer not found", { status: 404 });
        }

        // --- Logic copied and adapted from createWorkbook ---
        const transactions: any[] = [];

        // Add Sales
        if (customer.sales) {
            customer.sales.forEach((s: any) => {
                s.items.forEach((item: any) => {
                    const listPrice = item.listUnitPrice || item.unitPrice;
                    const discountRate = item.appliedDiscountRate || 0;

                    transactions.push({
                        date: new Date(s.date),
                        type: 'Satış',
                        description: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        listPrice: listPrice,
                        discountRate: discountRate,
                        itemTotal: item.quantity * item.unitPrice,
                        debt: item.quantity * item.unitPrice,
                        credit: 0
                    });
                });
            });
        }

        // Add Collections
        if (customer.collections) {
            customer.collections.forEach((c: any) => {
                transactions.push({
                    date: new Date(c.date),
                    type: 'Tahsilat',
                    description: c.note || 'Tahsilat',
                    quantity: '-',
                    unitPrice: '-',
                    listPrice: '-',
                    discountRate: '-',
                    itemTotal: '-',
                    debt: 0,
                    credit: c.amount
                });
            });
        }

        // Add Returns
        if (customer.returns) {
            customer.returns.forEach((r: any) => {
                r.items.forEach((item: any) => {
                    transactions.push({
                        date: new Date(r.date),
                        type: 'İade',
                        description: item.productName + ' (İade)',
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        listPrice: '-',
                        discountRate: '-',
                        itemTotal: item.quantity * item.unitPrice,
                        debt: 0,
                        credit: item.quantity * item.unitPrice // Returns are credits
                    });
                });
            });
        }

        // Sort by date ascending
        transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate running balance
        let balance = 0;
        const transactionRows = transactions.map(t => {
            balance += (t.debt - t.credit);
            return [
                t.date.toLocaleDateString('tr-TR'),
                t.type,
                t.description,
                t.quantity,
                t.listPrice !== '-' ? Number(t.listPrice).toLocaleString('en-US') : '-',
                t.discountRate !== '-' ? `%${(Number(t.discountRate) * 100).toFixed(0)}` : '-',
                t.unitPrice !== '-' ? Number(t.unitPrice).toLocaleString('en-US') : '-',
                t.itemTotal !== '-' ? Number(t.itemTotal).toLocaleString('en-US') : '-',
                t.debt > 0 ? t.debt : '',
                t.credit > 0 ? t.credit : '',
                balance
            ];
        });

        // Summary Calculations
        const totalDebt = transactions.reduce((sum, t) => sum + t.debt, 0);
        const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);

        // Assuming balance is correctly calculated on the fly here, or use the one from DB if preferred.
        // The one calculated here (running balance final value) should match.

        const summaryRows = [
            ["MÜŞTERİ HESAP EKSTRESİ"],
            [""],
            ["Sayın", `${customer.name} ${customer.surname}`],
            ["Telefon", customer.phone || '-'],
            ["Adres", customer.address || '-'],
            ["İl", customer.city ? customer.city.toLocaleUpperCase('tr-TR') : '-'],
            ["Vergi No", customer.taxId || '-'],
            ["Rapor Tarihi", new Date().toLocaleDateString('tr-TR')],
            [""],
            ["GENEL DURUM"],
            ["Toplam Borç", totalDebt],
            ["Toplam Ödeme", totalCredit],
            ["Güncel Bakiye", balance],
            [""],
        ];

        const tableHeader = [
            'Tarih',
            'İşlem Türü',
            'Açıklama / Ürün',
            'Adet',
            'Liste Fiyatı',
            'İndirim',
            'Birim Fiyat',
            'Toplam',
            'Borç ($)',
            'Tahsilat ($)',
            'Bakiye ($)'
        ];

        const footerRow = [
            '', '', 'GENEL TOPLAM', '', '', '', '', '',
            totalDebt,
            totalCredit,
            balance
        ];

        // Combine all data
        const wsData = [
            ...summaryRows,
            tableHeader,
            ...transactionRows,
            footerRow
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Customize columns width
        const wscols = [
            { wch: 12 }, // Date
            { wch: 15 }, // Type - Increased width
            { wch: 30 }, // Description
            { wch: 6 },  // Qty
            { wch: 10 }, // List Price
            { wch: 10 }, // Discount
            { wch: 12 }, // Unit Price
            { wch: 15 }, // Item Total
            { wch: 12 }, // Debt
            { wch: 12 }, // Credit - (Tahsilat)
            { wch: 12 }, // Balance
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Hesap Ekstresi");

        // Generate buffer
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        // Filename
        const cleanName = `${customer.name}_${customer.surname}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const filename = `ekstre_${cleanName}.xlsx`;

        // Return response with headers
        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
        });

    } catch (error: any) {
        console.error("Export API Error:", error);
        return new Response("Error exporting: " + error.message, { status: 500 });
    }
}
