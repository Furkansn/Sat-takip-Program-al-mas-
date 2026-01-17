"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

// Products
export async function getProducts(options?: { search?: string, page?: number, limit?: number }) {
    const user = await getSessionUser();
    const where: any = { companyId: user.companyId };

    if (options?.search) {
        where.name = { contains: options.search };
    }

    const totalCount = await prisma.product.count({ where });

    let products;
    if (options?.page && options?.limit) {
        const skip = (options.page - 1) * options.limit;
        products = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' },
            take: options.limit,
            skip
        });
    } else {
        // Return all if no pagination is requested (for dropdowns)
        products = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' }
        });
    }

    return {
        products,
        totalCount,
        totalPages: options?.limit ? Math.ceil(totalCount / options.limit) : 1
    };
}

export async function createProduct(formData: FormData) {
    const user = await getSessionUser();
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));

    await prisma.product.create({
        data: {
            companyId: user.companyId,
            name,
            price,
            stock
        }
    });
    revalidatePath("/products");
}

export async function updateProduct(id: string, data: { name: string, price: number, stock: number }) {
    const user = await getSessionUser();
    await prisma.product.updateMany({
        where: { id, companyId: user.companyId },
        data: {
            name: data.name,
            price: data.price,
            stock: data.stock
        }
    });
    revalidatePath("/products");
}

export async function deleteProduct(id: string) {
    const user = await getSessionUser();
    try {
        // Ensure ownership
        const product = await prisma.product.findFirst({ where: { id, companyId: user.companyId } });
        if (!product) throw new Error("Product not found");

        await prisma.product.delete({ where: { id } });
        revalidatePath("/products");
    } catch (error: any) {
        throw new Error(error.message || "Bu ürün satışlarda kullanıldığı için silinemez.");
    }
}

export async function updateStock(productId: string, quantity: number) {
    const user = await getSessionUser();
    await prisma.product.updateMany({
        where: { id: productId, companyId: user.companyId },
        data: { stock: { increment: quantity } }
    });
    revalidatePath("/products");
}

// Sales
export async function createSale(data: {
    customerId: string,
    segmentAtTime: string,
    discountRateAtTime: number,
    items: any[]
}) {
    const user = await getSessionUser();

    // Verify customer ownership
    const customer = await prisma.customer.findFirst({ where: { id: data.customerId, companyId: user.companyId } });
    if (!customer) throw new Error("Customer not found or access denied");

    // Calculate total
    const totalAmount = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    // Transaction: Create Sale -> Create Items -> Decrement Stock
    await prisma.$transaction(async (tx) => {
        // 1. Create Sale
        const sale = await tx.sale.create({
            data: {
                companyId: user.companyId,
                customerId: data.customerId,
                totalAmount,
                segmentAtTime: data.segmentAtTime || 'bronze',
                discountRateAtTime: data.discountRateAtTime || 0
            }
        });

        // 2. Create Items & Decrement Stock
        for (const item of data.items) {
            await tx.saleItem.create({
                data: {
                    saleId: sale.id,
                    productId: item.productId || null,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.quantity * item.unitPrice,
                    listUnitPrice: item.listUnitPrice || item.unitPrice, // Fallback if missing
                    appliedDiscountRate: item.appliedDiscountRate || 0
                }
            });

            if (item.productId) {
                // Ensure product ownership
                const product = await tx.product.findFirst({ where: { id: item.productId, companyId: user.companyId } });

                if (!product) throw new Error(`Product ${item.productId} not found`);
                if (product.stock < item.quantity) {
                    throw new Error(`Stok yetersiz: ${product.name}`);
                }

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }
        }
    });

    revalidatePath("/sales");
    revalidatePath("/customers");
}


export async function getSales(filters?: { customerId?: string, productId?: string, date?: string, page?: number, limit?: number }) {
    const user = await getSessionUser();
    const where: any = { companyId: user.companyId };

    if (filters?.customerId) {
        where.customerId = filters.customerId;
    }

    if (filters?.date) {
        // Filter for the specific date (00:00 to 23:59)
        const start = new Date(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.date);
        end.setHours(23, 59, 59, 999);

        where.date = {
            gte: start,
            lte: end
        };
    }

    if (filters?.productId) {
        where.items = {
            some: {
                productId: filters.productId
            }
        };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [totalCount, sales] = await Promise.all([
        prisma.sale.count({ where }),
        prisma.sale.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                customer: true,
                items: true
            },
            take: limit,
            skip: skip
        })
    ]);

    return {
        sales,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalCount
    };
}

export async function getSale(id: string) {
    const user = await getSessionUser();
    return await prisma.sale.findFirst({
        where: { id, companyId: user.companyId },
        include: {
            customer: true,
            items: true
        }
    });
}


export async function updateSale(saleId: string, data: { items: any[] }) {
    const user = await getSessionUser();

    // Verify ownership
    const sale = await prisma.sale.findFirst({ where: { id: saleId, companyId: user.companyId } });
    if (!sale) throw new Error("Sale not found or access denied");

    // Calculate new total
    const totalAmount = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    await prisma.$transaction(async (tx) => {
        // 1. Get existing sale items to revert stock
        const existingItems = await tx.saleItem.findMany({
            where: { saleId }
        });

        // 2. Revert stock for existing items
        for (const item of existingItems) {
            if (item.productId) {
                // Ensure product still exists/owned
                const product = await tx.product.findFirst({ where: { id: item.productId, companyId: user.companyId } });
                if (product) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });
                }
            }
        }

        // 3. Delete existing items
        await tx.saleItem.deleteMany({
            where: { saleId }
        });

        // 4. Create new items & Deduct stock
        for (const item of data.items) {
            await tx.saleItem.create({
                data: {
                    saleId: saleId,
                    productId: item.productId || null,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.quantity * item.unitPrice
                }
            });

            if (item.productId) {
                const product = await tx.product.findFirst({ where: { id: item.productId, companyId: user.companyId } });
                if (!product) throw new Error(`Product ${item.productId} not found`);

                if (product.stock < item.quantity) {
                    throw new Error(`Stok yetersiz: ${product.name} (Stok: ${product.stock}, İstenen: ${item.quantity})`);
                }

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }
        }

        // 5. Update Sale Total
        await tx.sale.update({
            where: { id: saleId },
            data: { totalAmount }
        });
    });

    revalidatePath("/sales");
    revalidatePath("/customers");
}
