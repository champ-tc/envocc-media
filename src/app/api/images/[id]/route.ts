import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const session = await getServerSession(request, authOptions);
    return !!(session && session.user.role === 'admin');
}

// API สำหรับลบข้อมูล
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    if (!(await checkAdminSession(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    try {
        const image = await prisma.image.findUnique({ where: { id } });
        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        const filePath = path.join(process.cwd(), 'public', 'uploads', image.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await prisma.image.delete({ where: { id } });
        return NextResponse.json({ message: 'Image and file deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        return NextResponse.json({ error: 'Error deleting image or file' }, { status: 500 });
    }
}

// API สำหรับแก้ไขข้อมูลภาพ
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    if (!(await checkAdminSession(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const newFile = formData.get('newFile') as File | null;

        const existingImage = await prisma.image.findUnique({ where: { id } });
        if (!existingImage) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
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

        return NextResponse.json({ message: 'Image updated successfully', image: updatedImage });
    } catch (error) {
        console.error('Error updating image:', error);
        return NextResponse.json({ error: 'Error updating image' }, { status: 500 });
    }
}

// API สำหรับ GET ข้อมูลภาพ
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const filename = params.id;
    if (!filename) {
        return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    try {
        const image = await prisma.image.findFirst({ where: { filename } });
        if (!image) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        return NextResponse.json(image);
    } catch (error) {
        console.error('Error fetching image:', error);
        return NextResponse.json({ error: "Error fetching image" }, { status: 500 });
    }
}

// API สำหรับเพิ่มจำนวนการดู (viewCount)
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const filename = params.id;
    if (!filename) {
        return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    try {
        const image = await prisma.image.findFirst({ where: { filename } });
        if (!image) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        const updatedImage = await prisma.image.update({
            where: { id: image.id },
            data: {
                viewCount: (image.viewCount || 0) + 1,
            },
        });

        return NextResponse.json(updatedImage);
    } catch (error) {
        console.error('Error updating view count:', error);
        return NextResponse.json({ error: "Error updating view count" }, { status: 500 });
    }
}
