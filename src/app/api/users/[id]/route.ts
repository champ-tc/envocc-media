import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const handleError = (error, message = "An error occurred", status = 500) => {
    console.error(message, error);
    return NextResponse.json({ error: message }, { status });
};

// ดึงข้อมูล, อัปเดต และลบผู้ใช้ตาม id
export async function GET(req, { params: { id } }) {
    try {
        const user = await prisma.user.findUnique({ where: { id: Number(id) } });
        return user ? NextResponse.json(user) : NextResponse.json({ error: "User not found" }, { status: 404 });
    } catch (error) {
        return handleError(error, "Error fetching user");
    }
}

export async function PUT(req, { params: { id } }) {
    try {
        const { name, email, role } = await req.json();
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: { name, email, role },
        });
        return NextResponse.json(updatedUser);
    } catch (error) {
        return handleError(error, "Error updating user");
    }
}

export async function DELETE(req, { params: { id } }) {
    try {
        const deletedUser = await prisma.user.delete({ where: { id: Number(id) } });
        return NextResponse.json(deletedUser);
    } catch (error) {
        return handleError(error, "Error deleting user");
    }
}
