import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod'; // ใช้เพื่อทำ validation

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

// API สำหรับแก้ไขข้อมูล
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        // ตรวจสอบสิทธิ์
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        // รับข้อมูลจาก formData
        const formData = await request.formData();
        const name = formData.get('name');
        const description = formData.get('description');

        // ตรวจสอบความถูกต้องของข้อมูลที่ได้รับ
        const data = typeSchema.parse({ name, description });

        // แก้ไขข้อมูลในฐานข้อมูล
        const updatedType = await prisma.type.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description || null,
            },
        });

        return NextResponse.json({ message: 'type updated successfully', type: updatedType });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        console.error('Error in PUT /api/type:', error);
        return NextResponse.json({ error: 'Error updating type' }, { status: 500 });
    }
}

// API สำหรับลบข้อมูล
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        // ตรวจสอบสิทธิ์
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        // ลบข้อมูลในฐานข้อมูล
        await prisma.type.delete({ where: { id } });

        return NextResponse.json({ message: 'type deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting type:', error);
        return NextResponse.json({ error: 'Error deleting type' }, { status: 500 });
    }
}
