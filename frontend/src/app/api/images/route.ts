import { NextResponse, type NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4
import fs from 'fs';
import path from 'path';
import { getToken } from "next-auth/jwt";

async function checkAdminSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && token.role === "admin");
}

export async function POST(request: NextRequest) {

    if (!(await checkAdminSession(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const file = formData.get('file') as File;

        if (!file || !title) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'Invalid file input' }, { status: 400 });
        }

        // สร้างชื่อไฟล์แบบสุ่ม
        const filename = `${uuidv4()}.${file.type.split('/')[1]}`;

        // เขียนไฟล์ไปยังเซิร์ฟเวอร์
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, fileBuffer);

        // บันทึกข้อมูลในฐานข้อมูล
        const newImage = await prisma.image.create({
            data: {
                title: title.toString(),
                filename,
            },
        });

        return NextResponse.json({ message: 'Image added successfully', image: newImage });
    } catch (error) {
        console.error("Error uploading image:", error);
        return NextResponse.json({ error: 'Error uploading image' }, { status: 500 });
    }
}


// API สำหรับ GET ข้อมูล
export async function GET() {
    try {
        const images = await prisma.image.findMany({
            select: {
                id: true,
                title: true,
                filename: true,
                addedDate: true,
                viewCount: true, // ✅ เพิ่มให้ตรงกับ model
            },
            orderBy: {
                addedDate: "desc",
            },
        });

        return NextResponse.json(images);
    } catch (error: unknown) {
        const errMessage =
            error instanceof Error ? error.message : "Unknown error";

        console.error("❌ Error in GET /api/images:", errMessage);

        return NextResponse.json(
            { error: "Error fetching image", detail: errMessage },
            { status: 500 }
        );
    }
}
