import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/sendEmail';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
    const { email } = await req.json();

    // ✅ ตรวจสอบรูปแบบ email
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
        return NextResponse.json(
            { success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' },
            { status: 400 }
        );
    }

    // ✅ ตรวจสอบว่ามีในฐานข้อมูลไหม
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return NextResponse.json(
            { success: false, message: 'Email ไม่ถูกต้อง หรือท่านยังไม่ได้สมัครสมาชิก' },
            { status: 404 }
        );
    }

    // ✅ ลบ token เดิมถ้ามี
    await prisma.passwordResetToken.deleteMany({
        where: { user_id: user.id },
    });

    // ✅ สร้าง token ใหม่
    const token = randomUUID();
    await prisma.passwordResetToken.create({
        data: {
            user_id: user.id,
            token,
        },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    // ✅ ส่งอีเมล HTML แบบสวยงาม
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #8753d5; font-size: 24px;">รีเซ็ตรหัสผ่านของคุณ</h2>
        <p>สวัสดีค่ะ</p>
        <p>คุณสามารถรีเซ็ตรหัสผ่านของคุณได้โดยคลิกที่ปุ่มด้านล่าง</p>
        <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #8753d5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            รีเซ็ตรหัสผ่าน
        </a>
        </div>
        <p style="font-size: 14px; color: #666;">หากคุณไม่ได้เป็นผู้ร้องขอ โปรดเพิกเฉยต่ออีเมลฉบับนี้</p>
        <p style="font-size: 12px; color: #999;">ลิงก์นี้จะหมดอายุใน 5 นาที</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ccc;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
        อีเมลฉบับนี้ถูกส่งโดยระบบอัตโนมัติจากเว็บไซต์ Media Envocc กรุณาอย่าตอบกลับ<br/>
        หากคุณมีคำถาม กรุณาติดต่อ 02-590-3867
        </p>
    </div>
    `;


    await sendEmail({
        to: email,
        subject: 'รีเซ็ตรหัสผ่าน เว็บไซต์ Media Envocc',
        text: `คลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน: ${resetUrl}`,
        html: htmlContent,
    });

    return NextResponse.json({ success: true, message: 'ส่งอีเมลเรียบร้อยแล้ว' });
}
