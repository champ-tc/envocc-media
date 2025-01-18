"use client";

import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavbarUser";
import React, { useState, useEffect } from "react";


type BorrowLog = {
    id: number;
    borrow_groupid: string;
    status: string;
    createdAt: string;
};

type RequisitionLog = {
    id: number;
    requested_groupid: string;
    status: string;
    createdAt: string;
};

type BorrowLogGroup = {
    borrow_groupid: string;
    logs: {
        id: number;
        status: string;
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
        quantity?: number;
        requested_quantity?: number; // เพิ่ม property นี้
        requisition: {
            requisition_name: string;
        };
    }[];
};



function UsersStatus() {
    const { session, isLoading } = useAuthCheck("user");
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState("all");
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
                <div className="relative -mt-24 flex flex-col items-center">
                    <div className="flex-1 flex items-start justify-center p-2">
                        <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">ตรวจสอบสถานะ</h2>

                            <div className="mt-6">
                                <h2 className="text-lg font-semibold">รายการเบิก</h2>
                                {requisitionGroups.length > 0 ? (
                                    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                                        <thead>
                                            <tr className="bg-gray-200 text-gray-700 text-sm">
                                                <th className="border border-gray-300 px-4 py-2">ลำดับที่</th>
                                                <th className="border border-gray-300 px-4 py-2">สถานะ</th>
                                                <th className="border border-gray-300 px-4 py-2">จำนวนรายการ</th>
                                                <th className="border border-gray-300 px-4 py-2">ดูรายละเอียด</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {requisitionGroups.map((group, index) => (
                                                <tr key={group.requested_groupid}>
                                                    {/* ลำดับที่ */}
                                                    <td className="border border-gray-300 px-4 py-2">รายการที่ {index + 1}</td>

                                                    {/* สถานะ */}
                                                    <td className="border border-gray-300 px-4 py-2">
                                                        {group.logs.length > 0
                                                            ? statusMapping[group.logs[0].status] || group.logs[0].status
                                                            : "ไม่มีข้อมูล"}
                                                    </td>

                                                    {/* จำนวนรายการ */}
                                                    <td className="border border-gray-300 px-4 py-2">{group.logs.length}</td>

                                                    {/* ปุ่มดูรายละเอียด */}
                                                    <td className="border border-gray-300 px-4 py-2">
                                                        <button
                                                            className="bg-green-500 text-white px-4 py-2 rounded"
                                                            onClick={() => openModal(group)}
                                                        >
                                                            แสดงรายการ
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>


                                    </table>
                                ) : (
                                    <p>ไม่มีข้อมูลรายการเบิก</p>
                                )}
                            </div>

                            <div className="mt-6">
                                <h2 className="text-lg font-semibold">รายการยืม</h2>
                                {borrowGroups.length > 0 ? (
                                    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                                        <thead>
                                            <tr className="bg-gray-200 text-gray-700 text-sm">
                                                <th className="border border-gray-300 px-4 py-2">ลำดับที่</th>
                                                <th className="border border-gray-300 px-4 py-2">สถานะ</th>
                                                <th className="border border-gray-300 px-4 py-2">จำนวนรายการ</th>
                                                <th className="border border-gray-300 px-4 py-2">ดูรายละเอียด</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {borrowGroups.map((group, index) => (
                                                <tr key={group.borrow_groupid}>
                                                    <td className="border border-gray-300 px-4 py-2">รายการที่ {index + 1}</td>

                                                    {/* สถานะ */}
                                                    <td className="border border-gray-300 px-4 py-2">
                                                        {group.logs.length > 0
                                                            ? statusMapping[group.logs[0].status] || group.logs[0].status
                                                            : "ไม่มีข้อมูล"}
                                                    </td>

                                                    {/* จำนวนรายการ */}
                                                    <td className="border border-gray-300 px-4 py-2">{group.logs.length}</td>

                                                    {/* ปุ่มดูรายละเอียด */}
                                                    <td className="border border-gray-300 px-4 py-2">
                                                        <button
                                                            className="bg-blue-500 text-white px-4 py-2 rounded"
                                                            onClick={() => openModal(group)}
                                                        >
                                                            แสดงรายการ
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>


                                ) : (
                                    <p>ไม่มีข้อมูลรายการยืม</p>
                                )}
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
                                            จำนวนที่ขอ: {"quantity" in log ? log.quantity : "N/A"}
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