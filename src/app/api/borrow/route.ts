import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface Token {
    role?: string;
    [key: string]: any;
}

// Schema สำหรับตรวจสอบข้อมูลด้วย zod
const borrowSchema = z.object({
    borrow_name: z.string().min(1, "ชื่อสื่อเป็นข้อมูลที่จำเป็น"),
    unit: z.string().min(1, "หน่วยนับเป็นข้อมูลที่จำเป็น"),
    type_id: z.number().int().min(1, "ต้องระบุประเภท ID"),
    quantity: z.number().int().min(1, "จำนวนต้องมากกว่า 0"),
    is_borro_restricted: z.boolean(),
    description: z.string().optional(),
});

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === 'admin');
}

// ฟังก์ชัน sanitizeInput สำหรับล้างข้อมูลที่ไม่ปลอดภัย
function sanitizeInput(input: string): string {
    return input.trim().replace(/<[^>]*>?/gm, "");
}

// POST: เพิ่มข้อมูล Borrow ใหม่
export async function POST(request: Request) {
    try {
        console.log("Start POST handler");

        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const formData = await request.formData();

        const borrowName = formData.get("borrow_name")?.toString() || "";
        const unit = formData.get("unit")?.toString() || "";
        const typeId = parseInt(formData.get("type_id")?.toString() || "0");
        const quantity = parseInt(formData.get("quantity")?.toString() || "0");
        const isBorroRestricted = formData.get("is_borro_restricted") === "true";
        const description = formData.get("description")?.toString() || "";
        const file = formData.get("file") as File | null;

        console.log("Data extracted from FormData:", {
            borrowName,
            unit,
            typeId,
            quantity,
            isBorroRestricted,
            description,
        });

        // ตรวจสอบข้อมูลด้วย schema
        const validatedData = borrowSchema.parse({
            borrow_name: sanitizeInput(borrowName),
            unit: sanitizeInput(unit),
            type_id: typeId,
            quantity: quantity,
            is_borro_restricted: isBorroRestricted,
            description: sanitizeInput(description),
        });
        console.log("Validated data:", validatedData);

        // จัดการอัปโหลดไฟล์
        let imageUrl = "";
        if (file) {
            console.log("File received:", file);

            const maxFileSize = 5 * 1024 * 1024; // ขนาดไฟล์สูงสุด 5MB
            const allowedFileTypes = ["image/jpeg", "image/png"];

            if (!allowedFileTypes.includes(file.type)) {
                console.error("Invalid file type:", file.type);
                return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
            }

            if (file.size > maxFileSize) {
                console.error("File size exceeds limit:", file.size);
                return NextResponse.json({ error: "File size exceeds limit" }, { status: 400 });
            }

            const filename = `${uuidv4()}.${file.type.split("/")[1]}`;
            const filePath = path.join(process.cwd(), "public", "borrows", filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer);
            imageUrl = filename;
            console.log("File saved:", imageUrl);
        }

        // บันทึกข้อมูลลงในฐานข้อมูล
        const newBorrow = await prisma.borrow.create({
            data: {
                borrow_name: validatedData.borrow_name,
                unit: validatedData.unit,
                type_id: validatedData.type_id,
                quantity: validatedData.quantity,
                is_borro_restricted: validatedData.is_borro_restricted,
                description: validatedData.description || null,
                borrow_images: imageUrl,
            },
        });
        console.log("New borrow created:", newBorrow);

        return NextResponse.json(newBorrow, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Validation error:", error.errors);
            return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
        }
        console.error("Error adding borrow:", error);
        return NextResponse.json({ error: "Error adding borrow" }, { status: 500 });
    }
}


// GET: ดึงข้อมูล Borrow ทั้งหมด
export async function GET(request: Request) {
    try {

        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const borrows = await prisma.borrow.findMany(); // ดึงข้อมูลทั้งหมด
        return NextResponse.json(borrows); // ส่งคืนข้อมูลทั้งหมด รวมถึง borrow_images
    } catch (error) {
        console.error("Error fetching borrows:", error);
        return NextResponse.json({ error: "Error fetching borrows" }, { status: 500 });
    }
}