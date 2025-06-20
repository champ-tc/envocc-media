import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { protectApiRoute } from '@/lib/protectApi';


// Schema สำหรับตรวจสอบข้อมูล
const profileUpdateSchema = z.object({
    username: z.string().min(1, "Username is required"),
    title: z.string().min(1, "Title is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    tel: z.string().min(1, "Telephone number is required"),
    email: z.string().email("Invalid email format"),
    department: z.string().min(1, "Department is required"),
    position: z.string().optional().nullable(),
    password: z.string().optional(), // Password เป็น optional
});


// ฟังก์ชัน GET สำหรับดึงข้อมูลผู้ใช้
export async function GET(req: NextRequest) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    const session = await getServerSession();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = {
        username: user.username,
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        tel: user.tel,
        email: user.email,
        department: user.department,
        position: user.position,
    };

    return NextResponse.json(userData);
}

// ฟังก์ชัน PUT สำหรับอัปเดตข้อมูลผู้ใช้
export async function PUT(req: NextRequest) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    const session = await getServerSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await req.json();

        if (!body.id || isNaN(Number(body.id))) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        if (!("position" in body) || body.position === null) {
            body.position = "";
        }

        const validatedData = profileUpdateSchema.parse(body);

        const updatedUser = await prisma.user.update({
            where: { id: Number(body.id) },
            data: validatedData,
        });

        return NextResponse.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Update user profile failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }    
}