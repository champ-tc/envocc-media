import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod"; // ใช้เพื่อทำ validation

// Schema สำหรับตรวจสอบข้อมูล
const typeSchema = z.object({
    name: z.string().min(1, "ชื่อเป็นข้อมูลจำเป็น"),
    description: z.string().optional(),
});

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

// API สำหรับแก้ไขข้อมูล
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    try {
        // ตรวจสอบสิทธิ์
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const typeId = parseInt(id, 10);
        if (isNaN(typeId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        // รับข้อมูลจาก formData
        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");

        // ตรวจสอบความถูกต้องของข้อมูลที่ได้รับ
        const data = typeSchema.parse({ name, description });

        // ตรวจสอบค่าซ้ำในฐานข้อมูล
        const existingType = await prisma.type.findFirst({
            where: {
                name: data.name,
                NOT: {
                    id: typeId, // ยกเว้นรายการที่กำลังแก้ไข
                },
            },
        });

        if (existingType) {
            return NextResponse.json(
                { error: "Duplicate name", message: "The type name already exists in the system." },
                { status: 400 }
            );
        }

        // แก้ไขข้อมูลในฐานข้อมูล
        const updatedType = await prisma.type.update({
            where: { id: typeId },
            data: {
                name: data.name,
                description: data.description || null,
            },
        });

        return NextResponse.json({ message: "Type updated successfully", type: updatedType });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
        }
        console.error("Error in PUT /api/type:", error);
        return NextResponse.json({ error: "Error updating type" }, { status: 500 });
    }
}

// API สำหรับลบข้อมูล
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    try {
        // ตรวจสอบสิทธิ์
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const typeId = parseInt(id, 10);
        if (isNaN(typeId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        // ลบข้อมูลในฐานข้อมูล
        await prisma.type.delete({ where: { id: typeId } });

        return NextResponse.json({ message: "Type deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting type:", error);
        return NextResponse.json({ error: "Error deleting type" }, { status: 500 });
    }
}
