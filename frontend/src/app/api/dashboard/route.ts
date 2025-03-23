import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

const departmentOptions = [
    '',
    'สำนักงานสาธารณสุขจังหวัด',
    'สำนักงานป้องกันควบคุมโรค',
    'โรงพยาบาล',
    'สถานประกอบการ',
    'มหาวิทยาลัย',
    'องค์กรอิสระ',
    'เจ้าหน้าที่ภาครัฐ/รัฐวิสาหกิจ',
    'เจ้าหน้าที่ EnvOcc',
    'นักเรียน/นักศึกษา',
    'ประชาชนทั่วไป',
];

async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

export async function GET(request: Request) {

    if (!(await checkAdminSession(request))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

    try {
        const [
            totalRequisitionLogs,
            approvedRequisitionLogs,
            totalBorrowLogs,
            returnedCount,
            users,
            requisitionLogs,
            borrowLogs,
        ] = await Promise.all([
            prisma.requisitionLog.count(),
            prisma.requisitionLog.count({ where: { approved_quantity: { not: null } } }),
            prisma.borrowLog.count(),
            prisma.borrowLog.count({ where: { actual_return_date: { not: null } } }),
            prisma.user.findMany(),
            prisma.requisitionLog.findMany({
                where: { approved_quantity: { not: null } },
                include: { requisition: true, reason: true },
            }),
            prisma.borrowLog.findMany({
                where: { approved_quantity: { not: null } },
                include: { borrow: true, reason: true },
            }),
        ]);

        // แปลง department เป็นกลุ่ม
        const userDepartmentCount: Record<string, number> = {};
        users.forEach((user) => {
            const index = parseInt(user.department ?? '');
            const label = isNaN(index) ? 'ไม่ระบุ' : departmentOptions[index] ?? 'ไม่ระบุ';
            userDepartmentCount[label] = (userDepartmentCount[label] || 0) + 1;
        });

        const userTypeStats = Object.entries(userDepartmentCount).map(([name, count]) => ({
            name,
            count,
        }));

        // TOP 5 รายการเบิก
        const requisitionCountMap: Record<string, { name: string; used: number; remaining: number }> = {};
        requisitionLogs.forEach((log) => {
            const req = log.requisition;
            if (!req) return;
            if (!requisitionCountMap[req.id]) {
                requisitionCountMap[req.id] = {
                    name: req.requisition_name,
                    used: 0,
                    remaining: req.quantity,
                };
            }
            requisitionCountMap[req.id].used += log.approved_quantity || 0;
        });

        const topRequisitions = Object.values(requisitionCountMap)
            .sort((a, b) => b.used - a.used)
            .slice(0, 5);

        // TOP 5 รายการยืม
        const borrowCountMap: Record<string, { name: string; used: number; remaining: number }> = {};
        borrowLogs.forEach((log) => {
            const item = log.borrow;
            if (!item) return;
            if (!borrowCountMap[item.id]) {
                borrowCountMap[item.id] = {
                    name: item.borrow_name,
                    used: 0,
                    remaining: item.quantity,
                };
            }
            borrowCountMap[item.id].used += log.approved_quantity || 0;
        });

        const topBorrows = Object.values(borrowCountMap)
            .sort((a, b) => b.used - a.used)
            .slice(0, 5);

        // Usage Purpose - Requisition
        const groupRequisition: Record<string, Set<string>> = {};
        for (const log of requisitionLogs) {
            const reasonName = log.reason?.reason_name || 'ไม่ระบุ';
            const groupKey = log.requested_groupid;
            if (!groupRequisition[reasonName]) groupRequisition[reasonName] = new Set();
            groupRequisition[reasonName].add(groupKey);
        }

        const usagePurposeStatsRequisition = Object.entries(groupRequisition).map(([name, set]) => ({
            name,
            count: set.size,
        }));

        // Usage Purpose - Borrow
        const groupBorrow: Record<string, Set<string>> = {};
        for (const log of borrowLogs) {
            const reasonName = log.reason?.reason_name || 'ไม่ระบุ';
            const groupKey = log.borrow_groupid;
            if (!groupBorrow[reasonName]) groupBorrow[reasonName] = new Set();
            groupBorrow[reasonName].add(groupKey);
        }

        const usagePurposeStatsBorrow = Object.entries(groupBorrow).map(([name, set]) => ({
            name,
            count: set.size,
        }));

        return NextResponse.json({
            totalRequisitionLogs,
            approvedRequisitionLogs,
            totalBorrowLogs,
            returnedCount,
            userTypeStats,
            topRequisitions,
            topBorrows,
            usagePurposeStatsRequisition,
            usagePurposeStatsBorrow,
        });
    } catch (err) {
        console.error('Dashboard API error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
