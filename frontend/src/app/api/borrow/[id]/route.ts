import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    try {
        if (!(await checkAdminSession(req))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        const borrow = await prisma.borrow.findUnique({
            where: { id: numericId },
            include: { type: true },
        });

        if (!borrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        return NextResponse.json(borrow);
    } catch (error) {
        console.error("Error fetching borrow:", error);
        return NextResponse.json({ error: "Error fetching borrow data" }, { status: 500 });
    }
}

// PUT: อัปเดตข้อมูล Borrow
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    try {
        if (!(await checkAdminSession(req))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        const formData = await req.formData();
        const borrowName = formData.get("borrow_name")?.toString() || "";
        const unit = formData.get("unit")?.toString() || "";
        const typeId = parseInt(formData.get("type_id")?.toString() || "0");
        const quantity = parseInt(formData.get("quantity")?.toString() || "0");
        const isBorroRestricted = formData.get("is_borro_restricted") === "true";
        const description = formData.get("description")?.toString() || "";
        const file = formData.get("file") as File | null;

        // ดึงข้อมูลเดิมจากฐานข้อมูล
        const existingBorrow = await prisma.borrow.findUnique({
            where: { id: numericId },
        });

        if (!existingBorrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        let imageUrl = existingBorrow.borrow_images;
        if (file) {
            const filename = `${uuidv4()}.${file.type.split("/")[1]}`;
            const filePath = path.join(process.cwd(), "public", "borrows", filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer);

            if (existingBorrow.borrow_images) {
                const oldFilePath = path.join(process.cwd(), "public", "borrows", existingBorrow.borrow_images);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            imageUrl = filename;
        }

        // คำนวณความแตกต่างของจำนวน
        const updatedQuantity = quantity - existingBorrow.quantity;
        const updateType = updatedQuantity > 0 ? "insert" : updatedQuantity < 0 ? "reduce" : "no change";

        // อัปเดต borrow ในฐานข้อมูล
        const updatedBorrow = await prisma.borrow.update({
            where: { id: numericId },
            data: {
                borrow_name: borrowName,
                unit,
                type_id: typeId,
                quantity,
                is_borro_restricted: isBorroRestricted,
                description: description || null,
                borrow_images: imageUrl,
            },
        });

        // เพิ่มบันทึกการอัปเดตเฉพาะเมื่อมีการเปลี่ยนแปลงจำนวน
        if (updatedQuantity !== 0) {
            await prisma.borrow_updates.create({
                data: {
                    borrowId: numericId,
                    updatedQuantity: updatedQuantity,
                    updateType: updateType,
                    remarks: "Updated via borrow edit form",
                },
            });
        }


        return NextResponse.json(updatedBorrow);
    } catch (error) {
        console.error("Error updating borrow:", error);
        return NextResponse.json({ error: "Error updating borrow data" }, { status: 500 });
    }
}


// DELETE: ลบข้อมูล Borrow
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    try {
        if (!(await checkAdminSession(req))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await prisma.borrow.delete({
            where: { id: numericId },
        });

        return NextResponse.json({ message: "Borrow deleted successfully" });
    } catch (error) {
        console.error("Error deleting borrow:", error);
        return NextResponse.json({ error: "Error deleting borrow data" }, { status: 500 });
    }
}
