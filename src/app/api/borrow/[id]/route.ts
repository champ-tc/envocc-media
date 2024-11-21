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


// GET: ดึงข้อมูล Borrow ตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const borrow = await prisma.borrow.findUnique({
            where: { id: parseInt(params.id) },
        });

        // ตรวจสอบหากไม่พบข้อมูล
        if (!borrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        return NextResponse.json(borrow);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching borrow data" }, { status: 500 });
    }
}

// PUT: อัปเดตข้อมูล Borrow พร้อมการอัปโหลดไฟล์
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

        // ดึงข้อมูลเดิมจากฐานข้อมูล
        const existingBorrow = await prisma.borrow.findUnique({
            where: { id: parseInt(params.id) },
        });

        if (!existingBorrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
        const hasChanges =
            borrowName !== existingBorrow.borrow_name ||
            unit !== existingBorrow.unit ||
            typeId !== existingBorrow.type_id ||
            quantity !== existingBorrow.quantity ||
            isBorroRestricted !== existingBorrow.is_borro_restricted ||
            description !== existingBorrow.description ||
            file !== null;

        if (!hasChanges) {
            return NextResponse.json({ message: "No changes detected" }, { status: 400 });
        }

        // ตรวจสอบและจัดการการอัปโหลดไฟล์ (ถ้ามี)
        let imageUrl = existingBorrow.borrow_images;
        if (file) {
            // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: "File size exceeds 10MB" }, { status: 400 });
            }

            // สร้างชื่อไฟล์แบบสุ่ม
            const filename = `${uuidv4()}.${file.type.split('/')[1]}`;
            const filePath = path.join(process.cwd(), 'public', 'borrows', filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer); // บันทึกไฟล์ในโฟลเดอร์ public/borrows
            imageUrl = filename; // เก็บชื่อไฟล์ใหม่ในฐานข้อมูล
        }



        // บันทึกการเปลี่ยนแปลงใน Borrow_updates
        const quantityDifference = quantity - existingBorrow.quantity;

        if (quantityDifference !== 0) {
            await prisma.borrow_updates.create({
                data: {
                    borrowId: existingBorrow.id,
                    updatedQuantity: Math.abs(quantityDifference), // ใช้ Math.abs เพื่อเก็บค่าบวก
                    updateType: quantityDifference > 0 ? "insert" : "reduce", // กำหนดประเภท update
                    remarks: "อัปเดตข้อมูลผ่านระบบ",
                },
            });
        }




        // อัปเดตข้อมูลในฐานข้อมูล
        const updatedBorrow = await prisma.borrow.update({
            where: { id: parseInt(params.id) },
            data: {
                borrow_name: borrowName,
                unit: unit,
                type_id: typeId,
                quantity: quantity,
                is_borro_restricted: isBorroRestricted,
                description: description || null,
                borrow_images: imageUrl, // อัปเดตชื่อไฟล์ (ถ้ามี)
            },
        });

        return NextResponse.json(updatedBorrow);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        console.error("Error updating borrow:", error);
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