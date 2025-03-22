"use client";

import React, { useEffect, useState } from "react";
import useAuthCheck from '@/hooks/useAuthCheck';
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface LogItem {
    id: number;
    requested_quantity: number;
    approved_quantity?: number;
    requisition_date: string;
    status: string;
    requested_groupid: string;
    requisition: {
        requisition_name: string;
    };
    user: {
        title: string;
        firstName: string;
        lastName: string;
        department: string;
    };
}

function AdminsReports_requisition() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();

    const [logs, setLogs] = useState<LogItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);
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
        { key: "all", label: "ทั้งหมด" },
        { key: "Pending", label: "รอพิจารณา" },
        { key: "Approved", label: "อนุมัติ" },
        { key: "NotApproved", label: "ไม่อนุมัติ" },
    ];

    const getDepartmentLabel = (value: string) => {
        return departmentOptions.find((opt) => opt.value === value)?.label || "-";
    };

    const getStatusLabel = (key: string) => {
        return statusOptions.find((opt) => opt.key === key)?.label || "-";
    };

    const groupedLogs = logs.reduce((acc, log) => {
        const groupId = log.requested_groupid;
        if (!acc[groupId]) {
            acc[groupId] = [];
        }
        acc[groupId].push(log);
        return acc;
    }, {} as Record<string, LogItem[]>);

    const currentGroups = Object.entries(groupedLogs);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/report_requisition?page=${currentPage}&limit=${itemsPerPage}`);
                const json = await res.json();
                setLogs(json.items || []);
                setTotalPages(json.totalPages || 1);
                setTotalRecords(json.totalRecords || 0);
            } catch (err) {
                console.error("Failed to fetch requisition logs:", err);
                setLogs([]);
            }
        };
        fetchData();
    }, [currentPage]);

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

            // รวมรายการที่เบิก
            const itemMap = new Map<string, { requested: number; approved: number }>();
            groupLogs.forEach((log) => {
                const name = log.requisition.requisition_name;
                const requested = log.requested_quantity;
                const approved = log.approved_quantity ?? 0;

                if (!itemMap.has(name)) {
                    itemMap.set(name, { requested: 0, approved: 0 });
                }

                const current = itemMap.get(name)!;
                itemMap.set(name, {
                    requested: current.requested + requested,
                    approved: current.approved + approved,
                });
            });

            const requisitionText = Array.from(itemMap.entries())
                .map(
                    ([name, { requested, approved }]) =>
                        `${name} - ขอ ${requested} / อนุมัติ ${approved}`
                )
                .join("\n");

            return {
                ลำดับ: startIndex + index + 1,
                "ชื่อ - นามสกุล": [...new Set(groupLogs.map(
                    (log) => `${log.user.title}${log.user.firstName} ${log.user.lastName}`
                ))].join(", "),
                หน่วยงาน: getDepartmentLabel(firstLog.user.department),
                "รายการที่เบิก": requisitionText,
                "วันที่เบิก": new Date(firstLog.requisition_date).toLocaleDateString("th-TH"),
                สถานะ: getStatusLabel(firstLog.status),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `รายงานการขอเบิก.xlsx`);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-4 mt-4 lg:ml-52">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">รายงานการขอเบิก</h2>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                            >
                                Export
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full border text-sm">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className="border px-4 py-2">ลำดับ</th>
                                        <th className="border px-4 py-2">ชื่อ - นามสกุล</th>
                                        <th className="border px-4 py-2">หน่วยงาน</th>
                                        <th className="border px-4 py-2">รายการและจำนวนที่เบิก</th>
                                        <th className="border px-4 py-2">วันที่เบิก</th>
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
                                                        const itemMap = new Map<string, { requested: number; approved: number }>();
                                                        groupLogs.forEach((log) => {
                                                            const name = log.requisition.requisition_name;
                                                            const requested = log.requested_quantity;
                                                            const approved = log.approved_quantity ?? 0;
                                                            if (!itemMap.has(name)) {
                                                                itemMap.set(name, { requested: 0, approved: 0 });
                                                            }
                                                            const current = itemMap.get(name)!;
                                                            itemMap.set(name, {
                                                                requested: current.requested + requested,
                                                                approved: current.approved + approved,
                                                            });
                                                        });
                                                        return Array.from(itemMap.entries()).map(([name, { requested, approved }], idx) => (
                                                            <div key={idx}>
                                                                {name} - ขอ {requested} / อนุมัติ {approved}
                                                            </div>
                                                        ));
                                                    })()}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {new Date(firstLog.requisition_date).toLocaleDateString("th-TH")}
                                                </td>
                                                <td className="border px-4 py-2">{getStatusLabel(firstLog.status)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {currentGroups.length === 0 ? 0 : startIndex + 1} ถึง{" "}
                                {Math.min(startIndex + itemsPerPage, currentGroups.length)} จาก{" "}
                                {currentGroups.length} รายการ
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

export default AdminsReports_requisition;