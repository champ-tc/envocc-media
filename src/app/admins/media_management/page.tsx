"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from 'axios';

interface Requisition {
    id: number;
    requisition_name: string;
    requisition_images?: string;
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
    useAuth('admin');  // ตรวจสอบสิทธิ์ผู้ใช้ระดับ admin

    const { data: session, status } = useSession();
    const router = useRouter();

    const [currentQuantity, setCurrentQuantity] = useState<number | null>(null);


    const [requisitionImage, setRequisitionImage] = useState<File | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);


    const [editedImage, setEditedImage] = useState<File | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null); // เก็บชื่อรูปภาพเดิมจากฐานข้อมูล

    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [types, setTypes] = useState<Type[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(false);

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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);




    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session && session.user.role !== 'admin') {
            router.push("/");  // เปลี่ยนเส้นทางหากผู้ใช้ไม่มีสิทธิ์ admin
        }
    }, [status, session]);

    useEffect(() => {
        fetchRequisitions();
        fetchTypes();
    }, []);

    const fetchRequisitions = async () => {
        try {
            const response = await axios.get('/api/requisition');
            setRequisitions(response.data);
        } catch (error) {
            console.error('Error fetching requisitions:', error);
        }
    };

    const fetchTypes = async () => {
        try {
            const response = await axios.get('/api/type');
            setTypes(response.data);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };


    const itemsPerPage = 10;
    const totalPages = Math.ceil(requisitions.length / itemsPerPage);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginatedRequisitions, setPaginatedRequisitions] = useState<Requisition[]>([]);


    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedRequisitions(requisitions.slice(startIndex, endIndex));
    }, [currentPage, requisitions]);

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };





    const handleImageClick = (filename: string) => {
        setSelectedImage(`/requisitions/${filename}`);
    };

    const handleQuantityChange = (value: number) => {
        setNewRequisition(prevState => {
            const reservedQuantity = Math.round(value * 0.01); // คำนวณ 1% และปัดเศษให้เป็นจำนวนเต็ม
            return {
                ...prevState,
                quantity: value,
                reserved_quantity: reservedQuantity
            };
        });
    };

    const handleRequisitionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setRequisitionImage(e.target.files[0]);
        }
    };

    const handleEditedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEditedImage(e.target.files[0]); // เก็บรูปใหม่ที่เลือก
        }
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

        // ตรวจสอบข้อมูลจำเป็นและรูปภาพก่อนส่งข้อมูล
        if (!newRequisition.requisition_name || !newRequisition.unit || newRequisition.type_id === 0 || newRequisition.quantity === 0) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อสื่อ, หน่วยนับ, ประเภท, และจำนวนคงเหลือ");
            setTimeout(() => setError(null), 5000);
            return;
        }

        // ตรวจสอบว่าได้เลือกรูปภาพหรือไม่
        if (!requisitionImage) {
            setError('กรุณาเลือกไฟล์รูปภาพ');
            setTimeout(() => setError(null), 5000);
            return;
        }

        // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (requisitionImage.size > maxSize) {
            setError('ไฟล์มีขนาดเกิน 10MB');
            setTimeout(() => setError(null), 5000);
            return;
        }

        // คำนวณ 1% ของจำนวนคงเหลือ
        const reservedQuantity = Math.round(newRequisition.quantity * 0.01);
        const adjustedQuantity = newRequisition.quantity - reservedQuantity;

        // สร้าง FormData เพื่อส่งไฟล์พร้อมข้อมูลอื่นๆ
        const formData = new FormData();
        formData.append('file', requisitionImage); // เพิ่มไฟล์รูปภาพ
        formData.append('requisition_name', newRequisition.requisition_name);
        formData.append('unit', newRequisition.unit);
        formData.append('type_id', newRequisition.type_id.toString());
        formData.append('quantity', adjustedQuantity.toString());
        formData.append('reserved_quantity', reservedQuantity.toString());
        formData.append('description', newRequisition.description || '');

        try {
            const response = await axios.post('/api/requisition', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.status === 200) {
                setRequisitions([...requisitions, response.data]);
                setShowModal(false);
                setSuccessMessage("เพิ่มข้อมูลสำเร็จ!");

                // รีเซ็ตค่า newRequisition และ requisitionImage
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

                // รีเซ็ตไฟล์ใน input
                setRequisitionImage(null); // รีเซ็ตค่าภาพที่เลือก

                // ถ้าต้องการให้ฟอร์มรีเซ็ตค่าของ input[file] ด้วย
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) {
                    (fileInput as HTMLInputElement).value = ''; // รีเซ็ตค่าไฟล์
                }

                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (error) {
            console.error('Error adding requisition:', error);
            setError("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
            setTimeout(() => setError(null), 5000);
        }
    };


    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (currentQuantity === null) {
            setError("เกิดข้อผิดพลาด: จำนวนเดิมไม่สามารถระบุได้");
            return;
        }

        // ค้นหาข้อมูล requisition ปัจจุบัน
        const currentRequisition = requisitions.find((req) => req.id === newRequisition.id);
        if (!currentRequisition) {
            setError("ไม่พบข้อมูลรายการในระบบ");
            return;
        }

        // ตรวจสอบว่ามีการเปลี่ยนแปลงข้อมูลหรือไม่
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
            setError("ไม่มีการเปลี่ยนแปลงข้อมูล");
            setEditModal(false);
            resetForm();
            return;
        }

        // ตรวจสอบว่าจำนวนใหม่ไม่ต่ำกว่าจำนวนเดิม
        if (newRequisition.quantity < currentQuantity) {
            setError("ไม่สามารถลดจำนวนให้น้อยกว่าจำนวนปัจจุบันได้");
            setEditModal(false);
            resetForm();
            return;
        }

        // ยืนยันการแก้ไข
        if (!window.confirm("คุณต้องการแก้ไขรายการนี้หรือไม่?")) return;

        try {
            // ส่งข้อมูลอัปเดตไปยังเซิร์ฟเวอร์
            const formData = new FormData();
            formData.append("requisition_name", newRequisition.requisition_name);
            formData.append("unit", newRequisition.unit);
            formData.append("type_id", newRequisition.type_id.toString());
            formData.append("quantity", newRequisition.quantity.toString());
            formData.append("reserved_quantity", (newRequisition.reserved_quantity || 0).toString());
            formData.append("description", newRequisition.description || "");
            formData.append("is_borro_restricted", String(newRequisition.is_borro_restricted));

            if (editedImage) {
                formData.append("file", editedImage);
            } else if (currentImage) {
                formData.append("requisition_images", currentImage);
            }

            const response = await axios.put(`/api/requisition/${newRequisition.id}?action=updateDetails`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.status === 200) {
                setRequisitions((prev) =>
                    prev.map((req) => (req.id === newRequisition.id ? response.data : req))
                );
                setEditModal(false);
                setSuccessMessage("แก้ไขข้อมูลสำเร็จ!");
                resetForm();
            }
        } catch (error) {
            console.error("Error editing requisition:", error);
            setError("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        } finally {
            setTimeout(() => setError(null), 5000);
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


    const handleDelete = async (id: number) => {
        if (!window.confirm("คุณต้องการปิดการใช้งานรายการนี้หรือไม่?")) return;

        try {
            const response = await axios.put(`/api/requisition/${id}?action=updateStatus`, {
                status: 0, // เปลี่ยน status เป็น 0
            });

            if (response.status === 200) {
                setRequisitions((prev) =>
                    prev.map((req) => (req.id === id ? { ...req, status: 0 } : req))
                );
                setSuccessMessage("ปิดการใช้งานสำเร็จ!");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            setError("เกิดข้อผิดพลาดในการปิดการใช้งาน");
        } finally {
            setTimeout(() => {
                setError(null);
                setSuccessMessage(null);
            }, 5000);
        }
    };

    const handleEnable = async (id: number) => {
        if (!window.confirm("คุณต้องการเปิดการใช้งานรายการนี้หรือไม่?")) return;

        try {
            const response = await axios.put(`/api/requisition/${id}?action=updateStatus`, {
                status: 1, // เปลี่ยน status เป็น 1
            });

            if (response.status === 200) {
                setRequisitions((prev) =>
                    prev.map((req) => (req.id === id ? { ...req, status: 1 } : req))
                );
                setSuccessMessage("เปิดการใช้งานสำเร็จ!");
            }
        } catch (error) {
            console.error("Error enabling requisition:", error);
            setError("เกิดข้อผิดพลาดในการเปิดการใช้งาน");
        } finally {
            setTimeout(() => {
                setError(null);
                setSuccessMessage(null);
            }, 5000);
        }
    };



    const openEditModal = (req: Requisition) => {
        setNewRequisition(req);
        setEditedImage(null);
        setCurrentImage(req.requisition_images || null);
        setCurrentQuantity(req.quantity); // เก็บค่าจำนวนเดิม
        setEditModal(true);
    };


    if (status === "loading") {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">เบิกสื่อ</h2>

                        {successMessage && (
                            <div className="bg-green-50 text-green-500 p-6 mb-10 text-sm rounded-2xl" role="alert">
                                <span>&#10004; </span>
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-500 p-6 mb-10 text-sm rounded-2xl" role="alert">
                                <span>&#10006; </span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button onClick={() => setShowModal(true)} className="mb-4 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition">+เพิ่มเบิก</button>

                        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                            <thead>
                                <tr className="bg-gray-200 text-gray-600 text-left text-sm uppercase font-semibold tracking-wider">
                                    <th className="px-4 py-2" style={{ width: "7%" }}>รูปภาพ</th>
                                    <th className="px-4 py-2" style={{ width: "13%" }}>ชื่อสื่อ</th>
                                    <th className="px-4 py-2" style={{ width: "10%" }}>หน่วยนับ</th>
                                    <th className="px-4 py-2" style={{ width: "15%" }}>ประเภท</th>
                                    <th className="px-4 py-2" style={{ width: "10%" }}>จำนวนคงเหลือ</th>
                                    <th className="px-4 py-2" style={{ width: "10%" }}>จำนวนที่เก็บ</th>
                                    <th className="px-4 py-2" style={{ width: "13%" }}>คำอธิบาย</th>
                                    <th className="px-4 py-2" style={{ width: "10%" }}>เบิก</th>
                                    <th className="px-4 py-2" style={{ width: "12%" }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                                {paginatedRequisitions.map((req) => (
                                    <tr key={req.id}>
                                        <td className="p-2 py-2 border">
                                            {req.requisition_images ? (
                                                <img
                                                    src={`/requisitions/${req.requisition_images}`}
                                                    alt={req.requisition_name}
                                                    className="w-16 h-16 object-cover cursor-pointer"
                                                    onClick={() => req.requisition_images && handleImageClick(req.requisition_images)}
                                                />
                                            ) : (
                                                "ไม่มีรูปภาพ"
                                            )}
                                        </td>
                                        <td className="p-2 border">{req.requisition_name}</td>
                                        <td className="p-2 border">{req.unit}</td>
                                        <td className="p-2 border">
                                            {types.find((type) => type.id === req.type_id)?.name || '-'}
                                        </td>
                                        <td className="p-2 border">{req.quantity}</td>
                                        <td className="p-2 border">{req.reserved_quantity || 0}</td>
                                        <td className="p-2 border">{req.description || '-'}</td>
                                        <td className="p-2 border">
                                            {req.is_borro_restricted ? "ห้ามเบิก" : "เบิกได้"} {/* แสดงสถานะการเบิก */}
                                        </td>
                                        <td className="p-2 border">
                                            <button
                                                onClick={() => openEditModal(req)}
                                                className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                            >
                                                <img
                                                    src="/images/edit.png"
                                                    alt="Edit Icon"
                                                    className="h-6 w-6"
                                                />
                                            </button>
                                            {req.status === 1 ? (
                                                <button
                                                    onClick={() => handleDelete(req.id)}
                                                    className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                                    title='ปิดใช้งาน'
                                                >
                                                    <img
                                                        src="/images/turn-on.png"
                                                        alt="Edit Icon"
                                                        className="h-6 w-6"
                                                    />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleEnable(req.id)}
                                                    className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                                    title='เปิดใช้งาน'
                                                >
                                                    <img
                                                        src="/images/turn-off.png"
                                                        alt="Edit Icon"
                                                        className="h-6 w-6"
                                                    />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                {
                                    (() => {
                                        const startIndex = (currentPage - 1) * itemsPerPage;
                                        const endIndex = Math.min(startIndex + itemsPerPage, requisitions.length);
                                        return `Showing ${startIndex + 1} to ${endIndex} of ${requisitions.length} entries`;
                                    })()
                                }
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-blue-400 hover:text-white transition disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                                            } hover:bg-blue-400 hover:text-white transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-blue-400 hover:text-white transition disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        {selectedImage && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-4 rounded-lg w-full max-w-md flex flex-col items-center">
                                    <img src={selectedImage} alt="Selected" className="w-96 h-auto mb-4" />
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="bg-red-500 text-white py-2 px-4 rounded-lg"
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        )}

                        {showModal && (
                            <div className="modal fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                                <div className="modal-box w-full max-w-md bg-white p-6 rounded-lg shadow-md max-h-[95vh]">
                                    <h2 className="text-lg font-medium mb-4 text-center text-gray-800">เพิ่ม Requisition</h2>
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
                                                className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-blue-400 focus:outline-none"
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
                                                    className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-blue-400 focus:outline-none"
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
                                                    className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-blue-400 focus:outline-none"
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
                                                    className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-blue-400 focus:outline-none"
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
                                                className="w-full border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-blue-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                className="mb-4 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                className="mb-4 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition"
                                            >
                                                บันทึก
                                            </button>
                                        </div>
                                    </form>
                                </div>



                            </div>
                        )}

                        {editModal && (
                            <div className="modal fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                                <div className="modal-box w-full max-w-md bg-white p-6 rounded-lg shadow-md max-h-[95vh]">
                                    <h2 className="text-lg font-medium mb-4 text-center text-gray-800">แก้ไข Requisition</h2>
                                    <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input
                                                type="text"
                                                placeholder="ชื่อสื่อ"
                                                value={newRequisition.requisition_name}
                                                onChange={(e) =>
                                                    setNewRequisition({ ...newRequisition, requisition_name: e.target.value })
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">อัปโหลดรูปภาพใหม่</label>
                                            <input
                                                type="file"
                                                onChange={(e) => handleImageChange(e, setEditedImage)}
                                                className="block w-full text-sm p-2 text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none  dark:placeholder-gray-400"
                                            />
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">PNG, JPG (10MB)</p>
                                            {currentImage && !editedImage && (
                                                <img src={`/requisitions/${currentImage}`} alt="Current" className="w-16 h-16 mt-2 rounded-md border" />
                                            )}
                                            {editedImage && (
                                                <img src={URL.createObjectURL(editedImage)} alt="New" className="w-16 h-16 mt-2 rounded-md border" />
                                            )}
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
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
                                                <label className="block text-gray-700 font-medium mb-1">จำนวนคงเหลือ</label>
                                                <input
                                                    type="number"
                                                    placeholder="จำนวนคงเหลือ"
                                                    value={newRequisition.quantity}
                                                    onChange={(e) =>
                                                        setNewRequisition({ ...newRequisition, quantity: Number(e.target.value) })
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">ห้ามเบิกหรือไม่</label>
                                                <input
                                                    type="checkbox"
                                                    checked={newRequisition.is_borro_restricted}
                                                    onChange={(e) =>
                                                        setNewRequisition({ ...newRequisition, is_borro_restricted: e.target.checked })
                                                    }
                                                    className="ml-2"
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
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditModal(false)}
                                                className="mb-4 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                className="mb-4 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition"
                                            >
                                                บันทึก
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsMedia_management;
