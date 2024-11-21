"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";

interface Requisition {
    id: number;
    requisition_name: string;
    requisition_images: string;
    unit: string;
    types: { name: string };
    quantity: number;
    reserved_quantity: number;
    is_borro_restricted: boolean;
    description: string | null;
}

function RequisitionDetail({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [requisition, setRequisition] = useState<Requisition | null>(null);
    const [quantity, setQuantity] = useState<number>(0);
    const { data: session } = useSession();

    useEffect(() => {
        const fetchRequisition = async () => {
            try {
                const response = await fetch(`/api/requisitions/${params.id}`);
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
    }, [params.id]);

    const handleAddToOrder = async (requisitionId: number, quantity: number) => { // กำหนดประเภทให้พารามิเตอร์
        try {
            const response = await fetch("/api/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: session?.user?.id,
                    requisitionId,
                    requisition_type: 1, // กำหนดค่าประเภทการเบิก
                    quantity,
                }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to add to order");
            }
    
            const data = await response.json();
    
            alert("เพิ่มรายการสำเร็จ!");
    
            router.push("/admins/requisition");
        } catch (error) {
            console.error("Error adding to order:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มรายการ");
            router.push("/admins/requisition");
        }
    };
    

    if (!requisition) return <p>Loading...</p>;

    // คำนวณ remaining
    const remaining = requisition.quantity - (requisition.reserved_quantity || 0);

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <TopBar />

                <div className="min-h-screen flex justify-center items-center bg-gray-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                            {requisition.requisition_name}
                        </h1>

                        {/* Image */}
                        <div className="relative overflow-hidden rounded-lg shadow-md mb-4">
                            <img
                                src={requisition.requisition_images}
                                alt={requisition.requisition_name}
                                className="w-full h-60 object-cover"
                            />
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <p className="text-gray-600 font-medium">ประเภท:</p>
                                <p className="text-gray-800 font-semibold">
                                    {requisition.types?.name || 'ไม่มีประเภท'}
                                </p>
                            </div>

                            <div className="flex justify-between">
                                <p className="text-gray-600">
                                    คงเหลือ: <span className="text-green-500">{requisition.quantity}</span>
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-600 font-medium mb-2">คำอธิบาย:</p>
                                <p className="text-gray-700">
                                    {requisition.description || "ไม่มีคำอธิบาย"}
                                </p>
                            </div>
                        </div>

                        {/* Input & Button */}
                        <div className="mt-6 flex items-center space-x-4">
                            <input
                                type="number"
                                min="1"
                                max={remaining} // ใช้ค่าคงเหลือที่คำนวณ
                                value={quantity}
                                onChange={(e) => {
                                    const inputQuantity = Number(e.target.value);
                                    if (inputQuantity <= remaining) {
                                        setQuantity(inputQuantity);
                                    } else {
                                        alert("จำนวนที่กรอกต้องไม่เกินจำนวนคงเหลือ");
                                    }
                                }}
                                className="w-1/3 px-4 py-2 border rounded-md text-center focus:ring-2 focus:ring-green-500 focus:outline-none"
                                placeholder="จำนวน"
                            />

                            <button
                                onClick={() => handleAddToOrder(requisition.id, quantity)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                            >
                                เพิ่มรายการ
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RequisitionDetail;
