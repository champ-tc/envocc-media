import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

// สร้าง schema สำหรับตรวจสอบข้อมูลด้วย zod
const borrowSchema = z.object({
    borrow_name: z.string().min(1, "ชื่อสื่อเป็นข้อมูลที่จำเป็น"),
    unit: z.string().min(1, "หน่วยนับเป็นข้อมูลที่จำเป็น"),
    type_id: z.number().int(),
    quantity: z.number().int().min(0, "จำนวนคงเหลือต้องเป็นค่าบวก"),
    is_borro_restricted: z.boolean(),
    description: z.string().optional(),
});

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === 'admin');
}

// GET: ดึงข้อมูล Borrow ตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const borrow = await prisma.borrow.findUnique({
            where: { id: parseInt(params.id) },
        });
        return NextResponse.json(borrow);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching borrow data" }, { status: 500 });
    }
}

// PUT: อัพเดตข้อมูล Borrow
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        // ตรวจสอบสิทธิ์
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const data = await request.json();

        // ตรวจสอบความถูกต้องของข้อมูล
        const validatedData = borrowSchema.parse(data);

        const updatedBorrow = await prisma.borrow.update({
            where: { id: parseInt(params.id) },
            data: validatedData,
        });
        return NextResponse.json(updatedBorrow);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Error updating borrow data" }, { status: 500 });
    }
}

// DELETE: ลบข้อมูล Borrow
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        // ตรวจสอบสิทธิ์
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.borrow.delete({
            where: { id: parseInt(params.id) },
        });
        return NextResponse.json({ message: "Borrow deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Error deleting borrow data" }, { status: 500 });
    }
}