
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function updatePassword() {
    console.log("Updating Admin Password...");
    const email = "admin@st.com";
    const newPassword = "Furkansen1.";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });

    console.log(`Password updated for ${user.email}`);
}

updatePassword()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
