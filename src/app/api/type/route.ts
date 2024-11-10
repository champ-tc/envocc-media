import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';  // ใช้เพื่อทำ validation

// Schema สำหรับตรวจสอบข้อมูล
const typeSchema = z.object({
    name: z.string().min(1, "ชื่อเป็นข้อมูลจำเป็น"),
    description: z.string().optional(),
});

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === 'admin');
}

// API สำหรับ GET ข้อมูล
export async function GET() {
    try {
        const types = await prisma.type.findMany();
        return NextResponse.json(types);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching type" }, { status: 500 });
    }
}

// เพิ่มข้อมูล
export async function POST(request: Request) {
    try {
        // ตรวจสอบสิทธิ์
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // รับข้อมูลจาก formData
        const formData = await request.formData();
        const name = formData.get('name');
        const description = formData.get('description');

        // ตรวจสอบความถูกต้องของข้อมูลที่ได้รับ
        const data = typeSchema.parse({ name, description });

        // บันทึกข้อมูลในฐานข้อมูล
        const newType = await prisma.type.create({
            data: {
                name: data.name,
                description: data.description || null,
            },
        });

        return NextResponse.json({ message: 'type added successfully', type: newType });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/type:', error);
        return NextResponse.json({ error: 'Error uploading type' }, { status: 500 });
    }
}