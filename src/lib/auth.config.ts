
import type { NextAuthConfig } from "next-auth";


export const authConfig = {
    trustHost: true,
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
    },
    providers: [], // Configured in auth.ts
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLoginPage = nextUrl.pathname.startsWith('/login');

            // Allow public assets
            if (nextUrl.pathname.startsWith('/api') ||
                nextUrl.pathname.startsWith('/_next') ||
                nextUrl.pathname.includes('favicon.ico') ||
                nextUrl.pathname.includes('manifest.json')) {
                return true;
            }

            if (isOnLoginPage) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true; // Allow access to login page
            }

            if (!isLoggedIn) {
                return false; // Redirect to login
            }

            // Admin pages - only super_admin can access
            if (nextUrl.pathname.startsWith('/admin')) {
                // Access role from auth.user (populated by session callback below)
                const userRole = (auth?.user as any)?.role;

                console.log('[Middleware] Admin access attempt:', {
                    path: nextUrl.pathname,
                    role: userRole,
                    email: auth?.user?.email
                });

                if (userRole !== 'super_admin') {
                    console.log('[Middleware] Access denied - redirecting to home');
                    // Redirect to home with error param
                    const url = new URL('/', nextUrl);
                    url.searchParams.set('error', 'access_denied');
                    return Response.redirect(url);
                }
                console.log('[Middleware] Access granted');
            }

            return true;
        },
        // These callbacks are needed for Middleware to see the role in 'auth' object
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = (user as any).role;
                token.companyId = (user as any).companyId;
            }
            // Persist during updates if needed
            if (trigger === "update" && session) {
                return { ...token, ...session };
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token) {
                (session.user as any).role = token.role;
                (session.user as any).companyId = token.companyId;
            }
            return session;
        }
    },
} satisfies NextAuthConfig;
