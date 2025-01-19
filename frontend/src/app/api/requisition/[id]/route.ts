import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

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


// ฟังก์ชันสำหรับตรวจสอบสิทธิ์ของผู้ใช้
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

// ฟังก์ชันแก้ไขรายละเอียด requisition
async function updateRequisitionDetails(id: number, request: Request) {
    const formData = await request.formData();
    const requisition_name = formData.get("requisition_name")?.toString() || "";
    const unit = formData.get("unit")?.toString() || "";
    const type_id = parseInt(formData.get("type_id")?.toString() || "0");
    const quantity = parseInt(formData.get("quantity")?.toString() || "0");
    const reserved_quantity = parseInt(formData.get("reserved_quantity")?.toString() || "0");
    const description = formData.get("description")?.toString() || "";
    const is_borro_restricted = formData.get("is_borro_restricted") === "true";
    const file = formData.get("file") as File | null;

    const existingRequisition = await prisma.requisition.findUnique({ where: { id } });
    if (!existingRequisition) {
        return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
    }

    let filename = existingRequisition.requisition_images || "";
    if (file) {
        filename = `${uuidv4()}.${file.type.split("/")[1]}`;
        const filePath = path.join(process.cwd(), "public", "requisitions", filename);
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, fileBuffer);
    }

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
            requisition_images: filename,
        },
    });

    return NextResponse.json(updatedRequisition);
}

// ฟังก์ชันเปลี่ยนสถานะ requisition
async function updateRequisitionStatus(id: number, request: Request) {
    const { status } = await request.json();

    if (![0, 1].includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedRequisition = await prisma.requisition.update({
        where: { id },
        data: { status },
    });

    return NextResponse.json(updatedRequisition);
}

// ตัวควบคุมหลัก
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    if (!(await checkAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const requisitionId = parseInt(id, 10);
    if (isNaN(requisitionId)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    try {
        if (action === "updateDetails") {
            return await updateRequisitionDetails(requisitionId, request);
        } else if (action === "updateStatus") {
            return await updateRequisitionStatus(requisitionId, request);
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error(`Error handling ${action}:`, error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
