import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';


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


export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const formData = await request.formData();
        const requisition_name = formData.get("requisition_name")?.toString() || "";
        const unit = formData.get("unit")?.toString() || "";
        const type_id = parseInt(formData.get("type_id")?.toString() || "0");
        const quantity = parseInt(formData.get("quantity")?.toString() || "0");
        const reserved_quantity = parseInt(formData.get("reserved_quantity")?.toString() || "0");
        const description = formData.get("description")?.toString() || "";
        const is_borro_restricted = formData.get("is_borro_restricted") === "true";
        const file = formData.get("file") as File | null;

        // ค้นหา requisition เดิมเพื่อคำนวณความแตกต่าง
        const existingRequisition = await prisma.requisition.findUnique({ where: { id } });
        if (!existingRequisition) {
            return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
        }

        // คำนวณความแตกต่างในจำนวน
        const quantityDifference = quantity - existingRequisition.quantity;

        // จัดการอัปโหลดไฟล์ (ถ้ามี)
        let filename = "";
        if (file) {
            filename = `${uuidv4()}.${file.type.split("/")[1]}`;
            const filePath = path.join(process.cwd(), "public", "requisitions", filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer);
        }

        // อัปเดต requisition
        const updatedRequisition = await prisma.requisition.update({
            where: { id },
            data: {
                requisition_name,
                unit,
                type_id,
                quantity,
                reserved_quantity,
                description,
                is_borro_restricted,
                requisition_images: filename || undefined,
            },
        });

        // เพิ่มข้อมูลใน requisition_updates
        await prisma.requisition_updates.create({
            data: {
                requisitionId: updatedRequisition.id,
                addedQuantity: quantityDifference,
                updateType: quantityDifference > 0 ? "insert" : "reduce",
                remarks: quantityDifference > 0 ? "เพิ่มจำนวน requisition" : "ลดจำนวน requisition",
            },
        });

        return NextResponse.json(updatedRequisition);
    } catch (error) {
        console.error("Error updating requisition:", error);
        return NextResponse.json({ error: "Error updating requisition" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    try {
        // ตรวจสอบสิทธิ์ผู้ใช้ (ถ้าจำเป็น)
        const token = await getToken({ req: request as any });
        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // ลบ requisition
        await prisma.requisition.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Requisition deleted successfully" });
    } catch (error) {
        console.error("Error deleting requisition:", error);
        return NextResponse.json({ error: "Error deleting requisition" }, { status: 500 });
    }
}

