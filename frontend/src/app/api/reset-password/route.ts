// /app/api/reset-password/route.ts
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rateLimit';


export async function POST(req: Request) {

    const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
    if (isRateLimited(ip, 30, 60_000)) {
        return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
    }

    const { token, newPassword } = await req.json();

    const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
    });

    if (!resetRecord) {
        return NextResponse.json({ error: 'ลิงก์หมดอายุ' }, { status: 400 });
    }

    const now = new Date();
    const diffMs = now.getTime() - resetRecord.createdAt.getTime();
    if (diffMs > 5 * 60 * 1000) {
        await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
        return NextResponse.json({ error: 'ลิงก์หมดอายุ' }, { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
        where: { id: resetRecord.user_id },
        data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });

    return NextResponse.json({ success: true });
}
