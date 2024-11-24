import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handler สำหรับ GET requests
export async function GET() {
    try {
        const borrows = await prisma.borrow.findMany({
            where: {
                is_borro_restricted: false, // เงื่อนไข: is_borro_restricted = 0 (false)
                status: 1,                 // เงื่อนไข: status = 1 (เปิดใช้งาน)
            },
            include: {
                type: true, // ดึงข้อมูล type ที่สัมพันธ์
            },
        });

        return NextResponse.json(borrows, { status: 200 });
    } catch (error) {
        console.error("Error fetching borrows:", error);
        return NextResponse.json({ message: "Error fetching borrows" }, { status: 500 });
    }
}
