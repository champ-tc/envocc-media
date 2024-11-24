"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

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


function RequisitionSummary() {
    const { data: session } = useSession();
    const router = useRouter();
    const [selectedAction, setSelectedAction] = useState(""); // สำหรับแยก Requisition และ Borrow
    const [returnDate, setReturnDate] = useState(""); // วันที่คืนสำหรับ borrow
    const [deliveryMethod, setDeliveryMethod] = useState("self"); // วิธีการจัดส่ง
    const [address, setAddress] = useState(""); // ที่อยู่สำหรับการจัดส่ง
    const [orders, setOrders] = useState<Order[]>([]); // กำหนด Type เป็น Order[]


    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch(`/api/order?userId=${session?.user?.id}`);
                if (!response.ok) throw new Error("Error fetching orders");
                const data = await response.json();
                setOrders(data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };

        if (session?.user?.id) {
            fetchOrders();
        }
    }, [session?.user?.id]);

    const handleDeleteOrder = async (orderId: number) => { // กำหนดชนิดข้อมูลเป็น number
        const confirmDelete = window.confirm("คุณต้องการลบรายการนี้หรือไม่?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/order/${orderId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete order");

            setOrders((prev) => prev.filter((order) => order.id !== orderId));
            alert("ลบรายการสำเร็จ");
        } catch (error) {
            console.error("Error deleting order:", error);
            alert("เกิดข้อผิดพลาดในการลบรายการ");
        }
    };


    const handleSubmitRequisition = async () => {
        try {
            const response = await axios.post("/api/requisition_log/${id}", {
                userId: session?.user?.id,
                orders: orders
                    .filter((order) => order.requisition) // ตรวจสอบเฉพาะรายการที่มี requisition
                    .map((order) => ({
                        requisitionId: order.requisition?.id, // ใช้ optional chaining
                        quantity: order.quantity,
                    })),
                deliveryMethod,
                address: deliveryMethod === "delivery" ? address : null,
            });

            alert("บันทึกการเบิกสำเร็จ!");
            setOrders([]);
            router.push("/admins/requisition_summary");
        } catch (error) {
            console.error("Error submitting requisition:", error);
            alert("เกิดข้อผิดพลาดในการเบิกของ");
        }
    };


    const handleSubmitBorrow = async () => {
        if (!returnDate) {
            alert("กรุณากรอกวันที่คืน");
            return;
        }

        try {
            const response = await axios.post("/api/borrow_log/${id}", {
                userId: session?.user?.id,
                orders: orders
                    .filter((order) => order.borrow) // กรองเฉพาะที่มี borrow
                    .map((order) => ({
                        borrowId: order.borrow?.id, // ใช้ optional chaining
                        quantity: order.quantity,
                    })),
                deliveryMethod,
                address: deliveryMethod === "delivery" ? address : null,
                returnDate, // ส่งวันที่คืน
            });

            alert("บันทึกการยืมสำเร็จ!");
            setOrders([]);
            router.push("/admins/requisition_summary");
        } catch (error) {
            console.error("Error submitting borrow:", error);
            alert("เกิดข้อผิดพลาดในการยืมของ");
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
                <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                    <h1 className="text-2xl font-bold mb-4">รายการ</h1>

                    {/* ตัวเลือกระหว่าง Requisition และ Borrow */}
                    <div className="mb-4 flex space-x-4">
                        <button
                            onClick={() => setSelectedAction("requisition")}
                            className={`py-2 px-4 rounded-md text-white ${selectedAction === "requisition"
                                    ? "bg-blue-500"
                                    : "bg-gray-300 hover:bg-gray-400"
                                }`}
                        >
                            เบิกของ (Requisition)
                        </button>
                        <button
                            onClick={() => setSelectedAction("borrow")}
                            className={`py-2 px-4 rounded-md text-white ${selectedAction === "borrow"
                                    ? "bg-blue-500"
                                    : "bg-gray-300 hover:bg-gray-400"
                                }`}
                        >
                            ยืมของ (Borrow)
                        </button>
                    </div>

                    {selectedAction ? (
                        <>
                            <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className="py-3 px-4 text-left">ชื่อรายการ</th>
                                        <th className="py-3 px-4 text-left">จำนวน</th>
                                        <th className="py-3 px-4 text-left">ลบ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length > 0 ? (
                                        filteredOrders.map((order) => (
                                            <tr key={order.id} className="border-b">
                                                <td className="py-3 px-4">
                                                    {order.requisition
                                                        ? order.requisition.requisition_name
                                                        : order.borrow?.borrow_name || "ไม่มีข้อมูล"}
                                                </td>
                                                <td className="py-3 px-4">{order.quantity}</td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteOrder(order.id)
                                                        }
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        ลบ
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
                                    <input
                                        type="date"
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                            )}

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
                                onClick={
                                    selectedAction === "requisition"
                                        ? handleSubmitRequisition
                                        : handleSubmitBorrow
                                }
                                disabled={filteredOrders.length === 0} // ปิดปุ่มถ้าไม่มีรายการ
                                className={`mt-6 py-2 px-4 rounded-md transition ${filteredOrders.length === 0
                                        ? "bg-gray-300 cursor-not-allowed text-gray-500" // สไตล์ปุ่มถูกปิด
                                        : "bg-green-500 text-white hover:bg-green-600" // สไตล์ปุ่มปกติ
                                    }`}
                            >
                                {selectedAction === "requisition"
                                    ? "บันทึกการเบิก"
                                    : "บันทึกการยืม"}
                            </button>

                        </>
                    ) : (
                        <p className="text-center text-gray-500 mt-4">
                            กรุณาเลือกระหว่างเบิกของหรือยืมของ
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RequisitionSummary;