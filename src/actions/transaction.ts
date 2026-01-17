"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";

// Products
export async function getProducts(options?: {
    search?: string,
    page?: number,
    limit?: number,
    sort?: 'name' | 'stock',
    fullDetails?: boolean // If false, excludes heavy fields like imageUrl
}) {
    const user = await getSessionUser();
    const where: any = { companyId: user.companyId };

    if (options?.search) {
        where.OR = [
            { name: { contains: options.search, mode: 'insensitive' } },
            // Search in compatible models too if applicable
            { compatibleModels: { contains: options.search, mode: 'insensitive' } }
        ];
    }

    const orderBy = options?.sort === 'stock' ? { stock: 'asc' } : { name: 'asc' };

    const totalCount = await prisma.product.count({ where });

    // Define select fields to optimize performance (exclude imageUrl by default unless fullDetails is true)

    // Auto-select optimization:
    const select = options?.fullDetails ? undefined : {
        id: true,
        name: true,
        price: true,
        stock: true,
        productGroup: true,
        ledStCode: true,
        ledCode: true,
        compatibleBrand: true,
        compatibleModels: true,
        inch: true,
        location: true,
        cost: true,
        supplierId: true,
        supplier: true, // Include relation in select
        // imageUrl: false // Excluded by default
    };

    let products;

    // Pagination logic
    if (options?.page && options?.limit) {
        const skip = (options.page - 1) * options.limit;

        // Use spread syntax to avoid passing both select and include
        const queryOptions: any = {
            where,
            orderBy: orderBy as any,
            take: options.limit,
            skip,
        };

        if (select) {
            queryOptions.select = { ...select, imageUrl: true }; // List view usually needs image
        } else {
            queryOptions.include = { supplier: true };
        }

        products = await prisma.product.findMany(queryOptions);
    } else {
        // Return optimized list for dropdowns (no images)
        products = await prisma.product.findMany({
            where,
            orderBy: orderBy as any,
            select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                // No image, no heavy fields
            }
        });
    }

    return {
        products,
        totalCount,
        totalPages: (options?.limit && totalCount > 0) ? Math.ceil(totalCount / options.limit) : 1
    };
}

// Helper to handle supplier creation/finding
async function getOrCreateSupplier(companyId: string, supplierName?: string) {
    if (!supplierName) return null;

    const existing = await prisma.supplier.findFirst({
        where: { companyId, name: { equals: supplierName, mode: 'insensitive' } }
    });

    if (existing) return existing.id;

    const newSupplier = await prisma.supplier.create({
        data: {
            companyId,
            name: supplierName
        }
    });

    return newSupplier.id;
}

export async function createProduct(formData: FormData) {
    const user = await getSessionUser();

    // Basic Fields
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));

    // New Fields
    const productGroup = formData.get("productGroup") as string;
    const ledStCode = formData.get("ledStCode") as string;
    const ledCode = formData.get("ledCode") as string;
    const compatibleBrand = formData.get("compatibleBrand") as string;
    const compatibleModels = formData.get("compatibleModels") as string;
    const inch = formData.get("inch") ? Number(formData.get("inch")) : null;
    const location = formData.get("location") as string;
    const cost = formData.get("cost") ? Number(formData.get("cost")) : 0;
    const imageUrl = formData.get("imageUrl") as string; // Base64
    const supplierName = formData.get("supplierName") as string;

    const supplierId = await getOrCreateSupplier(user.companyId, supplierName);

    await prisma.product.create({
        data: {
            companyId: user.companyId,
            name,
            price,
            stock,
            productGroup: productGroup || null,
            ledStCode: ledStCode || null,
            ledCode: ledCode || null,
            compatibleBrand: compatibleBrand || null,
            compatibleModels: compatibleModels || null,
            inch: inch,
            location: location || null,
            cost: cost,
            imageUrl: imageUrl || null,
            supplierId: supplierId
        }
    });
    revalidatePath("/products");
}

export async function updateProduct(id: string, formData: FormData) {
    const user = await getSessionUser();

    // Basic Fields
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));

    // New Fields
    const productGroup = formData.get("productGroup") as string;
    const ledStCode = formData.get("ledStCode") as string;
    const ledCode = formData.get("ledCode") as string;
    const compatibleBrand = formData.get("compatibleBrand") as string;
    const compatibleModels = formData.get("compatibleModels") as string;
    const inch = formData.get("inch") ? Number(formData.get("inch")) : null;
    const location = formData.get("location") as string;
    const cost = formData.get("cost") ? Number(formData.get("cost")) : 0;
    const imageUrl = formData.get("imageUrl") as string;
    const supplierName = formData.get("supplierName") as string;

    const supplierId = await getOrCreateSupplier(user.companyId, supplierName);

    const updateData: any = {
        name,
        price,
        stock,
        productGroup: productGroup || null,
        ledStCode: ledStCode || null,
        ledCode: ledCode || null,
        compatibleBrand: compatibleBrand || null,
        compatibleModels: compatibleModels || null,
        inch: inch,
        location: location || null,
        cost: cost,
    };

    // Only update image if a new one is provided (non-empty string)
    if (imageUrl && imageUrl.length > 0) {
        updateData.imageUrl = imageUrl;
    }

    if (supplierName) {
        updateData.supplierId = supplierId;
    }

    await prisma.product.updateMany({
        where: { id, companyId: user.companyId },
        data: updateData
    });
    revalidatePath("/products");
}

export async function deleteProduct(id: string) {
    const user = await getSessionUser();
    try {
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

                // STOCK CHECK - Throw error if quantity > stock
                if (product.stock < item.quantity) {
                    throw new Error(`Stok yetersiz: ${product.name} (Mevcut: ${product.stock}, İstenen: ${item.quantity})`);
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
