import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
        const borrows = await prisma.borrow.findMany(); // ดึงข้อมูลทั้งหมด
        return NextResponse.json(borrows); // ส่งคืนข้อมูลทั้งหมด รวมถึง borrow_images
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

        const formData = await request.formData();

        // ดึงข้อมูลจาก formData
        const borrowName = formData.get('borrow_name')?.toString() || "";
        const unit = formData.get('unit')?.toString() || "";
        const typeId = parseInt(formData.get('type_id')?.toString() || "0");
        const quantity = parseInt(formData.get('quantity')?.toString() || "0");
        const isBorroRestricted = formData.get('is_borro_restricted') === "true";
        const description = formData.get('description')?.toString() || "";
        const file = formData.get('file') as File | null;

        // ตรวจสอบข้อมูลที่ได้รับจากฟอร์ม
        const validatedData = borrowSchema.parse({
            borrow_name: borrowName,
            unit: unit,
            type_id: typeId,
            quantity: quantity,
            is_borro_restricted: isBorroRestricted,
            description: description,
        });

        // ตรวจสอบและจัดการการอัปโหลดไฟล์
        let imageUrl = "";
        if (file) {
            const filename = `${uuidv4()}.${file.type.split('/')[1]}`;
            const filePath = path.join(process.cwd(), 'public', 'borrows', filename); // บันทึกไฟล์ที่ public/borrows
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer);
            imageUrl = filename; // เก็บเฉพาะชื่อไฟล์ในฐานข้อมูล
        }

        // บันทึกข้อมูล Borrow ลงในฐานข้อมูล
        const newBorrow = await prisma.borrow.create({
            data: {
                borrow_name: validatedData.borrow_name,
                unit: validatedData.unit,
                type_id: validatedData.type_id,
                quantity: validatedData.quantity,
                is_borro_restricted: validatedData.is_borro_restricted,
                description: validatedData.description || null,
                borrow_images: imageUrl, // เก็บชื่อไฟล์ในฐานข้อมูล
            },
        });

        await prisma.borrow_updates.create({
            data: {
                borrowId: newBorrow.id, // หรือ borrowId ที่คุณใช้อยู่
                updatedQuantity: validatedData.quantity, // ใช้ validatedData.quantity หรือค่าจากข้อมูลที่ได้รับ
                updateType: validatedData.quantity > 0 ? "insert" : "reduce", // ถ้าจำนวน > 0 ให้ใช้ "insert", ถ้าน้อยกว่า 0 ให้ใช้ "reduce"
                remarks: "เพิ่ม Borrow ใหม่", // หมายเหตุหรือเหตุผลในการอัปเดต
            },
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
