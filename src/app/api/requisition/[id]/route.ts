import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

// ฟังก์ชันสำหรับตรวจสอบสิทธิ์ของผู้ใช้
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === 'admin');
}

// Schema สำหรับตรวจสอบข้อมูลในฟังก์ชัน PUT
const requisitionUpdateSchema = z.object({
    requisition_name: z.string().min(1, "ชื่อสื่อเป็นข้อมูลจำเป็น"),
    unit: z.string().min(1, "หน่วยนับเป็นข้อมูลจำเป็น"),
    type_id: z.number().int(),
    quantity: z.number().positive("จำนวนคงเหลือควรมากกว่า 0"),
    reserved_quantity: z.number().optional(),
    description: z.string().optional(),
    is_borro_restricted: z.boolean().optional(),
});

// ฟังก์ชัน PUT สำหรับอัปเดตข้อมูล requisition
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const jsonData = await request.json();
        const data = requisitionUpdateSchema.parse(jsonData);

        const updatedRequisition = await prisma.requisition.update({
            where: { id },
            data: {
                requisition_name: data.requisition_name,
                unit: data.unit,
                type_id: data.type_id,
                quantity: data.quantity,
                reserved_quantity: data.reserved_quantity || 0,
                is_borro_restricted: data.is_borro_restricted ?? false,
                description: data.description || null,
            },
        });
        return NextResponse.json(updatedRequisition);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }

        console.error('Error updating requisition:', error);
        return NextResponse.json({ error: 'Error updating requisition' }, { status: 500 });
    }
}

// ฟังก์ชัน DELETE สำหรับลบข้อมูล requisition
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.requisition.delete({ where: { id } });
        return NextResponse.json({ message: 'Requisition deleted successfully' });
    } catch (error) {
        console.error('Error deleting requisition:', error);
        return NextResponse.json({ error: 'Error deleting requisition' }, { status: 500 });
    }
}
