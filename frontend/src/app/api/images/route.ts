import { NextResponse, type NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4
import fs from 'fs';
import path from 'path';
import { protectApiRoute } from '@/lib/protectApi';




export async function POST(request: NextRequest) {
    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;

    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const file = formData.get('file');

        if (!file || typeof title !== 'string') {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: 'Invalid file input' }, { status: 400 });
        }

        const filename = `${uuidv4()}.${file.type.split('/')[1]}`;

        // ไฟล์เข้า Docker
        const filePath = path.join('/app/fileuploads', filename); 

        // ใช้ใน local
        // const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

        console.log('Saving file to:', filePath);

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, fileBuffer);

        const newImage = await prisma.image.create({
            data: {
                title,
                filename,
            },
        });

        return NextResponse.json({ message: 'Image added successfully', image: newImage });
    } catch (error) {
        console.error("Error uploading image:", error);
        return NextResponse.json({ error: 'Error uploading image' }, { status: 500 });
    }
}


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