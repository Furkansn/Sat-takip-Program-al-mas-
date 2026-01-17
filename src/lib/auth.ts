import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(3) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    console.log("[Auth] Attempting login for:", email);

                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user) {
                        console.log("[Auth] User not found");
                        return null;
                    }

                    if (!user.isActive) {
                        console.log("[Auth] User inactive");
                        throw new Error("USER_INACTIVE");
                    }
                    if (!user.password) {
                        console.log("[Auth] No password set");
                        return null;
                    }

                    // Google users must set password
                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    console.log("[Auth] Match Result:", passwordsMatch);


                    if (passwordsMatch) {
                        let companyName = null;
                        // Check company status if not super admin
                        if (user.role !== 'super_admin') {
                            if (!user.companyId) {
                                console.log("[Auth] No Company ID");
                                return null;
                            }
                            const company = await prisma.company.findUnique({ where: { id: user.companyId } });
                            if (!company || !company.isActive) {
                                console.log("[Auth] Company inactive");
                                throw new Error("COMPANY_INACTIVE");
                            }
                            companyName = company.name;
                        }
                        console.log("[Auth] Success!");
                        return {
                            id: user.id,
                            name: user.fullName,
                            email: user.email,
                            role: user.role,
                            companyId: user.companyId,
                            companyName: companyName,
                        };
                    }
                }
                console.log("Invalid credentials or Validation failed");
                return null;
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }) {
            // debug
            // console.log("JWT Trigger:", trigger, "User:", user ? "Yes" : "No");

            if (user) {
                token.role = (user as any).role;
                token.companyId = (user as any).companyId;
                token.companyName = (user as any).companyName;
            }

            // Persist during updates if needed
            if (trigger === "update" && session) {
                token = { ...token, ...session }
            }

            // ADMIN TENANT SWITCHING
            // If user is super_admin, check if they have selected a specific tenant
            if (token.role === 'super_admin') {
                try {
                    const { cookies } = await import("next/headers");
                    const cookieStore = cookies();
                    const tenantId = cookieStore.get('admin_tenant_id')?.value;
                    if (tenantId) {
                        token.companyId = tenantId;
                    }
                } catch (error) {
                    console.error("Error accessing cookies in JWT callback:", error);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token) {
                (session.user as any).role = token.role;
                (session.user as any).companyId = token.companyId;
                (session.user as any).companyName = token.companyName;
            }
            return session;
        }
    }
})
