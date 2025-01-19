import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt"; // เปลี่ยนการนำเข้า
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Schema สำหรับตรวจสอบข้อมูล
const profileUpdateSchema = z.object({
    username: z.string().min(1, "Username is required"),
    title: z.string().min(1, "Title is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    tel: z.string().min(1, "Telephone number is required"),
    email: z.string().email("Invalid email format"),
    department: z.string().min(1, "Department is required"),
    position: z.string().min(1, "Position is required"),
    password: z.string().optional(), // Password เป็น optional
});

async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === 'admin');
}

// ฟังก์ชัน GET สำหรับดึงข้อมูลผู้ใช้
export async function GET(req: Request) {
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
export async function PUT(req: Request) {
    const session = await getServerSession();

    if (!session || !(await checkAdminSession(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    try {
        // ตรวจสอบความถูกต้องของข้อมูลที่ได้รับ
        const data = profileUpdateSchema.parse(body);

        const updatedData: any = {
            username: data.username,
            title: data.title,
            firstName: data.firstName,
            lastName: data.lastName,
            tel: data.tel,
            email: data.email,
            department: data.department,
            position: data.position,
        };

        // Hash the password if it is provided
        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 12);
            updatedData.password = hashedPassword;
        }

        // Update the user data in the database
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updatedData,
        });

        return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        console.error('Error in PUT /api/users/profile:', error);
        return NextResponse.json({ error: 'Error updating user profile' }, { status: 500 });
    }
}