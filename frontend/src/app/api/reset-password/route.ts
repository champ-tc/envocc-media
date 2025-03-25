// /app/api/reset-password/route.ts
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
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
