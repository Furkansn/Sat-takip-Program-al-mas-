
import { prisma } from "../src/lib/db";

async function main() {
    console.log("Seeding companies...");

    const companies = [
        { name: "Teknoloji A.Ş.", isActive: true },
        { name: "İnşaat Ltd. Şti.", isActive: true },
        { name: "Perakende Pazarlama", isActive: true },
    ];

    for (const c of companies) {
        // Upsert to avoid duplicates
        // Note: prisma.company.upsert requires a unique field like id or name (if unique).
        // If name is not unique in schema, we'll check first.

        // Check if exists
        const exists = await prisma.company.findFirst({ where: { name: c.name } });
        if (!exists) {
            await prisma.company.create({ data: c });
            console.log(`Created: ${c.name}`);
        } else {
            console.log(`Exists: ${c.name}`);
        }
    }
    console.log("Done.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());
