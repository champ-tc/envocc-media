"use client";

import React, { useEffect, useState, forwardRef } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import axios from "axios";
import Image from 'next/image';
import dynamic from "next/dynamic";
import { registerLocale } from "react-datepicker";
import { th } from "date-fns/locale/th";
import "react-datepicker/dist/react-datepicker.css";
import type { ReactDatePickerCustomHeaderProps, DatePickerProps } from "react-datepicker";

// Components
import Navbar from "@/components/NavbarUser";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import EvaluationModal, { EvaluationData } from "@/components/EvaluationModal"; // ✅ Import Modal ประเมิน

registerLocale("th", th);

// --- Interfaces ---
interface CustomInputProps {
    value?: string;
    onClick?: () => void;
    id: string;
    name: string;
}

interface Order {
    id: number;
    quantity: number;
    requisition?: {
        id: number;
        requisition_name: string;
    };
    borrow?: {
        id: number;
        borrow_name: string;
    };
    // เพิ่ม field ให้ชัดเจนสำหรับ TS
    requisitionId?: number;
    borrowId?: number;
}

type Reason = {
    id: number;
    reason_name: string;
};

// Interface สำหรับเก็บข้อมูลที่รอกดส่งจริง
interface PendingSubmissionData {
    actionType: "requisition" | "borrow";
    payload: any;
}

