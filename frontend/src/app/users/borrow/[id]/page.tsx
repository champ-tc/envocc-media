"use client";

import React, { useEffect, useState } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter, useParams } from "next/navigation"; // เพิ่ม useParams
import Navbar from "@/components/NavbarUser";
import AlertModal from "@/components/AlertModal";
import Image from "next/image";

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

function UsersBorrowDetail() {
    const { session, isLoading } = useAuthCheck("user");
    const router = useRouter();
    const { id } = useParams(); // ดึง id จาก URL
    const [borrow, setBorrow] = useState<Borrow | null>(null);
    const [borrowQuantity, setBorrowQuantity] = useState<number>(1);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

    useEffect(() => {
        const fetchBorrow = async () => {
            try {
                const response = await fetch(`/api/borrows/${id}`);
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
    }, [session, id]);

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
            showAlert("จำนวนต้องมากกว่า 0", "error");
            return;
        }
        if (borrowQuantity > borrow.quantity) {
            showAlert(`ไม่สามารถยืมเกิน ${borrow.quantity} ได้`, "error");
            return;
        }

        try {
            if (!session || !session.user) {
                showAlert("คุณต้องเข้าสู่ระบบก่อนดำเนินการ", "error");
                return;
            }

            const response = await fetch("/api/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    borrowId: borrow.id,
                    requisition_type: 2,
                    quantity: borrowQuantity,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                showAlert(errorData.message || "เกิดข้อผิดพลาด", "error");
                return;
            }

            showAlert(`เพิ่มรายการสำเร็จ ${borrowQuantity} รายการ`, "success");
            setTimeout(() => {
                router.push("/admins/borrow");
            }, 3000);
        } catch (error) {
            console.error("Error in handleBorrow:", error);
            showAlert("เกิดข้อผิดพลาดในการเพิ่มรายการ", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#f3e5f5]">
            <Navbar />
            <div className="relative flex flex-col items-center">
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex items-start justify-center p-2">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 flex">
                            <div className="w-1/2 pr-4">
                                <div className="relative overflow-hidden rounded-lg shadow-md h-full">
                                    {borrow.borrow_images ? (
                                        <Image
                                            src={`/borrows/${borrow.borrow_images}`}
                                            alt={borrow.borrow_name}
                                            className="w-full h-full object-cover"
                                            width={24}
                                            height={24}
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

                                <div className="mt-6 flex items-center space-x-4">
                                    <input
                                        type="number"
                                        min={1}
                                        max={borrow.quantity}
                                        value={borrowQuantity}
                                        onChange={(e) => setBorrowQuantity(Number(e.target.value))}
                                        className="w-2/4 px-4 py-2 border rounded-md text-center focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                        placeholder="จำนวน"
                                    />
                                </div>
                                <div className="mt-6 flex items-center space-x-4">
                                    <button
                                        className="bg-[#9063d2] hover:bg-[#8753d5] text-white px-4 py-2 rounded-md"
                                        onClick={handleBorrow}
                                    >
                                        เพิ่มรายการ
                                    </button>
                                    <button
                                        className="bg-[#f3e5f5] hover:bg-[#8753d5] text-white px-4 py-2 rounded-md"
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
                            type={alertType ?? "error"}
                            iconSrc={alertType === "success" ? "/images/check.png" : "/images/close.png"}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default UsersBorrowDetail;
