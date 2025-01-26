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

async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    try {
        const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
        return !!(token && (token.role === "admin" || token.role === "user"));
    } catch (error) {
        console.error("Error in checkAdminOrUserSession:", error);
        return false; // หากมีข้อผิดพลาด ให้ถือว่าไม่มีสิทธิ์
    }
}

// Schema สำหรับตรวจสอบข้อมูลในฟังก์ชัน PUT
const userUpdateSchema = z.object({
    title: z.string().min(1, "Title is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    tel: z.string().min(1, "Telephone number is required"),
    email: z.string().email("Invalid email format"),
    department: z.string().min(1, "Department is required"),
    position: z.string().optional().nullable(),
    role: z.string().optional(), // role เป็น optional
});

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {

    const { id } = await context.params;

    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: Number(id) } });
        return user
            ? NextResponse.json(user)
            : NextResponse.json({ error: "User not found" }, { status: 404 });
    } catch (error) {
        return handleError(error, "Error fetching user");
    }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (isNaN(Number(id))) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    try {
        let data = await req.json();

        // ตรวจสอบว่ามี position หรือไม่ ถ้าไม่มีให้ตั้งค่าเป็นค่าว่าง
        if (!("position" in data) || data.position === null) {
            data.position = "";
        }

        const validatedData = userUpdateSchema.parse(data);

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                title: validatedData.title,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                tel: validatedData.tel,
                email: validatedData.email,
                department: validatedData.department,
                position: validatedData.position,  // รองรับค่าว่าง
                role: validatedData.role,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input data", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error in PUT API:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}


// ฟังก์ชัน DELETE สำหรับลบข้อมูลผู้ใช้ตาม id
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const numericId = Number(id); // แปลง id ให้เป็น Number
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        const deletedUser = await prisma.user.delete({
            where: { id: numericId },
        });

        return NextResponse.json(deletedUser);
    } catch (error) {
        return handleError(error, "Error deleting user");
    }
}