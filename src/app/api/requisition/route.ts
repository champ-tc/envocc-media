import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

// Schema สำหรับตรวจสอบความถูกต้องของข้อมูล
const requisitionSchema = z.object({
    requisition_name: z.string().min(1, "ชื่อสื่อเป็นข้อมูลจำเป็น"),
    unit: z.string().min(1, "หน่วยนับเป็นข้อมูลจำเป็น"),
    type_id: z.number().int(),
    quantity: z.number().positive("จำนวนคงเหลือควรมากกว่า 0"),
    reserved_quantity: z.number().optional(),
    description: z.string().optional(),
    is_borro_restricted: z.boolean().optional(),
});

// ฟังก์ชันสำหรับตรวจสอบสิทธิ์ของผู้ใช้
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === 'admin');
}

// ฟังก์ชัน GET สำหรับดึงข้อมูล requisition ทั้งหมด
export async function GET(request: Request) {
    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const requisitions = await prisma.requisition.findMany();
        return NextResponse.json(requisitions);
    } catch (error) {
        console.error('Error fetching requisitions:', error);
        return NextResponse.json({ error: 'Error fetching requisitions' }, { status: 500 });
    }
}

// ฟังก์ชัน POST สำหรับเพิ่มข้อมูล requisition ใหม่
export async function POST(request: Request) {
    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const jsonData = await request.json();
        const data = requisitionSchema.parse(jsonData);

        const newRequisition = await prisma.requisition.create({
            data: {
                requisition_name: data.requisition_name,
                unit: data.unit,
                type_id: data.type_id,
                quantity: data.quantity,
                reserved_quantity: data.reserved_quantity || 0,
                description: data.description || null,
                is_borro_restricted: data.is_borro_restricted ?? false,
            },
        });

        return NextResponse.json(newRequisition);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }

        console.error('Error in POST /api/requisition:', error);
        return NextResponse.json({ error: 'Error creating requisition' }, { status: 500 });
    }
}