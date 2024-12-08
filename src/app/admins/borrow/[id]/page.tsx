"use client";

import React, { useEffect, useState } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import AlertModal from "@/components/AlertModal";

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
    const router = useRouter();
    const [borrow, setBorrow] = useState<Borrow | null>(null);
    const [borrowQuantity, setBorrowQuantity] = useState<number>(1);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);


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
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    const showAlert = (message: string, type: "success" | "error") => {
        setAlertMessage(message);
        setAlertType(type);

        setTimeout(() => {
            setAlertMessage(null);
        }, 3000);
    };


    if (!borrow) {
        return <p>Loading borrow details...</p>;
    }

    const handleBorrow = async () => {
        if (borrowQuantity <= 0) {
            setAlertMessage("จำนวนต้องมากกว่า 0");
            setAlertType("error");
            return;
        }
        if (borrowQuantity > borrow.quantity) {
            setAlertMessage(`ไม่สามารถยืมเกิน ${borrow.quantity} ได้`);
            setAlertType("error");
            return;
        }

        try {
            if (!session || !session.user) {
                setAlertMessage("คุณต้องเข้าสู่ระบบก่อนดำเนินการ");
                setAlertType("error");
                return;
            }
        
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
                setAlertMessage(`Error: ${errorData.message}`);
                setAlertType("error");
                return;
            }
        
            setAlertMessage(`เพิ่มรายการสำเร็จ: ${borrowQuantity} ${borrow.unit}`);
            setAlertType("success");
            setTimeout(() => {
                router.push("/admins/borrow");
            }, 3000);
        } catch (error) {
            setAlertMessage("เกิดข้อผิดพลาดในการเพิ่มรายการ");
            setAlertType("error");
        }
        
    };


    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 flex">
                        <div className="w-1/2 pr-4">
                            <div className="relative overflow-hidden rounded-lg shadow-md h-full">
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
                        </div>

                        <div className="w-1/2 pl-4 flex flex-col justify-start">
                            <h1 className="text-2xl font-bold text-gray-800 mb-4">{borrow.borrow_name}</h1>

                            {/* Details */}
                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    ประเภท: <span>{borrow.type?.name || "ไม่มีประเภท"}</span>
                                </p>
                                <p className="text-gray-600">
                                    คงเหลือ:{" "}
                                    <span className="text-[#fb8124] font-bold">{borrow.quantity}</span>
                                </p>
                                <div>
                                    <p className="text-gray-600 font-medium mb-2">คำอธิบาย:</p>
                                    <p className="text-gray-700">{borrow.description || "ไม่มีคำอธิบาย"}</p>
                                </div>
                            </div>

                            {/* Input and Buttons */}
                            <div className="mt-6 flex items-center space-x-4">
                                <input
                                    type="number"
                                    min={1}
                                    max={borrow.quantity}
                                    value={borrowQuantity}
                                    onChange={(e) => setBorrowQuantity(Number(e.target.value))}
                                    className="w-2/4 px-4 py-2 border rounded-md text-center focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    placeholder="จำนวน"
                                />
                            </div>
                            <div className="mt-6 flex items-center space-x-4">
                                <button
                                    className="bg-[#fb8124] text-white px-4 py-2 rounded-md hover:bg-[#fb8124]"
                                    onClick={handleBorrow}
                                >
                                    เพิ่มรายการ
                                </button>
                                <button
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                    onClick={() => router.push("/admins/borrow")}
                                >
                                    ย้อนกลับ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {alertMessage && (
                    <AlertModal
                        isOpen={!!alertMessage}
                        message={alertMessage}
                        type={alertType ?? 'error'}
                        iconSrc={alertType === 'success' ? '/images/check.png' : '/images/close.png'}
                    />
                )}

            </div>
        </div>

    );
}

export default AdminsBorrowDetail;