import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

// ฟังก์ชันจัดการข้อผิดพลาด
const handleError = (error: any, message = "An error occurred", status = 500) => {
    console.error(message, error);
    return NextResponse.json({ error: message }, { status });
};

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === 'admin');
}

// Schema สำหรับตรวจสอบข้อมูลในฟังก์ชัน PUT
const userUpdateSchema = z.object({
    username: z.string().min(1, "Username is required"),
    title: z.string().min(1, "Title is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    tel: z.string().min(1, "Telephone number is required"),
    email: z.string().email("Invalid email format"),
    department: z.string().min(1, "Department is required"),
    position: z.string().min(1, "Position is required"),
    role: z.string().optional(), // role เป็น optional
});

// ฟังก์ชัน GET สำหรับดึงข้อมูลผู้ใช้ตาม id
export async function GET(req: Request, { params: { id } }: { params: { id: string } }) {
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: Number(id) } });
        return user ? NextResponse.json(user) : NextResponse.json({ error: "User not found" }, { status: 404 });
    } catch (error) {
        return handleError(error, "Error fetching user");
    }
}

// ฟังก์ชัน PUT สำหรับอัปเดตข้อมูลผู้ใช้ตาม id
export async function PUT(req: Request, { params: { id } }: { params: { id: string } }) {
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // ตรวจสอบความถูกต้องของข้อมูลที่ได้รับ
        const data = userUpdateSchema.parse(await req.json());

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                username: data.username,
                title: data.title,
                firstName: data.firstName,
                lastName: data.lastName,
                tel: data.tel,
                email: data.email,
                department: data.department,
                position: data.position,
                role: data.role,
            },
        });
        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        return handleError(error, "Update failed");
    }
}

// ฟังก์ชัน DELETE สำหรับลบข้อมูลผู้ใช้ตาม id
export async function DELETE(req: Request, { params: { id } }: { params: { id: string } }) {
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const numericId = Number(id); // แปลง id ให้เป็น Number
        if (isNaN(numericId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const deletedUser = await prisma.user.delete({
            where: { id: numericId },
        });
        return NextResponse.json(deletedUser);
    } catch (error) {
        return handleError(error, "Error deleting user");
    }
}