function UsersSummary() {
    const { session, isLoading } = useAuthCheck("user");

    // State การทำงานหลัก
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [reasons, setReasons] = useState<Reason[]>([]);

    // Form Fields
    const [returnDate, setReturnDate] = useState("");
    const [deliveryMethod, setDeliveryMethod] = useState("self");
    const [address, setAddress] = useState("");
    const [usageReasonId, setUsageReasonId] = useState<number | null>(null);
    const [customUsageReason, setCustomUsageReason] = useState("");
    const [customUsageReasonError, setCustomUsageReasonError] = useState<string | null>(null);

    // Modal States
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

    // ✅ State ใหม่: จัดการ Modal ประเมิน
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const [pendingData, setPendingData] = useState<PendingSubmissionData | null>(null);

    // --- Effects ---
    useEffect(() => {
        fetch("/api/reason")
            .then((res) => res.json())
            .then((data) => setReasons(data))
            .catch((error) => console.error("Error fetching reasons:", error));
    }, []);

    const fetchOrders = async () => {
        if (!session?.user?.id) return;
        try {
            const response = await fetch(`/api/order?userId=${session?.user?.id}`);
            if (!response.ok) throw new Error("Error fetching orders");
            const data = await response.json();
            setOrders(data);
        } catch {
            showAlert("เกิดข้อผิดพลาดในการโหลดรายการ", "error");
        }
    };

    useEffect(() => {
        if (session?.user?.id) {
            fetchOrders();
        }
    }, [session?.user?.id]);

    // --- Handlers ---
    const handleUsageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = Number(event.target.value);
        setUsageReasonId(selectedValue);
        if (selectedValue !== 0) {
            setCustomUsageReason("");
        }
    };

    const showAlert = (message: string, type: "success" | "error") => {
        setAlertMessage(message);
        setAlertType(type);
        setTimeout(() => setAlertMessage(null), 3000);
    };

    const handleDeleteOrder = (orderId: number) => {
        setSelectedOrderId(orderId);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedOrderId) return;
        try {
            const response = await fetch(`/api/order/${selectedOrderId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete order");
            setOrders((prev) => prev.filter((order) => order.id !== selectedOrderId));
            showAlert("ลบรายการสำเร็จ", "success");
        } catch {
            showAlert("เกิดข้อผิดพลาดในการลบรายการ", "error");
        } finally {
            setIsDeleteConfirmOpen(false);
            setSelectedOrderId(null);
        }
    };

    // --- Date Picker Config ---
    const DynamicDatePicker = dynamic(() =>
        import("react-datepicker").then((mod) => {
            const DatePicker = forwardRef<never, DatePickerProps>((props, ref) => (
                <mod.default {...props} ref={ref} />
            ));
            DatePicker.displayName = "DatePicker";
            return { default: DatePicker };
        }), { ssr: false, loading: () => <p>Loading...</p> }
    );

    const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
        ({ value, onClick, id, name }, ref) => (
            <input
                type="text"
                className="input input-bordered w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                onClick={onClick} value={value || ""} readOnly autoComplete="off" ref={ref} id={id} name={name}
            />
        )
    );
    CustomInput.displayName = "CustomInput";

    const renderCustomHeader = ({
        date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled,
    }: ReactDatePickerCustomHeaderProps) => {
        const years = Array.from({ length: 2 }, (_, i) => new Date().getFullYear() + i);
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        return (
            <div className="flex items-center gap-2 p-2">
                <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1 rounded bg-gray-200 hover:bg-gray-300">⬅️</button>
                <select value={date.getFullYear()} onChange={({ target: { value } }) => changeYear(parseInt(value))} className="p-1 border rounded-md">
                    {years.map((year) => (<option key={year} value={year}>{year + 543}</option>))}
                </select>
                <select value={date.getMonth()} onChange={({ target: { value } }) => changeMonth(parseInt(value))} className="p-1 border rounded-md">
                    {months.map((month, index) => (<option key={index} value={index}>{month}</option>))}
                </select>
                <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1 rounded bg-gray-200 hover:bg-gray-300">➡️</button>
            </div>
        );
    };

    function formatDisplayDate(date: Date): string {
        return date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    function formatSubmitDate(date: Date): string {
        const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split('T')[0];
    }

    // =========================================================
    // ✅ Logic ส่วนที่ 1: ตรวจสอบ Form "เบิก" (ยังไม่ส่ง API)
    // =========================================================
    const handlePreSubmitRequisition = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (!session?.user?.id) { showAlert("ไม่พบผู้ใช้", "error"); return; }
        if (!orders || orders.length === 0) { showAlert("ไม่มีรายการเบิก", "error"); return; }
        if (usageReasonId === null) { showAlert("กรุณาเลือกเหตุผลในการนำไปใช้", "error"); return; }
        if (usageReasonId === 0 && !customUsageReason.trim()) {
            setCustomUsageReasonError("กรุณาระบุรายละเอียดเพิ่มเติม");
            showAlert("กรุณาระบุรายละเอียดเพิ่มเติม", "error");
            return;
        } else {
            setCustomUsageReasonError(null);
        }
        if (deliveryMethod === "delivery" && !address.trim()) { showAlert("กรุณากรอกที่อยู่สำหรับการจัดส่ง", "error"); return; }

        // 2. Prepare Payload
        const formattedOrders = orders
            .filter((order) => order.requisition?.id && order.quantity > 0)
            .reduce((acc, order) => {
                const existingOrder = acc.find(o => o.requisitionId === order.requisition!.id);
                if (existingOrder) {
                    existingOrder.quantity += order.quantity;
                } else {
                    acc.push({ requisitionId: order.requisition!.id, quantity: order.quantity });
                }
                return acc;
            }, [] as { requisitionId: number; quantity: number }[]);

        if (formattedOrders.length === 0) { showAlert("ไม่มีรายการเบิกที่ถูกต้อง", "error"); return; }

        // 3. ✅ Store Data & Open Modal
        setPendingData({
            actionType: "requisition",
            payload: {
                userId: session?.user?.id,
                orders: formattedOrders,
                deliveryMethod,
                address: deliveryMethod === "delivery" ? address : null,
                usageReasonId,
                customUsageReason: usageReasonId === 0 ? customUsageReason : null,
            }
        });
        setIsEvalModalOpen(true);
    };

    // =========================================================
    // ✅ Logic ส่วนที่ 1: ตรวจสอบ Form "ยืม" (ยังไม่ส่ง API)
    // =========================================================
    const handlePreSubmitBorrow = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (!returnDate) { showAlert("กรุณากรอกวันที่คืน", "error"); return; }
        if (deliveryMethod === "delivery" && !address.trim()) { showAlert("กรุณากรอกข้อมูลที่อยู่สำหรับการจัดส่ง", "error"); return; }
        if (usageReasonId === null) { showAlert("กรุณาเลือกเหตุผลในการนำไปใช้", "error"); return; }
        if (usageReasonId === 0 && !customUsageReason.trim()) { showAlert("กรุณาระบุรายละเอียดเพิ่มเติม", "error"); return; }

        // 2. Prepare Payload
        const formattedOrders = orders
            .filter((order) => order.borrow?.id && order.quantity > 0)
            .map((order) => ({ borrowId: order.borrow!.id, quantity: order.quantity }));

        if (formattedOrders.length === 0) { showAlert("ไม่มีรายการยืมที่ถูกต้อง", "error"); return; }

        // 3. ✅ Store Data & Open Modal
        setPendingData({
            actionType: "borrow",
            payload: {
                userId: session?.user?.id,
                orders: formattedOrders,
                deliveryMethod,
                address: deliveryMethod === "delivery" ? address : null,
                returnDate,
                usageReasonId,
                customUsageReason: usageReasonId === 0 ? customUsageReason : null,
            }
        });
        setIsEvalModalOpen(true);
    };

    // =========================================================
    // ✅ Logic ส่วนที่ 2: เมื่อกด "ยืนยัน" ในหน้า Modal ประเมิน (ส่ง API จริง)
    // =========================================================
    const handleFinalSubmit = async (evalData: EvaluationData) => {
        if (!pendingData) return;

        // รวมข้อมูล: [ข้อมูลการเบิก/ยืม] + [ข้อมูลประเมิน]
        const finalPayload = {
            ...pendingData.payload,
            evaluation: evalData,
            actionType: pendingData.actionType
        };

        try {
            // เลือก Endpoint ตามประเภท
            const url = pendingData.actionType === "requisition"
                ? "/api/requisition_log"
                : "/api/borrowlog";

            // 🚀 ส่งข้อมูลไปที่ Backend
            await axios.post(url, finalPayload);

            // ✅ Success Handling
            setIsEvalModalOpen(false);
            setPendingData(null);
            showAlert(`บันทึกการ${pendingData.actionType === 'requisition' ? 'เบิก' : 'ยืม'}และแบบประเมินสำเร็จ!`, "success");

            // Clear Form
            setOrders([]);
            setAddress("");
            setSelectedAction(null);
            setUsageReasonId(null);
            setCustomUsageReason("");
            setReturnDate("");

            // Refresh Data
            await fetchOrders();

        } catch (error) {
            console.error("Submission Error:", error);
            showAlert("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
            // ไม่ปิด Modal เพื่อให้ user ลองกดใหม่ได้
        }
    };

    // Filter Orders for Display
    const filteredOrders: Order[] =
        selectedAction === "requisition"
            ? orders.filter((order) => order.requisition)
            : selectedAction === "borrow"
                ? orders.filter((order) => order.borrow)
                : [];

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><p>กำลังโหลด...</p></div>;
    }

    return (
        <>
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="relative flex flex-col items-center">
                    <div className="flex-1 flex items-start justify-center p-2">
                        <div className="bg-white rounded-lg shadow-lg w-full md:w-[800px] p-8 mt-4">
                            <h1 className="text-2xl font-bold mb-4">รายการของฉัน</h1>

                            {/* ปุ่มเลือกประเภท */}
                            <div className="mb-4 flex flex-wrap gap-4">
                                <button onClick={() => setSelectedAction("requisition")} className={`py-2 px-4 rounded-md text-white transition-colors duration-200 ${selectedAction === "requisition" ? "bg-[#8753d5]" : "bg-[#9063d2] hover:bg-[#8753d5]"}`}>เบิกสื่อ</button>
                                <button onClick={() => setSelectedAction("borrow")} className={`py-2 px-4 rounded-md text-white transition-colors duration-200 ${selectedAction === "borrow" ? "bg-[#8753d5]" : "bg-[#9063d2] hover:bg-[#8753d5]"}`}>ยืมสื่อ</button>
                            </div>

                            {selectedAction ? (
                                <>
                                    {/* ตารางรายการ */}
                                    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                                        <thead>
                                            <tr className="bg-[#9063d2] text-white">
                                                <th className="py-3 px-4 text-left">ชื่อรายการ</th>
                                                <th className="py-3 px-4 text-left">จำนวน</th>
                                                <th className="py-3 px-4 text-left">ลบ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOrders.length > 0 ? (
                                                filteredOrders.map((order) => (
                                                    <tr key={order.id} className="border-b">
                                                        <td className="py-3 px-4">{order.requisition ? order.requisition.requisition_name : order.borrow?.borrow_name || "ไม่มีข้อมูล"}</td>
                                                        <td className="py-3 px-4">{order.quantity}</td>
                                                        <td className="py-3 px-4">
                                                            <button onClick={() => handleDeleteOrder(order.id)} className="mb-4 py-2 px-2 rounded-md transition hover:scale-110">
                                                                <Image src="/images/delete.png" alt="Delete" width={24} height={24} className="h-6 w-6" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan={3} className="text-center py-4 text-gray-500">ไม่มีรายการที่จะแสดง</td></tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {/* ฟอร์มยืม: วันที่คืน */}
                                    {selectedAction === "borrow" && (
                                        <div className="mt-4">
                                            <label className="block text-gray-700 font-semibold mb-2">วันที่คืน:</label>
                                            <DynamicDatePicker
                                                selected={returnDate ? new Date(returnDate) : null}
                                                onChange={(date: Date | null) => {
                                                    if (date) {
                                                        const today = new Date();
                                                        const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                                        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                                        if (selectedDate < currentDate) { showAlert("ไม่สามารถเลือกวันที่น้อยกว่าวันปัจจุบัน", "error"); return; }
                                                        setReturnDate(formatSubmitDate(date));
                                                    }
                                                }}
                                                locale="th" dateFormat="dd/MM/yyyy" renderCustomHeader={renderCustomHeader}
                                                customInput={<CustomInput id="returnDate" name="returnDate" />}
                                                withPortal minDate={new Date()}
                                            />
                                        </div>
                                    )}

                                    {/* ฟอร์ม: เหตุผล */}
                                    <div className="mt-6">
                                        <label className="block text-gray-700 font-semibold mb-2">นำไปใช้เพื่ออะไร:</label>
                                        <select value={usageReasonId ?? ""} onChange={handleUsageChange} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#9063d2] focus:outline-none">
                                            <option value="" disabled>กรุณาเลือก...</option>
                                            {reasons.map((reason) => (<option key={reason.id} value={reason.id}>{reason.reason_name}</option>))}
                                        </select>
                                        {usageReasonId === 99 && (
                                            <>
                                                <input type="text" value={customUsageReason} onChange={(e) => setCustomUsageReason(e.target.value)} className="mt-2 w-full px-4 py-2 border rounded-md" placeholder="กรุณาระบุรายละเอียด" />
                                                {customUsageReasonError && <p className="text-red-500 text-sm mt-1">{customUsageReasonError}</p>}
                                            </>
                                        )}
                                    </div>

                                    {/* ฟอร์ม: จัดส่ง */}
                                    <div className="mt-6">
                                        <h2 className="text-lg font-semibold mb-2">เลือกวิธีการจัดส่ง:</h2>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center cursor-pointer"><input type="radio" name="deliveryMethod" value="delivery" checked={deliveryMethod === "delivery"} onChange={(e) => setDeliveryMethod(e.target.value)} className="radio radio-primary radio-sm mr-2" />จัดส่ง</label>
                                            <label className="flex items-center cursor-pointer"><input type="radio" name="deliveryMethod" value="self" checked={deliveryMethod === "self"} onChange={(e) => setDeliveryMethod(e.target.value)} className="radio radio-primary radio-sm mr-2" />รับเอง</label>
                                        </div>
                                        {deliveryMethod === "delivery" && (
                                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="mt-4 w-full px-4 py-2 border rounded-md" placeholder="กรอกที่อยู่สำหรับการจัดส่ง" rows={3} />
                                        )}
                                    </div>

                                    {/* ปุ่มดำเนินการต่อ (เปิด Modal ประเมิน) */}
                                    <button
                                        onClick={(e) => selectedAction === "requisition" ? handlePreSubmitRequisition(e) : handlePreSubmitBorrow(e)}
                                        disabled={filteredOrders.length === 0}
                                        className={`mt-6 w-full py-3 px-4 rounded-md transition font-bold text-lg shadow-md ${filteredOrders.length === 0 ? "bg-gray-300 cursor-not-allowed text-gray-500" : "bg-[#9063d2] hover:bg-[#8753d5] text-white transform hover:-translate-y-1"}`}
                                    >
                                        {selectedAction === "requisition" ? "ดำเนินการต่อ (บันทึกการเบิก)" : "ดำเนินการต่อ (บันทึกการยืม)"}
                                    </button>
                                </>
                            ) : (
                                <p className="text-center text-gray-500 mt-10 p-10 border-2 border-dashed rounded-lg">กรุณาเลือกระหว่าง "เบิกสื่อ" หรือ "ยืมสื่อ" เพื่อเริ่มทำรายการ</p>
                            )}
                        </div>

                        {/* Modals */}
                        {isDeleteConfirmOpen && (<ConfirmModal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={handleConfirmDelete} title="คุณต้องการลบข้อมูลนี้หรือไม่?" iconSrc="/images/alert.png" />)}
                        {alertMessage && (<AlertModal isOpen={!!alertMessage} message={alertMessage} type={alertType ?? "error"} iconSrc={alertType === "success" ? "/images/check.png" : "/images/close.png"} />)}

                        {/* ✅ Evaluation Modal */}
                        <EvaluationModal
                            isOpen={isEvalModalOpen}
                            onClose={() => {
                                setIsEvalModalOpen(false);
                                setPendingData(null); // ยกเลิกรายการถ้าปิด Modal
                            }}
                            onSubmit={handleFinalSubmit}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default UsersSummary;