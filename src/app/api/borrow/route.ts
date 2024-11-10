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

// GET: ดึงข้อมูล Borrow ทั้งหมด
export async function GET(request: Request) {
    try {
        const borrows = await prisma.borrow.findMany();
        return NextResponse.json(borrows);
    } catch (error) {
        console.error("Error fetching borrows:", error);
        return NextResponse.json({ error: "Error fetching borrows" }, { status: 500 });
    }
}

// POST: เพิ่มข้อมูล Borrow ใหม่
export async function POST(request: Request) {
    try {
        // ตรวจสอบสิทธิ์
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const data = await request.json();

        // ตรวจสอบความถูกต้องของข้อมูล
        const validatedData = borrowSchema.parse(data);

        const newBorrow = await prisma.borrow.create({
            data: validatedData,
        });

        return NextResponse.json(newBorrow, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        console.error('Error adding borrow:', error);
        return NextResponse.json({ error: 'Error adding borrow' }, { status: 500 });
    }
}