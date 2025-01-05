import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getToken } from 'next-auth/jwt';
import cookie from 'cookie';
import { NextResponse } from 'next/server';

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
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

        // ตรวจสอบ Cookie ว่าเคยบันทึกการเข้าชมแล้วหรือไม่
        const cookies = cookie.parse(request.headers.get('cookie') || '');
        if (cookies[`viewed_${filename}`]) {
            // ถ้ามีการเข้าชมแล้วในช่วงเวลาที่กำหนด ข้ามการเพิ่ม viewCount
            return new Response(JSON.stringify({ message: "Already viewed recently" }), { status: 200 });
        }

        // อัปเดต viewCount ในฐานข้อมูลโดยใช้คำสั่ง increment
        const updatedImage = await prisma.image.update({
            where: { id: image.id },
            data: {
                viewCount: {
                    increment: 1, // เพิ่มค่า viewCount อย่างปลอดภัย
                },
            },
        });

        // ตั้งค่า Cookie เพื่อบันทึกการเข้าชม โดยกำหนดอายุเป็น 1 ชั่วโมง
        const response = new Response(JSON.stringify(updatedImage), { status: 200 });
        response.headers.set('Set-Cookie', cookie.serialize(`viewed_${filename}`, 'true', {
            maxAge: 60 * 60, // อายุของ Cookie เป็น 1 ชั่วโมง
            httpOnly: true,
            path: '/',
        }));

        return response;
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error updating view count" }), { status: 500 });
    }
}

