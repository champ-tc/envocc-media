import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { protectApiRoute } from '@/lib/protectApi';




// GET: ดึงข้อมูล Borrow ตาม ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;


    const { id } = await context.params;

    try {

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
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    const { id } = await context.params;
    try {

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

        const existingBorrow = await prisma.borrow.findUnique({ where: { id: numericId } });
        if (!existingBorrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        let imageUrl = existingBorrow.borrow_images;
        if (file) {
            const filename = `${uuidv4()}.${file.type.split("/")[1]}`;
            const filePath = path.join("/app/fileborrows", filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer);

            if (existingBorrow.borrow_images) {
                const oldFilePath = path.join("/app/fileborrows", existingBorrow.borrow_images);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            imageUrl = filename;
        }

        const updatedQuantity = quantity - existingBorrow.quantity;
        const updateType = updatedQuantity > 0 ? "insert" : updatedQuantity < 0 ? "reduce" : "no change";

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

        if (updatedQuantity !== 0) {
            await prisma.borrow_updates.create({
                data: {
                    borrowId: numericId,
                    updatedQuantity,
                    updateType,
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
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;
    
    const { id } = await context.params;
    try {

        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        const borrow = await prisma.borrow.findUnique({ where: { id: numericId } });
        if (!borrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        if (borrow.borrow_images) {
            const filePath = path.join("/app/fileborrows", borrow.borrow_images);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await prisma.borrow.delete({ where: { id: numericId } });
        return NextResponse.json({ message: "Borrow and image deleted successfully" });
    } catch (error) {
        console.error("Error deleting borrow or image:", error);
        return NextResponse.json({ error: "Error deleting borrow data" }, { status: 500 });
    }
}
