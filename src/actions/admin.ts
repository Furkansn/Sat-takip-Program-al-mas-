"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

// --- COMPANIES ---

export async function getCompanies() {
    const session = await auth();
    if ((session?.user as any)?.role !== 'super_admin') return [];

    return await prisma.company.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function createCompany(prevState: any, formData: FormData) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'super_admin') {
        return { message: "Yetkisiz işlem" };
    }

    const name = formData.get("name") as string;
    // Fix: existing code expects "on" but UI usually sends "true" from select. 
    // Let's support both for isActive to be safe, but reportsEnabled will use "true" from Select.
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";
    const reportsEnabled = formData.get("reportsEnabled") === "true";

    if (!name || name.length < 2) {
        return { message: "Firma adı en az 2 karakter olmalıdır." };
    }

    try {
        const existing = await prisma.company.findFirst({ where: { name } });
        if (existing) {
            return { message: "Bu isimde bir firma zaten var." };
        }

        await prisma.company.create({
            data: {
                name,
                isActive,
                reportsEnabled
            }
        });

        revalidatePath("/admin/companies");
        return { success: true, message: "Firma eklendi" };
    } catch (error) {
        return { message: "Veritabanı hatası" };
    }
}

export async function updateCompany(prevState: any, formData: FormData) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'super_admin') {
        return { message: "Yetkisiz işlem" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const isActive = formData.get("isActive") === "true"; // Handle boolean from select/checkbox properly
    const reportsEnabled = formData.get("reportsEnabled") === "true";

    if (!id) return { message: "ID eksik" };
    if (!name || name.length < 2) return { message: "Geçersiz isim" };

    try {
        await prisma.company.update({
            where: { id },
            data: { name, isActive, reportsEnabled }
        });
        revalidatePath("/admin/companies");
        return { success: true, message: "Firma güncellendi" };
    } catch (error) {
        console.error("Update Company Error:", error);
        return { message: "Güncelleme hatası: " + (error as Error).message };
    }
}

// --- USERS ---

export async function getUsers() {
    const session = await auth();
    if ((session?.user as any)?.role !== 'super_admin') return [];

    return await prisma.user.findMany({
        include: { company: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createUser(prevState: any, formData: FormData) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'super_admin') {
        return { message: "Yetkisiz işlem" };
    }

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const companyId = formData.get("companyId") as string;
    const role = formData.get("role") as string;
    const isActive = formData.get("isActive") === "on";

    if (!email || !password || !companyId || !role) {
        return { message: "Tüm alanlar zorunludur" };
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return { message: "Bu email kullanımda." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                companyId,
                role,
                isActive,
                fullName: email.split('@')[0] // Default name
            }
        });

        revalidatePath("/admin/users");
        return { success: true, message: "Kullanıcı oluşturuldu" };
    } catch (error) {
        console.error(error);
        return { message: "Oluşturma hatası" };
    }
}

export async function updateUser(prevState: any, formData: FormData) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'super_admin') {
        return { message: "Yetkisiz işlem" };
    }

    const id = formData.get("id") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const companyId = formData.get("companyId") as string;
    const isActive = formData.get("isActive") === "true"; // Expecting string "true" or "false" from select
    const newPassword = formData.get("newPassword") as string;

    if (!id || !email) return { message: "Eksik bilgi" };

    try {
        const dataToUpdate: any = {
            email,
            role,
            companyId,
            isActive
        };

        if (newPassword && newPassword.trim().length > 0) {
            dataToUpdate.password = await bcrypt.hash(newPassword, 10);
        }

        await prisma.user.update({
            where: { id },
            data: dataToUpdate
        });

        revalidatePath("/admin/users");
        return { success: true, message: "Kullanıcı güncellendi" };
    } catch (error) {
        console.error(error);
        return { message: "Güncelleme hatası" };
    }
}
