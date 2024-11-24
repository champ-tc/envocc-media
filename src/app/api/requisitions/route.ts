import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handler สำหรับ GET requests
export async function GET() {
    try {
        const requisitions = await prisma.requisition.findMany({
            where: {
                is_borro_restricted: false, // เงื่อนไข: is_borro_restricted = 0 (false)
                status: 1,                 // เงื่อนไข: status = 1 (เปิดการใช้งาน)
            },
            include: {
                type: true, // แก้ไขจาก types เป็น type
            },
        });

        return NextResponse.json(requisitions, { status: 200 });
    } catch (error) {
        console.error("Error fetching requisitions:", error);
        return NextResponse.json({ message: 'Error fetching requisitions' }, { status: 500 });
    }
}