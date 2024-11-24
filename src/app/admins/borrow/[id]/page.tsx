"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthCheck from "@/hooks/useAuthCheck";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";

interface Borrow {
    id: number;
    borrow_name: string;
    borrow_images?: string;
    type: {
        name: string;
    };
    quantity: number;
    reserved_quantity: number;
    unit: string;
    description?: string | null;
}

function AdminsBorrowDetail({ params }: { params: { id: string } }) {
    const { session, isLoading } = useAuthCheck("admin");
    const [borrow, setBorrow] = useState<Borrow | null>(null);
    const [borrowQuantity, setBorrowQuantity] = useState<number>(1); // ค่าเริ่มต้นของจำนวนที่ยืม
    const router = useRouter();

    useEffect(() => {
        const fetchBorrow = async () => {
            try {
                const response = await fetch(`/api/borrows/${params.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch borrow details");
                }
                const data: Borrow = await response.json();
                setBorrow(data);
            } catch (error) {
                console.error("Error fetching borrow details:", error);
            }
        };

        if (session) {
            fetchBorrow();
        }
    }, [session, params.id]);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!session) {
        return null;
    }

    if (!borrow) {
        return <p>Loading borrow details...</p>;
    }

    const handleBorrow = async () => {
        if (borrowQuantity <= 0) {
            alert("จำนวนต้องมากกว่า 0");
            return;
        }
        if (borrowQuantity > borrow.quantity) {
            alert(`ไม่สามารถยืมเกิน ${borrow.quantity} ได้`);
            return;
        }

        try {
            const response = await fetch("/api/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: session.user.id, // ดึง userId จาก session
                    borrowId: borrow.id,
                    requisition_type: 2, // ระบุว่าเป็นการยืม (type = 2)
                    quantity: borrowQuantity,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
                return;
            }

            const order = await response.json();
            alert(`เพิ่มรายการสำเร็จ: ${borrowQuantity} ${borrow.unit}`);
            router.push("/admins/borrow"); // เปลี่ยนเส้นทางหลังจากเพิ่มสำเร็จ
        } catch (error) {
            console.error("Error creating order:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มรายการ");
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
                        {/* ส่วนหัว */}
                        <h2 className="text-center text-xl font-bold mt-4">{borrow.borrow_name}</h2>
                        {/* รูปภาพ */}
                        <div className="relative w-full h-64 bg-gray-200 overflow-hidden mt-4">
                            {borrow.borrow_images ? (
                                <img
                                    src={`/borrows/${borrow.borrow_images}`}
                                    alt={borrow.borrow_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    ไม่มีรูปภาพ
                                </div>
                            )}
                        </div>
                        {/* รายละเอียด */}
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>ประเภท:</strong> {borrow.type?.name || "ไม่มีประเภท"}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>คงเหลือ:</strong>{" "}
                                <span className="text-green-600 font-bold">
                                    {borrow.quantity}
                                </span>
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                <strong>คำอธิบาย:</strong>{" "}
                                {borrow.description || "ไม่มีคำอธิบาย"}
                            </p>

                            {/* ช่องกรอกจำนวน */}
                            <div className="flex items-center space-x-4 mb-4">
                                <input
                                    type="number"
                                    className="border rounded-md w-16 p-2 text-center text-sm"
                                    min="1"
                                    max={borrow.quantity}
                                    value={borrowQuantity}
                                    onChange={(e) =>
                                        setBorrowQuantity(Number(e.target.value))
                                    }
                                />
                                <span>{borrow.unit}</span>
                            </div>

                            {/* ปุ่ม */}
                            <div className="flex items-center justify-between">
                                <button
                                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                    onClick={() => router.push("/admins/borrow")}
                                >
                                    ย้อนกลับ
                                </button>
                                <button
                                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                                    onClick={handleBorrow}
                                >
                                    เพิ่มรายการ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsBorrowDetail;