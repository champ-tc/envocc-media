"use client";

import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter, useParams } from "next/navigation";
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
    remaining: number;
}

function UsersRequisitionDetail() {
    const { session, isLoading } = useAuthCheck("user");
    const router = useRouter();
    const { id } = useParams();
    const [requisition, setRequisition] = useState<Requisition | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

    useEffect(() => {
        const fetchRequisition = async () => {
            try {
                const response = await fetch(`/api/requisitions/${id}`);
                if (!response.ok) throw new Error("Failed to fetch requisition data");
                const data = await response.json();
                setRequisition(data);
            } catch (error) {
                console.error("Error fetching requisition:", error);
            }
        };
        if (id) fetchRequisition();
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
        setTimeout(() => setAlertMessage(null), 3000);
    };

    const handleAddToOrder = async (
        requisitionId: number,
        qty: number,
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!requisition) return;

        const remaining = Number(requisition.remaining) || 0;
        const maxAllow = Math.max(1, Math.floor(remaining * 0.05)); // 🔧 CHANGED: 5% ของคงเหลือ (ขั้นต่ำ 1)

        if (qty <= 0) {
            showAlert("จำนวนห้ามน้อยกว่า 0", "error");
            return;
        }

        // 🔧 CHANGED: ตรวจไม่ให้เกิน 5% ของคงเหลือ
        if (qty > maxAllow) {
            showAlert(
                `ไม่สำเร็จ สามารถเบิกได้ไม่เกิน ${maxAllow} ชิ้น (5% ของคงเหลือ ${remaining})`,
                "error"
            );
            return;
        }

        try {
            const response = await fetch("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session?.user?.id,
                    requisitionId,
                    requisition_type: 1,
                    quantity: qty,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // 🔧 CHANGED: แสดงข้อความ error จากเซิร์ฟเวอร์ (ถ้ามี)
                showAlert(
                    errorData?.message ||
                    "เกิดข้อผิดพลาดในการเพิ่มรายการ (ไม่เกิน 5% ของคงเหลือ)",
                    "error"
                );
                return;
            }

            showAlert("เพิ่มรายการสำเร็จ!", "success");
            setTimeout(() => router.push("/users/requisition"), 3000);
        } catch (err) {
            console.error(err);
            showAlert("เกิดข้อผิดพลาดในการเพิ่มรายการ", "error");
        }
    };

    if (!requisition) return <p>Loading...</p>;

    const remaining = Number(requisition.remaining) || 0;
    const maxAllow = Math.max(1, Math.floor(remaining * 0.05)); // 🔧 CHANGED: ใช้ใน UI ด้วย

    return (
        <>
            <div className="min-h-screen bg-[#f3e5f5]">
                <Navbar />
                <div className="relative flex flex-col items-center">
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex items-start justify-center p-2">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 flex">
                                <div className="w-1/2 pr-4">
                                    <div className="relative overflow-hidden rounded-lg shadow-md h-auto">
                                        <Image
                                            src={requisition.requisition_images}
                                            alt={requisition.requisition_name}
                                            className="w-full h-auto object-cover"
                                            width={200}
                                            height={300}
                                            priority
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

                                        {/* <div>
                                            <p className="text-gray-600 font-medium mb-2">คำอธิบาย:</p>
                                            <p className="text-gray-700">
                                                {requisition.description || "ไม่มีคำอธิบาย"}
                                            </p>
                                        </div> */}

                                        {/* 🔧 CHANGED: สื่อสาร limit ให้ผู้ใช้ทราบ */}
                                        {/* <div className="text-sm text-gray-600">
                                            จำกัดการเบิกครั้งนี้ไม่เกิน{" "}
                                            <span className="font-semibold">{maxAllow}</span> ชิ้น
                                            (5% ของคงเหลือ {remaining})
                                        </div> */}
                                    </div>

                                    <div className="mt-6 flex items-center space-x-4">
                                        <input
                                            type="number"
                                            min={1}
                                            max={maxAllow} // 🔧 CHANGED
                                            value={quantity}
                                            onChange={(e) => {
                                                const v = Number(e.target.value);
                                                // 🔧 CHANGED: clamp ค่าใน input
                                                if (Number.isNaN(v)) {
                                                    setQuantity(1);
                                                    return;
                                                }
                                                setQuantity(Math.max(1, Math.min(maxAllow, v)));
                                            }}
                                            className="w-2/4 px-4 py-2 border rounded-md text-center focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                            placeholder="จำนวน"
                                        />
                                    </div>

                                    <div className="mt-6 flex items-center space-x-4">
                                        <button
                                            onClick={(e) =>
                                                handleAddToOrder(requisition.id, quantity, e)
                                            }
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
                                iconSrc={
                                    alertType === "success" ? "/images/check.png" : "/images/close.png"
                                }
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default UsersRequisitionDetail;
