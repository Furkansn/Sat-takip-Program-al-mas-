
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Multi-Tenant Migration...");

    // 1. Check if any company exists
    const existingCompany = await prisma.company.findFirst();
    let companyId = existingCompany?.id;

    if (!companyId) {
        console.log("Creating Default Company...");
        const company = await prisma.company.create({
            data: {
                name: "A Firması", // Using a generic name
                isActive: true
            }
        });
        companyId = company.id;
    }

    console.log(`Using Company ID: ${companyId}`);

    // 2. Migrate Data
    // Customers
    const customers = await prisma.customer.updateMany({
        where: { companyId: null },
        data: { companyId }
    });
    console.log(`Customers migrated: ${customers.count}`);

    // Products
    const products = await prisma.product.updateMany({
        where: { companyId: null },
        data: { companyId }
    });
    console.log(`Products migrated: ${products.count}`);

    // Sales
    const sales = await prisma.sale.updateMany({
        where: { companyId: null },
        data: { companyId }
    });
    console.log(`Sales migrated: ${sales.count}`);

    // Collections
    const collections = await prisma.collection.updateMany({
        where: { companyId: null },
        data: { companyId }
    });
    console.log(`Collections migrated: ${collections.count}`);

    // Users
    const users = await prisma.user.findMany({ where: { companyId: null } });
    for (const user of users) {
        console.log(`Migrating user: ${user.email}`);

        // Logic: Allow whitelist emails to become company admins?
        // Or just make everyone company_admin of this default company for now so they don't get locked out.
        await prisma.user.update({
            where: { id: user.id },
            data: {
                companyId,
                role: 'company_admin',
                isActive: true
            }
        });
    }
    console.log(`Users migrated: ${users.length}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
