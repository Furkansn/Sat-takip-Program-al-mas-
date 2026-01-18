"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getCurrentCompany() {
    const session = await auth();
    const companyId = (session?.user as any)?.companyId;

    if (!companyId) return null;

    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                name: true,
                reportsEnabled: true,
                isActive: true
            }
        });
        return company;
    } catch (error) {
        return null;
    }
}
