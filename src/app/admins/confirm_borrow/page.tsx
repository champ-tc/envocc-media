"use client";

import React, { useState, useEffect } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from "axios";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";
import dynamic from "next/dynamic";
import { registerLocale } from "react-datepicker";
import { th } from "date-fns/locale/th";
import "react-datepicker/dist/react-datepicker.css";
import type { ReactDatePickerCustomHeaderProps } from "react-datepicker";

registerLocale("th", th);


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

interface CustomInputProps {
    value?: string;
    onClick?: () => void;
    id: string;
    name: string;
}


function AdminsConfirmBorrow() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();
    const [returnDate, setReturnDate] = useState("");

    const [statusFilter, setStatusFilter] = useState("");
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);

    const [borrowGroups, setBorrowGroups] = useState<BorrowGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<BorrowGroup | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination logic
    const itemsPerPage = 10;
    const totalPages = Math.ceil(borrowGroups.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBorrows = borrowGroups.slice(startIndex, endIndex);

    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedReturnGroup, setSelectedReturnGroup] = useState<BorrowGroup | null>(null);

    useEffect(() => {
        const fetchBorrowLogs = async () => {
            try {
                if (!session || !statusFilter) return; // ย้ายเงื่อนไขการตรวจสอบเข้ามาในฟังก์ชัน
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

        fetchBorrowLogs();
    }, [session, statusFilter]);

    useEffect(() => {
        if (session && statusFilter) {
            fetchBorrowLogs();
        }
    }, [session, statusFilter]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }



    const DynamicDatePicker = dynamic<any>(() => import("react-datepicker"), {
        ssr: false,
        loading: () => <p>Loading...</p>,
    });

    function formatDisplayDate(date: Date): string {
        return date.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }


    function formatSubmitDate(date: Date): string {
        const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split('T')[0]; // Format as yyyy-mm-dd
    }

    const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
        ({ value, onClick, id, name }, ref) => (
            <input
                type="text"
                className="input input-bordered w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                onClick={onClick} // เปิดปฏิทินเมื่อคลิก
                value={value || ""} // กำหนดค่าให้ input
                readOnly
                autoComplete="off"
                ref={ref}
                id={id}
                name={name}
            />
        )
    );

    CustomInput.displayName = "CustomInput";


    const years = Array.from({ length: 2 }, (_, i) => new Date().getFullYear() + i);

    const renderCustomHeader = ({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
    }: ReactDatePickerCustomHeaderProps) => {
        const months = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
        ];

        return (
            <div className="flex items-center gap-2 p-2">
                <button
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    className="p-1 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none"
                >
                    ⬅️
                </button>
                <select
                    value={date.getFullYear()}
                    onChange={({ target: { value } }) => changeYear(parseInt(value))}
                    className="p-1 border rounded-md"
                >
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year + 543}
                        </option>
                    ))}
                </select>
                <select
                    value={date.getMonth()}
                    onChange={({ target: { value } }) => changeMonth(parseInt(value))}
                    className="p-1 border rounded-md"
                >
                    {months.map((month, index) => (
                        <option key={index} value={index}>
                            {month}
                        </option>
                    ))}
                </select>
                <button
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    className="p-1 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none"
                >
                    ➡️
                </button>
            </div>
        );
    };

    const showAlert = (message: string, type: "success" | "error") => {
        setAlertMessage(message);
        setAlertType(type);

        setTimeout(() => {
            setAlertMessage(null);
        }, 3000);
    };






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


    const handleQuantityChange = (index: number, value: number) => {
        setSelectedGroup((prevGroup) => {
            if (!prevGroup) return null; // If no group, return null
            const updatedLogs = [...prevGroup.logs];
            updatedLogs[index].approved_quantity = Math.min(value || 0, updatedLogs[index].quantity); // Ensure value does not exceed requested quantity
            return { ...prevGroup, logs: updatedLogs };
        });
    };

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
            setAlertMessage("ไม่พบคำขอที่เลือก");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

        // ตรวจสอบจำนวนที่อนุมัติในทุก log
        const isValid = selectedGroup.logs.every(
            (log) =>
                log.approved_quantity !== undefined && log.approved_quantity >= 1 // ต้องไม่น้อยกว่า 1
        );

        if (!isValid) {
            setAlertMessage("จำนวนที่อนุมัติในแต่ละรายการต้องไม่น้อยกว่า 1");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

        const confirmApprove = async () => {
            try {
                const response = await axios.put("/api/borrow_log/approve", {
                    groupId: selectedGroup.borrow_groupid,
                    logs: selectedGroup.logs.map((log) => ({
                        id: log.id,
                        approved_quantity: log.approved_quantity ?? log.quantity,
                    })),
                });

                if (response.status === 200) {
                    setAlertMessage("อนุมัติสำเร็จ!");
                    setAlertType("success");
                    closeModal();
                    await fetchBorrowLogs();
                } else {
                    setAlertMessage("เกิดข้อผิดพลาดในการอนุมัติ");
                    setAlertType("error");
                }
            } catch (error) {
                console.error("Error approving borrow logs:", error);
                setAlertMessage("ไม่สามารถอนุมัติคำขอได้ในขณะนี้!");
                setAlertType("error");
            } finally {
                autoCloseAlert();
                setIsEditConfirmOpen(false); // ปิด Modal ยืนยัน
            }
        };

        confirmApprove();
    };

    const handleReject = () => {
        if (!selectedGroup) return;

        // เปิด Modal ยืนยัน
        setIsEditConfirmOpen(true);
    };

    const confirmReject = async () => {
        try {
            const response = await axios.put("/api/borrow_log/reject", {
                groupId: selectedGroup.borrow_groupid,
            });

            if (response.status === 200) {
                setAlertMessage("ปฏิเสธคำขอสำเร็จ!");
                setAlertType("success");
                closeModal();
                await fetchBorrowLogs();
            } else {
                setAlertMessage("เกิดข้อผิดพลาดในการปฏิเสธคำขอ");
                setAlertType("error");
            }
        } catch (error) {
            console.error("Error rejecting borrow:", error);
            setAlertMessage("ไม่สามารถปฏิเสธคำขอได้ในขณะนี้");
            setAlertType("error");
        } finally {
            autoCloseAlert();
            setIsEditConfirmOpen(false); // ปิด Modal ยืนยัน
        }
    };




    const handleReturn = async () => {
        if (!selectedReturnGroup?.actual_return_date) {
            setAlertMessage("กรุณาเลือกวันที่คืน");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

        const date = new Date(selectedReturnGroup.actual_return_date);
        const formattedDate = date.toISOString().split("T")[0];

        const isValid = selectedReturnGroup.logs.every(
            (log) =>
                log.returned_quantity !== undefined &&
                log.returned_quantity <= log.quantity
        );

        if (!isValid) {
            setAlertMessage("กรุณาระบุจำนวนที่คืนให้ถูกต้องในทุกรายการ");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

        try {
            const response = await axios.post("/api/borrow_log/return", {
                borrow_groupid: selectedReturnGroup.borrow_groupid,
                actual_return_date: formattedDate,
                logs: selectedReturnGroup.logs.map((log) => ({
                    id: log.id,
                    returned_quantity: log.returned_quantity,
                })),
            });

            if (response.status === 200) {
                setAlertMessage("บันทึกข้อมูลการคืนสำเร็จ");
                setAlertType("success");
                closeReturnModal();
                await fetchBorrowLogs();
            } else {
                setAlertMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                setAlertType("error");
            }
        } catch (error) {
            console.error("Error saving return data:", error);
            setAlertMessage("ไม่สามารถบันทึกข้อมูลการคืนได้");
            setAlertType("error");
        } finally {
            autoCloseAlert();
        }
    };

    // ฟังก์ชันปิดแจ้งเตือนอัตโนมัติใน 3 วินาที
    const autoCloseAlert = () => {
        setTimeout(() => {
            setAlertMessage(null);
            setAlertType(null);
        }, 3000); // 3 วินาที
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
                    <h1 className="text-2xl font-bold mb-6">ยืนยันการยืม-คืน</h1>
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
                                className={`py-2 px-4 rounded ${statusFilter === key ? "bg-[#fb8124] text-white" : "bg-gray-200"}`}
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
                                    <th className="py-3 px-4 text-left">คำขอ</th>
                                    <th className="py-3 px-4 text-left">ชื่อผู้ขอ</th>
                                    <th className="py-3 px-4 text-left">สถานะ</th>
                                    <th className="py-3 px-4 text-left">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentBorrows.length > 0 ? (
                                    currentBorrows.map((group, index) => {
                                        return (
                                            <tr key={group.borrow_groupid} className="border-b text-xs">
                                                {/* เปลี่ยนจาก group.borrow_groupid เป็นการแสดงลำดับ */}
                                                <td className="py-3 px-4">คำขอที่ {startIndex + index + 1}</td>
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
                                                            className="px-4 py-2 rounded bg-[#fb8124] text-white"
                                                        >
                                                            ดูคำขอ
                                                        </button>
                                                    ) : group.status === "Approved" ? (
                                                        <button
                                                            onClick={() => openReturnModal(group)}
                                                            className="px-4 py-2 rounded bg-[#fb8124] text-white"
                                                        >
                                                            คืนของ
                                                        </button>
                                                    ) : group.status === "ApprovedReturned" ? (
                                                        <button
                                                            onClick={() => openDetailModal(group)}
                                                            className="px-4 py-2 rounded bg-green-500 text-white"
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

                    {statusFilter && (
                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {startIndex + 1} ถึง {Math.min(startIndex + 10, borrowGroups.length)} จาก {" "}
                                {borrowGroups.length} รายการ
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

                {modalOpen && selectedGroup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                            <h2 className="text-2xl font-bold mb-4 text-center">รายละเอียดคำขอ</h2>
                            <ul className="divide-y divide-gray-200">
                                {selectedGroup.logs.map((log, index) => (
                                    <li key={log.id} className="py-4">
                                        <p className="font-semibold">
                                            ชื่อ: {log.borrow.borrow_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            จำนวนที่ขอ:{" "}{log.quantity}
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <label className="block text-sm font-medium text-gray-600">
                                                จำนวนที่อนุมัติ:
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={log.quantity}
                                                value={log.approved_quantity ?? 0} // Default to requested quantity
                                                onChange={(e) =>
                                                    handleQuantityChange(index, Number(e.target.value))
                                                }
                                                className="mt-1 block w-24 px-2 py-1 border rounded-md text-sm"
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
                                    onClick={handleReject}
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

                {returnModalOpen && selectedReturnGroup && (
                    <>
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 text-center">คืนของ</h2>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600">วันที่คืน:</label>
                                    <DynamicDatePicker
                                        selected={returnDate ? new Date(returnDate) : null} // ค่าเริ่มต้น
                                        onChange={(date: Date | null) => {
                                            if (date) {
                                                const today = new Date();
                                                const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                                const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                                                if (selectedDate < currentDate) {
                                                    showAlert("ไม่สามารถเลือกวันที่น้อยกว่าวันปัจจุบัน", "error");
                                                    return;
                                                }

                                                // กำหนดค่าที่ได้จาก DatePicker
                                                setSelectedReturnGroup((prev) =>
                                                    prev ? { ...prev, actual_return_date: formatSubmitDate(date) } : null
                                                );

                                                setReturnDate(formatSubmitDate(date)); // อัพเดทค่าที่ส่งไปยัง API
                                            }
                                        }}
                                        locale="th" // ใช้ภาษาไทย
                                        dateFormat="dd/MM/yyyy" // รูปแบบการแสดงผล
                                        renderCustomHeader={renderCustomHeader} // ใช้ header ที่ปรับแต่ง
                                        customInput={
                                            <CustomInput
                                                id="actual_return_date" // ระบุ id
                                                name="actual_return_date" // ส่ง name ไปยัง API
                                                value={returnDate ? formatDisplayDate(new Date(returnDate)) : ""} // แสดงค่าที่เลือก
                                            />
                                        }
                                        className="datepicker-input" // เพิ่ม className สำหรับปรับแต่ง
                                        minDate={new Date()} // ห้ามเลือกวันที่น้อยกว่าวันปัจจุบัน
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

                {isEditConfirmOpen && (
                    <ConfirmEditModal
                        isOpen={isEditConfirmOpen}
                        onClose={() => setIsEditConfirmOpen(false)} // ปิด Modal
                        onConfirm={confirmReject} // ดำเนินการปฏิเสธคำขอเมื่อยืนยัน
                        title="ยืนยันการปฏิเสธคำขอนี้หรือไม่?"
                        iconSrc="/images/alert.png"
                    />
                )}


                {alertMessage && (
                    <AlertModal
                        isOpen={!!alertMessage}
                        message={alertMessage}
                        type={alertType ?? "error"}
                        iconSrc={alertType === "success" ? "/images/check.png" : "/images/close.png"}
                    />
                )}

            </div>
        </div>
    );
}

export default AdminsConfirmBorrow;
