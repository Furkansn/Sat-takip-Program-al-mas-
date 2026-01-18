import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Assuming auth is available here
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
    // 1. Auth Check
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'super_admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Parse Query Params
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type || (type !== 'customers' && type !== 'products')) {
        return NextResponse.json({ error: "Invalid type. Must be 'customers' or 'products'" }, { status: 400 });
    }

    // 3. Define Headers and Sample Data
    let headers: string[] = [];
    let sample: any[] = [];

    if (type === 'customers') {
        headers = [
            "customer_code", "name", "surname", "phone", "email",
            "tax_number", "tax_office", "address", "city", "district",
            "discount_rate", "status"
        ];
        sample = [{
            customer_code: "C-1001",
            name: "Ahmet",
            surname: "Yılmaz",
            phone: "05551234567",
            email: "ahmet@mail.com",
            tax_number: "11111111111",
            tax_office: "Kadıköy",
            address: "Atatürk Cad. No:1",
            city: "İstanbul",
            district: "Kadıköy",
            discount_rate: "10",
            status: "Aktif"
        }];
    } else {
        headers = [
            "name", "product_group", "led_code", "led_st_code",
            "compatible_brand", "compatible_models", "inch",
            "location", "stock", "cost", "price"
        ];
        sample = [{
            name: "Samsung 50\" LED Bar Takımı",
            product_group: "Led",
            led_code: "L12345",
            led_st_code: "ST-9876",
            compatible_brand: "Samsung",
            compatible_models: "UE50TU8000, UE50TU7000",
            inch: 50,
            location: "Raf A1",
            stock: 100,
            cost: 450,
            price: 750
        }];
    }

    // 4. Create Workbook
    const worksheet = XLSX.utils.json_to_sheet(sample, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sablon");

    // 5. Buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // 6. Return Response
    return new NextResponse(buf, {
        headers: {
            "Content-Disposition": `attachment; filename="${type}_template.xlsx"`,
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
}
