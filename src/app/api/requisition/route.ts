import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid'; // สำหรับสร้างชื่อไฟล์แบบสุ่ม
import fs from 'fs';
import path from 'path';

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

// ฟังก์ชัน POST สำหรับเพิ่มข้อมูล requisition ใหม่พร้อมอัปโหลดรูปภาพ
export async function POST(request: Request) {
    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const formData = await request.formData();
        const requisition_name = formData.get('requisition_name')?.toString() || "";
        const unit = formData.get('unit')?.toString() || "";
        const type_id = parseInt(formData.get('type_id')?.toString() || "0");
        const quantity = parseInt(formData.get('quantity')?.toString() || "0");
        const reserved_quantity = parseInt(formData.get('reserved_quantity')?.toString() || "0");
        const description = formData.get('description')?.toString() || "";
        const is_borro_restricted = formData.get('is_borro_restricted') === "true";
        const file = formData.get('file') as File | null;

        // บันทึกไฟล์ภาพ (ถ้ามี)
        let filename = "";
        if (file) {
            filename = `${uuidv4()}.${file.type.split('/')[1]}`;
            const filePath = path.join(process.cwd(), 'public', 'requisitions', filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer);
        }

        // เพิ่มข้อมูลในตาราง requisition
        const newRequisition = await prisma.requisition.create({
            data: {
                requisition_name,
                unit,
                type_id,
                quantity,
                reserved_quantity,
                description,
                is_borro_restricted,
                requisition_images: filename,
            },
        });

        // เพิ่มข้อมูลใน requisition_updates
        await prisma.requisition_updates.create({
            data: {
                requisitionId: newRequisition.id,
                addedQuantity: quantity, // ใช้จำนวนที่เพิ่มเป็นค่าเริ่มต้น
                updateType: quantity > 0 ? "insert" : "reduce", // ถ้าจำนวน > 0 จะใช้ "insert" ถ้าน้อยกว่า 0 จะใช้ "reduce"
                remarks: "เพิ่ม requisition ใหม่", // หมายเหตุ
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