"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

type FilterType = 'all' | 'month' | 'today';

function getDateFilter(filter: FilterType) {
    const now = new Date();
    if (filter === 'today') {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'month') {
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return null; // All time
}

export async function getDashboardStats(filter: FilterType = 'all') {
    const user = await getSessionUser();
    const dateFilter = getDateFilter(filter);

    const whereClause: any = { companyId: user.companyId };
    if (dateFilter) {
        whereClause.date = { gte: dateFilter };
    }

    // 1. Sales
    const sales = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: whereClause
    });

    // 2. Collection
    const collections = await prisma.collection.aggregate({
        _sum: { amount: true },
        where: whereClause
    });

    // 3. Balance (All time for THIS COMPANY)
    const globalSales = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { companyId: user.companyId }
    });
    const globalCollection = await prisma.collection.aggregate({
        _sum: { amount: true },
        where: { companyId: user.companyId }
    });
    const totalBalance = (globalSales._sum.totalAmount || 0) - (globalCollection._sum.amount || 0);

    return {
        sales: sales._sum.totalAmount || 0,
        collection: collections._sum.amount || 0,
        balance: totalBalance
    };
}

export async function getTopProducts(filter: FilterType = 'all') {
    const user = await getSessionUser();
    const dateFilter = getDateFilter(filter);

    // Filter by company via relation
    // Note: SaleItem doesn't have companyId directly, but Sale does.
    const whereClause: any = {
        sale: {
            companyId: user.companyId,
            ...(dateFilter ? { date: { gte: dateFilter } } : {})
        }
    };

    const topItems = await prisma.saleItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true, lineTotal: true },
        where: whereClause,
        orderBy: {
            _sum: { lineTotal: 'desc' }
        },
        take: 5
    });

    return topItems.map(item => ({
        name: item.productName,
        quantity: item._sum.quantity || 0,
        total: item._sum.lineTotal || 0
    }));
}

export async function getLatestSales(filter: FilterType = 'all') {
    const user = await getSessionUser();
    const dateFilter = getDateFilter(filter);

    const whereClause: any = { companyId: user.companyId };
    if (dateFilter) {
        whereClause.date = { gte: dateFilter };
    }

    const sales = await prisma.sale.findMany({
        where: whereClause,
        take: 3,
        orderBy: { date: 'desc' },
        include: { customer: true }
    });
    return sales;
}
