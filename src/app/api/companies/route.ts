
import { handlers } from "@/lib/auth"; // Referring to where we defined NextAuth
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await getSessionUser();
        if (user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companies = await prisma.company.findMany({
            where: { isActive: true }, // or all?
            select: { id: true, name: true }
        });

        return NextResponse.json(companies);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const user = await getSessionUser();
        if (user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, name } = body;

        if (!id || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const updated = await prisma.company.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
