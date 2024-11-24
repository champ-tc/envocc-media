"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import useAuthCheck from "@/hooks/useAuthCheck";


interface BorrowGroup {
    borrow_groupid: string;
    status: string;
    logs: BorrowLog[]; // ต้องมีข้อมูล logs
    user?: {
        title: string;
        firstName: string;
        lastName: string;
    };
    actual_return_date?: string; // สำหรับวันที่คืน
}

interface BorrowLog {
    id: number;
    borrow: {
        borrow_name: string; // ชื่อของที่ยืม
    };
    quantity: number; // จำนวนที่ยืม
    returned_quantity: number; // จำนวนที่คืน
    approved_quantity?: number; // จำนวนที่อนุมัติ (ถ้ามี)
    status: string;
}


function AdminsConfirmBorrow() {
    const { session, isLoading } = useAuthCheck("admin");
    const [borrowGroups, setBorrowGroups] = useState<BorrowGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<BorrowGroup | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session) {
            const fetchBorrowLogs = async () => {
                try {
                    const url = statusFilter
                        ? `/api/borrow_log?status=${statusFilter}`
                        : '/api/borrow_log';
                    const response = await fetch(url);
                    const data = await response.json();

                    if (Array.isArray(data)) {
                        setBorrowGroups(data); // เก็บข้อมูลใน state
                    }
                } catch (error) {
                    console.error('Error fetching borrow logs:', error);
                }
            };

            fetchBorrowLogs();
        }
    }, [session, statusFilter]);






    // Open modal with group details
    const openModal = async (group: BorrowGroup) => {
        try {
            const response = await fetch(`/api/borrow_log?groupid=${group.borrow_groupid}`);
            const data = await response.json();

            setSelectedGroup({ ...group, logs: data });
            setModalOpen(true);
        } catch (error) {
            console.error("Error fetching group details:", error);
        }
    };


    // Close modal
    const closeModal = () => {
        setSelectedGroup(null);
        setModalOpen(false);
    };

    // Pagination logic
    const totalPages = Math.ceil(borrowGroups.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBorrows = borrowGroups.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleQuantityChange = (index: number, value: number) => {
        setSelectedGroup((prevGroup) => {
            if (!prevGroup) return null; // If no group, return null
            const updatedLogs = [...prevGroup.logs];
            updatedLogs[index].approved_quantity = Math.min(value || 0, updatedLogs[index].quantity); // Ensure value does not exceed requested quantity
            return { ...prevGroup, logs: updatedLogs };
        });
    };

    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedReturnGroup, setSelectedReturnGroup] = useState<BorrowGroup | null>(null);

    // เปิด Modal คืนของ
    const openReturnModal = async (group: BorrowGroup) => {
        try {
            const response = await fetch(`/api/borrow_log?groupid=${group.borrow_groupid}`);
            const data = await response.json();

            setSelectedReturnGroup({ ...group, logs: data });
            setReturnModalOpen(true);
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    };

    const openDetailModal = async (group: BorrowGroup) => {
        try {
            const response = await fetch(`/api/borrow_log?groupid=${group.borrow_groupid}`);
            const data = await response.json();

            if (Array.isArray(data)) {
                setSelectedReturnGroup({ ...group, logs: data });
                setDetailModalOpen(true);
            } else {
                alert('ไม่พบข้อมูล logs สำหรับคำขอนี้');
            }
        } catch (error) {
            console.error('Error fetching detail logs:', error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล logs');
        }
    };



    // ปิด Modal ทั้งสอง
    const closeReturnModal = () => {
        setSelectedReturnGroup(null);
        setReturnModalOpen(false);
    };

    const closeDetailModal = () => {
        setSelectedReturnGroup(null);
        setDetailModalOpen(false);
    };

    useEffect(() => {
        if (session && statusFilter) {
            fetchBorrowLogs();
        }
    }, [session, statusFilter]);


    const fetchBorrowLogs = async () => {
        try {
            if (!statusFilter) return; // หากยังไม่ได้เลือกสถานะ ข้ามไปเลย
            const url =
                statusFilter === "all"
                    ? "/api/borrow_log"
                    : `/api/borrow_log?status=${statusFilter}`;
            const response = await fetch(url);
            const data = await response.json();
    
            if (Array.isArray(data)) {
                setBorrowGroups(data); // เก็บข้อมูลใน state
            }
        } catch (error) {
            console.error("Error fetching borrow logs:", error);
        }
    };
    


    const handleApprove = async () => {
        if (!selectedGroup) {
            alert("ไม่พบคำขอที่เลือก");
            return;
        }

        try {
            const response = await fetch("/api/borrow_log/approve", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    groupId: selectedGroup.borrow_groupid,
                    logs: selectedGroup.logs.map((log) => ({
                        id: log.id,
                        approved_quantity: log.approved_quantity ?? log.quantity,
                    })),
                }),
            });

            if (response.ok) {
                alert("อนุมัติสำเร็จ!");
                closeModal();
                await fetchBorrowLogs();
            } else {
                alert("เกิดข้อผิดพลาดในการอนุมัติ");
            }
        } catch (error) {
            console.error("Error approving borrow logs:", error);
            alert("ไม่สามารถอนุมัติคำขอได้ในขณะนี้!");
        }
    };



    const handleReject = async () => {
        if (!selectedGroup) return;

        try {
            const response = await fetch("/api/borrow_log/reject", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId: selectedGroup.borrow_groupid }),
            });

            if (response.ok) {
                alert("ปฏิเสธคำขอสำเร็จ!");
                closeModal();
                await fetchBorrowLogs();
            } else {
                alert("เกิดข้อผิดพลาดในการปฏิเสธคำขอ");
            }
        } catch (error) {
            console.error("Error rejecting borrow:", error);
            alert("ไม่สามารถปฏิเสธคำขอได้ในขณะนี้");
        }
    };


    const handleReturn = async () => {
        if (!selectedReturnGroup?.actual_return_date) {
            alert("กรุณาเลือกวันที่คืน");
            return;
        }

        // ตัดเวลาออก ให้เหลือเฉพาะวันที่
        const date = new Date(selectedReturnGroup.actual_return_date);
        const formattedDate = date.toISOString().split("T")[0]; // ตัดเวลา เหลือเฉพาะวันที่ (YYYY-MM-DD)

        const isValid = selectedReturnGroup.logs.every(
            (log) =>
                log.returned_quantity !== undefined &&
                log.returned_quantity <= log.quantity
        );

        if (!isValid) {
            alert("กรุณาระบุจำนวนที่คืนให้ถูกต้องในทุกรายการ");
            return;
        }

        try {
            // ส่งข้อมูลไปยัง API
            const response = await fetch("/api/borrow_log/return", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    borrow_groupid: selectedReturnGroup.borrow_groupid,
                    actual_return_date: formattedDate, // ส่งเฉพาะวันที่
                    logs: selectedReturnGroup.logs.map((log) => ({
                        id: log.id,
                        returned_quantity: log.returned_quantity,
                    })),
                }),
            });

            if (response.ok) {
                alert("บันทึกข้อมูลการคืนสำเร็จ");
                closeReturnModal();
                await fetchBorrowLogs();
            } else {
                alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        } catch (error) {
            console.error("Error saving return data:", error);
            alert("ไม่สามารถบันทึกข้อมูลการคืนได้");
        }
    };



    // Helper function to map statuses
    const mapStatus = (status: string): string => {
        switch (status) {
            case "Pending":
                return "รอพิจารณา";
            case "Approved":
                return "รอรับคืน";
            case "ApprovedReturned":
                return "อนุมัติ";
            case "NotApproved":
                return "ไม่อนุมัติ";
            default:
                return "สถานะไม่ทราบ"; // กรณีสถานะที่ไม่รู้จัก
        }
    };


    // Avoid conditional rendering that causes hooks mismatch
    if (isLoading) return <p>Loading...</p>;
    if (!session) return <p>Unauthorized</p>;

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1">
                <TopBar />
                <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                    <h1 className="text-2xl font-bold mb-6">ยืนยันการยืม-คืน</h1>

                    {successMessage && (
                        <div className="bg-green-50 text-green-500 p-6 mb-10 text-sm rounded-2xl" role="alert">
                            <span>&#10004; </span>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-500 p-6 mb-10 text-sm rounded-2xl" role="alert">
                            <span>&#10006; </span>
                            <span>{error}</span>
                        </div>
                    )}

