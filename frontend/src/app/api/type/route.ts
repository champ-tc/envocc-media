import { NextResponse, type NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

// Schema สำหรับตรวจสอบข้อมูล
const typeSchema = z.object({
    name: z.string().min(1, "ชื่อเป็นข้อมูลจำเป็น"),
    description: z.string().optional(),
});

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && token.role === "admin");
}


export async function GET(req: NextRequest) {
    try {
        if (!(await checkAdminSession(req))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;


        const types = await prisma.type.findMany({
            skip: offset,
            take: limit,
            orderBy: { id: "asc" } // ให้แน่ใจว่าข้อมูลเรียงตาม id
        });

        const totalRecords = await prisma.type.count();
        const totalPages = Math.ceil(totalRecords / limit);

        return NextResponse.json({ items: types, totalPages, totalRecords });
    } catch (error) {
        console.error("Error fetching types:", error);
        return NextResponse.json({ error: "Error fetching types" }, { status: 500 });
    }
}


// เพิ่มข้อมูล
export async function POST(request: NextRequest) {
    try {
        if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // รับข้อมูลจาก formData
        const formData = await request.formData();
        const name = formData.get('name')?.toString();  // Ensure it's a string
        const description = formData.get('description')?.toString();  // Ensure it's a string

        // ตรวจสอบความถูกต้องของข้อมูลที่ได้รับ
        const data = typeSchema.parse({ name, description });

        // ตรวจสอบว่ามี name ซ้ำอยู่ในฐานข้อมูลหรือไม่
        const existingType = await prisma.type.findMany({
            where: { name: data.name },
        });

        if (existingType.length > 0) {
            return NextResponse.json({ error: 'ชื่อประเภทนี้มีอยู่แล้วในฐานข้อมูล' }, { status: 400 });
        }

        // บันทึกข้อมูลในฐานข้อมูล
        const newType = await prisma.type.create({
            data: {
                name: data.name,
                description: data.description || null,
            },
        });

        return NextResponse.json({ message: 'ประเภทเพิ่มสำเร็จ', type: newType });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'ข้อมูลที่กรอกไม่ถูกต้อง', details: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/type:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดข้อมูลประเภท' }, { status: 500 });
    }
}

