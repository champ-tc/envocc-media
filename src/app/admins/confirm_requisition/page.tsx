"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Group {
    requested_groupid: string;
    status: string;
    logs: Log[]; // ทำให้ logs ไม่เป็น optional หาก logs ต้องมีเสมอ
    user?: {
        title: string;
        firstName: string;
        lastName: string;
    };
}

interface Log {
    id: number; // รหัสคำขอ
    requisition: {
        requisition_name: string; // ชื่อสื่อ
    };
    requested_quantity: number; // จำนวนที่ขอ
    approved_quantity: number; // จำนวนที่อนุมัติ (ค่าเริ่มต้นเป็น 0)
}


interface ApprovedGroup extends Group {
    logs: Log[];
}


interface PendingGroup extends Group {
    logs: Log[];
}


function ConfirmRequisition() {
    const [statusFilter, setStatusFilter] = useState("");
    const [pendingModalOpen, setPendingModalOpen] = useState(false);
    const [approvedModalOpen, setApprovedModalOpen] = useState(false);
    const { data: session } = useSession();
    const [requisitionGroups, setRequisitionGroups] = useState<Group[]>([]);
    const [selectedApprovedGroup, setSelectedApprovedGroup] = useState<ApprovedGroup | null>(null);
    const [selectedPendingGroup, setSelectedPendingGroup] = useState<PendingGroup | null>(null);
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    useAuth("admin");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session && session.user?.role !== 'admin') {
            router.push("/admins/dashboard");
        }
    }, [status, session]);

    useEffect(() => {
        const fetchRequisitionLogs = async () => {
            try {
                const url = statusFilter
                    ? `/api/requisition_log?status=${statusFilter}`
                    : "/api/requisition_log";

                const response = await fetch(url);
                const data = await response.json();

                if (Array.isArray(data)) {
                    setRequisitionGroups(data);
                }
            } catch (error) {
                console.error("Error fetching requisition logs:", error);
            }
        };

        fetchRequisitionLogs();
    }, [statusFilter]);

    const totalPages = Math.ceil(requisitionGroups.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequisitions = requisitionGroups.slice(startIndex, endIndex);

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };


    const closeModal = () => {
        setSelectedPendingGroup(null);
        setPendingModalOpen(false);
        setSelectedApprovedGroup(null);
        setApprovedModalOpen(false);
    };

    const openModal = async (group: Group, type: "pending" | "approved") => {
        try {
            const response = await fetch(`/api/requisition_log?groupid=${group.requested_groupid}`);
            const data: Log[] = await response.json();

            const logs = data.map((log: Log) => ({
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

    const handleApprove = async () => {
        if (!selectedPendingGroup) {
            alert("ไม่พบคำขอที่เลือก");
            return;
        }

        if (!selectedPendingGroup.logs.every((log) => (log.approved_quantity ?? 0) >= 0)) {
            alert("กรุณากรอกจำนวนที่ให้เบิกให้ถูกต้อง (0 หรือมากกว่า)");
            return;
        }

        try {
            const token = session?.token;

            if (!token) {
                alert("Unauthorized: Missing token");
                return;
            }

            const response = await fetch("/api/requisition_log/approve", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    groupId: selectedPendingGroup.requested_groupid,
                    logs: selectedPendingGroup.logs,
                }),
            });

            if (response.ok) {
                alert("สำเร็จ!"); // เปลี่ยนข้อความแสดงผลเมื่อสำเร็จ
                closeModal();
                setRequisitionGroups((prevGroups) =>
                    prevGroups.map((group) =>
                        group.requested_groupid === selectedPendingGroup.requested_groupid
                            ? { ...group, status: "Approved" }
                            : group
                    )
                );
            } else {
                const errorData = await response.json();
                console.error("Failed to approve request:", errorData.error);
                alert("เกิดข้อผิดพลาดในการอนุมัติ!");
            }
        } catch (error) {
            console.error("Error approving request:", error);
            alert("ไม่สามารถอนุมัติคำขอได้ในขณะนี้!");
        }
    };


    const handleReject = async (group: Group) => {
        if (!group || !group.requested_groupid) {
            alert("ไม่สามารถดำเนินการได้: ไม่พบรหัสคำขอ");
            return;
        }

        const confirmAction = confirm("คุณต้องการแก้ไขรายการนี้หรือไม่?");
        if (!confirmAction) {
            return; // หากผู้ใช้กดยกเลิก จะไม่ทำอะไรต่อ
        }

        try {
            const response = await fetch("/api/requisition_log/notapproved", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: group.requested_groupid }),
            });

            if (response.ok) {
                alert("สำเร็จ! สถานะถูกแก้ไขเป็น 'ไม่อนุมัติ'"); // เปลี่ยนข้อความแสดงผลเมื่อสำเร็จ
                setRequisitionGroups((prevGroups) =>
                    prevGroups.map((g) =>
                        g.requested_groupid === group.requested_groupid
                            ? { ...g, status: "NotApproved" }
                            : g
                    )
                );

                // ปิด Modal ที่เกี่ยวข้อง
                if (pendingModalOpen) closeModal();
                if (approvedModalOpen) closeModal();
            } else {
                const errorData = await response.json();
                console.error("Failed to reject request:", errorData.error);
                alert(`เกิดข้อผิดพลาด: ${errorData.error || "ไม่สามารถเปลี่ยนสถานะได้"}`);
            }
        } catch (error) {
            console.error("Error rejecting request:", error);
            alert("ไม่สามารถแก้ไขสถานะได้ในขณะนี้! โปรดลองอีกครั้ง");
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1">
                <TopBar />
                <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                    <h1 className="text-2xl font-bold mb-6">อนุมัติเบิกสื่อ</h1>

                    <div className="mb-4 flex space-x-4">
                        {["", "Pending", "Approved", "NotApproved"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`py-2 px-4 rounded ${statusFilter === status ? "bg-blue-500 text-white" : "bg-gray-200"
                                    }`}
                            >
                                {statusMapping[status] || "ทั้งหมด"}
                            </button>
                        ))}
                    </div>

                    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="py-3 px-4 text-left">รหัสคำขอ</th>
                                <th className="py-3 px-4 text-left">ชื่อผู้ขอ</th>
                                <th className="py-3 px-4 text-left">สถานะ</th>
                                <th className="py-3 px-4 text-left">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requisitionGroups.map((group) => (
                                <tr key={group.requested_groupid} className="border-b">
                                    <td className="py-3 px-4">{group.requested_groupid}</td>
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
                                                className="px-4 py-2 rounded bg-blue-500 text-white"
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
                        </tbody>
                    </table>

                    <div className="flex items-center justify-between mt-6">
                        <span className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {Math.min(endIndex, requisitionGroups.length)} of{" "}
                            {requisitionGroups.length} entries
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-blue-400 hover:text-white transition disabled:opacity-50"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-4 py-2 rounded-md ${
                                        currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                                    } hover:bg-blue-400 hover:text-white transition`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-blue-400 hover:text-white transition disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {pendingModalOpen && selectedPendingGroup && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 text-center">รายละเอียดคำขอที่รอพิจารณา</h2>
                                <ul className="divide-y divide-gray-200">
                                    {selectedPendingGroup.logs.map((log, index) => (
                                        <li key={log.id} className="py-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-700">
                                                        ชื่อสื่อ: {log.requisition.requisition_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        จำนวนที่ขอ: {log.requested_quantity}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600">
                                                        จำนวนที่ให้เบิก:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={log.requested_quantity}
                                                        value={log.approved_quantity ?? 0} // ใช้ค่า 0 ถ้า approved_quantity เป็น null
                                                        onChange={(e) =>
                                                            handleQuantityChange(index, Number(e.target.value)) // แปลงค่าเป็น number
                                                        }
                                                        className="mt-1 block w-20 px-2 py-1 border rounded-md text-gray-700 text-sm"
                                                    />
                                                </div>
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
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold text-gray-700">
                                                            ชื่อสื่อ: {log.requisition.requisition_name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            จำนวนที่ขอ: {log.requested_quantity}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-700">
                                                            จำนวนที่ให้: {log.approved_quantity}
                                                        </p>
                                                    </div>
                                                </div>
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


                </div>
            </div>
        </div>
    );
}

export default ConfirmRequisition;