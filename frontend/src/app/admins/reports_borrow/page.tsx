"use client";

import React, { useState, useEffect } from "react";
import useAuthCheck from '@/hooks/useAuthCheck';
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface BorrowLogItem {
    id: number;
    quantity: number;
    approved_quantity?: number;
    borrow_date: string;
    actual_return_date?: string;
    status: string;
    borrow_groupid: string;
    borrow: {
        borrow_name: string;
    };
    user: {
        title: string;
        firstName: string;
        lastName: string;
        department: string;
    };
}

function AdminsReports_borrows() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();

    const [logs, setLogs] = useState<BorrowLogItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [totalRecords, setTotalRecords] = useState(0);

    const startIndex = (currentPage - 1) * itemsPerPage;

    const departmentOptions = [
        { value: '1', label: 'สำนักงานสาธารณสุขจังหวัด' },
        { value: '2', label: 'สำนักงานป้องกันควบคุมโรค' },
        { value: '3', label: 'โรงพยาบาล' },
        { value: '4', label: 'สถานประกอบการ' },
        { value: '5', label: 'มหาวิทยาลัย' },
        { value: '6', label: 'องค์กรอิสระ' },
        { value: '7', label: 'เจ้าหน้าที่ภาครัฐ/รัฐวิสาหกิจ' },
        { value: '8', label: 'เจ้าหน้าที่ EnvOcc' },
        { value: '9', label: 'นักเรียน/นักศึกษา' },
        { value: '10', label: 'ประชาชนทั่วไป' },
    ];

    const statusOptions = [
        { key: "pending", label: "รอดำเนินการ" },
        { key: "approved", label: "รอคืน" },
        { key: "returned", label: "คืนแล้ว" },
        { key: "approvedreturned", label: "คืนสำเร็จ" },
    ];


    const getDepartmentLabel = (value: string) => {
        return departmentOptions.find((opt) => opt.value === value)?.label || "-";
    };

    const getStatusLabel = (key: string) => {
        const normalizedKey = key.trim().toLowerCase();
        const match = statusOptions.find(
            (opt) => opt.key.toLowerCase() === normalizedKey
        );
        return match?.label || "-";
    };


    // Group
    const groupedLogs = logs.reduce((acc, log) => {
        const groupId = log.borrow_groupid;
        if (!acc[groupId]) acc[groupId] = [];
        acc[groupId].push(log);
        return acc;
    }, {} as Record<string, BorrowLogItem[]>);

    // แปลงเป็น array
    const groupArray = Object.entries(groupedLogs);

    // Total pages จากจำนวนกลุ่ม
    const totalPages = Math.ceil(groupArray.length / itemsPerPage);

    // กำหนดกลุ่มในหน้าปัจจุบัน
    const currentGroups = groupArray.slice(startIndex, startIndex + itemsPerPage);


    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/report_borrow`);
                const json = await res.json();
                setLogs(json.items || []);
                setTotalRecords(json.items?.length || 0);
            } catch (err) {
                console.error("Failed to fetch borrow logs:", err);
                setLogs([]);
            }
        };
        fetchData();
    }, []);



    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    const exportToExcel = () => {
        const dataForExcel = currentGroups.map(([groupId, groupLogs], index) => {
            const firstLog = groupLogs[0];

            const itemMap = new Map<string, { quantity: number; approved: number }>();
            groupLogs.forEach((log) => {
                const name = log.borrow.borrow_name;
                const qty = log.quantity;
                const approved = log.approved_quantity ?? 0;
                if (!itemMap.has(name)) itemMap.set(name, { quantity: 0, approved: 0 });
                const current = itemMap.get(name)!;
                itemMap.set(name, {
                    quantity: current.quantity + qty,
                    approved: current.approved + approved,
                });
            });

            const borrowText = Array.from(itemMap.entries())
                .map(([name, { quantity, approved }]) => `${name} - ขอ ${quantity} / อนุมัติ ${approved}`)
                .join("\n");

            return {
                ลำดับ: startIndex + index + 1,
                "ชื่อ - นามสกุล": [...new Set(groupLogs.map(
                    (log) => `${log.user.title}${log.user.firstName} ${log.user.lastName}`
                ))].join(", "),
                หน่วยงาน: getDepartmentLabel(firstLog.user.department),
                "รายการที่ยืม": borrowText,
                "วันที่ยืม": new Date(firstLog.borrow_date).toLocaleDateString("th-TH"),
                "วันที่คืน": firstLog.actual_return_date
                    ? new Date(firstLog.actual_return_date).toLocaleDateString("th-TH")
                    : "-",
                สถานะ: getStatusLabel(firstLog.status),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "BorrowReport");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `รายงานการยืม.xlsx`);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-4 mt-4 lg:ml-52">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">รายงานการยืม</h2>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                            >
                                Export เป็น Excel
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full border text-sm">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className="border px-4 py-2">ลำดับ</th>
                                        <th className="border px-4 py-2">ชื่อ - นามสกุล</th>
                                        <th className="border px-4 py-2">หน่วยงาน</th>
                                        <th className="border px-4 py-2">รายการและจำนวนที่ยืม</th>
                                        <th className="border px-4 py-2">วันที่ยืม</th>
                                        <th className="border px-4 py-2">วันที่คืน</th>
                                        <th className="border px-4 py-2">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentGroups.map(([groupId, groupLogs], index) => {
                                        const firstLog = groupLogs[0];
                                        return (
                                            <tr key={groupId}>
                                                <td className="border px-4 py-2">{startIndex + index + 1}</td>
                                                <td className="border px-4 py-2">
                                                    {[...new Set(groupLogs.map(
                                                        (log) => `${log.user.title}${log.user.firstName} ${log.user.lastName}`
                                                    ))].join(", ")}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {getDepartmentLabel(firstLog.user.department)}
                                                </td>
                                                <td className="border px-4 py-2 text-left">
                                                    {(() => {
                                                        const itemMap = new Map<string, { quantity: number; approved: number }>();
                                                        groupLogs.forEach((log) => {
                                                            const name = log.borrow.borrow_name;
                                                            const quantity = log.quantity;
                                                            const approved = log.approved_quantity ?? 0;
                                                            if (!itemMap.has(name)) itemMap.set(name, { quantity: 0, approved: 0 });
                                                            const current = itemMap.get(name)!;
                                                            itemMap.set(name, {
                                                                quantity: current.quantity + quantity,
                                                                approved: current.approved + approved,
                                                            });
                                                        });
                                                        return Array.from(itemMap.entries()).map(([name, { quantity, approved }], idx) => (
                                                            <div key={idx}>
                                                                {name} - ขอ {quantity} / อนุมัติ {approved}
                                                            </div>
                                                        ));
                                                    })()}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {new Date(firstLog.borrow_date).toLocaleDateString("th-TH")}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {firstLog.actual_return_date
                                                        ? new Date(firstLog.actual_return_date).toLocaleDateString("th-TH")
                                                        : "-"}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {getStatusLabel(firstLog.status)}
                                                </td>

                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {groupArray.length === 0 ? 0 : startIndex + 1} ถึง{" "}
                                {Math.min(startIndex + itemsPerPage, groupArray.length)} จาก{" "}
                                {groupArray.length} รายการ
                            </span>

                            <div className="flex space-x-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#fb8124] hover:text-white transition disabled:opacity-50"
                                >
                                    ก่อนหน้า
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md ${currentPage === page
                                            ? "bg-[#fb8124] text-white"
                                            : "bg-gray-200 text-gray-600"
                                            } hover:bg-[#fb8124] hover:text-white transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#fb8124] hover:text-white transition disabled:opacity-50"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsReports_borrows;
