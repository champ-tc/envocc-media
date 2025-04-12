import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from 'next-auth/jwt';

async function checkAdminSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && token.role === "admin");
}

export async function POST(req: NextRequest) {

    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { borrow_groupid, actual_return_date, logs } = body;

        if (!borrow_groupid || !actual_return_date || !logs) {
            return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
        }

        // แปลง actual_return_date จาก string (YYYY-MM-DD) เป็น Date
        const returnDate = new Date(`${actual_return_date}T00:00:00Z`); // ใช้เวลาเริ่มต้น 00:00:00 (UTC)

        // อัปเดตข้อมูลการคืนในฐานข้อมูล
        await Promise.all(
            logs.map(async (log: { id: number; returned_quantity: number }) => {
                // อัปเดตข้อมูลใน borrowLog
                await prisma.borrowLog.update({
                    where: { id: log.id },
                    data: {
                        status: "ApprovedReturned",
                        returned_quantity: log.returned_quantity,
                        actual_return_date: returnDate, // บันทึกเป็น Date
                    },
                });

                // เพิ่มจำนวนที่คืนในตาราง borrow (อัปเดตสต็อก)
                const borrowLog = await prisma.borrowLog.findUnique({
                    where: { id: log.id },
                    select: { borrow_id: true },
                });

                if (borrowLog) {
                    const borrowItem = await prisma.borrow.findUnique({
                        where: { id: borrowLog.borrow_id },
                    });

                    if (borrowItem) {
                        const updatedQuantity = borrowItem.quantity + log.returned_quantity;

                        // อัปเดตจำนวนใน borrow (เพิ่มจำนวนที่คืน)
                        await prisma.borrow.update({
                            where: { id: borrowItem.id },
                            data: { quantity: updatedQuantity },
                        });
                    }
                }
            })
        );

        return NextResponse.json({ message: "Return data saved successfully" });
    } catch (error) {
        console.error("Error saving return data:", error);
        return NextResponse.json({ error: "Failed to save return data" }, { status: 500 });
    }
}
