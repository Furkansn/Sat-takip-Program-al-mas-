
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function getSessionUser() {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
        redirect("/login");
    }

    const baseUser = {
        id: session.user.id || "",
        email: session.user.email,
        companyId: (session.user as any).companyId as string,
        role: (session.user as any).role as string
    };

    // If Super Admin, check for cookie override
    if (baseUser.role === 'super_admin') {
        const cookieStore = cookies();
        const adminTenantId = cookieStore.get('admin_tenant_id')?.value;
        if (adminTenantId) {
            console.log(`[Admin Switch] Active Context: ${adminTenantId}`);
            return { ...baseUser, companyId: adminTenantId };
        }
    }

    return baseUser;
}
