// frontend/src/app/admins/confirm_borrow/page.tsx
"use client";

import React, { useState, useEffect, useCallback, forwardRef } from "react";
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
import type { DatePickerProps } from "react-datepicker";

registerLocale("th", th);

/* ------------------------------------------------------------------ */
/*                               Types                                */
/* ------------------------------------------------------------------ */
interface BorrowLog {
    id: number;
    borrow: {
        borrow_name: string;
    };
    quantity: number;
    returned_quantity: number;
    approved_quantity?: number;
    status: string;
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

/* ------------------------------------------------------------------ */
/*                              Helpers                               */
/* ------------------------------------------------------------------ */
function clampInt(raw: string, min: number, max: number) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return min;
    const i = Math.trunc(n);
    return Math.min(max, Math.max(min, i));
}

function safeStr(v: any, fallback = ""): string {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return fallback;
    return String(v);
}

function safeNum(v: any, fallback = 0): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeBorrowLog(x: any): BorrowLog {
    const quantity = safeNum(x?.quantity, 0);
    const returned_quantity = safeNum(x?.returned_quantity, 0);

    return {
        id: safeNum(x?.id, 0),
        borrow: { borrow_name: safeStr(x?.borrow?.borrow_name, "") },
        quantity,
        returned_quantity: clampInt(String(returned_quantity), 0, Math.max(0, quantity)),
        approved_quantity:
            x?.approved_quantity === undefined || x?.approved_quantity === null
                ? undefined
                : clampInt(String(x.approved_quantity), 0, Math.max(0, quantity)),
        status: safeStr(x?.status, ""),
        reason: x?.reason ? { reason_name: safeStr(x?.reason?.reason_name, "") } : undefined,
        customUsageReason: x?.customUsageReason ? safeStr(x?.customUsageReason, "") : undefined,
    };
}

function normalizeLogs(data: any): BorrowLog[] {
    const raw = Array.isArray(data?.items) ? data.items : data;
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeBorrowLog);
}

