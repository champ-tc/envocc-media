import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import type { JWT } from "next-auth/jwt";

// ฟังก์ชันจัดการข้อผิดพลาด
const handleError = (error: unknown, message = "An error occurred", status = 500) => {
    console.error(message, error);
    return NextResponse.json({ error: message }, { status });
};

// ฟังก์ชันตรวจสอบสิทธิ์ admin
async function checkAdminSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && (token as JWT).role === 'admin');
}

// ฟังก์ชันตรวจสอบสิทธิ์ admin หรือ user
async function checkAdminOrUserSession(request: NextRequest): Promise<boolean> {
    try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        return !!(token && ((token as JWT).role === "admin" || (token as JWT).role === "user"));
    } catch (error) {
        console.error("Error in checkAdminOrUserSession:", error);
        return false;
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
    role: z.string().optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (isNaN(Number(id))) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    try {
        const data = await req.json();

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
                position: validatedData.position,
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

        return handleError(error, "Update failed");
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const numericId = Number(id);
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
