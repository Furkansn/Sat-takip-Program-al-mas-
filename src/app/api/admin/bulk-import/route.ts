import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const session = await auth();
        // @ts-ignore
        if (session?.user?.role !== 'super_admin') {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const companyId = formData.get("companyId") as string;
        const type = formData.get("type") as string;

        if (!file || !companyId || !type) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        // Verify company exists
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return NextResponse.json({ success: false, message: "Invalid company" }, { status: 400 });
        }

        // 3. Read File
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: false, message: "File is empty" }, { status: 400 });
        }

        let successCount = 0;
        let errorCount = 0;
        const errorDetails: any[] = [];

        // 4. Process Rows
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +2 because 1-based and header is row 1

            try {
                if (type === 'customers') {
                    await processCustomer(row, companyId);
                } else if (type === 'products') {
                    await processProduct(row, companyId);
                }
                successCount++;
            } catch (err: any) {
                errorCount++;
                errorDetails.push({
                    row: rowNumber,
                    error: err.message || "Unknown error",
                    data: row
                });
            }
        }

        return NextResponse.json({
            success: true,
            importedCount: successCount,
            errorCount: errorCount,
            errors: errorDetails
        });

    } catch (error: any) {
        console.error("Bulk Import Error:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error: " + error.message }, { status: 500 });
    }
}

async function processCustomer(row: any, companyId: string) {
    // 1. Validate required
    // Normalize keys to lowercase to be safe? Template uses snake_case, but let's be robust.
    // Assuming template keys: name, surname, tax_number, phone
    const name = row['name'];
    if (!name) throw new Error("Name is required");

    const taxId = row['tax_number'] ? String(row['tax_number']).trim() : null;
    const phone = row['phone'] ? String(row['phone']).trim() : null;
    const surname = row['surname'] ? String(row['surname']).trim() : "";
    const email = row['email'] ? String(row['email']).trim() : null; // We can't store this in Customer currently, but we use for check logic if we could

    // 2. Check Duplicates
    // Priority: taxId > phone+name
    let existing = null;

    if (taxId) {
        existing = await prisma.customer.findFirst({
            where: {
                companyId,
                taxId
            }
        });
    }

    if (!existing && name && phone) {
        // Fallback check
        existing = await prisma.customer.findFirst({
            where: {
                companyId,
                name: { equals: name, mode: "insensitive" },
                phone
            }
        });
    }

    if (existing) {
        throw new Error("Customer already exists (Tax ID or Name+Phone match)");
    }

    // 3. Create
    await prisma.customer.create({
        data: {
            companyId,
            name,
            surname,
            phone,
            taxId,
            address: row['address'] || null,
            city: row['city'] || null,
            // district: row['district'], // Schema doesn't have district
            // riskLimit: row['discount_rate'] ? parseFloat(row['discount_rate']) : 0 // Maybe map discount_rate to riskLimit? No that's dangerous.
            // Ignoring unmapped fields as per schema constraints
        }
    });
}

async function processProduct(row: any, companyId: string) {
    // 1. Validate
    const name = row['name'];
    if (!name) throw new Error("Name is required");

    // Helper for parsing flexible keys
    const getVal = (keys: string[]) => {
        for (const k of keys) {
            if (row[k] !== undefined) return String(row[k]).trim();
        }
        return null;
    };

    const ledCode = getVal(['led_code', 'sku']) || null;
    const ledStCode = getVal(['led_st_code', 'st_code']) || null;
    const productGroup = getVal(['product_group', 'category', 'group']) || null;
    const compatibleBrand = getVal(['compatible_brand', 'brand']) || null;
    const compatibleModels = getVal(['compatible_models', 'models']) || null;
    const location = getVal(['location', 'shelf']) || null;

    // Numeric parsing
    const cost = row['cost'] ? parseFloat(String(row['cost']).replace(',', '.')) : 0;
    const price = row['price'] ? parseFloat(String(row['price']).replace(',', '.')) : 0;
    const stock = row['stock'] ? parseInt(String(row['stock'])) : 0;
    const inch = row['inch'] ? parseInt(String(row['inch'])) : null;

    // 2. Check Duplicates (Priority: ledCode/SKU > Name)
    let existing = null;
    if (ledCode) {
        existing = await prisma.product.findFirst({
            where: {
                companyId,
                ledCode: ledCode
            }
        });
    }

    if (!existing) {
        // Fallback to name check if no SKU or SKU didn't match
        existing = await prisma.product.findFirst({
            where: {
                companyId,
                name: { equals: name, mode: "insensitive" }
            }
        });
    }

    if (existing) {
        throw new Error("Product already exists (SKU or Name match)");
    }

    // 3. Create
    await prisma.product.create({
        data: {
            companyId,
            name,
            ledCode,
            ledStCode,
            productGroup,
            compatibleBrand,
            compatibleModels,
            inch,
            location,
            cost,
            price,
            stock
        }
    });
}