<div className="mb-4 flex space-x-4">
    {[
        { key: "all", label: "ทั้งหมด" },
        { key: "Pending", label: "รอพิจารณา" },
        { key: "Approved", label: "รับคืน" },
        { key: "ApprovedReturned", label: "อนุมัติ" },
        { key: "NotApproved", label: "ไม่อนุมัติ" },
    ].map(({ key, label }) => (
        <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`py-2 px-4 rounded ${statusFilter === key ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
            {label}
        </button>
    ))}
</div>

{!statusFilter ? (
    <p className="text-center text-gray-500">กรุณาเลือกสถานะเพื่อตรวจสอบข้อมูล</p>
) : (
    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
        {/* เนื้อหาตาราง */}
    </table>
)}



                    {!statusFilter ? (
                        <p className="text-center text-gray-500">กรุณาเลือกสถานะเพื่อตรวจสอบข้อมูล</p>
                    ) : (

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
                                {currentBorrows.length > 0 ? (
                                    currentBorrows.map((group) => {
                                        return (
                                            <tr key={group.borrow_groupid} className="border-b">
                                                <td className="py-3 px-4">{group.borrow_groupid}</td>
                                                <td className="py-3 px-4">
                                                    {group.user
                                                        ? `${group.user.title}${group.user.firstName} ${group.user.lastName}`
                                                        : "ไม่ระบุข้อมูลผู้ใช้"}
                                                </td>
                                                <td className="py-3 px-4">{mapStatus(group.status)}</td>
                                                <td className="py-3 px-4">
                                                    {group.status === "Pending" ? (
                                                        <button
                                                            onClick={() => openModal(group)}
                                                            className="px-4 py-2 rounded bg-blue-500 text-white"
                                                        >
                                                            ดูคำขอ
                                                        </button>
                                                    ) : group.status === "Approved" ? (
                                                        // แสดงปุ่ม "คืนของ" ถ้าไม่มีวันที่คืน
                                                        <button
                                                            onClick={() => openReturnModal(group)}
                                                            className="px-4 py-2 rounded bg-green-500 text-white"
                                                        >
                                                            คืนของ
                                                        </button>
                                                    ) : group.status === "ApprovedReturned" ? (
                                                        // แสดงปุ่ม "ดูรายละเอียด" ถ้ามีวันที่คืน
                                                        <button
                                                            onClick={() => openDetailModal(group)}
                                                            className="px-4 py-2 rounded bg-blue-500 text-white"
                                                        >
                                                            ดูรายละเอียด
                                                        </button>
                                                    ) : null}
                                                </td>

                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                                            ไม่มีข้อมูลคำขอยืม
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    )}

                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded bg-gray-200 text-gray-600"
                        >
                            Previous
                        </button>
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded bg-gray-200 text-gray-600"
                        >
                            Next
                        </button>
                    </div>

                    {modalOpen && selectedGroup && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 text-center">รายละเอียดคำขอ</h2>
                                <ul className="divide-y divide-gray-200">
                                    {selectedGroup.logs.map((log, index) => (
                                        <li key={log.id} className="py-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">
                                                        ชื่อ: {log.borrow.borrow_name} (จำนวนที่ขอ:{" "}
                                                        {log.quantity})
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        คืนแล้ว: {log.returned_quantity ?? "ยังไม่ได้คืน"}
                                                    </p>
                                                </div>
                                                <div className="ml-4">
                                                    <label className="block text-sm font-medium text-gray-600">
                                                        จำนวนที่อนุมัติ:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={log.quantity}
                                                        value={log.approved_quantity ?? log.quantity} // Default to requested quantity
                                                        onChange={(e) =>
                                                            handleQuantityChange(index, Number(e.target.value))
                                                        }
                                                        className="mt-1 block w-24 px-2 py-1 border rounded-md text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 flex justify-between items-center space-x-4">
                                    <button
                                        onClick={handleApprove}
                                        className="bg-green-500 text-white py-2 px-4 rounded"
                                    >
                                        อนุมัติ
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        className="bg-red-500 text-white py-2 px-4 rounded"
                                    >
                                        ปฏิเสธ
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="bg-gray-300 text-black py-2 px-4 rounded"
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    {returnModalOpen && selectedReturnGroup && (
                        <>
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                                    <h2 className="text-2xl font-bold mb-4 text-center">คืนของ</h2>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-600">วันที่คืน:</label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full px-2 py-1 border rounded-md text-sm"
                                            onChange={(e) =>
                                                setSelectedReturnGroup((prev) =>
                                                    prev ? { ...prev, actual_return_date: e.target.value } : null
                                                )
                                            }
                                        />
                                    </div>

                                    <ul className="divide-y divide-gray-200">
                                        {selectedReturnGroup.logs?.length > 0 ? (
                                            selectedReturnGroup.logs.map((log, index) => (
                                                <li key={log.id} className="py-4">
                                                    <div className="flex flex-col space-y-2">
                                                        <p className="font-semibold text-gray-700">
                                                            ชื่อ: {log.borrow.borrow_name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            จำนวนที่ให้ยืม: {log.quantity}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <label className="block text-sm font-medium text-gray-600">
                                                                จำนวนที่คืน:
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={log.quantity}
                                                                value={log.returned_quantity || ""}
                                                                placeholder="กรอกจำนวนที่คืน"
                                                                onChange={(e) =>
                                                                    setSelectedReturnGroup((prev) => {
                                                                        if (!prev) return null;
                                                                        const updatedLogs = [...prev.logs];
                                                                        updatedLogs[index].returned_quantity = Number(e.target.value);
                                                                        return { ...prev, logs: updatedLogs };
                                                                    })
                                                                }
                                                                className="block w-24 px-2 py-1 border rounded-md text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-gray-600 text-sm text-center">ไม่มีข้อมูลรายการที่ยืม</p>
                                        )}
                                    </ul>

                                    <div className="mt-6 flex justify-end items-center space-x-4">
                                        {/* ปุ่มบันทึก */}
                                        <button
                                            onClick={handleReturn}
                                            className="bg-green-500 text-white py-2 px-4 rounded"
                                        >
                                            บันทึก
                                        </button>

                                        {/* ปุ่มปิด */}
                                        <button
                                            onClick={closeReturnModal}
                                            className="bg-gray-300 text-black py-2 px-4 rounded"
                                        >
                                            ปิด
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}



                    {detailModalOpen && selectedReturnGroup && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 text-center">รายละเอียดการคืนของ</h2>
                                <ul className="divide-y divide-gray-200">
                                    {selectedReturnGroup.logs && selectedReturnGroup.logs.length > 0 ? (
                                        selectedReturnGroup.logs.map((log) => (
                                            <li key={log.id} className="py-4">
                                                <p className="font-semibold">ชื่อ: {log.borrow.borrow_name}</p>
                                                <p className="text-sm text-gray-600">
                                                    จำนวนที่คืน: {log.approved_quantity !== null && log.approved_quantity !== undefined ? log.approved_quantity : "ยังไม่ได้คืน"}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    วันที่คืน: {selectedReturnGroup.actual_return_date ? new Date(selectedReturnGroup.actual_return_date).toLocaleDateString() : "ยังไม่มี"}
                                                </p>

                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-gray-600 text-center">ไม่มีข้อมูลการคืนของ</p>
                                    )}
                                </ul>
                                <div className="mt-6 flex justify-end items-center space-x-4">
                                    <button
                                        onClick={closeDetailModal}
                                        className="bg-gray-300 text-black py-2 px-4 rounded"
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

export default AdminsConfirmBorrow;
