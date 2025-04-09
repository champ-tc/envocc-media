"use client";

import useAuthCheck from "@/hooks/useAuthCheck";
import Navbar from "@/components/NavbarUser";
import React, { useState, useEffect } from "react";



type BorrowLogGroup = {
    borrow_groupid: string;
    logs: {
        id: number;
        status: string;
        createdAt: string; // ✅ เพิ่มตรงนี้
        quantity?: number;
        borrow: {
            borrow_name: string;
        };
    }[];
};

type RequisitionLogGroup = {
    requested_groupid: string;
    logs: {
        id: number;
        status: string;
        createdAt: string; // ✅ เพิ่มตรงนี้
        quantity?: number;
        requested_quantity?: number;
        requisition: {
            requisition_name: string;
        };
    }[];
};



function UsersStatus() {
    const { session, isLoading } = useAuthCheck("user");
    const [statusFilter] = useState<string>("all");
    const [borrowGroups, setBorrowGroups] = useState<BorrowLogGroup[]>([]);
    const [requisitionGroups, setRequisitionGroups] = useState<RequisitionLogGroup[]>([]);

    const [selectedGroup, setSelectedGroup] = useState<BorrowLogGroup | RequisitionLogGroup | null>(null);
    const [modalOpen, setModalOpen] = useState(false);



    useEffect(() => {
        const fetchLogs = async () => {
            try {
                if (!session || !session.user || !statusFilter) return;

                const url = `/api/status/${session.user.id}${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`;
                const response = await fetch(url);
                const data = await response.json();

                if (!response.ok) {
                    console.error("Error fetching logs:", data);
                    return;
                }

                console.log("Borrow Groups:", data.borrowLogs);
                console.log("Requisition Groups:", data.requisitionLogs);

                setBorrowGroups(data.borrowLogs); // อัปเดต borrowLogs
                setRequisitionGroups(data.requisitionLogs); // อัปเดต requisitionLogs
            } catch (error) {
                console.error("Error in fetchLogs:", error);
            }
        };

        fetchLogs();
    }, [session, statusFilter]);



    const statusMapping: Record<string, string> = {
        Pending: "รอพิจารณา",
        Approved: "อนุมัติ",
        NotApproved: "ไม่อนุมัติ",
        ApprovedReturned: "คืนแล้ว", // ✅ เพิ่มตรงนี้
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    const openModal = (group: BorrowLogGroup | RequisitionLogGroup) => {
        setSelectedGroup(group); // เก็บข้อมูล group ที่เลือก
        setModalOpen(true); // เปิด Modal
    };


    const closeModal = () => {
        setSelectedGroup(null); // ล้างข้อมูล groupid ที่เลือก
        setModalOpen(false); // ปิด Modal
    };


    return (
        <>
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="relative flex flex-col items-center">
                    <div className="flex-1 flex items-start justify-center p-2">
                        <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">ตรวจสอบสถานะ 10 อันดับ ล่าสุด</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                {/* ตารางรายการเบิก */}
                                <div>
                                    <h2 className="text-lg font-semibold mb-2">รายการเบิก</h2>
                                    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                                        <thead>
                                            <tr className="bg-[#fb8124] text-white text-sm">
                                                <th className="border px-3 py-2">ลำดับ</th>
                                                <th className="border px-3 py-2">สถานะ</th>
                                                <th className="border px-3 py-2">จำนวน</th>
                                                <th className="border px-3 py-2">วันที่</th> {/* ✅ เพิ่ม */}
                                                <th className="border px-3 py-2">ดู</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {requisitionGroups.slice(0, 10).map((group, index) => (
                                                <tr key={group.requested_groupid}>
                                                    <td className="border px-3 py-2">รายการที่ {index + 1}</td>
                                                    <td className="border px-3 py-2">
                                                        {group.logs[0]?.status ? statusMapping[group.logs[0].status] || group.logs[0].status : "ไม่มีข้อมูล"}
                                                    </td>
                                                    <td className="border px-3 py-2">{group.logs.length}</td>
                                                    <td className="border px-3 py-2">
                                                        {group.logs[0]?.createdAt
                                                            ? new Date(group.logs[0].createdAt).toLocaleDateString("th-TH", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            })
                                                            : "-"}
                                                    </td>

                                                    <td className="border px-3 py-2">
                                                        <button
                                                            className="bg-[#fb8124] text-white px-3 py-1 rounded text-sm"
                                                            onClick={() => openModal(group)}
                                                        >
                                                            ดู
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ตารางรายการยืม */}
                                <div>
                                    <h2 className="text-lg font-semibold mb-2">รายการยืม</h2>
                                    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                                        <thead>
                                            <tr className="bg-[#9063d2] text-white text-sm">
                                                <th className="border px-3 py-2">ลำดับ</th>
                                                <th className="border px-3 py-2">สถานะ</th>
                                                <th className="border px-3 py-2">จำนวน</th>
                                                <th className="border px-3 py-2">วันที่</th> {/* ✅ เพิ่ม */}
                                                <th className="border px-3 py-2">ดู</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {borrowGroups.slice(0, 10).map((group, index) => (
                                                <tr key={group.borrow_groupid}>
                                                    <td className="border px-3 py-2">รายการที่ {index + 1}</td>
                                                    <td className="border px-3 py-2">
                                                        {group.logs[0]?.status ? statusMapping[group.logs[0].status] || group.logs[0].status : "ไม่มีข้อมูล"}
                                                    </td>
                                                    <td className="border px-3 py-2">{group.logs.length}</td>
                                                    <td className="border px-3 py-2">
                                                        {group.logs[0]?.createdAt
                                                            ? new Date(group.logs[0].createdAt).toLocaleDateString("th-TH", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            })
                                                            : "-"}
                                                    </td>

                                                    <td className="border px-3 py-2">
                                                        <button
                                                            className="bg-[#9063d2] text-white px-3 py-1 rounded text-sm"
                                                            onClick={() => openModal(group)}
                                                        >
                                                            ดู
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>





                        </div>
                    </div>
                </div>

                {modalOpen && selectedGroup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                            <h2 className="text-2xl font-bold mb-4 text-center">
                                รายละเอียด {selectedGroup && ('borrow_groupid' in selectedGroup ? "การยืม" : "การเบิก")}
                            </h2>

                            <ul className="divide-y divide-gray-200">
                                {selectedGroup.logs.map((log) => (
                                    <li key={log.id} className="py-4">
                                        <p className="font-semibold text-gray-700">
                                            ชื่อ: {"borrow" in log ? log.borrow.borrow_name : log.requisition.requisition_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            จำนวนที่ขอ: {"quantity" in log && log.quantity !== undefined
                                                ? log.quantity
                                                : "requested_quantity" in log && log.requested_quantity !== undefined
                                                    ? log.requested_quantity
                                                    : "N/A"}
                                        </p>

                                        <p className="text-sm text-gray-600">
                                            สถานะ: {statusMapping[log.status]}
                                        </p>
                                    </li>
                                ))}
                            </ul>


                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={closeModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded-lg font-semibold"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default UsersStatus;