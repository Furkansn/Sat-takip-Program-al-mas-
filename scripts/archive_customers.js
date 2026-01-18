
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function archiveCustomers() {
    const ids = ['cmkibdnr70001n07s3y09sl6k', 'cmkia7xlk00013g3ivq0wykig'];

    console.log("Archiving customers...");

    for (const id of ids) {
        try {
            const updated = await prisma.customer.update({
                where: { id },
                data: { isActive: false }
            });
            console.log(`✅ Archived: ${updated.name} ${updated.surname} (${id})`);
        } catch (e) {
            console.error(`Error archiving ${id}:`, e.message);
        }
    }
}

archiveCustomers()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
