import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { protectApiRoute } from '@/lib/protectApi';



const prisma = new PrismaClient();

export async function GET(request: NextRequest) {

    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;

    try {
        const borrowLogs = await prisma.borrowLog.findMany({
            include: {
                borrow: {
                    select: {
                        borrow_name: true
                    }
                },
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                borrow_date: 'desc'
            }
        });

        return NextResponse.json(borrowLogs.map(log => ({
            id: log.id,
            borrow_name: log.borrow.borrow_name,
            quantity: log.quantity,
            returned_quantity: log.returned_quantity || 0,
            borrow_date: log.borrow_date,
            return_due_date: log.return_due_date,
            status: log.status,
            user: `${log.user.firstName} ${log.user.lastName}`
        })), { status: 200 });
    } catch (error) {
        console.error("Error fetching borrow logs:", error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
    }
}
