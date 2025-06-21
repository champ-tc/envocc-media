import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { protectApiRoute } from '@/lib/protectApi';


// ✅ แก้ไขรายละเอียด requisition
async function updateRequisitionDetails(id: number, request: NextRequest) {


  const access = await protectApiRoute(request, ['admin', 'user']);
  if (access !== true) return access;

  const formData = await request.formData();
  const requisition_name = formData.get("requisition_name")?.toString() || "";
  const unit = formData.get("unit")?.toString() || "";
  const type_id = parseInt(formData.get("type_id")?.toString() || "0");
  const quantity = parseInt(formData.get("quantity")?.toString() || "0");
  const reserved_quantity = parseInt(formData.get("reserved_quantity")?.toString() || "0");
  const description = formData.get("description")?.toString() || "";
  const is_borro_restricted = formData.get("is_borro_restricted") === "true";
  const file = formData.get("file") as File | null;

  const existing = await prisma.requisition.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
  }

  let filename = existing.requisition_images || "";

  // ✅ ถ้ามีไฟล์ใหม่ → ลบไฟล์เก่า + บันทึกไฟล์ใหม่
  if (file) {
    const oldPath = path.join("/app/filerequisitions", filename);
    if (filename && fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (e) {
        console.warn("⚠️ ลบไฟล์เก่าล้มเหลว:", oldPath, e);
      }
    }

    const extension = file.type?.split("/")[1] || "jpg";
    filename = `${uuidv4()}.${extension}`;
    const newPath = path.join("/app/filerequisitions", filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(newPath, buffer);
  }

  const updated = await prisma.requisition.update({
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

  // ✅ log ปริมาณที่เปลี่ยนแปลง
  const diff = quantity - existing.quantity;
  if (diff !== 0) {
    await prisma.requisition_updates.create({
      data: {
        requisitionId: id,
        addedQuantity: diff,
        updateType: diff > 0 ? "increase" : "decrease",
        remarks: "Updated via requisition edit",
      },
    });
  }

  return NextResponse.json(updated);
}

// ✅ เปลี่ยนสถานะ requisition
async function updateRequisitionStatus(id: number, request: NextRequest) {
  const access = await protectApiRoute(request, ['admin', 'user']);
  if (access !== true) return access;

  const { status } = await request.json();

  if (![0, 1].includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const updated = await prisma.requisition.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}

// ✅ Entry point: PUT
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {

  const access = await protectApiRoute(request, ['admin']);
  if (access !== true) return access;

  const { id } = await context.params;


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
  } catch (err) {
    console.error(`🔥 Error handling ${action}:`, err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
