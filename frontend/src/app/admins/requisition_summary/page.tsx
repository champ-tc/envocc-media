"use client";

import React, { useEffect, useState, useCallback } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from "axios";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import { registerLocale } from "react-datepicker";
import { th } from "date-fns/locale/th";
import "react-datepicker/dist/react-datepicker.css";
import type { ReactDatePickerCustomHeaderProps } from "react-datepicker";
import Image from "next/image";
import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type { DatePickerProps } from "react-datepicker";

registerLocale("th", th);

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
}

interface Requisition {
    id: number;
    requisition_name: string;
}

interface Order {
    requisition?: Requisition;
    quantity: number;
}

type Reason = {
    id: number;
    reason_name: string;
};


function RequisitionSummary() {
    const { session, isLoading } = useAuthCheck("admin");

    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [returnDate, setReturnDate] = useState("");
    const [deliveryMethod, setDeliveryMethod] = useState("self");
    const [address, setAddress] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    const [usageReasonId, setUsageReasonId] = useState<number | null>(null);
    const [customUsageReasonError, setCustomUsageReasonError] = useState<string | null>(null);

    const [customUsageReason, setCustomUsageReason] = useState(""); // เก็บค่าที่พิมพ์เมื่อเลือก "อื่นๆ"
    const [reasons, setReasons] = useState<Reason[]>([]);


    const handleUsageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = Number(event.target.value); // แปลง string -> number
        setUsageReasonId(selectedValue);

        if (selectedValue !== 0) {
            setCustomUsageReason(""); // ล้างเมื่อไม่ใช่ "อื่นๆ"
        }
    };

    useEffect(() => {
        fetch("/api/reason")
            .then((res) => res.json())
            .then((data) => setReasons(data))
            .catch((error) => console.error("Error fetching reasons:", error));
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await fetch(`/api/order?userId=${session?.user?.id}`);
            if (!response.ok) throw new Error("Error fetching orders");
            const data = await response.json();
            setOrders(data);
        } catch {
            showAlert("เกิดข้อผิดพลาดในการโหลดรายการ", "error");
        }
    }, [session?.user?.id]); // dependency ที่จำเป็น

    useEffect(() => {
        if (!session?.user?.id) return;
        fetchOrders();
    }, [session?.user?.id, fetchOrders]);

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

    const handleDeleteOrder = (orderId: number) => {
        setSelectedOrderId(orderId);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedOrderId) return;

        try {
            await fetch(`/api/order/${selectedOrderId}`, {
                method: "DELETE",
            });

            setOrders((prev) => prev.filter((order) => order.id !== selectedOrderId));
            showAlert("ลบรายการสำเร็จ", "success");
        } catch {
            showAlert("เกิดข้อผิดพลาดในการลบรายการ", "error");
        } finally {
            setIsDeleteConfirmOpen(false);
            setSelectedOrderId(null);
        }
    };


    const handleSubmitRequisition = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orders || orders.length === 0) {
            showAlert("ไม่มีรายการเบิก", "error");
            return;
        }

        if (usageReasonId === null) {
            showAlert("กรุณาเลือกเหตุผลในการนำไปใช้", "error");
            return;
        }

        if (usageReasonId === 0 && !customUsageReason.trim()) {
            setCustomUsageReasonError("กรุณาระบุรายละเอียดเพิ่มเติม");
            return;
        } else {
            setCustomUsageReasonError(null); // เคลียร์ error ถ้าระบุแล้ว
        }


        if (deliveryMethod === "delivery" && !address.trim()) {
            showAlert("กรุณากรอกที่อยู่สำหรับการจัดส่ง", "error");
            return;
        }



        try {
            const formattedOrders = orders
                .filter((order: Order) => order.requisition?.id && order.quantity > 0)
                .reduce((acc, order) => {
                    const existingOrder = acc.find(o => o.requisitionId === order.requisition!.id);
                    if (existingOrder) {
                        existingOrder.quantity += order.quantity; // รวมจำนวน
                    } else {
                        acc.push({
                            requisitionId: order.requisition!.id,
                            quantity: order.quantity,
                        });
                    }
                    return acc;
                }, [] as { requisitionId: number; quantity: number }[]);

            if (formattedOrders.length === 0) {
                showAlert("ไม่มีรายการเบิกที่ถูกต้อง", "error");
                return;
            }

            // ส่งคำขอไปยัง API
            await axios.post("/api/requisition_log", {
                userId: session?.user?.id,
                orders: formattedOrders,
                deliveryMethod,
                address: deliveryMethod === "delivery" ? address : null,
                usageReasonId,
                customUsageReason: usageReasonId === 0 ? customUsageReason : null,
            });

            showAlert("บันทึกการเบิกสำเร็จ!", "success");
            setOrders([]);
            setAddress("");
            setSelectedAction(null);
            await fetchOrders();
        } catch {
            showAlert("เกิดข้อผิดพลาดในการเบิกของ", "error");
        }
    };



    const handleSubmitBorrow = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!returnDate) {
            showAlert("กรุณากรอกวันที่คืน", "error");
            return;
        }

        if (deliveryMethod === "delivery" && !address.trim()) {
            showAlert("กรุณากรอกข้อมูลที่อยู่สำหรับการจัดส่ง", "error");
            return;
        }

        if (usageReasonId === null) {
            showAlert("กรุณาเลือกเหตุผลในการนำไปใช้", "error");
            return;
        }

        if (usageReasonId === 0 && !customUsageReason.trim()) {
            showAlert("กรุณาระบุรายละเอียดเพิ่มเติม", "error");
            return;
        }

        try {
            const formattedOrders = orders
                .filter((order: Order) => order.borrow?.id && order.quantity > 0)
                .map((order: Order) => ({
                    borrowId: order.borrow!.id,
                    quantity: order.quantity,
                }));

            if (formattedOrders.length === 0) {
                showAlert("ไม่มีรายการยืมที่ถูกต้อง", "error");
                return;
            }

            await axios.post("/api/borrowlog", {
                userId: session?.user?.id,
                orders: formattedOrders,
                deliveryMethod,
                address: deliveryMethod === "delivery" ? address : null,
                returnDate,
                usageReasonId,
                customUsageReason: usageReasonId === 0 ? customUsageReason : null,
            });

            showAlert("บันทึกการยืมสำเร็จ!", "success");

            setOrders([]);
            setAddress("");
            setSelectedAction(null);
            await fetchOrders();
        } catch {
            showAlert("เกิดข้อผิดพลาดในการยืมของ", "error");
        }
    };



    const filteredOrders: Order[] =
        selectedAction === "requisition"
            ? orders.filter((order) => order.requisition)
            : selectedAction === "borrow"
                ? orders.filter((order) => order.borrow)
                : [];


    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1">
                <TopBar />

                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h1 className="text-2xl font-bold mb-4">รายการ</h1>

                        <div className="mb-4 flex space-x-4">
                            <button
                                onClick={() => setSelectedAction("requisition")}
                                className={`py-2 px-4 rounded-md text-white ${selectedAction === "requisition"
                                    ? "bg-[#9063d2]"
                                    : "bg-gray-300 hover:bg-gray-400"
                                    }`}
                            >
                                เบิกสื่อ
                            </button>
                            <button
                                onClick={() => setSelectedAction("borrow")}
                                className={`py-2 px-4 rounded-md text-white ${selectedAction === "borrow"
                                    ? "bg-[#9063d2]"
                                    : "bg-gray-300 hover:bg-gray-400"
                                    }`}
                            >
                                ยืมสื่อ
                            </button>
                        </div>

                        {selectedAction ? (
                            <>
                                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                                    <thead>
                                        <tr className="bg-[#9063d2] text-white text-left text-sm uppercase font-semibold tracking-wider">
                                            <th className="border py-3 px-4 text-left">ชื่อรายการ</th>
                                            <th className="border py-3 px-4 text-left">จำนวน</th>
                                            <th className="border py-3 px-4 text-left">ลบ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map((order) => (
                                                <tr key={order.id} className="border-b">
                                                    <td className="border py-3 px-4">
                                                        {order.requisition
                                                            ? order.requisition.requisition_name
                                                            : order.borrow?.borrow_name || "ไม่มีข้อมูล"}
                                                    </td>
                                                    <td className="border py-3 px-4">{order.quantity}</td>
                                                    <td className="border py-3 px-4">
                                                        <button
                                                            onClick={() => handleDeleteOrder(order.id)}
                                                            className="mb-4 py-2 px-2 rounded-md transition"
                                                        >
                                                            <Image
                                                                src="/images/delete.png"
                                                                alt="Delete Icon"
                                                                className="h-6 w-6"
                                                                width={40}
                                                                height={40}
                                                                priority
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-4">
                                                    ไม่มีรายการที่จะแสดง
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {selectedAction === "borrow" && (
                                    <div className="mt-4">
                                        <label className="block text-gray-700 font-semibold mb-2">
                                            วันที่คืน:
                                        </label>
                                        <DynamicDatePicker
                                            selected={returnDate ? new Date(returnDate) : null}
                                            onChange={(date: Date | null) => {
                                                if (date) {
                                                    const today = new Date();
                                                    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                                    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                                                    if (selectedDate < currentDate) {
                                                        showAlert("ไม่สามารถเลือกวันที่น้อยกว่าวันปัจจุบัน", "error");
                                                        return;
                                                    }
                                                    setReturnDate(formatSubmitDate(date));
                                                }
                                            }}
                                            locale="th" // ใช้ภาษาไทย
                                            dateFormat="dd/MM/yyyy" // รูปแบบการแสดงผล
                                            renderCustomHeader={renderCustomHeader} // ใช้ header ที่ปรับแต่ง
                                            customInput={
                                                <CustomInput
                                                    id="returnDate"
                                                    name="returnDate"
                                                    value={returnDate ? formatDisplayDate(new Date(returnDate)) : ""}
                                                />
                                            }
                                            className="datepicker-input" // เพิ่ม className สำหรับปรับแต่ง
                                            withPortal
                                            minDate={new Date()} // ห้ามเลือกวันที่น้อยกว่าวันปัจจุบัน
                                        />

                                    </div>
                                )}

                                <div className="mt-6">
                                    <label className="block text-gray-700 font-semibold mb-2">นำไปใช้เพื่ออะไร:</label>
                                    <select
                                        value={usageReasonId ?? ""}
                                        onChange={handleUsageChange}
                                        className="w-full px-4 py-2 border rounded-md"
                                    >
                                        <option value="" disabled>กรุณาเลือก...</option>
                                        {reasons.map((reason) => (
                                            <option key={reason.id} value={reason.id}>{reason.reason_name}</option>
                                        ))}
                                        <option value={0}>อื่นๆ</option> {/* 👈 เปลี่ยนจาก "อื่นๆ" เป็น value 0 */}
                                    </select>


                                    {usageReasonId === 0 && (
                                        <>
                                            <input
                                                type="text"
                                                value={customUsageReason}
                                                onChange={(e) => setCustomUsageReason(e.target.value)}
                                                className="mt-2 w-full px-4 py-2 border rounded-md"
                                                placeholder="กรุณาระบุรายละเอียด"
                                            />
                                            {customUsageReasonError && (
                                                <p className="text-red-500 text-sm mt-1">{customUsageReasonError}</p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* ตัวเลือกจัดส่ง */}
                                <div className="mt-6">
                                    <h2 className="text-lg font-semibold mb-2">เลือกวิธีการจัดส่ง:</h2>
                                    <div className="flex items-center space-x-4">
                                        <label>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="delivery"
                                                checked={deliveryMethod === "delivery"}
                                                onChange={(e) => setDeliveryMethod(e.target.value)}
                                            />
                                            <span className="ml-2">จัดส่ง</span>
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="self"
                                                checked={deliveryMethod === "self"}
                                                onChange={(e) => setDeliveryMethod(e.target.value)}
                                            />
                                            <span className="ml-2">รับเอง</span>
                                        </label>
                                    </div>

                                    {deliveryMethod === "delivery" && (
                                        <textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className="mt-4 w-full px-4 py-2 border rounded-md"
                                            placeholder="กรอกที่อยู่สำหรับการจัดส่ง"
                                        />
                                    )}
                                </div>

                                {/* ปุ่มบันทึก */}
                                <button
                                    onClick={(e) =>
                                        selectedAction === "requisition"
                                            ? handleSubmitRequisition(e)
                                            : handleSubmitBorrow(e)
                                    }
                                    disabled={filteredOrders.length === 0}
                                    className={`mt-6 py-2 px-4 rounded-md transition ${filteredOrders.length === 0
                                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                        : "bg-[#9063d2] hover:bg-[#8753d5] text-white"
                                        }`}
                                >
                                    {selectedAction === "requisition" ? "บันทึกการเบิก" : "บันทึกการยืม"}
                                </button>


                            </>
                        ) : (
                            <p className="text-center text-gray-500 mt-4">
                                กรุณาเลือกระหว่างเบิกสื่อ หรือ ยืมสื่อ
                            </p>
                        )}

                    </div>

                    {isDeleteConfirmOpen && (
                        <ConfirmModal
                            isOpen={isDeleteConfirmOpen}
                            onClose={() => setIsDeleteConfirmOpen(false)} // ปิด Modal หากยกเลิก
                            onConfirm={handleConfirmDelete} // เรียกฟังก์ชันลบเมื่อยืนยัน
                            title="คุณต้องการลบข้อมูลนี้หรือไม่?"
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
        </div>
    );
}

export default RequisitionSummary;