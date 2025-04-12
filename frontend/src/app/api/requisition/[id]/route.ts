import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

// ฟังก์ชันสำหรับตรวจสอบสิทธิ์ของผู้ใช้
async function checkAdminSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
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

    // ตรวจสอบจำนวนที่เปลี่ยนแปลง
    const addedQuantity = quantity - existingRequisition.quantity;
    const updateType = addedQuantity > 0 ? "increase" : addedQuantity < 0 ? "decrease" : "no change";

    if (addedQuantity !== 0) {
        await prisma.requisition_updates.create({
            data: {
                requisitionId: id,
                addedQuantity: addedQuantity,
                updateType: updateType,
                remarks: "Updated via requisition edit",
            },
        });
    }

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
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

