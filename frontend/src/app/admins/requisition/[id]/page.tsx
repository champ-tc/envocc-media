"use client";

import { useRouter, useParams } from "next/navigation";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import AlertModal from "@/components/AlertModal";

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

function RequisitionDetail() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();
    const params = useParams(); // ดึง params จาก URL
    const id = params?.id; // ใช้ id จาก useParams

    const [requisition, setRequisition] = useState<Requisition | null>(null);
    const [quantity, setQuantity] = useState<number>(0);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

    useEffect(() => {
        const fetchRequisition = async () => {
            try {
                if (!id) throw new Error("Invalid requisition ID");
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
        fetchRequisition();
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

            const data = await response.json();

            showAlert("เพิ่มรายการสำเร็จ!", "success");

            setTimeout(() => {
                router.push("/admins/requisition");
            }, 3000);
        } catch (error) {
            showAlert("เกิดข้อผิดพลาดในการเพิ่มรายการ", "error");
        }
    };


    if (!requisition) return <p>Loading...</p>;


    const remaining = requisition.quantity - (requisition.reserved_quantity || 0);

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />

                <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 flex lg:ml-52">
                        {/* Image Section */}
                        <div className="w-1/2 pr-4">
                            <div className="relative overflow-hidden rounded-lg shadow-md h-full">
                                <img
                                    src={requisition.requisition_images}
                                    alt={requisition.requisition_name}
                                    className="w-full h-full object-cover"
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
                                        ประเภท: <span>{requisition.type?.name || 'ไม่มีประเภท'}</span>
                                    </p>
                                </div>

                                <div className="flex justify-between">
                                    <p className="text-gray-600">
                                        คงเหลือ: <span className="text-[#fb8124] font-bold">{requisition.quantity}</span>
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
                                    onChange={(e) => {
                                        const inputQuantity = Number(e.target.value);
                                        if (inputQuantity <= remaining) {
                                            setQuantity(inputQuantity);
                                        } else {
                                            alert("จำนวนที่กรอกต้องไม่เกินจำนวนคงเหลือ");
                                        }
                                    }}
                                    className="w-2/4 px-4 py-2 border rounded-md text-center focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    placeholder="จำนวน"
                                />
                            </div>
                            <div className="mt-6 flex items-center space-x-4">
                                <button
                                    onClick={(e) => handleAddToOrder(requisition.id, quantity, e)}
                                    className="bg-[#fb8124] text-white px-4 py-2 rounded-md hover:bg-[#fb8124]"
                                >
                                    เพิ่มรายการ
                                </button>


                                <button
                                    onClick={() => window.history.back()}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
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

export default RequisitionDetail;