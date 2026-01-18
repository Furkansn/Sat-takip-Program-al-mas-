"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Helper to get date range for a given "YYYY-MM"
function getMonthRange(monthStr?: string) {
    const date = monthStr ? new Date(monthStr) : new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
}

async function checkPermission() {
    const session = await auth();
    const companyId = (session?.user as any)?.companyId;
    if (!companyId) return null;

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, reportsEnabled: true }
    });

    if (!company || !company.reportsEnabled) return null;
    return companyId;
}

export async function getReportsSummary(monthStr?: string) {
    const companyId = await checkPermission();
    if (!companyId) throw new Error("Unauthorized");

    const { start, end } = getMonthRange(monthStr);

    // Run parallel queries
    const [sales, collections, returns] = await Promise.all([
        prisma.sale.aggregate({
            where: { companyId, date: { gte: start, lte: end } },
            _sum: { totalAmount: true }
        }),
        prisma.collection.aggregate({
            where: { companyId, date: { gte: start, lte: end } },
            _sum: { amount: true }
        }),
        prisma.return.aggregate({
            where: { companyId, date: { gte: start, lte: end } },
            _sum: { totalAmount: true },
            _count: true
        })
    ]);

    const totalSales = sales._sum.totalAmount || 0;
    const totalCollections = collections._sum.amount || 0;
    const totalReturns = returns._sum.totalAmount || 0;
    const returnCount = returns._count || 0;

    // Net Durum: Satış - İade (Tahsilat kasaya giren paradır, net satış durumunu etkilemez ama nakit akışıdır)
    // Prompt says: "Net Durum (Satış - İade - Tahsilat gibi)" -> vague.
    // Let's do: Cash Flow = Collections - Returns (assuming returns are cash out? or credit?)
    // Actually usually: Net Sales = Sales - Returns.
    // Net Cash = Collections.
    // Let's provide "Net Satış" (Sales - Returns) and "Net Kasa Girişi" (Collections).
    // Prompt says "Net Durum". I'll calculate it as Sales - Returns.
    const netStatus = totalSales - totalReturns;

    return {
        totalSales,
        totalCollections,
        totalReturns,
        returnCount,
        netStatus
    };
}

export async function getMonthlyTransactions(monthStr?: string) {
    const companyId = await checkPermission();
    if (!companyId) throw new Error("Unauthorized");

    const { start, end } = getMonthRange(monthStr);

    const [sales, collections, returns] = await Promise.all([
        prisma.sale.findMany({
            where: { companyId, date: { gte: start, lte: end } },
            include: { customer: true, items: true },
            orderBy: { date: 'desc' }
        }),
        prisma.collection.findMany({
            where: { companyId, date: { gte: start, lte: end } },
            include: { customer: true },
            orderBy: { date: 'desc' }
        }),
        prisma.return.findMany({ // Assuming Return model exists and is similar
            where: { companyId, date: { gte: start, lte: end } },
            include: { customer: true, items: true },
            orderBy: { date: 'desc' }
        })
    ]);

    return { sales, collections, returns };
}

export async function getCustomerBalances() {
    const companyId = await checkPermission();
    if (!companyId) throw new Error("Unauthorized");

    // "Seçili ay sonunda (veya güncel)".
    // Calculation historical balance is hard without a transaction ledger.
    // I will return CURRENT balances for simplicity as implied by "veya güncel".

    // Logic: Calculate total sales - total collections - total returns for each customer.
    // This assumes starting balance was 0.
    // Ideally we iterate all customers and sum their transactions.
    // This is heavy. Let's see if Customer model has a 'balance' field?
    // Checking schema... No balance field.
    // Calculating on the fly.

    const customers = await prisma.customer.findMany({
        where: { companyId },
        include: {
            sales: { select: { totalAmount: true } },
            collections: { select: { amount: true } },
            returns: { select: { totalAmount: true } }
        }
    });

    const balances = customers.map(c => {
        const totalSales = c.sales.reduce((sum, s) => sum + s.totalAmount, 0);
        const totalCollections = c.collections.reduce((sum, col) => sum + col.amount, 0);
        const totalReturns = c.returns.reduce((sum, r) => sum + r.totalAmount, 0);

        // Alacak (Receivable) = Sales - Collections - Returns
        const balance = totalSales - totalCollections - totalReturns;

        return {
            id: c.id,
            name: c.name,
            surname: c.surname,
            riskLimit: c.riskLimit,
            balance
        };
    }).sort((a, b) => b.balance - a.balance); // Highest debt first

    return balances;
}

export async function getTopProducts(monthStr?: string) {
    const companyId = await checkPermission();
    if (!companyId) throw new Error("Unauthorized");

    const { start, end } = getMonthRange(monthStr);

    // Get all sale items for the period
    const saleItems = await prisma.saleItem.findMany({
        where: {
            sale: {
                companyId,
                date: { gte: start, lte: end }
            }
        },
        include: {
            product: true
        }
    });

    // Aggregate by product
    const productStats = new Map<string, {
        name: string,
        quantity: number,
        revenue: number,
        cost: number
    }>();

    for (const item of saleItems) {
        if (!item.productId) continue;

        const existing = productStats.get(item.productId) || {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            cost: 0
        };

        existing.quantity += item.quantity;
        existing.revenue += item.lineTotal;

        // Cost calculation
        // item.product.cost is nullable
        const unitCost = item.product?.cost || 0;
        existing.cost += unitCost * item.quantity;

        // Update name in case it changed? Keep original
        productStats.set(item.productId, existing);
    }

    const result = Array.from(productStats.values()).map(stat => ({
        ...stat,
        profit: stat.cost > 0 ? (stat.revenue - stat.cost) : null // null if no cost info
    })).sort((a, b) => b.revenue - a.revenue); // Sort by revenue

    return result;
}
