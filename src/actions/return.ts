"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";

type ReturnItemInput = {
    productName: string;
    quantity: number;
    unitPrice: number;
};

export async function createReturn(customerId: string, items: ReturnItemInput[]) {
    const user = await getSessionUser();

    if (!items || items.length === 0) {
        throw new Error("İade edilecek ürün girilmelidir.");
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const returnRecord = await prisma.return.create({
        data: {
            companyId: user.companyId,
            customerId: customerId,
            totalAmount: totalAmount,
            items: {
                create: items.map(item => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.quantity * item.unitPrice
                }))
            }
        }
    });

    revalidatePath(`/customers/${customerId}`);
    return returnRecord;
}

export async function updateReturn(returnId: string, items: ReturnItemInput[]) {
    const user = await getSessionUser();

    if (!items || items.length === 0) {
        throw new Error("İade edilecek ürün girilmelidir.");
    }

    const returnRecord = await prisma.return.findFirst({
        where: { id: returnId, companyId: user.companyId }
    });

    if (!returnRecord) {
        throw new Error("İade kaydı bulunamadı.");
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Update using transaction to replace items
    await prisma.$transaction(async (tx) => {
        // Delete old items
        await tx.returnItem.deleteMany({
            where: { returnId: returnId }
        });

        // Create new items
        await tx.returnItem.createMany({
            data: items.map(item => ({
                returnId: returnId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.quantity * item.unitPrice
            }))
        });

        // Update return total
        await tx.return.update({
            where: { id: returnId },
            data: { totalAmount }
        });
    });

    revalidatePath(`/customers/${returnRecord.customerId}`);
}

export async function deleteReturn(returnId: string) {
    const user = await getSessionUser();

    // Verify ownership
    const returnRecord = await prisma.return.findFirst({
        where: { id: returnId, companyId: user.companyId }
    });

    if (!returnRecord) {
        throw new Error("İade kaydı bulunamadı.");
    }

    await prisma.return.delete({
        where: { id: returnId }
    });

    revalidatePath(`/customers/${returnRecord.customerId}`);
}
