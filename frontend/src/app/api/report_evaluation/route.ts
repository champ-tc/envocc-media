import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';

export async function GET(request: NextRequest) {
    // 1. ตรวจสอบสิทธิ์ (Admin เท่านั้น)
    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;

    try {
        // 2. ดึงข้อมูล Evaluation พร้อมข้อมูล User
        const evaluations = await prisma.evaluation.findMany({
            include: {
                user: {
                    select: {
                        title: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc' // เรียงจากใหม่ไปเก่า
            }
        });

        return NextResponse.json({ items: evaluations });
    } catch (error) {
        console.error("Error fetching evaluation report:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}