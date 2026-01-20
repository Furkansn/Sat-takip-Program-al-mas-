"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export async function getCustomers(
    query: string = "",
    showInactive: boolean = false,
    page: number = 1,
    limit: number = 10
) {
    const user = await getSessionUser();

    const where: any = {
        companyId: user.companyId,
        isActive: showInactive ? undefined : true,
    };

    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { surname: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
        ];
    }

    const [totalCount, customers] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.findMany({
            where,
            include: {
                sales: { select: { totalAmount: true } },
                collections: { select: { amount: true } },
                returns: { select: { totalAmount: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        })
    ]);

    return {
        customers,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
    };
}

export async function toggleCustomerStatus(customerId: string, isActive: boolean) {
    const user = await getSessionUser();

    // Limit to admin roles if desired, but for now just company check
    if (user.role !== 'company_admin' && user.role !== 'super_admin') {
        throw new Error("Unauthorized");
    }

    await prisma.customer.updateMany({
        where: { id: customerId, companyId: user.companyId },
        data: { isActive }
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
}

export async function createCustomer(formData: FormData) {
    const user = await getSessionUser();

    const name = formData.get("name") as string;
    const surname = formData.get("surname") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const taxId = formData.get("taxId") as string;
    const riskLimit = Number(formData.get("riskLimit"));
    const segment = (formData.get("segment") as string) || "bronze";

    await prisma.customer.create({
        data: {
            companyId: user.companyId,
            name,
            surname,
            phone,
            address,
            city,
            taxId,
            riskLimit,
            segment,
            segmentUpdatedAt: new Date()
        }
    });

    revalidatePath("/customers");
    redirect("/customers");
}

export async function updateRiskLimit(customerId: string, newLimit: number) {
    const user = await getSessionUser();

    await prisma.customer.updateMany({
        where: { id: customerId, companyId: user.companyId },
        data: { riskLimit: newLimit }
    });
    revalidatePath(`/customers/${customerId}`);
}

export async function updateCustomer(customerId: string, data: { name: string, surname: string, phone: string, address?: string, city?: string, taxId?: string, riskLimit: number, segment?: string }) {
    const user = await getSessionUser();

    // Check ownership and existing segment
    const existing = await prisma.customer.findFirst({
        where: { id: customerId, companyId: user.companyId },
        select: { segment: true }
    });

    if (!existing) throw new Error("Customer not found or access denied");

    let segmentData: any = {};
    if (data.segment && existing?.segment !== data.segment) {
        segmentData.segment = data.segment;
        segmentData.segmentUpdatedAt = new Date();
    }

    await prisma.customer.updateMany({
        where: { id: customerId, companyId: user.companyId },
        data: {
            name: data.name,
            surname: data.surname,
            phone: data.phone,
            address: data.address,
            city: data.city,
            taxId: data.taxId,
            riskLimit: data.riskLimit,
            ...segmentData
        }
    });
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
}

export async function addCollection(customerId: string, amount: number, note: string) {
    const user = await getSessionUser();

    // Verify customer exists to prevent assigning collection to non-owned customer
    const customer = await prisma.customer.findFirst({
        where: { id: customerId, companyId: user.companyId }
    });
    if (!customer) throw new Error("Customer not found");

    await prisma.collection.create({
        data: {
            companyId: user.companyId,
            customerId,
            amount,
            note
        }
    });
    revalidatePath(`/customers/${customerId}`);
}

export async function getCustomerDetails(id: string) {
    const user = await getSessionUser();

    // find first with companyId
    const customer = await prisma.customer.findFirst({
        where: { id, companyId: user.companyId },
        include: {
            sales: { orderBy: { date: 'desc' }, include: { items: true } },
            collections: { orderBy: { date: 'desc' } },
            returns: { orderBy: { date: 'desc' }, include: { items: true } },
            company: true
        }
    });

    if (!customer) return null;

    // Calculate Balance
    const totalSales = customer.sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalCollections = customer.collections.reduce((acc, c) => acc + c.amount, 0);
    const totalReturns = customer.returns.reduce((acc, r) => acc + r.totalAmount, 0);

    // Returns reduce the debt (balance), just like collections
    const balance = totalSales - (totalCollections + totalReturns);

    return { ...customer, balance };
}
