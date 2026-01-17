
"use server";

import { cookies } from "next/headers";
import { getSessionUser } from "./session";
import { revalidatePath } from "next/cache";

export async function switchAdminTenant(companyId: string) {
    const user = await getSessionUser();

    // Security Check: Only Super Admin can switch tenants
    if (user.role !== 'super_admin') {
        throw new Error("Unauthorized");
    }

    const cookieStore = cookies();

    // If companyId is same as user's own company or empty -> clear cookie (reset to default)
    // Or we can just set the cookie.

    cookieStore.set('admin_tenant_id', companyId, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
    });

    console.log(`Switched Admin Tenant to: ${companyId}`);

    revalidatePath('/', 'layout'); // Refresh global layout and data
}

export async function clearAdminTenant() {
    cookies().delete('admin_tenant_id');
    revalidatePath('/', 'layout');
}
