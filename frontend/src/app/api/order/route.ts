import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from '@/lib/prisma';
import { protectApiRoute } from '@/lib/protectApi';



// เพิ่มคำสั่งซื้อ
export async function POST(req: NextRequest) {
    const access = await protectApiRoute(req, ['admin', 'user']);
    if (access !== true) return access;

    try {
        const { userId, requisitionId, borrowId, requisition_type, quantity } = await req.json();
        const date = new Date();
        const isProd = process.env.NODE_ENV === "production";
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
            cookieName: isProd
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
        });
        const isAdmin = token?.role === "admin";

        // ตรวจสอบ input ที่จำเป็น
        if (
            !userId ||
            !Number.isInteger(quantity) ||
            quantity <= 0 ||
            !requisition_type ||
            (!requisitionId && !borrowId)
        ) {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }

        // ตรวจสอบว่ามี order เดิมอยู่หรือไม่
        const existingOrder = await prisma.order.findFirst({
            where: {
                userId,
                requisitionId: requisitionId || null,
                borrowId: borrowId || null,
                requisition_type,
            },
        });

        if (existingOrder) {
            // รวมจำนวนใหม่
            const newQuantity = existingOrder.quantity + quantity;

            // Admin ไม่มีเพดานจำนวน แต่ผู้ใช้ทั่วไปยังจำกัดสูงสุด 100 ชิ้น
            if (!isAdmin && newQuantity > 100) {
                return NextResponse.json({ message: "Total quantity cannot exceed 100" }, { status: 400 });
            }

            const stockError = await validateStock(requisition_type, requisitionId, borrowId, newQuantity);
            if (stockError) return stockError;

            const updatedOrder = await prisma.order.update({
                where: { id: existingOrder.id },
                data: {
                    quantity: newQuantity,
                    date,
                },
            });

            return NextResponse.json(updatedOrder);
        } else {
            // ถ้าไม่มี order เดิม → สร้างใหม่
            if (!isAdmin && quantity > 100) {
                return NextResponse.json({ message: "Quantity cannot exceed 100" }, { status: 400 });
            }

            const stockError = await validateStock(requisition_type, requisitionId, borrowId, quantity);
            if (stockError) return stockError;

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
        }
    } catch (error) {
        console.error("Error adding order:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

async function validateStock(
    requisitionType: number,
    requisitionId: number | null | undefined,
    borrowId: number | null | undefined,
    totalQuantity: number,
): Promise<NextResponse | null> {
    const item = requisitionType === 1 && requisitionId
        ? await prisma.requisition.findUnique({ where: { id: requisitionId } })
        : requisitionType === 2 && borrowId
            ? await prisma.borrow.findUnique({ where: { id: borrowId } })
            : null;

    if (!item) {
        return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    if (totalQuantity > item.quantity) {
        return NextResponse.json(
            { message: `Quantity cannot exceed remaining stock (${item.quantity})` },
            { status: 400 },
        );
    }

    return null;
}


// ดึงรายการคำสั่งซื้อ
export async function GET(req: NextRequest) {

    const access = await protectApiRoute(req, ['admin', 'user']);
    if (access !== true) return access;

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
