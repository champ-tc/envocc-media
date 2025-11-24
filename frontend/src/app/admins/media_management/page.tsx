"use client";

import React, { useEffect, useState, useCallback } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from "axios";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";
import Image from "next/image";

interface Requisition {
    id: number;
    requisition_name: string;
    requisition_images?: string | null;
    unit: string;
    type_id: number;
    quantity: number;
    reserved_quantity?: number;
    is_borro_restricted: boolean;
    description?: string;
    status: number;
    createdAt: string;
}


interface Type {
    id: number;
    name: string;
}

function AdminsMedia_management() {
    const { isLoading } = useAuthCheck("admin");
    const [currentQuantity, setCurrentQuantity] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [requisitionImage, setRequisitionImage] = useState<File | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);


    const [editedImage, setEditedImage] = useState<File | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    const [types, setTypes] = useState<Type[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(false);

    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


    const [newRequisition, setNewRequisition] = useState<Requisition>({
        id: 0,
        requisition_name: '',
        unit: '',
        type_id: 0,
        quantity: 0,
        reserved_quantity: 0,
        is_borro_restricted: false,
        description: '',
        status: 1,
        createdAt: new Date().toISOString(),
    });

    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    // const [alertType, setAlertType] = useState<"success" | "error" | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | "warning" | null>(null);


    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false); // Modal ยืนยันการลบ
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<Requisition | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null); // ID ของข้อมูลที่เลือกสำหรับการลบ
    const [isEnableConfirmOpen, setIsEnableConfirmOpen] = useState(false); // ใช้สำหรับ Modal เปิดการใช้งาน
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0); // 🔥 เก็บจำนวนข้อมูลทั้งหมด
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;




    // 1. ครอบฟังก์ชันด้วย useCallback และใส่ currentPage เป็น dependency
    const fetchRequisitions = useCallback(async () => {
        try {
            const response = await axios.get(`/api/requisition?page=${currentPage}&limit=${itemsPerPage}`);
            if (response.status === 200) {
                setRequisitions(response.data.items || []);
                setTotalPages(response.data.totalPages);
                setTotalRecords(response.data.totalRecords);
            }
        } catch {
            console.log("Error fetching requisitions");
        }
    }, [currentPage]);


    useEffect(() => {
        fetchRequisitions();
        fetchTypes();
    }, [fetchRequisitions]);


    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const fetchTypes = async () => {
        try {
            const response = await axios.get("/api/type");
            if (response.status === 200 && Array.isArray(response.data.items)) {
                setTypes(response.data.items); // ✅ ใช้ response.data.items ซึ่งเป็น array
            } else {
                setTypes([]); // ป้องกัน error ถ้าข้อมูลผิด
            }
        } catch {
            setTypes([]); // กำหนดค่าเริ่มต้นเป็นอาร์เรย์ว่าง
        }
    };


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
            setAlertType(null);
        }, 3000);
    };

    const handleImageClick = (filename: string) => {
        setSelectedImage(`/requisitions/${filename}`);
    };

    const handleQuantityChange = (value: number) => {
        setNewRequisition(prevState => {
            const reservedQuantity = Math.round(value * 0.01);
            return {
                ...prevState,
                quantity: value,
                reserved_quantity: reservedQuantity
            };
        });
    };

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setImage: React.Dispatch<React.SetStateAction<File | null>>
    ) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return; // ป้องกันคลิกซ้ำ
        setIsSubmitting(true);     // เริ่มกำลังส่ง

        // ตรวจสอบข้อมูลจำเป็น
        if (!newRequisition.requisition_name || !newRequisition.unit || newRequisition.type_id === 0 || newRequisition.quantity === 0) {
            setAlertMessage("กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อสื่อ, หน่วยนับ, ประเภท, และจำนวนคงเหลือ");
            setAlertType("error");
            setIsSubmitting(false);
            return;
        }

        if (!requisitionImage) {
            setAlertMessage("กรุณาเลือกไฟล์รูปภาพ");
            setAlertType("error");
            setIsSubmitting(false);
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (requisitionImage.size > maxSize) {
            setAlertMessage("ไฟล์มีขนาดเกิน 10MB");
            setAlertType("error");
            setIsSubmitting(false);
            return;
        }

        const reservedQuantity = Math.round(newRequisition.quantity * 0.01);
        const adjustedQuantity = newRequisition.quantity - reservedQuantity;

        const formData = new FormData();
        formData.append("file", requisitionImage);
        formData.append("requisition_name", newRequisition.requisition_name);
        formData.append("unit", newRequisition.unit);
        formData.append("type_id", newRequisition.type_id.toString());
        formData.append("quantity", adjustedQuantity.toString());
        formData.append("reserved_quantity", reservedQuantity.toString());
        formData.append("description", newRequisition.description || "");

        try {
            const response = await axios.post("/api/requisition", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.status === 200) {
                setRequisitions([...requisitions, response.data]);
                showAlert("เพิ่มข้อมูลสำเร็จ!", "success");
                setShowModal(false);

                setNewRequisition({
                    id: 0,
                    requisition_name: "",
                    unit: "",
                    type_id: 0,
                    quantity: 0,
                    reserved_quantity: 0,
                    is_borro_restricted: false,
                    description: "",
                    status: 1,
                    createdAt: new Date().toISOString(),
                });

                setRequisitionImage(null);
                const fileInput = document.querySelector("input[type='file']");
                if (fileInput) {
                    (fileInput as HTMLInputElement).value = "";
                }
            }
        } catch {
            showAlert("เกิดข้อผิดพลาดในการเพิ่มข้อมูล", "error");
        } finally {
            setIsSubmitting(false); // ปลดล็อกการกด
        }
    };


    const handleEditRequest = (req: Requisition) => {
        setSelectedType(req); // เก็บข้อมูล requisition ที่ต้องการแก้ไข
        setIsEditConfirmOpen(true); // เปิด Modal เพื่อยืนยัน
    };

    const handleEditConfirm = () => {
        setIsEditConfirmOpen(false); // ปิด Modal ยืนยัน
        if (selectedType) { // ตรวจสอบว่า selectedType ไม่เป็น null
            openEditModal(selectedType); // เปิด Modal สำหรับแก้ไขข้อมูล
        } else {
            console.error("selectedType is null"); // Debugging ถ้า selectedType เป็น null
        }
    };

    const openEditModal = (req: Requisition) => {
        setNewRequisition(req); // ตั้งค่า requisition ใหม่
        setEditedImage(null); // รีเซ็ตภาพที่แก้ไข
        setCurrentImage(req.requisition_images || null); // ตั้งค่าภาพปัจจุบัน
        setCurrentQuantity(req.quantity); // ตั้งค่า currentQuantity จาก requisition
        setEditModal(true); // เปิด Modal
    };


    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ตรวจสอบจำนวนเดิม
        if (currentQuantity === null) {
            showAlert("เกิดข้อผิดพลาด: จำนวนเดิมไม่สามารถระบุได้", "error");
            return;
        }

        // ค้นหา requisition ปัจจุบัน
        const currentRequisition = requisitions.find((req) => req.id === newRequisition.id);
        if (!currentRequisition) {
            showAlert("ไม่พบข้อมูลรายการในระบบ", "error");
            return;
        }

        // ตรวจสอบการเปลี่ยนแปลง
        const hasChanges =
            newRequisition.requisition_name !== currentRequisition.requisition_name ||
            newRequisition.unit !== currentRequisition.unit ||
            newRequisition.type_id !== currentRequisition.type_id ||
            newRequisition.quantity !== currentRequisition.quantity ||
            newRequisition.reserved_quantity !== currentRequisition.reserved_quantity ||
            newRequisition.description !== currentRequisition.description ||
            newRequisition.is_borro_restricted !== currentRequisition.is_borro_restricted ||
            editedImage !== null;

        if (!hasChanges) {
            showAlert("ไม่มีการเปลี่ยนแปลงข้อมูล", "error");
            setEditModal(false);
            resetForm();
            return;
        }

        // ตรวจสอบว่าจำนวนใหม่ไม่ต่ำกว่าจำนวนเดิม
        if (newRequisition.quantity < currentQuantity) {
            showAlert("ไม่สามารถลดจำนวนให้น้อยกว่าจำนวนปัจจุบันได้", "error");
            setEditModal(false);
            resetForm();
            return;
        }

        // แสดงข้อความ "กำลังบันทึก"
        showAlert("กำลังบันทึกการแก้ไข...", "success");

        try {
            // เตรียมข้อมูล FormData
            const formData = new FormData();
            formData.append("requisition_name", newRequisition.requisition_name);
            formData.append("unit", newRequisition.unit);
            formData.append("type_id", newRequisition.type_id.toString());
            formData.append("quantity", newRequisition.quantity.toString());
            formData.append("reserved_quantity", (newRequisition.reserved_quantity || 0).toString());
            formData.append("description", newRequisition.description || "");
            formData.append("is_borro_restricted", String(newRequisition.is_borro_restricted));

            // ตรวจสอบไฟล์ที่ต้องการส่ง
            if (editedImage) {
                formData.append("file", editedImage);
            } else if (currentImage) {
                formData.append("requisition_images", currentImage);
            }

            // ส่งข้อมูลไปยัง API
            const response = await axios.put(
                `/api/requisition/${newRequisition.id}?action=updateDetails`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // ตรวจสอบการตอบกลับ
            if (response.status === 200) {
                // อัปเดต requisitions ใน state
                setRequisitions((prev) =>
                    prev.map((req) => (req.id === newRequisition.id ? response.data : req))
                );
                setEditModal(false);
                showAlert("แก้ไขข้อมูลสำเร็จ!", "success");
                resetForm();
            } else {
                showAlert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล", "error");
            }
        } catch {
            showAlert("ไม่สามารถแก้ไขข้อมูลได้", "error");
        }
    };

    const resetForm = () => {
        setNewRequisition({
            id: 0,
            requisition_name: '',
            unit: '',
            type_id: 0,
            quantity: 0,
            reserved_quantity: 0,
            is_borro_restricted: false,
            description: '',
            status: 1,
            createdAt: new Date().toISOString(),
        });
    };


    const openDeleteConfirm = (id: number) => {
        setSelectedId(id); // เก็บ ID ของรายการที่ต้องการปิดการใช้งาน
        setIsDeleteConfirmOpen(true); // เปิด Modal ยืนยัน
    };

    const openEnableConfirm = (id: number) => {
        setSelectedId(id); // เก็บ ID ของรายการที่ต้องการเปิดการใช้งาน
        setIsEnableConfirmOpen(true); // เปิด Modal ยืนยัน
    };


    const handleDelete = async () => {
        if (!selectedId) return; // ตรวจสอบว่า selectedId มีค่า

        try {
            const response = await axios.put(`/api/requisition/${selectedId}?action=updateStatus`, {
                status: 0, // เปลี่ยน status เป็น 0 (ปิดการใช้งาน)
            });

            if (response.status === 200) {
                setRequisitions((prev) =>
                    prev.map((req) => (req.id === selectedId ? { ...req, status: 0 } : req))
                );
                setAlertMessage("ปิดการใช้งานสำเร็จ!");
                setAlertType("success");
            }
        } catch {
            setAlertMessage("เกิดข้อผิดพลาดในการปิดการใช้งาน");
            setAlertType("error");
        } finally {
            setIsDeleteConfirmOpen(false); // ปิด Modal
            setTimeout(() => {
                setAlertMessage(null);
                setAlertType(null);
            }, 5000); // ตั้งเวลาให้แจ้งเตือนหายไป
        }
    };


    const handleEnable = async () => {
        if (!selectedId) return; // ตรวจสอบว่า selectedId มีค่า

        try {
            const response = await axios.put(`/api/requisition/${selectedId}?action=updateStatus`, {
                status: 1, // เปลี่ยน status เป็น 1 (เปิดการใช้งาน)
            });

            if (response.status === 200) {
                setRequisitions((prev) =>
                    prev.map((req) => (req.id === selectedId ? { ...req, status: 1 } : req))
                );
                setAlertMessage("เปิดการใช้งานสำเร็จ!");
                setAlertType("success");
            }
        } catch {
            setAlertMessage("เกิดข้อผิดพลาดในการเปิดการใช้งาน");
            setAlertType("error");
        }
    };


    const openPermanentDeleteConfirm = (id: number) => {
        setSelectedDeleteId(id);
        setIsDeleteModalOpen(true);
    };


    const handlePermanentDelete = async () => {
        if (!selectedDeleteId) return;

        try {
            const response = await axios.delete(`/api/requisition/${selectedDeleteId}`);

            if (response.status === 200) {
                setRequisitions((prev) => prev.filter((req) => req.id !== selectedDeleteId));
                setAlertMessage("ลบสื่อสำเร็จ!");
                setAlertType("success");
            }
        } catch {
            setAlertMessage("เกิดข้อผิดพลาดในการลบสื่อ");
            setAlertType("error");
        } finally {
            setIsDeleteModalOpen(false);
            setTimeout(() => {
                setAlertMessage(null);
                setAlertType(null);
            }, 5000);
        }
    };



    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">เบิกสื่อ</h2>

                        <button onClick={() => setShowModal(true)} className="mb-4 bg-[#9063d2] hover:bg-[#8753d5] text-white py-2 px-4 rounded-md transition">+เพิ่มเบิก</button>

                        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                            <thead>
                                <tr className="bg-[#9063d2] text-white text-left text-sm uppercase font-semibold tracking-wider">
                                    <th className="border px-4 py-2" style={{ width: "7%" }}>รูปภาพ</th>
                                    <th className="border px-4 py-2" style={{ width: "13%" }}>ชื่อสื่อ</th>
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>หน่วยนับ</th>
                                    <th className="border px-4 py-2" style={{ width: "12%" }}>ประเภท</th>
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>จำนวนคงเหลือ</th>
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>จำนวนที่เก็บ</th>
                                    <th className="border px-4 py-2" style={{ width: "13%" }}>คำอธิบาย</th>
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>เบิก</th>
                                    <th className="border px-4 py-2" style={{ width: "15%" }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                                {requisitions.length > 0 ? (
                                    requisitions.map((req) => (
                                        <tr key={req.id}>
                                            <td className="p-2 py-2 border">
                                                {req.requisition_images ? (
                                                    <Image
                                                        src={`/requisitions/${req.requisition_images}`}
                                                        // src={`/filerequisitions/${req.requisition_images}`}
                                                        alt={req.requisition_name}
                                                        className="w-16 h-16 object-cover cursor-pointer"
                                                        onClick={() => req.requisition_images && handleImageClick(req.requisition_images)}
                                                        width={40}
                                                        height={40}
                                                        priority
                                                    />
                                                ) : (
                                                    "ไม่มีรูปภาพ"
                                                )}
                                            </td>
                                            <td className="p-2 border">{req.requisition_name}</td>
                                            <td className="p-2 border">{req.unit}</td>
                                            <td className="p-2 border">
                                                {Array.isArray(types) && types.length > 0
                                                    ? types.find((type) => type.id === req.type_id)?.name || "ไม่พบประเภท"
                                                    : "กำลังโหลด..."}
                                            </td>

                                            <td className="p-2 border">{req.quantity.toLocaleString()}</td>
                                            <td className="p-2 border">{req.reserved_quantity ? req.reserved_quantity.toLocaleString() : 0}</td>
                                            <td className="p-2 border">{req.description || "-"}</td>
                                            <td className="p-2 border">
                                                {req.is_borro_restricted ? "ห้ามเบิก" : "เบิกได้"}
                                            </td>
                                            <td className="p-2 border">
                                                <button onClick={() => handleEditRequest(req)} className="mb-4 py-2 px-2 mr-2 rounded-md transition">
                                                    <Image
                                                        src="/images/edit.png"
                                                        alt="Edit Icon"
                                                        className="h-6 w-6"
                                                        width={40}
                                                        height={40}
                                                        priority
                                                    />
                                                </button>
                                                {req.status === 1 ? (
                                                    <button
                                                        onClick={() => openDeleteConfirm(req.id)}
                                                        className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                                        title="ปิดใช้งาน"
                                                    >
                                                        <Image
                                                            src="/images/turn-on.png"
                                                            alt="Turn Off Icon"
                                                            className="h-6 w-6"
                                                            width={40}
                                                            height={40}
                                                            priority
                                                        />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openEnableConfirm(req.id)}
                                                        className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                                        title="เปิดใช้งาน"
                                                    >
                                                        <Image
                                                            src="/images/turn-off.png"
                                                            alt="Turn On Icon"
                                                            className="h-6 w-6"
                                                            width={40}
                                                            height={40}
                                                            priority
                                                        />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openPermanentDeleteConfirm(req.id)}
                                                    className="py-2 px-2 mr-2 rounded-md transition"
                                                    title="ลบถาวร"
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
                                        <td colSpan={9} className="text-center py-4">ไม่มีข้อมูลรายการ</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                {
                                    (() => {
                                        const startIndex = (currentPage - 1) * itemsPerPage + 1;
                                        const endIndex = Math.min(startIndex + requisitions.length - 1, totalRecords);
                                        return `รายการที่ ${startIndex} ถึง ${endIndex} จาก ${totalRecords} รายการ`;
                                    })()
                                }
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                                >
                                    ก่อนหน้า
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#9063d2] text-white" : "bg-gray-200 text-gray-600"} hover:bg-[#9063d2] hover:text-white transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>

                        {selectedImage && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 flex flex-col items-center">
                                    <div className="w-full flex justify-center">
                                        <Image
                                            src={selectedImage}
                                            alt="Selected"
                                            width={1000}
                                            height={600}
                                            className="w-auto h-auto max-h-[75vh] object-contain"
                                            priority
                                        />
                                    </div>
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="mt-4 bg-red-500 text-white py-2 px-4 rounded-lg"
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        )}


                        {showModal && (
                            <div className="modal fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                                <div className="modal-box w-full max-w-md bg-white p-6 rounded-lg shadow-md max-h-[95vh]">
                                    <h2 className="text-lg font-medium mb-4 text-center text-gray-800">เพิ่มรายการเบิก</h2>
                                    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input
                                                type="text"
                                                placeholder="ชื่อสื่อ"
                                                value={newRequisition.requisition_name}
                                                onChange={(e) =>
                                                    setNewRequisition({ ...newRequisition, requisition_name: e.target.value })
                                                }
                                                className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-[#9063d2] focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">เพิ่มรูปภาพ</label>
                                            <input
                                                type="file"
                                                onChange={(e) => handleImageChange(e, setRequisitionImage)}
                                                className="block w-full text-sm p-2 text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none  dark:placeholder-gray-400"
                                            />
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">PNG, JPG (10MB)</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">หน่วยนับ</label>
                                                <input
                                                    type="text"
                                                    placeholder="หน่วยนับ"
                                                    value={newRequisition.unit}
                                                    onChange={(e) =>
                                                        setNewRequisition({ ...newRequisition, unit: e.target.value })
                                                    }
                                                    className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                                <select
                                                    value={newRequisition.type_id}
                                                    onChange={(e) =>
                                                        setNewRequisition({ ...newRequisition, type_id: Number(e.target.value) })
                                                    }
                                                    className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                >
                                                    <option value="">เลือกประเภท</option>
                                                    {types.map((type) => (
                                                        <option key={type.id} value={type.id}>
                                                            {type.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">จำนวน</label>
                                                <input
                                                    type="number"
                                                    placeholder="จำนวน"
                                                    minLength={0}
                                                    value={newRequisition.quantity}
                                                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                                                    className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">
                                                    จำนวนที่เก็บไว้ไม่ให้เบิก
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="จำนวนที่เก็บไว้ไม่ให้เบิก"
                                                    value={newRequisition.reserved_quantity}
                                                    disabled
                                                    className="w-full border border-gray-300 rounded px-3 py-1 bg-gray-100"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea
                                                placeholder="คำอธิบายเพิ่มเติม"
                                                value={newRequisition.description}
                                                onChange={(e) =>
                                                    setNewRequisition({ ...newRequisition, description: e.target.value })
                                                }
                                                className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-[#9063d2] focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className={`mb-4 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#9063d2] hover:bg-[#8753d5]"
                                                    } text-white py-2 px-4 rounded-md transition`}
                                            >
                                                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                className="mb-4 bg-[#f3e5f5] hover:bg-[#8753d5] text-white py-2 px-4 rounded-md transition"
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    </form>
                                </div>



                            </div>
                        )}

                        {editModal && (
                            <div className="modal fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
                                <div className="modal-box w-full sm:max-w-lg md:max-w-xl bg-white p-4 sm:p-6 rounded-lg shadow-md h-[90vh] overflow-y-auto">
                                    <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">แก้ไข Requisition</h2>

                                    <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                                        {/* ชื่อสื่อ */}
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input
                                                type="text"
                                                placeholder="ชื่อสื่อ"
                                                value={newRequisition.requisition_name}
                                                onChange={(e) =>
                                                    setNewRequisition({ ...newRequisition, requisition_name: e.target.value })
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                required
                                            />
                                        </div>

                                        {/* อัปโหลดรูป */}
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">อัปโหลดรูปภาพใหม่</label>
                                            <input
                                                type="file"
                                                onChange={(e) => handleImageChange(e, setEditedImage)}
                                                className="block w-full text-sm p-2 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">PNG, JPG (10MB)</p>

                                            {(currentImage || editedImage) && (
                                                <Image
                                                    src={editedImage ? URL.createObjectURL(editedImage) : `/requisitions/${currentImage}`}
                                                    alt="Preview"
                                                    className="w-20 h-20 mt-2 rounded-md border object-cover"
                                                    width={40}
                                                    height={40}
                                                    priority
                                                />
                                            )}
                                        </div>

                                        {/* หน่วยนับ + ประเภท */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">หน่วยนับ</label>
                                                <input
                                                    type="text"
                                                    value={newRequisition.unit}
                                                    onChange={(e) =>
                                                        setNewRequisition({ ...newRequisition, unit: e.target.value })
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                                <select
                                                    value={newRequisition.type_id}
                                                    onChange={(e) =>
                                                        setNewRequisition({ ...newRequisition, type_id: Number(e.target.value) })
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                >
                                                    <option value="">เลือกประเภท</option>
                                                    {types?.map((type) => (
                                                        <option key={type.id} value={type.id}>
                                                            {type.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* จำนวนคงเหลือ + ห้ามเบิก */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">จำนวนคงเหลือ</label>
                                                <input
                                                    type="number"
                                                    value={newRequisition.quantity}
                                                    onChange={(e) =>
                                                        setNewRequisition({ ...newRequisition, quantity: Number(e.target.value) })
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 mt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={newRequisition.is_borro_restricted}
                                                    onChange={(e) =>
                                                        setNewRequisition({ ...newRequisition, is_borro_restricted: e.target.checked })
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                <label className="text-sm text-gray-700">ห้ามเบิก</label>
                                            </div>
                                        </div>

                                        {/* คำอธิบาย */}
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea
                                                value={newRequisition.description}
                                                onChange={(e) =>
                                                    setNewRequisition({ ...newRequisition, description: e.target.value })
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                            />
                                        </div>

                                        {/* ปุ่ม */}
                                        <div className="flex justify-end space-x-2 pt-4">
                                            <button
                                                type="submit"
                                                className="bg-[#9063d2] hover:bg-[#8753d5] text-white py-2 px-4 rounded transition"
                                            >
                                                บันทึก
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditModal(false)}
                                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition"
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                        )}

                        {isDeleteConfirmOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
                                <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-80 h-80 max-w-5xl text-center border-2 border-orange-500">
                                    <div className="text-red-500 mb-4">
                                        <Image
                                            src="/images/alert.png"
                                            alt="Confirm Icon"
                                            className="h-40 w-40 mx-auto"
                                            width={40}
                                            height={40}
                                            priority
                                        />
                                    </div>
                                    <h2 className="text-lg font-semibold mb-4">คุณต้องการปิดข้อมูลนี้หรือไม่?</h2>
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                                            onClick={() => setIsDeleteConfirmOpen(false)} // ปิด Modal เมื่อยกเลิก
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                                            onClick={handleDelete} // เรียก handleDelete เมื่อยืนยัน
                                        >
                                            ปิด
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEnableConfirmOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
                                <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-80 h-80 max-w-5xl text-center border-2 border-orange-500">
                                    <div className="text-red-500 mb-4">
                                        <Image
                                            src="/images/alert.png"
                                            alt="Confirm Icon"
                                            className="h-40 w-40 mx-auto"
                                            width={40}
                                            height={40}
                                            priority
                                        />
                                    </div>
                                    <h2 className="text-lg font-semibold mb-4">คุณต้องการเปิดข้อมูลนี้หรือไม่?</h2>
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                                            onClick={() => setIsEnableConfirmOpen(false)} // ปิด Modal เมื่อยกเลิก
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                                            onClick={handleEnable} // เรียก handleEnable เมื่อยืนยัน
                                        >
                                            เปิด
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEditConfirmOpen && (
                            <ConfirmEditModal
                                isOpen={isEditConfirmOpen}
                                onClose={() => setIsEditConfirmOpen(false)} // ปิด Modal หากยกเลิก
                                onConfirm={handleEditConfirm} // ดำเนินการแก้ไขเมื่อยืนยัน
                                title="คุณต้องการแก้ไขข้อมูลนี้หรือไม่?"
                                iconSrc="/images/alert.png"
                            />
                        )}

                        {alertMessage && (
                            <AlertModal
                                isOpen={!!alertMessage}
                                message={alertMessage}
                                type={alertType ?? 'error'}
                                iconSrc={alertType === 'success' ? '/images/check.png' : '/images/close.png'}
                            />
                        )}

                        {isDeleteModalOpen && (
                            <AlertModal
                                isOpen={true}
                                message="ท่านต้องการลบสื่อหรือไม่? หากลบแล้วจะไม่สามารถกู้คืนได้อีก"
                                type="warning"
                                iconSrc="/images/warning.png"
                                onConfirm={handlePermanentDelete}
                                onCancel={() => setIsDeleteModalOpen(false)}
                            />
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsMedia_management;