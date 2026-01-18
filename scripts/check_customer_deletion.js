
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCustomers() {
    const ids = ['cmkibdnr70001n07s3y09sl6k', 'cmkia7xlk00013g3ivq0wykig'];

    console.log("Checking customer data integrity...");

    for (const id of ids) {
        try {
            const customer = await prisma.customer.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { sales: true, collections: true, returns: true }
                    }
                }
            });

            if (!customer) {
                console.log(`❌ Customer ${id} not found.`);
                continue;
            }

            console.log(`\nCustomer: ${customer.name} ${customer.surname} (${id})`);
            console.log(`- Sales: ${customer._count.sales}`);
            console.log(`- Collections: ${customer._count.collections}`);
            console.log(`- Returns: ${customer._count.returns}`);

            if (customer._count.sales === 0 && customer._count.collections === 0 && customer._count.returns === 0) {
                console.log("✅ SAFE TO DELETE: No related records found.");
            } else {
                console.log("⚠️ WARNING: Has related records. Deleting will fail or break reports.");
            }

        } catch (e) {
            console.error(`Error checking ${id}:`, e.message);
        }
    }
}

checkCustomers()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