/* ------------------------------------------------------------------ */
/*                            Component                               */
/* ------------------------------------------------------------------ */
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
                    : `/api/borrow_log?page=${currentPage}&limit=${itemsPerPage}&status=${encodeURIComponent(
                        statusFilter
                    )}`;

            const response = await fetch(url);
            const data = await response.json();

            if (Array.isArray(data.items)) {
                // NOTE: รายการกลุ่มจาก API ให้คงแบบเดิม (เชื่อว่า backend ส่งเป็น BorrowGroup[])
                // ถ้า backend ส่ง logs มาด้วยก็ยัง OK แต่เราจะ normalize ตอนเปิด modal อีกครั้งอยู่แล้ว
                setBorrowGroups(data.items);
                setTotalPages(safeNum(data.totalPages, 1));
                setTotalItems(safeNum(data.totalItems, 0));
            } else {
                setBorrowGroups([]);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch {
            // no-op (ไม่ log เพื่อความสะอาด)
        }
    }, [session, statusFilter, currentPage]);

    useEffect(() => {
        fetchBorrowLogs();
    }, [fetchBorrowLogs]);

    const handlePageChange = (page: number) => setCurrentPage(page);

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage((p) => p - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
    };

    const showAlert = (message: string, type: "success" | "error") => {
        setAlertMessage(message);
        setAlertType(type);
        setTimeout(() => setAlertMessage(null), 3000);
    };

    const autoCloseAlert = () => {
        setTimeout(() => {
            setAlertMessage(null);
            setAlertType(null);
        }, 3000);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    const DynamicDatePicker = dynamic(
        () =>
            import("react-datepicker").then((mod) => {
                const DatePicker = forwardRef<never, DatePickerProps>((props, ref) => (
                    <mod.default {...props} ref={ref} />
                ));
                DatePicker.displayName = "DatePicker";
                return { default: DatePicker };
            }),
        { ssr: false, loading: () => <p>Loading...</p> }
    );

    function formatDisplayDate(date: Date): string {
        return date.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    function formatSubmitDate(date: Date): string {
        const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split("T")[0];
    }

    const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
        ({ value, onClick, id, name }, ref) => (
            <input
                type="text"
                className="input input-bordered w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                onClick={onClick}
                value={value || ""}
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
            "มกราคม",
            "กุมภาพันธ์",
            "มีนาคม",
            "เมษายน",
            "พฤษภาคม",
            "มิถุนายน",
            "กรกฎาคม",
            "สิงหาคม",
            "กันยายน",
            "ตุลาคม",
            "พฤศจิกายน",
            "ธันวาคม",
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

    /* ------------------------ Modal: View Request ------------------------ */
    const openModal = async (group: BorrowGroup) => {
        try {
            const response = await fetch(`/api/borrow_log?groupid=${encodeURIComponent(group.borrow_groupid)}`);
            const data = await response.json();
            const logs = normalizeLogs(data);

            setSelectedGroup({ ...group, logs });
            setModalOpen(true);
        } catch {
            // no-op
        }
    };

    const closeModal = () => {
        setSelectedGroup(null);
        setModalOpen(false);
    };

    const handleQuantityChange = (index: number, value: number) => {
        setSelectedGroup((prev) => {
            if (!prev) return null;

            const logs = Array.isArray(prev.logs) ? prev.logs : [];
            const nextLogs = logs.map((log, i) => {
                if (i !== index) return log;

                const max = Number.isFinite(log.quantity) ? log.quantity : 0;
                const approved = Math.min(Math.max(0, Math.trunc(value || 0)), max);

                return { ...log, approved_quantity: approved };
            });

            return { ...prev, logs: nextLogs };
        });
    };

    /* ------------------------ Modal: Return Items ------------------------ */
    const openReturnModal = async (group: BorrowGroup) => {
        try {
            const response = await fetch(`/api/borrow_log?groupid=${encodeURIComponent(group.borrow_groupid)}`);
            const data = await response.json();
            const logs = normalizeLogs(data);

            setSelectedReturnGroup({ ...group, logs });
            setReturnModalOpen(true);
        } catch {
            // no-op
        }
    };

    const openDetailModal = async (group: BorrowGroup) => {
        try {
            const response = await fetch(`/api/borrow_log?groupid=${encodeURIComponent(group.borrow_groupid)}`);
            const data = await response.json();
            const logs = normalizeLogs(data);

            if (logs.length > 0) {
                setSelectedReturnGroup({ ...group, logs });
                setDetailModalOpen(true);
            } else {
                showAlert("ไม่พบข้อมูล logs สำหรับคำขอนี้", "error");
            }
        } catch {
            showAlert("เกิดข้อผิดพลาดในการดึงข้อมูล logs", "error");
        }
    };

    const closeReturnModal = () => {
        setSelectedReturnGroup(null);
        setReturnModalOpen(false);
    };

    const closeDetailModal = () => {
        setSelectedReturnGroup(null);
        setDetailModalOpen(false);
    };

    /* ------------------------------- Actions ------------------------------ */
    const handleApprove = async () => {
        if (!selectedGroup) {
            setAlertMessage("ไม่พบคำขอที่เลือก");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

        const isValid = selectedGroup.logs.every(
            (log) => log.approved_quantity !== undefined && log.approved_quantity >= 1
        );

        if (!isValid) {
            setAlertMessage("จำนวนที่อนุมัติในแต่ละรายการต้องไม่น้อยกว่า 1");
            setAlertType("error");
            autoCloseAlert();
            return;
        }

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
            setIsEditConfirmOpen(false);
        }
    };

    const handleReject = () => {
        if (!selectedGroup) return;
        setIsEditConfirmOpen(true);
    };

    const confirmReject = async () => {
        try {
            const response = await axios.put("/api/borrow_log/reject", {
                groupId: selectedGroup?.borrow_groupid,
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
        } catch {
            setAlertMessage("ไม่สามารถปฏิเสธคำขอได้ในขณะนี้");
            setAlertType("error");
        } finally {
            autoCloseAlert();
            setIsEditConfirmOpen(false);
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

        const isValid = selectedReturnGroup.logs.every((log) => {
            const q = Number.isFinite(log.quantity) ? log.quantity : 0;
            const r = Number.isFinite(log.returned_quantity) ? log.returned_quantity : 0;
            return r >= 0 && r <= q;
        });

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
        } catch {
            setAlertMessage("ไม่สามารถบันทึกข้อมูลการคืนได้");
            setAlertType("error");
        } finally {
            autoCloseAlert();
        }
    };

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
                return "สถานะไม่ทราบ";
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
                                className={`py-2 px-4 rounded ${statusFilter === key ? "bg-[#9063d2] text-white" : "bg-gray-200"
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
                                <tr className="bg-[#9063d2] text-white text-left text-sm uppercase font-semibold tracking-wider">
                                    <th className="border py-3 px-4 text-left">คำขอ</th>
                                    <th className="border py-3 px-4 text-left">ชื่อผู้ขอ</th>
                                    <th className="border py-3 px-4 text-left">สถานะ</th>
                                    <th className="border py-3 px-4 text-left">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentBorrows.length > 0 ? (
                                    currentBorrows.map((group, index) => (
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
                                    ))
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
                                รายการที่ {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, totalItems)} จาก{" "}
                                {totalItems} รายการ
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

                {/* ------------------------------- Modal: Pending ------------------------------- */}
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
                                        <p className="font-semibold">ชื่อ: {log.borrow.borrow_name}</p>
                                        <p className="text-sm text-gray-600">จำนวนที่ขอ: {log.quantity}</p>

                                        <div className="flex items-center space-x-2">
                                            <label className="block text-sm font-medium text-gray-600">จำนวนที่อนุมัติ:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={log.quantity}
                                                value={log.approved_quantity ?? 0}
                                                onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
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

                {/* ------------------------------- Modal: Return ------------------------------- */}
                {returnModalOpen && selectedReturnGroup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                            <h2 className="text-2xl font-bold mb-4 text-center">คืนของ</h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600">วันที่คืน:</label>
                                <DynamicDatePicker
                                    selected={returnDate ? new Date(returnDate) : null}
                                    onChange={(date: Date | null) => {
                                        if (!date) return;

                                        const today = new Date();
                                        const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                                        if (selectedDate > currentDate) {
                                            showAlert("ไม่สามารถเลือกวันที่น้อยกว่าวันปัจจุบัน", "error");
                                            return;
                                        }

                                        const submitDate = formatSubmitDate(date);

                                        setSelectedReturnGroup((prev) => (prev ? { ...prev, actual_return_date: submitDate } : null));
                                        setReturnDate(submitDate);
                                    }}
                                    locale="th"
                                    dateFormat="dd/MM/yyyy"
                                    renderCustomHeader={renderCustomHeader}
                                    customInput={
                                        <CustomInput
                                            id="actual_return_date"
                                            name="actual_return_date"
                                            value={returnDate ? formatDisplayDate(new Date(returnDate)) : ""}
                                        />
                                    }
                                    className="datepicker-input"
                                    maxDate={new Date()}
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
                                                        value={Number.isFinite(log.returned_quantity) ? log.returned_quantity : ""}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const raw = e.target.value;

                                                            setSelectedReturnGroup((prev) => {
                                                                if (!prev) return null;

                                                                const logs = Array.isArray(prev.logs) ? prev.logs : [];
                                                                const nextLogs = logs.map((l, i) => {
                                                                    if (i !== index) return l;

                                                                    const max = Number.isFinite(l.quantity) ? l.quantity : 0;
                                                                    const returned = clampInt(raw, 0, max);

                                                                    return { ...l, returned_quantity: returned };
                                                                });

                                                                return { ...prev, logs: nextLogs };
                                                            });
                                                        }}
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
                                <button
                                    onClick={handleReturn}
                                    className="bg-[#9063d2] hover:bg-[#8753d5] text-white py-2 px-4 rounded"
                                >
                                    บันทึก
                                </button>

                                <button
                                    onClick={closeReturnModal}
                                    className="bg-[#f3e5f5] hover:bg-[#8753d5] text-white py-2 px-4 rounded"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ------------------------------- Modal: Detail ------------------------------- */}
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
                                                จำนวนที่คืน:{" "}
                                                {log.approved_quantity !== null && log.approved_quantity !== undefined
                                                    ? log.approved_quantity
                                                    : "ยังไม่ได้คืน"}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                วันที่คืน:{" "}
                                                {selectedReturnGroup.actual_return_date
                                                    ? new Date(selectedReturnGroup.actual_return_date).toLocaleDateString("th-TH", {
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
                                <button onClick={closeDetailModal} className="bg-gray-300 text-black py-2 px-4 rounded">
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
                        onConfirm={confirmReject}
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