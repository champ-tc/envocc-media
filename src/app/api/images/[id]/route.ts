import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getToken } from 'next-auth/jwt';

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && token.role === 'admin');
}

// API สำหรับลบข้อมูล
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    if (!(await checkAdminSession(request))) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return new Response(JSON.stringify({ error: 'Invalid ID format' }), { status: 400 });
    }

    try {
        // ค้นหาข้อมูลไฟล์ในฐานข้อมูล
        const image = await prisma.image.findUnique({ where: { id } });
        if (!image) {
            return new Response(JSON.stringify({ error: 'Image not found' }), { status: 404 });
        }

        // ลบไฟล์จริงในโฟลเดอร์ /public/uploads
        const filePath = path.join(process.cwd(), 'public', 'uploads', image.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // ลบข้อมูลในฐานข้อมูล
        await prisma.image.delete({ where: { id } });

        return new Response(JSON.stringify({ message: 'Image and file deleted successfully' }), { status: 200 });
    } catch (error) {
        console.error('Error deleting image:', error);
        return new Response(JSON.stringify({ error: 'Error deleting image or file' }), { status: 500 });
    }
}

// API สำหรับแก้ไขข้อมูลภาพ
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    if (!(await checkAdminSession(request))) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return new Response(JSON.stringify({ error: 'Invalid ID format' }), { status: 400 });
    }

    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const newFile = formData.get('newFile') as File | null;

        const existingImage = await prisma.image.findUnique({ where: { id } });
        if (!existingImage) {
            return new Response(JSON.stringify({ error: 'Image not found' }), { status: 404 });
        }

        let filename = existingImage.filename;

        if (newFile) {
            const oldFilePath = path.join(process.cwd(), 'public', 'uploads', filename);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }

            filename = `${uuidv4()}.${newFile.type.split('/')[1]}`;
            const newFilePath = path.join(process.cwd(), 'public', 'uploads', filename);
            const fileBuffer = Buffer.from(await newFile.arrayBuffer());
            fs.writeFileSync(newFilePath, fileBuffer);
        }

        const updatedImage = await prisma.image.update({
            where: { id },
            data: {
                title,
                filename,
                addedDate: new Date(),
            },
        });

        return new Response(JSON.stringify({ message: 'Image updated successfully', image: updatedImage }), { status: 200 });
    } catch (error) {
        console.error('Error updating image:', error);
        return new Response(JSON.stringify({ error: 'Error updating image' }), { status: 500 });
    }
}


// API สำหรับ GET ข้อมูลภาพ
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const filename = params.id;
    if (!filename) {
        return new Response(JSON.stringify({ error: "Filename is required" }), { status: 400 });
    }

    try {
        const image = await prisma.image.findFirst({ where: { filename } });
        if (!image) {
            return new Response(JSON.stringify({ error: "Image not found" }), { status: 404 });
        }

        return new Response(JSON.stringify(image), { status: 200 });
    } catch (error) {
        console.error('Error fetching image:', error);
        return new Response(JSON.stringify({ error: "Error fetching image" }), { status: 500 });
    }
}

// API สำหรับเพิ่มจำนวนการดู (viewCount)
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const filename = params.id;
    if (!filename) {
        return new Response(JSON.stringify({ error: "Filename is required" }), { status: 400 });
    }

    try {
        // ตรวจสอบว่ารูปภาพมีอยู่จริง
        const image = await prisma.image.findFirst({ where: { filename } });
        if (!image) {
            return new Response(JSON.stringify({ error: "Image not found" }), { status: 404 });
        }

        // อัปเดต viewCount ในฐานข้อมูลโดยใช้คำสั่ง increment
        const updatedImage = await prisma.image.update({
            where: { id: image.id },
            data: {
                viewCount: {
                    increment: 1, // ใช้ increment เพื่อเพิ่มค่า viewCount อย่างปลอดภัย
                },
            },
        });

        return new Response(JSON.stringify(updatedImage), { status: 200 });
    } catch (error) {
        console.error('Error updating view count:', error);
        return new Response(JSON.stringify({ error: "Error updating view count" }), { status: 500 });
    }
}
