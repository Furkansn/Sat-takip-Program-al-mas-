
import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
    console.log("Seeding database...");

    // Create Default Company if not exists
    let company = await prisma.company.findFirst({
        where: { name: "A Firması" }
    });

    if (!company) {
        console.log("Creating default company: A Firması");
        company = await prisma.company.create({
            data: {
                name: "A Firması",
                isActive: true
            }
        });
    }

    // Create Super Admin if not exists
    const adminEmail = "admin@st.com";
    const adminPassword = "admin"; // Change this in production!

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        console.log(`Creating Super Admin: ${adminEmail} / ${adminPassword}`);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                fullName: "Süper Yönetici",
                role: "super_admin",
                companyId: company.id,
                isActive: true
            }
        });
    } else {
        console.log("Super Admin already exists.");
        // Ensure role and password match (optional reset)
        // const hashedPassword = await bcrypt.hash(adminPassword, 10);
        // await prisma.user.update({
        //     where: { email: adminEmail },
        //     data: { role: 'super_admin', password: hashedPassword }
        // });
    }

    // Create a regular user for testing
    const userEmail = "user@st.com";
    const userPassword = "user";

    const existingUser = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!existingUser) {
        console.log(`Creating Regular User: ${userEmail} / ${userPassword}`);
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        await prisma.user.create({
            data: {
                email: userEmail,
                password: hashedPassword,
                fullName: "Test Kullanıcı",
                role: "user",
                companyId: company.id,
                isActive: true
            }
        });
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
