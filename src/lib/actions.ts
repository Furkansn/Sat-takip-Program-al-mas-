
"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "USER_INACTIVE") {
                return "Hesabınız pasif. Lütfen sistem yöneticiniz ile iletişime geçin.";
            }
            if (error.message === "COMPANY_INACTIVE") {
                return "Firmanız pasif durumda. Lütfen sistem yöneticiniz ile iletişime geçin.";
            }
        }
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Giriş bilgileri hatalı.";
                default:
                    return "Bir hata oluştu.";
            }
        }
        throw error;
    }
}

export async function handleSignOut() {
    await signOut({ redirectTo: "/login" });
}
