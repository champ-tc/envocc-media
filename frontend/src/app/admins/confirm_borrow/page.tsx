"use client";

import React, { useState, useEffect, useCallback } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from "axios";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";
import { registerLocale } from "react-datepicker";
import { th } from "date-fns/locale/th";
import "react-datepicker/dist/react-datepicker.css";
import type { ReactDatePickerCustomHeaderProps } from "react-datepicker";
import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type { DatePickerProps } from "react-datepicker";


registerLocale("th", th);


interface BorrowLog {
    id: number;
    borrow: {
        borrow_name: string;
    };
    quantity: number;
    returned_quantity: number;
    approved_quantity?: number;
    status: string;
    // เพิ่มให้รองรับ reason/customReason ถ้ามี
    reason?: { reason_name: string };
    customUsageReason?: string;
}

interface BorrowGroup {
    borrow_groupid: string;
    status: string;
    logs: BorrowLog[];
    user?: {
        title: string;
        firstName: string;
        lastName: string;
    };
    actual_return_date?: string;
}


interface CustomInputProps {
    value?: string;
    onClick?: () => void;
    id: string;
    name: string;
}


function AdminsConfirmBorrow() {
    const { session, isLoading } = useAuthCheck("admin");
    const [returnDate, setReturnDate] = useState("");

    const [statusFilter, setStatusFilter] = useState("");
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);

    const [borrowGroups, setBorrowGroups] = useState<BorrowGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<BorrowGroup | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedReturnGroup, setSelectedReturnGroup] = useState<BorrowGroup | null>(null);


    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const [totalItems, setTotalItems] = useState(0);
    const currentBorrows = borrowGroups || [];


    const fetchBorrowLogs = useCallback(async () => {
        try {
            if (!session || !statusFilter) return;

            const url =
                statusFilter === "all"
                    ? `/api/borrow_log?page=${currentPage}&limit=${itemsPerPage}`
                    : `/api/borrow_log?page=${currentPage}&limit=${itemsPerPage}&status=${statusFilter}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.items && Array.isArray(data.items)) {
                setBorrowGroups(data.items);
                setTotalPages(data.totalPages);
                setTotalItems(data.totalItems || 0);
            }
        } catch {
            console.log("Error fetching borrow logs:");
        }
    }, [session, statusFilter, currentPage]); // ✅ ใส่ dependencies ให้ครบ


    useEffect(() => {
        fetchBorrowLogs();
    }, [fetchBorrowLogs]); // ✅ warning จะหายไป



    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    const DynamicDatePicker = dynamic(() =>
        import("react-datepicker").then((mod) => {
            const DatePicker = forwardRef<never, DatePickerProps>((props, ref) => (
                <mod.default {...props} ref={ref} />
            ));
            DatePicker.displayName = "DatePicker";
            return { default: DatePicker };
        }), {
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
                className="input input-bordered w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
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

            const logs = Array.isArray(data.items) ? data.items : data; // รองรับทั้งกรณี items หรือ array ตรง

            setSelectedGroup({ ...group, logs });
            setModalOpen(true);
        } catch {
            console.log("Error fetching group details:");
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

            const logs = Array.isArray(data.items) ? data.items : data;

            setSelectedReturnGroup({ ...group, logs }); // ✅ ใช้ logs ที่เป็น array เท่านั้น
            setReturnModalOpen(true);
        } catch {
            console.log("Error fetching logs:");
        }
    };

    const openDetailModal = async (group: BorrowGroup) => {
        try {
            const response = await fetch(`/api/borrow_log?groupid=${group.borrow_groupid}`);
            const data = await response.json();

            const logs = Array.isArray(data.items) ? data.items : [];

            if (logs.length > 0) {
                setSelectedReturnGroup({ ...group, logs });
                setDetailModalOpen(true);
            } else {
                alert('ไม่พบข้อมูล logs สำหรับคำขอนี้');
            }
        } catch {
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
            } catch {
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
                groupId: selectedGroup?.borrow_groupid,
            });
            ;

            if (response.status === 200) {
                setAlertMessage("ปฏิเสธคำขอสำเร็จ!");
                setAlertType("success");
                closeModal();
                await fetchBorrowLogs();
            } else {
                setAlertMessage("เกิดข้อผิดพลาดในการปฏิเสธคำขอ");
                setAlertType("error");
            }
        } catch {
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

        const formattedDate = new Date(selectedReturnGroup.actual_return_date).toISOString().split("T")[0];

        const isValid = selectedReturnGroup.logs.every(
            (log) => log.returned_quantity !== undefined && log.returned_quantity <= log.quantity
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
                await fetchBorrowLogs(); // ✅ ดึงข้อมูลใหม่
            } else {
                setAlertMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                setAlertType("error");
            }
        } catch {
            setAlertMessage("ไม่สามารถบันทึกข้อมูลการคืนได้");
            setAlertType("error");
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


    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1">
                <TopBar />
                <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full p-8 mt-4 lg:ml-56">
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
                                onClick={() => {
                                    setStatusFilter(key);
                                    setCurrentPage(1);
                                }}

                                className={`py-2 px-4 rounded ${statusFilter === key ? "bg-[#9063d2] text-white" : "bg-gray-200"}`}
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
                                <tr className="bg-[#9063d2] text-white text-left text-sm uppercase font-semibold tracking-wider">
                                    <th className="border py-3 px-4 text-left">คำขอ</th>
                                    <th className="border py-3 px-4 text-left">ชื่อผู้ขอ</th>
                                    <th className="border py-3 px-4 text-left">สถานะ</th>
                                    <th className="border py-3 px-4 text-left">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentBorrows.length > 0 ? (
                                    currentBorrows.map((group, index) => {
                                        return (
                                            <tr key={group.borrow_groupid} className="border-b text-xs font-normal">
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
                                                            className="px-4 py-2 rounded bg-[#9063d2] text-white"
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
                                รายการที่ {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, totalItems)} จาก {totalItems} รายการ
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                                >
                                    ก่อนหน้า
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#9063d2] text-white" : "bg-gray-200 text-gray-600"
                                            } hover:bg-[#9063d2] hover:text-white transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
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

                            {selectedGroup.logs.length > 0 && (
                                <p className="text-sm text-gray-600 mb-4">
                                    เหตุผลการขอ:{" "}
                                    {selectedGroup.logs[0].reason?.reason_name ||
                                        selectedGroup.logs[0].customUsageReason ||
                                        "ไม่ระบุ"}
                                </p>
                            )}

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
                                    className="flex-1 bg-[#9063d2] hover:bg-[#8753d5] text-white py-2 px-4 rounded-lg font-semibold"
                                >
                                    อนุมัติ
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 bg-[#f3e5f5] hover:bg-[#8753d5] text-white py-2 px-4 rounded-lg font-semibold"
                                >
                                    ไม่อนุมัติ
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-[#f3e5f5] hover:bg-[#8753d5] text-white py-2 px-4 rounded-lg font-semibold"
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

                                                if (selectedDate > currentDate) {
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
                                        maxDate={new Date()} // ห้ามเลือกวันที่น้อยกว่าวันปัจจุบัน
                                    />

                                </div>

                                <ul className="divide-y divide-gray-200">
                                    {selectedReturnGroup.logs?.length > 0 ? (
                                        selectedReturnGroup.logs.map((log, index) => (
                                            <li key={log.id} className="py-5">
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-base font-medium text-gray-800">
                                                        ชื่อสื่อ: <span className="font-semibold">{log.borrow.borrow_name}</span>
                                                    </p>

                                                    <p className="text-sm text-gray-600">
                                                        จำนวนที่ให้ยืม: <span className="font-semibold text-gray-800">{log.quantity}</span>
                                                    </p>

                                                    <div className="flex items-center gap-x-2">
                                                        <label htmlFor={`return-${log.id}`} className="text-sm text-gray-600 whitespace-nowrap">
                                                            จำนวนที่คืน:
                                                        </label>
                                                        <input
                                                            id={`return-${log.id}`}
                                                            type="number"
                                                            min="0"
                                                            max={log.quantity}
                                                            value={log.returned_quantity || ""}
                                                            placeholder="0"
                                                            onChange={(e) =>
                                                                setSelectedReturnGroup((prev) => {
                                                                    if (!prev) return null;
                                                                    const updatedLogs = [...prev.logs];
                                                                    updatedLogs[index].returned_quantity = Number(e.target.value);
                                                                    return { ...prev, logs: updatedLogs };
                                                                })
                                                            }
                                                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                        />
                                                    </div>

                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-500 text-sm py-4">ไม่มีข้อมูลรายการที่ยืม</p>
                                    )}
                                </ul>


                                <div className="mt-6 flex justify-end items-center space-x-4">
                                    {/* ปุ่มบันทึก */}
                                    <button
                                        onClick={handleReturn}
                                        className="bg-[#9063d2] hover:bg-[#8753d5] text-white py-2 px-4 rounded"
                                    >
                                        บันทึก
                                    </button>

                                    {/* ปุ่มปิด */}
                                    <button
                                        onClick={closeReturnModal}
                                        className="bg-[#f3e5f5] hover:bg-[#8753d5] text-white py-2 px-4 rounded"
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
                                                วันที่คืน: {selectedReturnGroup.actual_return_date ?
                                                    new Date(selectedReturnGroup.actual_return_date).toLocaleDateString("th-TH", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })
                                                    : "ยังไม่มี"}
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
