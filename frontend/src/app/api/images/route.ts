import { NextResponse, type NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { protectApiRoute } from '@/lib/protectApi';
import { UploadValidationError, validateUploadedImage } from '@/lib/uploadSecurity';




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

        const upload = await validateUploadedImage(file);
        const filename = upload.filename;

        // ไฟล์เข้า Docker
        const filePath = path.join('/app/fileuploads', filename); 

        // ใช้ใน local
        // const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

        console.log('Saving file to:', filePath);

        fs.writeFileSync(filePath, upload.buffer);

        const newImage = await prisma.image.create({
            data: {
                title,
                filename,
            },
        });

        return NextResponse.json({ message: 'Image added successfully', image: newImage });
    } catch (error) {
        if (error instanceof UploadValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
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
