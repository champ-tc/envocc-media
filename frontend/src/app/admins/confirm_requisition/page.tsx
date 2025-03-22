"use client";

import React, { useState, useEffect } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from "axios";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";

interface Group {
    requested_groupid: string;
    status: string;
    logs: Log[];
    user?: {
        title: string;
        firstName: string;
        lastName: string;
    };
    reason?: {
        id: number;
        reason_name: string;
    };
    customUsageReason?: string;
}


interface Log {
    id: number;
    requisition: {
        requisition_name: string;
    };
    requested_quantity: number;
    approved_quantity: number;
    reason?: {
        reason_name: string;
    };
    customUsageReason?: string;
}



interface ApprovedGroup extends Group {
    logs: Log[];
}


interface PendingGroup extends Group {
    logs: Log[];
}


function ConfirmRequisition() {

    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();


    const [statusFilter, setStatusFilter] = useState("");
    const [selectedApprovedGroup, setSelectedApprovedGroup] = useState<ApprovedGroup | null>(null);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);
    const [pendingModalOpen, setPendingModalOpen] = useState(false);
    const [approvedModalOpen, setApprovedModalOpen] = useState(false);
    const [requisitionGroups, setRequisitionGroups] = useState<Group[]>([]);
    const [selectedPendingGroup, setSelectedPendingGroup] = useState<PendingGroup | null>(null);


    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchRequisitionLogs = async () => {
            try {
                if (!statusFilter) return;

                const url = statusFilter === "all"
                    ? `/api/requisition_log?page=${currentPage}&limit=${itemsPerPage}`
                    : `/api/requisition_log?page=${currentPage}&limit=${itemsPerPage}&status=${statusFilter}`;

                const response = await axios.get(url);

                if (response.status === 200 && response.data.items) {
                    setRequisitionGroups(response.data.items);
                    setTotalPages(response.data.totalPages);
                }
            } catch (error) {
                console.error("Error fetching requisition logs:", error);
            }
        };

        fetchRequisitionLogs();
    }, [statusFilter, currentPage]);





    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    const closeModal = () => {
        setSelectedPendingGroup(null);
        setPendingModalOpen(false);
        setSelectedApprovedGroup(null);
        setApprovedModalOpen(false);
    };


    const openModal = async (group: Group, type: "pending" | "approved") => {
        try {
            const response = await fetch(`/api/requisition_log?groupid=${group.requested_groupid}`);
            const data = await response.json();

            if (!Array.isArray(data.items)) {
                console.error("Unexpected response format:", data);
                return;
            }

            const logs = data.items.map((log: Log) => ({
                ...log,
                approved_quantity: log.approved_quantity ?? 0,
            }));

            if (type === "pending") {
                setSelectedPendingGroup({ ...group, logs });
                setPendingModalOpen(true);
            } else {
                setSelectedApprovedGroup({ ...group, logs });
                setApprovedModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching group details:", error);
        }
    };



    const statusMapping: Record<string, string> = {
        Pending: "รอพิจารณา",
        Approved: "อนุมัติ",
        NotApproved: "ไม่อนุมัติ",
    };

    const handleQuantityChange = (index: number, value: number) => {
        if (!selectedPendingGroup) return; // ตรวจสอบว่า selectedPendingGroup ไม่เป็น null
        setSelectedPendingGroup((prevGroup) => {
            if (!prevGroup) return null; // ป้องกัน prevGroup เป็น null
            const updatedLogs = [...prevGroup.logs];
            updatedLogs[index].approved_quantity = Math.min(value || 0, updatedLogs[index].requested_quantity);
            return { ...prevGroup, logs: updatedLogs };
        });
    };


    const handleReject = async (group: Group) => {
        if (!group || !group.requested_groupid) {
            setAlertMessage("ไม่สามารถดำเนินการได้: ไม่พบรหัสคำขอ");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

        setGroupToEdit(group);
        setIsEditConfirmOpen(true);
    };

    const handleEditConfirm = async () => {
        if (!groupToEdit) return;

        setIsEditConfirmOpen(false);

        try {
            const response = await axios.post("/api/requisition_log/notapproved", {
                id: groupToEdit.requested_groupid,
            });

            if (response.status === 200) {
                setAlertMessage("สำเร็จ");
                setAlertType("success");
                setRequisitionGroups((prevGroups) =>
                    prevGroups.map((g) =>
                        g.requested_groupid === groupToEdit.requested_groupid
                            ? { ...g, status: "NotApproved" }
                            : g
                    )
                );

                if (pendingModalOpen) closeModal();
                if (approvedModalOpen) closeModal();
            } else {
                setAlertMessage(`เกิดข้อผิดพลาด: ไม่สามารถเปลี่ยนสถานะได้`);
                setAlertType("error");
            }
        } catch (error) {
            setAlertMessage("ไม่สามารถแก้ไขสถานะได้ในขณะนี้! โปรดลองอีกครั้ง");
            setAlertType("error");
        } finally {
            setGroupToEdit(null);
            autoCloseAlert();
        }
    };

    const handleApprove = async () => {
        if (!selectedPendingGroup) {
            setAlertMessage("ไม่พบคำขอที่เลือก");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

        // ตรวจสอบว่าจำนวนที่อนุมัติทั้งหมดต้องไม่น้อยกว่า 1
        const totalApprovedQuantity = selectedPendingGroup.logs.reduce((sum, log) => sum + (log.approved_quantity || 0), 0);
        if (totalApprovedQuantity < 1) {
            setAlertMessage("จำนวนที่อนุมัติต้องไม่น้อยกว่า 1");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

        try {
            const response = await axios.put("/api/requisition_log/approve", {
                groupId: selectedPendingGroup.requested_groupid,
                logs: selectedPendingGroup.logs,
            });

            if (response.status === 200) {
                setAlertMessage("สำเร็จ! คำขอได้รับการอนุมัติ");
                setAlertType("success");
                setRequisitionGroups((prevGroups) =>
                    prevGroups.map((group) =>
                        group.requested_groupid === selectedPendingGroup.requested_groupid
                            ? { ...group, status: "Approved" }
                            : group
                    )
                );
                closeModal();
            } else {
                console.warn("Unexpected response:", response);
                setAlertMessage("เกิดข้อผิดพลาดในการอนุมัติคำขอ");
                setAlertType("error");
            }
        } catch (error) {
            console.error("Error approving request:", error);
            setAlertMessage("ไม่สามารถอนุมัติคำขอได้ในขณะนี้");
            setAlertType("error");
        } finally {
            autoCloseAlert();
        }
    };


    const autoCloseAlert = () => {
        setTimeout(() => {
            setAlertMessage(null);
            setAlertType(null);
        }, 3000);
    };


    const startIndex = (currentPage - 1) * itemsPerPage;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1">
                <TopBar />

                <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                    <h1 className="text-2xl font-bold mb-6">อนุมัติเบิกสื่อ</h1>

                    <div className="mb-4 flex space-x-4">
                        {[
                            { key: "all", label: "ทั้งหมด" },
                            { key: "Pending", label: "รอพิจารณา" },
                            { key: "Approved", label: "อนุมัติ" },
                            { key: "NotApproved", label: "ไม่อนุมัติ" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(key)}
                                className={`py-2 px-4 rounded ${statusFilter === key ? "bg-[#fb8124] text-white" : "bg-gray-200"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {!statusFilter ? (
                        <p className="text-center text-gray-500">กรุณาเลือกสถานะเพื่อตรวจสอบข้อมูล</p>
                    ) : (
                        <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-gray-200 text-gray-700">
                                    <th className="py-3 px-4 text-left">ลำดับ</th>
                                    <th className="py-3 px-4 text-left">ชื่อผู้ขอ</th>
                                    <th className="py-3 px-4 text-left">สถานะ</th>
                                    <th className="py-3 px-4 text-left">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(statusFilter === "all"
                                    ? requisitionGroups.slice(startIndex, startIndex + 10) // แสดงข้อมูลทีละ 10 แถว
                                    : requisitionGroups
                                        .filter((group) => group.status === statusFilter)
                                        .slice(startIndex, startIndex + 10) // แสดงข้อมูลทีละ 10 แถวสำหรับสถานะที่เลือก
                                ).map((group, index) => (
                                    <tr key={group.requested_groupid} className="border-b text-sm">
                                        <td className="py-3 px-4">คำขอที่ {startIndex + index + 1}</td>
                                        <td className="py-3 px-4">
                                            {group.user
                                                ? `${group.user.title}${group.user.firstName} ${group.user.lastName}`
                                                : "ไม่ระบุข้อมูลผู้ใช้"}
                                        </td>
                                        <td className="py-3 px-4">{statusMapping[group.status]}</td>
                                        <td className="py-3 px-4">
                                            {group.status === "Pending" && (
                                                <button
                                                    onClick={() => openModal(group, "pending")}
                                                    className="px-4 py-2 rounded bg-[#fb8124] text-white"
                                                >
                                                    ดูคำขอ
                                                </button>
                                            )}
                                            {group.status === "Approved" && (
                                                <button
                                                    onClick={() => openModal(group, "approved")}
                                                    className="px-4 py-2 rounded bg-green-500 text-white"
                                                >
                                                    รายละเอียด
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(statusFilter === "all" && requisitionGroups.length === 0) ||
                                    (statusFilter !== "all" &&
                                        requisitionGroups.filter((group) => group.status === statusFilter).length === 0) ? (
                                    <tr>
                                        <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                                            ไม่มีข้อมูลคำขอในสถานะนี้
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    )}

                    {statusFilter && (
                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {startIndex + 1} ถึง {Math.min(startIndex + 10, requisitionGroups.length)} จาก {" "}
                                {requisitionGroups.length} รายการ
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
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#fb8124] text-white" : "bg-gray-200 text-gray-600"
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
                    )}
                </div>

                {pendingModalOpen && selectedPendingGroup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                            <h2 className="text-2xl font-bold mb-2 text-center">รายละเอียดคำขอที่รอพิจารณา</h2>

                            {selectedPendingGroup.logs.length > 0 && (
                                <p className="text-sm text-gray-600">
                                    เหตุผลการใช้งาน:{" "}
                                    {selectedPendingGroup.logs[0].reason?.reason_name ||
                                        selectedPendingGroup.logs[0].customUsageReason ||
                                        "ไม่ระบุ"}
                                </p>
                            )}



                            <ul className="divide-y divide-gray-200">
                                {selectedPendingGroup.logs.map((log, index) => (
                                    <li key={log.id} className="py-4">
                                        <p className="font-semibold text-gray-700">
                                            ชื่อสื่อ: {log.requisition.requisition_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            จำนวนที่ขอ: {log.requested_quantity}
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-600">
                                                จำนวนที่ให้เบิก:
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={log.requested_quantity}
                                                value={log.approved_quantity ?? 0}
                                                onChange={(e) =>
                                                    handleQuantityChange(index, Number(e.target.value))
                                                }
                                                className="block w-20 px-2 py-1 border rounded-md text-gray-700 text-sm"
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6 flex justify-between items-center space-x-4">
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold"
                                >
                                    อนุมัติ
                                </button>
                                <button
                                    onClick={() => handleReject(selectedPendingGroup)}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold"
                                >
                                    ไม่อนุมัติ
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded-lg font-semibold"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {approvedModalOpen && selectedApprovedGroup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                            <h2 className="text-2xl font-bold mb-4 text-center">รายละเอียดคำขอที่อนุมัติแล้ว</h2>

                            {selectedApprovedGroup.logs?.length ? (
                                <ul className="divide-y divide-gray-200">
                                    {selectedApprovedGroup.logs.map((log) => (
                                        <li key={log.id} className="py-4">
                                            <p className="font-semibold text-gray-700">
                                                ชื่อสื่อ: {log.requisition.requisition_name}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                จำนวนที่ขอ: {log.requested_quantity}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                จำนวนที่ให้: {log.approved_quantity}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600 text-center">ไม่มีข้อมูลสำหรับคำขอที่อนุมัติ</p>
                            )}

                            <div className="mt-6 flex justify-center">
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

                {isEditConfirmOpen && (
                    <ConfirmEditModal
                        isOpen={isEditConfirmOpen}
                        onClose={() => setIsEditConfirmOpen(false)}
                        onConfirm={handleEditConfirm}
                        title="ไม่อนุมัติรายการนี้หรือไม่?"
                        iconSrc="/images/alert.png"
                    />
                )}

                {alertMessage && (
                    <AlertModal
                        isOpen={!!alertMessage}
                        message={alertMessage}
                        type={alertType ?? 'error'}
                        iconSrc={alertType === 'success' ? '/images/check.png' : '/images/close.png'}
                    />
                )}

            </div>
        </div>
    );
}

export default ConfirmRequisition;