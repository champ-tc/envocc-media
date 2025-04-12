import { NextResponse, type NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';


async function checkAdminOrUserSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && (token.role === "admin" || token.role === "user"));
}

// เพิ่มคำสั่งซื้อ
export async function POST(req: NextRequest) {

    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { userId, requisitionId, borrowId, requisition_type, quantity } = await req.json();
        const date = new Date();

        // ตรวจสอบ input ที่จำเป็น
        if (!userId || !quantity || !requisition_type || (!requisitionId && !borrowId)) {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }

        // ตรวจสอบ Borrow (เฉพาะกรณี requisition_type เป็นการยืม)
        if (requisition_type === 2 && borrowId) {
            const borrow = await prisma.borrow.findUnique({ where: { id: borrowId } });

            if (!borrow) {
                return NextResponse.json({ message: "Borrow not found" }, { status: 404 });
            }

            // ตรวจสอบว่ามีสินค้าคงเหลือเพียงพอหรือไม่
            if (quantity > borrow.quantity) {
                return NextResponse.json({ message: "Not enough stock available" }, { status: 400 });
            }
        }

        // สร้างคำสั่งซื้อในตาราง Order
        const order = await prisma.order.create({
            data: {
                userId,
                requisitionId: requisitionId || null,
                borrowId: borrowId || null,
                requisition_type,
                quantity,
                date,
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error adding order:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// ดึงรายการคำสั่งซื้อ
export async function GET(req: NextRequest) {
    
    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const searchParams = new URL(req.url).searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const orders = await prisma.order.findMany({
            where: { userId: parseInt(userId, 10) },
            include: {
                requisition: true,
                borrow: true,
            },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}