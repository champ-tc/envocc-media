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
    return !!(token && token.role === "admin");
}

// GET: ดึงข้อมูล Borrow ตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const borrow = await prisma.borrow.findUnique({
            where: { id: parseInt(params.id) },
            include: {
                type: true, // รวมข้อมูลประเภท
            },
        });

        if (!borrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        return NextResponse.json(borrow);
    } catch (error) {
        console.error("Error fetching borrow data:", error);
        return NextResponse.json({ error: "Error fetching borrow data" }, { status: 500 });
    }
}

// PUT: อัปเดตข้อมูล Borrow พร้อมจัดการไฟล์
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const formData = await request.formData();

        const borrowName = formData.get("borrow_name")?.toString() || "";
        const unit = formData.get("unit")?.toString() || "";
        const typeId = parseInt(formData.get("type_id")?.toString() || "0");
        const quantity = parseInt(formData.get("quantity")?.toString() || "0");
        const isBorroRestricted = formData.get("is_borro_restricted") === "true";
        const description = formData.get("description")?.toString() || "";
        const file = formData.get("file") as File | null;

        const existingBorrow = await prisma.borrow.findUnique({
            where: { id: parseInt(params.id) },
        });

        if (!existingBorrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        let imageUrl = existingBorrow.borrow_images;
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: "File size exceeds 10MB" }, { status: 400 });
            }

            const filename = `${uuidv4()}.${file.type.split("/")[1]}`;
            const filePath = path.join(process.cwd(), "public", "borrows", filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer);

            // ลบไฟล์เก่า
            if (existingBorrow.borrow_images) {
                const oldFilePath = path.join(process.cwd(), "public", "borrows", existingBorrow.borrow_images);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            imageUrl = filename;
        }

        const quantityDifference = quantity - existingBorrow.quantity;
        if (quantityDifference !== 0) {
            await prisma.borrow_updates.create({
                data: {
                    borrowId: existingBorrow.id,
                    updatedQuantity: Math.abs(quantityDifference),
                    updateType: quantityDifference > 0 ? "insert" : "reduce",
                    remarks: "Updated via API",
                },
            });
        }

        const updatedBorrow = await prisma.borrow.update({
            where: { id: parseInt(params.id) },
            data: {
                borrow_name: borrowName,
                unit: unit,
                type_id: typeId,
                quantity: quantity,
                is_borro_restricted: isBorroRestricted,
                description: description || null,
                borrow_images: imageUrl,
            },
        });

        return NextResponse.json(updatedBorrow);
    } catch (error) {
        console.error("Error updating borrow:", error);
        return NextResponse.json({ error: "Error updating borrow data" }, { status: 500 });
    }
}

// PATCH: เปิด/ปิดการใช้งาน Borrow
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { status } = await request.json();

        if (typeof status !== "number" || ![0, 1].includes(status)) {
            return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
        }

        const updatedBorrow = await prisma.borrow.update({
            where: { id: parseInt(params.id) },
            data: { status },
        });

        return NextResponse.json({ message: "Borrow status updated successfully", data: updatedBorrow });
    } catch (error) {
        console.error("Error updating borrow status:", error);
        return NextResponse.json({ error: "Error updating borrow status" }, { status: 500 });
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