// src/app/api/requisitions/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handler สำหรับ GET requests
export async function GET() {
    try {
        // ดึงข้อมูล requisitions และรวมข้อมูล types ที่เกี่ยวข้อง
        const requisitions = await prisma.requisition.findMany({
            include: {
                types: true,  // เปลี่ยนจาก 'type' เป็น 'types' ตาม Prisma schema
            },
        });

        return NextResponse.json(requisitions, { status: 200 });
    } catch (error) {
        console.error("Error fetching requisitions:", error);
        return NextResponse.json({ message: 'Error fetching requisitions' }, { status: 500 });
    }
}

