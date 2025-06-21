import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { protectApiRoute } from '@/lib/protectApi';

export async function PUT(req: NextRequest) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    try {
        const { groupId, logs } = await req.json();

        // Validate input
        if (!groupId || !logs || !Array.isArray(logs)) {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }

        // Extract admin ID from the token
        const token = await getToken({ req });
        if (!token || token.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const adminId = parseInt(token.sub || "0", 10);


        // Process each log
        await Promise.all(
            logs.map(async (log) => {
                if (!log.id || typeof log.approved_quantity !== "number") {
                    throw new Error(`Invalid log structure: ${JSON.stringify(log)}`);
                }

                // Fetch the borrow record
                const borrowLog = await prisma.borrowLog.findUnique({
                    where: { id: log.id },
                });
                if (!borrowLog) {
                    throw new Error(`BorrowLog with ID ${log.id} not found`);
                }

                // Fetch the borrow item
                const borrowItem = await prisma.borrow.findUnique({
                    where: { id: borrowLog.borrow_id },
                });
                if (!borrowItem) {
                    throw new Error(`Borrow item with ID ${borrowLog.borrow_id} not found`);
                }

                // Validate stock availability
                if (borrowItem.quantity < log.approved_quantity) {
                    throw new Error(
                        `Not enough stock for borrow item ID ${borrowLog.borrow_id}. Available: ${borrowItem.quantity}, Requested: ${log.approved_quantity}`
                    );
                }

                // Calculate remaining stock
                const stockAfterBorrow = borrowItem.quantity - log.approved_quantity;

                // Update BorrowLog entry
                await prisma.borrowLog.update({
                    where: { id: log.id },
                    data: {
                        status: "Approved",
                        approved_by_admin_id: adminId,
                        returned_quantity: log.returned_quantity || 0,
                        actual_return_date: log.actual_return_date || null,
                        approved_quantity: log.approved_quantity, // This field now exists
                    },
                });

                // Update borrow item's stock
                await prisma.borrow.update({
                    where: { id: borrowLog.borrow_id },
                    data: { quantity: stockAfterBorrow },
                });

                // Optionally, remove stock from the borrow table or log the changes elsewhere if necessary
                console.log(`Updated stock for Borrow ID: ${borrowLog.borrow_id}, remaining: ${stockAfterBorrow}`);
            })
        );

        return NextResponse.json({ message: "Borrow logs approved successfully" });
    } catch (error) {
        console.error("Error approving borrow logs:", error);
        return NextResponse.json(
            { error: "Failed to approve borrow logs", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
