import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import * as XLSX from "xlsx";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser();

        // 1. Fetch all products for the company
        const products = await prisma.product.findMany({
            where: {
                companyId: user.companyId
            },
            include: {
                supplier: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // 2. Format data for Excel
        const exportData = products.map(product => ({
            "ID": product.id,
            "Ürün Adı": product.name,
            "Grup": product.productGroup || "",
            "Satış Fiyatı": product.price,
            "Maliyet": product.cost || 0,
            "Stok": product.stock,
            "İnç": product.inch || "",
            "Uyumlu Marka": product.compatibleBrand || "",
            "Uyumlu Modeller": product.compatibleModels || "",
            "Led Kodu": product.ledCode || "",
            "Led St Kodu": product.ledStCode || "",
            "Depo Konumu": product.location || "",
            "Tedarikçi": product.supplier?.name || "",
            "Oluşturulma Tarihi": product.createdAt ? new Date(product.createdAt).toLocaleString('tr-TR') : "",
            "Son Güncelleme": product.updatedAt ? new Date(product.updatedAt).toLocaleString('tr-TR') : ""
        }));

        // 3. Create Workbook and Sheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Auto-width for columns (basic estimation)
        const wscols = [
            { wch: 25 }, // ID
            { wch: 30 }, // Name
            { wch: 15 }, // Group
            { wch: 12 }, // Price
            { wch: 12 }, // Cost
            { wch: 8 },  // Stock
            { wch: 8 },  // Inch
            { wch: 15 }, // Compatible Brand
            { wch: 30 }, // Compatible Models
            { wch: 15 }, // Led Code
            { wch: 15 }, // Led St Code
            { wch: 15 }, // Location
            { wch: 20 }, // Supplier
            { wch: 20 }, // Created At
            { wch: 20 }, // Updated At
        ];
        worksheet["!cols"] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");

        // 4. Generate Buffer
        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        // 5. Return Response
        const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const filename = `urun-listesi-${dateStr}.xlsx`;

        return new Response(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error("Export Error:", error);
        return new Response(JSON.stringify({ error: "Export failed: " + error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
