
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeDatabase() {
    console.log("⚠️  STARTING FULL DATABASE WIPE (TEST DATA CLEANUP) ⚠️");
    console.log("This will delete ALL Sales, Collections, Returns, Products, and Customers.");

    try {
        // 1. Delete transactional data (Children)
        console.log("Deleting Collections...");
        await prisma.collection.deleteMany({});

        console.log("Deleting Returns (and ReturnItems via Cascade)...");
        await prisma.return.deleteMany({});

        console.log("Deleting Sales (and SaleItems via Cascade)...");
        await prisma.sale.deleteMany({});

        // 2. Delete Master Data
        console.log("Deleting Products...");
        await prisma.product.deleteMany({});

        console.log("Deleting Customers...");
        await prisma.customer.deleteMany({});

        console.log("\n✅ DATABASE WIPED SUCCESSFULLY. ALL TEST DATA IS GONE.");
    } catch (e) {
        console.error("\n❌ ERROR DURING WIPE:", e);
    } finally {
        await prisma.$disconnect();
    }
}

wipeDatabase();
