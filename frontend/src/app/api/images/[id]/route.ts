import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { getToken } from "next-auth/jwt";
import cookie from "cookie";
import { NextResponse } from "next/server";

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

// DELETE: ลบข้อมูลภาพ
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    if (!(await checkAdminSession(request))) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
    }

    const imageId = parseInt(id, 10);
    if (isNaN(imageId)) {
        return new Response(JSON.stringify({ error: "Invalid ID format" }), { status: 400 });
    }

    try {
        const image = await prisma.image.findUnique({ where: { id: imageId } });
        if (!image) {
            return new Response(JSON.stringify({ error: "Image not found" }), { status: 404 });
        }

        const filePath = path.join(process.cwd(), "public", "uploads", image.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await prisma.image.delete({ where: { id: imageId } });

        return new Response(JSON.stringify({ message: "Image and file deleted successfully" }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error deleting image or file" }), { status: 500 });
    }
}

// PUT: แก้ไขข้อมูลภาพ
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    if (!(await checkAdminSession(request))) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
    }

    const imageId = parseInt(id, 10);
    if (isNaN(imageId)) {
        return new Response(JSON.stringify({ error: "Invalid ID format" }), { status: 400 });
    }

    try {
        const formData = await request.formData();
        const title = formData.get("title") as string;
        const newFile = formData.get("newFile") as File | null;

        const existingImage = await prisma.image.findUnique({ where: { id: imageId } });
        if (!existingImage) {
            return new Response(JSON.stringify({ error: "Image not found" }), { status: 404 });
        }

        let filename = existingImage.filename;

        if (newFile) {
            const oldFilePath = path.join(process.cwd(), "public", "uploads", filename);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }

            filename = `${uuidv4()}.${newFile.type.split("/")[1]}`;
            const newFilePath = path.join(process.cwd(), "public", "uploads", filename);
            const fileBuffer = Buffer.from(await newFile.arrayBuffer());
            fs.writeFileSync(newFilePath, fileBuffer);
        }

        const updatedImage = await prisma.image.update({
            where: { id: imageId },
            data: {
                title,
                filename,
                addedDate: new Date(),
            },
        });

        return new Response(
            JSON.stringify({ message: "Image updated successfully", image: updatedImage }),
            { status: 200 }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error updating image" }), { status: 500 });
    }
}

// GET: ดึงข้อมูลภาพ
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    if (!id) {
        return new Response(JSON.stringify({ error: "Filename is required" }), { status: 400 });
    }

    try {
        const image = await prisma.image.findFirst({ where: { filename: id } });
        if (!image) {
            return new Response(JSON.stringify({ error: "Image not found" }), { status: 404 });
        }

        return new Response(JSON.stringify(image), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error fetching image" }), { status: 500 });
    }
}

// POST: เพิ่ม viewCount
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    if (!id) {
        return new Response(JSON.stringify({ error: "Filename is required" }), { status: 400 });
    }

    try {
        const image = await prisma.image.findFirst({ where: { filename: id } });
        if (!image) {
            return new Response(JSON.stringify({ error: "Image not found" }), { status: 404 });
        }

        const cookies = cookie.parse(request.headers.get("cookie") || "");
        if (cookies[`viewed_${id}`]) {
            return new Response(JSON.stringify({ message: "Already viewed recently" }), { status: 200 });
        }

        const updatedImage = await prisma.image.update({
            where: { id: image.id },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });

        const response = new Response(JSON.stringify(updatedImage), { status: 200 });
        response.headers.set(
            "Set-Cookie",
            cookie.serialize(`viewed_${id}`, "true", {
                maxAge: 3600,
                httpOnly: true,
                path: "/",
            })
        );

        return response;
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error updating view count" }), { status: 500 });
    }
}
