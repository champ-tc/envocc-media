"use client";

import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter, useParams } from "next/navigation"; // เพิ่ม useParams
import Navbar from "@/components/NavbarUser";
import React, { useState, useEffect } from "react";
import AlertModal from "@/components/AlertModal";
import Image from "next/image";

interface Requisition {
    id: number;
    requisition_name: string;
    requisition_images: string;
    unit: string;
    type: { name: string };
    quantity: number;
    reserved_quantity: number;
    is_borro_restricted: boolean;
    description: string | null;
}

function UsersRequisitionDetail() {
    const { session, isLoading } = useAuthCheck("user");
    const router = useRouter();
    const { id } = useParams(); // ใช้ useParams ดึง id จาก URL
    const [requisition, setRequisition] = useState<Requisition | null>(null);
    const [quantity, setQuantity] = useState<number>(0);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

    useEffect(() => {
        const fetchRequisition = async () => {
            try {
                const response = await fetch(`/api/requisitions/${id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch requisition data");
                }
                const data = await response.json();
                setRequisition(data);
            } catch (error) {
                console.error("Error fetching requisition:", error);
            }
        };
        if (id) {
            fetchRequisition();
        }
    }, [id]);

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

    const handleAddToOrder = async (requisitionId: number, quantity: number, e: React.FormEvent) => {
        e.preventDefault();

        if (quantity <= 0) {
            showAlert("จำนวนห้ามน้อยกว่า 0", "error");
            return;
        }

        try {
            const response = await fetch("/api/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: session?.user?.id,
                    requisitionId,
                    requisition_type: 1,
                    quantity,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to add to order");
            }

            showAlert("เพิ่มรายการสำเร็จ!", "success");

            setTimeout(() => {
                router.push("/users/requisition");
            }, 3000);
        } catch {
            showAlert("เกิดข้อผิดพลาดในการเพิ่มรายการ", "error");
        }
    };

    if (!requisition) return <p>Loading...</p>;

    const remaining = requisition.quantity - (requisition.reserved_quantity || 0);

    return (
        <>
            <div className="min-h-screen bg-[#f3e5f5]">
                <Navbar />
                <div className="relative flex flex-col items-center">
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex items-start justify-center p-2">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 flex">
                                <div className="w-1/2 pr-4">
                                    <div className="relative overflow-hidden rounded-lg shadow-md h-full">
                                        <Image
                                            src={requisition.requisition_images}
                                            alt={requisition.requisition_name}
                                            className="w-full h-full object-cover"
                                            width={24}
                                            height={24}
                                        />
                                    </div>
                                </div>

                                <div className="w-1/2 pl-4 flex flex-col justify-start">
                                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                                        ชื่อสื่อ : {requisition.requisition_name}
                                    </h1>

                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <p className="text-gray-600">
                                                ประเภท: <span>{requisition.type?.name || "ไม่มีประเภท"}</span>
                                            </p>
                                        </div>

                                        <div className="flex justify-between">
                                            <p className="text-gray-600">
                                                คงเหลือ: <span className="text-[#fb8124] font-bold">{remaining}</span>
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-gray-600 font-medium mb-2">คำอธิบาย:</p>
                                            <p className="text-gray-700">
                                                {requisition.description || "ไม่มีคำอธิบาย"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center space-x-4">
                                        <input
                                            type="number"
                                            min={1}
                                            max={remaining}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="w-2/4 px-4 py-2 border rounded-md text-center focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                            placeholder="จำนวน"
                                        />
                                    </div>
                                    <div className="mt-6 flex items-center space-x-4">
                                        <button
                                            onClick={(e) => handleAddToOrder(requisition.id, quantity, e)}
                                            className="bg-[#9063d2] hover:bg-[#8753d5] text-white px-4 py-2 rounded-md"
                                        >
                                            เพิ่มรายการ
                                        </button>

                                        <button
                                            onClick={() => window.history.back()}
                                            className="bg-[#f3e5f5] hover:bg-[#8753d5] text-white px-4 py-2 rounded-md"
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
        </>
    );
}

export default UsersRequisitionDetail;