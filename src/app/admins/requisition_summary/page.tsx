"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

function RequisitionSummary() {
    const { data: session } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [deliveryMethod, setDeliveryMethod] = useState("self");
    const [address, setAddress] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                console.log("Fetching orders for user:", session?.user?.id);
                const response = await fetch(`/api/order?userId=${session?.user?.id}`);
                if (!response.ok) throw new Error("Error fetching orders");
                const data = await response.json();
                console.log("Fetched orders:", data); // ตรวจสอบข้อมูลที่ดึงมา
                setOrders(data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };
    
        if (session?.user?.id) {
            fetchOrders();
        }
    }, [session?.user?.id]);
    

    const handleDeleteOrder = async (orderId) => {
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
        if (orders.length === 0) return;
    
        try {
            const requestedGroupId = `group${Math.floor(Math.random() * 1000)}`;
    
            // ส่งข้อมูลไปยัง API ผ่าน axios
            const response = await axios.post("/api/requisition_log", {
                userId: session?.user?.id,
                orders: orders.map((order) => ({
                    requisitionId: order.requisition?.id,  // requisitionId
                    quantity: order.quantity,             // quantity
                })),
                deliveryMethod,                          // ส่งวิธีการจัดส่ง
                address: deliveryMethod === "delivery" ? address : null,  // ส่งที่อยู่
                requestedGroupId,                        // ส่ง requested_groupid
            });
    
            console.log("Requisition submitted:", response.data);
            setOrders([]);
            setAddress("");
            setDeliveryMethod("self");
            alert("บันทึกคำขอเรียบร้อยแล้ว");
            router.push("/admins/requisition_summary");
        } catch (error) {
            console.error("Error submitting requisition:", error);
            alert("เกิดข้อผิดพลาด");
        }
    };


    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1">
                <TopBar />
                <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                    <h1 className="text-2xl font-bold mb-4">รายการที่ขอเบิก</h1>
                    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="py-3 px-4 text-left">ชื่อรายการ</th>
                                <th className="py-3 px-4 text-left">จำนวน</th>
                                <th className="py-3 px-4 text-left">ลบ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="border-b">
                                        <td className="py-3 px-4">{order.requisition?.requisition_name}</td>
                                        <td className="py-3 px-4">{order.quantity}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
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

                    {/* ปุ่มเบิกของ */}
                    <button
                        onClick={handleSubmitRequisition}
                        className={`mt-6 bg-green-500 text-white py-2 px-4 rounded-md transition ${
                            orders.length === 0 ? "bg-gray-300 cursor-not-allowed" : "hover:bg-green-600"
                        }`}
                        disabled={orders.length === 0} // ปิดการใช้งานถ้าไม่มีคำขอ
                    >
                        เบิกของ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RequisitionSummary;
