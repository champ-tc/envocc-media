import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { protectApiRoute } from "@/lib/protectApi";

const PUBLIC_BORROW_DIR = path.join(process.cwd(), "public", "borrows"); // <- ใช้กับ <Image src="/borrows/...">
const LEGACY_DIR = "/app/fileborrows"; // <- เผื่อมีไฟล์เก่าที่เคยเก็บไว้ที่นี่
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function ensureDir(p: string) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function delFileIfExists(p?: string | null) {
    if (!p) return;
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch { }
}

function findExistingFilePath(filename?: string | null) {
    if (!filename) return null;
    const p1 = path.join(PUBLIC_BORROW_DIR, filename);
    if (fs.existsSync(p1)) return p1;
    const p2 = path.join(LEGACY_DIR, filename);
    if (fs.existsSync(p2)) return p2;
    return null;
}

/* ===================== DELETE ===================== */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const access = await protectApiRoute(request, ["admin"]);
    if (access !== true) return access;

    try {
        // ลบความเชื่อมโยงก่อน
        await prisma.borrow_updates.deleteMany({ where: { borrowId: id } });
        await prisma.borrowLog.deleteMany({ where: { borrow_id: id } });

        const borrow = await prisma.borrow.findUnique({ where: { id } });
        if (!borrow) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // ลบ row
        await prisma.borrow.delete({ where: { id } });

        // ลบไฟล์ (ลองเช็คทั้งโฟลเดอร์ใหม่และ legacy)
        const p = findExistingFilePath(borrow.borrow_images);
        delFileIfExists(p || undefined);

        return NextResponse.json({ message: "ลบเรียบร้อยแล้ว" }, { status: 200 });
    } catch (error) {
        console.error("❌ DELETE borrow:", error);
        return NextResponse.json(
            { error: "ไม่สามารถลบสื่อได้ อาจมีข้อมูลเชื่อมโยงอยู่" },
            { status: 500 }
        );
    }
}

/* ===================== GET ===================== */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const access = await protectApiRoute(req, ["admin"]);
    if (access !== true) return access;

    try {
        const numericId = Number(params.id);
        if (!Number.isInteger(numericId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        const borrow = await prisma.borrow.findUnique({
            where: { id: numericId },
            include: { type: true },
        });

        if (!borrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        return NextResponse.json(borrow, { status: 200 });
    } catch (error) {
        console.error("Error fetching borrow:", error);
        return NextResponse.json({ error: "Error fetching borrow data" }, { status: 500 });
    }
}

/* ===================== PUT (update + optional file) ===================== */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const access = await protectApiRoute(req, ["admin"]);
    if (access !== true) return access;

    try {
        const numericId = Number(params.id);
        if (!Number.isInteger(numericId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        const formData = await req.formData();
        const borrowName = formData.get("borrow_name")?.toString() || "";
        const unit = formData.get("unit")?.toString() || "";
        const typeId = parseInt(formData.get("type_id")?.toString() || "0", 10);
        const quantity = parseInt(formData.get("quantity")?.toString() || "0", 10);
        const isBorroRestricted = formData.get("is_borro_restricted") === "true";
        const description = formData.get("description")?.toString() || "";
        const file = formData.get("file") as File | null;

        const existingBorrow = await prisma.borrow.findUnique({ where: { id: numericId } });
        if (!existingBorrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        let imageFilename = existingBorrow.borrow_images ?? null;

        if (file) {
            if (!ALLOWED_TYPES.has(file.type)) {
                return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
            }
            if (file.size > MAX_SIZE) {
                return NextResponse.json({ error: "File size exceeds 10MB" }, { status: 400 });
            }

            ensureDir(PUBLIC_BORROW_DIR);
            const ext = file.type.split("/")[1] || "png";
            const filename = `${uuidv4()}.${ext}`;
            const newPath = path.join(PUBLIC_BORROW_DIR, filename);
            const buf = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(newPath, buf);

            // ลบไฟล์เดิมถ้ามี
            const oldPath = findExistingFilePath(imageFilename);
            delFileIfExists(oldPath || undefined);

            imageFilename = filename;
        }

        // บันทึก Borrow
        const updatedBorrow = await prisma.borrow.update({
            where: { id: numericId },
            data: {
                borrow_name: borrowName,
                unit,
                type_id: typeId,
                quantity,
                is_borro_restricted: isBorroRestricted,
                description: description || null,
                borrow_images: imageFilename,
            },
        });

        // เก็บ log การเปลี่ยนจำนวน (ถ้ามี)
        const delta = quantity - existingBorrow.quantity;
        if (delta !== 0) {
            const updateType = delta > 0 ? "insert" : "reduce";
            await prisma.borrow_updates.create({
                data: {
                    borrowId: numericId,
                    updatedQuantity: delta,
                    updateType,
                    remarks: "Updated via borrow edit form",
                },
            });
        }

        return NextResponse.json(updatedBorrow, { status: 200 });
    } catch (error) {
        console.error("Error updating borrow:", error);
        return NextResponse.json({ error: "Error updating borrow data" }, { status: 500 });
    }
}

/* ===================== PATCH (toggle status) ===================== */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const access = await protectApiRoute(req, ["admin"]);
    if (access !== true) return access;

    try {
        const id = Number(params.id);
        if (!Number.isInteger(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const status = Number(body?.status);
        if (!(status === 0 || status === 1)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const updated = await prisma.borrow.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (e) {
        console.error("PATCH /borrow/:id error:", e);
        return NextResponse.json({ error: "Cannot update status" }, { status: 500 });
    }
}
