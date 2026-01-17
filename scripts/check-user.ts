
import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function check() {
    console.log("Checking Admin User...");
    const user = await prisma.user.findUnique({
        where: { email: "admin@st.com" }
    });

    if (user) {
        console.log("User found:", user.email);
        console.log("Hash stored:", user.password);
        console.log("Role:", user.role);

        const valid = await bcrypt.compare("admin", user.password || "");
        console.log("Password 'admin' is valid?", valid);
    } else {
        console.log("User admin@st.com NOT FOUND");
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
