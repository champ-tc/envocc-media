"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from 'axios';

interface Borrow {
    id: number;
    borrow_name: string;
    unit: string;
    type_id: number;
    quantity: number;
    is_borro_restricted: boolean;
    description?: string;
    createdAt: string;
    borrow_images?: string; // เพิ่มกรณีที่มีรูปภาพ
}

interface Type {
    id: number;
    name: string;
}

function AdminsBorrow_management() {
    useAuth('admin');

    const { data: session, status } = useSession();
    const router = useRouter();

    const [borrows, setBorrows] = useState<Borrow[]>([]);
    const [types, setTypes] = useState<Type[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [borrowImage, setBorrowImage] = useState<File | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [selectedBorrow, setSelectedBorrow] = useState<Borrow | null>(null);
    const [newBorrow, setNewBorrow] = useState<Borrow>({
        id: 0,
        borrow_name: '',
        unit: '',
        type_id: 0,
        quantity: 0,
        is_borro_restricted: false,
        description: '',
        createdAt: new Date().toISOString(),
    });
    const initialBorrowState = {
        id: 0,
        borrow_name: '',
        unit: '',
        type_id: 0,
        quantity: 0,
        is_borro_restricted: false,
        description: '',
        createdAt: new Date().toISOString(),
    };
    
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(borrows.length / itemsPerPage);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session && session.user.role !== 'admin') {
            router.push("/admins/dashboard");
        }
    }, [status, session]);

    useEffect(() => {
        fetchBorrows();
        fetchTypes();
    }, []);

    const fetchBorrows = async () => {
        try {
            const response = await axios.get('/api/borrow');
            setBorrows(response.data);
        } catch (error) {
            setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
            setTimeout(() => setError(null), 5000);
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
    const handleImageClick = (imageUrl: string | undefined) => {
        if (imageUrl) {
            setSelectedImage(imageUrl); // ตั้งค่าให้เปิด modal และแสดงรูป
        } else {
            // จัดการกรณีที่ไม่มีรูปภาพ
            console.log('No image to display');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setBorrowImage(e.target.files[0]); // เก็บไฟล์ที่เลือก
        }
    };

    const openEditModal = (borrow: Borrow) => {
        setSelectedBorrow(borrow);
        setNewBorrow(borrow);
        setBorrowImage(null); // รีเซ็ตค่าภาพที่เลือกใน modal แก้ไข
        setEditModal(true);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (!newBorrow.borrow_name || !newBorrow.unit || newBorrow.type_id === 0 || newBorrow.quantity === 0) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        if (!borrowImage) {
            setError("กรุณาเลือกไฟล์รูปภาพ");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        const maxSize = 10 * 1024 * 1024;
        if (borrowImage.size > maxSize) {
            setError("ไฟล์มีขนาดเกิน 10MB");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        const formData = new FormData();
        formData.append("borrow_name", newBorrow.borrow_name);
        formData.append("unit", newBorrow.unit);
        formData.append("type_id", newBorrow.type_id.toString());
        formData.append("quantity", newBorrow.quantity.toString());
        formData.append("is_borro_restricted", String(newBorrow.is_borro_restricted));
        formData.append("description", newBorrow.description || "");
        formData.append("file", borrowImage);
    
        try {
            const response = await axios.post("/api/borrow", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
    
            if (response.status === 200) {
                fetchBorrows();
                setShowModal(false); // ปิด Modal ก่อน
                setSuccessMessage("เพิ่มข้อมูลสำเร็จ!");
            }
        } catch (error) {
            console.error("Error adding borrow:", error);
            setError("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
        } finally {
            setTimeout(() => {
                setError(null);
                setSuccessMessage(null);
            }, 5000);
        }
    };
    


    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (borrowImage && borrowImage.size > 10 * 1024 * 1024) {
            setError("ไฟล์มีขนาดเกิน 10MB");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        const hasChanges =
            newBorrow.borrow_name !== selectedBorrow?.borrow_name ||
            newBorrow.unit !== selectedBorrow?.unit ||
            newBorrow.type_id !== selectedBorrow?.type_id ||
            newBorrow.quantity !== selectedBorrow?.quantity ||
            newBorrow.is_borro_restricted !== selectedBorrow?.is_borro_restricted ||
            newBorrow.description !== selectedBorrow?.description ||
            borrowImage !== null;
    
        if (!hasChanges) {
            setEditModal(false);
            setError("ไม่มีการเปลี่ยนแปลงข้อมูล");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        if (!window.confirm("คุณต้องการแก้ไขรายการนี้หรือไม่?")) {
            return;
        }
    
        const formData = new FormData();
        formData.append("borrow_name", newBorrow.borrow_name);
        formData.append("unit", newBorrow.unit);
        formData.append("type_id", newBorrow.type_id.toString());
        formData.append("quantity", newBorrow.quantity.toString());
        formData.append("is_borro_restricted", String(newBorrow.is_borro_restricted));
        formData.append("description", newBorrow.description || "");
    
        if (borrowImage) {
            formData.append("file", borrowImage);
        } else if (selectedBorrow?.borrow_images) {
            formData.append("borrow_images", selectedBorrow.borrow_images);
        }
    
        try {
            const response = await axios.put(`/api/borrow/${selectedBorrow?.id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
    
            if (response.status === 200) {
                fetchBorrows();
                setEditModal(false); // ปิด Modal ก่อน
                setSuccessMessage("แก้ไขข้อมูลสำเร็จ!");
            }
        } catch (error) {
            console.error("Error editing borrow:", error);
            setError("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
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
            const response = await axios.patch(`/api/borrow/${id}`, { status: 1 });
            if (response.status === 200) {
                setBorrows((prev) =>
                    prev.map((borrow) =>
                        borrow.id === id ? { ...borrow, status: 1 } : borrow
                    )
                );
                setSuccessMessage("เปิดการใช้งานสำเร็จ!");
            }
        } catch (error) {
            console.error("Error enabling borrow:", error);
            setError("เกิดข้อผิดพลาดในการเปิดการใช้งาน");
        } finally {
            setTimeout(() => {
                setError(null);
                setSuccessMessage(null);
            }, 5000);
        }
    };
    
    
    const handleDisable = async (id: number) => {
        if (!window.confirm("คุณต้องการปิดการใช้งานรายการนี้หรือไม่?")) return;
    
        try {
            const response = await axios.patch(`/api/borrow/${id}`, { status: 0 });
            if (response.status === 200) {
                setBorrows((prev) =>
                    prev.map((borrow) =>
                        borrow.id === id ? { ...borrow, status: 0 } : borrow
                    )
                );
                setSuccessMessage("ปิดการใช้งานสำเร็จ!");
            }
        } catch (error) {
            console.error("Error disabling borrow:", error);
            setError("เกิดข้อผิดพลาดในการปิดการใช้งาน");
        } finally {
            setTimeout(() => {
                setError(null);
                setSuccessMessage(null);
            }, 5000);
        }
    };


    const handleDelete = async (id: number) => {
        if (!window.confirm('คุณต้องการลบรายการนี้หรือไม่?')) return;
        try {
            await axios.delete(`/api/borrow/${id}`);
            setBorrows(borrows.filter((borrow) => borrow.id !== id));
            setSuccessMessage("ลบข้อมูลสำเร็จ!");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error('Error deleting borrow:', error);
            setError("เกิดข้อผิดพลาดในการลบข้อมูล");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBorrows = borrows.slice(startIndex, endIndex);

    if (status === "loading") return <p>Loading...</p>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">จัดการข้อมูล</h2>

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

                        <button onClick={() => setShowModal(true)} className="mb-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition">เพิ่ม Borrow</button>

                        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                        <thead>
    <tr className="bg-gray-200 text-gray-600 text-left text-sm uppercase font-semibold tracking-wider">
        <th className="px-4 py-2">ชื่อสื่อ</th>
        <th className="px-4 py-2">หน่วยนับ</th>
        <th className="px-4 py-2">ประเภท</th>
        <th className="px-4 py-2">จำนวนคงเหลือ</th>
        <th className="px-4 py-2">เบิก</th> {/* คอลัมน์ใหม่สำหรับสถานะเบิก */}
        <th className="px-4 py-2">คำอธิบาย</th>
        <th className="px-4 py-2">รูปภาพ</th>
        <th className="px-4 py-2">จัดการ</th>
    </tr>
</thead>
<tbody className="text-gray-700 text-sm">
    {paginatedBorrows.length > 0 ? (
        paginatedBorrows.map((borrow) => (
            <tr key={borrow.id}>
                <td className="px-4 py-2 border">{borrow.borrow_name}</td>
                <td className="px-4 py-2 border">{borrow.unit}</td>
                <td className="px-4 py-2 border">
                    {types.find((type) => type.id === borrow.type_id)?.name || '-'}
                </td>
                <td className="px-4 py-2 border">{borrow.quantity}</td>
                <td className="px-4 py-2 border">
                    {borrow.is_borro_restricted ? "ห้ามเบิก" : "เบิกได้"} {/* แสดงสถานะเบิก */}
                </td>
                <td className="px-4 py-2 border">{borrow.description || '-'}</td>
                <td className="px-4 py-2 border">
                    {borrow.borrow_images ? (
                        <img
                            src={`/borrows/${borrow.borrow_images}`}
                            alt="Borrow"
                            className="w-12 h-12 object-cover cursor-pointer"
                            onClick={() => handleImageClick(`/borrows/${borrow.borrow_images}`)}
                        />
                    ) : (
                        'ไม่มีรูปภาพ'
                    )}
                </td>
                <td className="px-4 py-2 border">
                    <button
                        onClick={() => openEditModal(borrow)}
                        className="bg-yellow-500 text-white px-2 py-1 mr-2 rounded"
                    >
                        แก้ไข
                    </button>
                    {borrow.status === 1 ? (
                        <button
                            onClick={() => handleDisable(borrow.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                            ปิดการใช้งาน
                        </button>
                    ) : (
                        <button
                            onClick={() => handleEnable(borrow.id)}
                            className="bg-green-500 text-white px-2 py-1 rounded"
                        >
                            เปิดการใช้งาน
                        </button>
                    )}
                </td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan={8} className="text-center py-4">
                ไม่มีข้อมูลในตาราง
            </td>
        </tr>
    )}
</tbody>

                        </table>

                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, borrows.length)} of {borrows.length} entries
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-blue-400 hover:text-white transition disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"} hover:bg-blue-400 hover:text-white transition`}
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
                                    <h2 className="text-lg font-medium mb-4 text-center text-gray-800">เพิ่ม Borrow</h2>
                                    <form onSubmit={handleAdd} className="space-y-4 text-sm">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input
                                                type="text"
                                                placeholder="ชื่อสื่อ"
                                                value={newBorrow.borrow_name}
                                                onChange={(e) => setNewBorrow({ ...newBorrow, borrow_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">เลือกรูปภาพ</label>
                                            <input
                                                type="file"
                                                onChange={(e) => handleImageChange(e)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">หน่วยนับ</label>
                                                <input
                                                    type="text"
                                                    placeholder="หน่วยนับ"
                                                    value={newBorrow.unit}
                                                    onChange={(e) => setNewBorrow({ ...newBorrow, unit: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                                <select
                                                    value={newBorrow.type_id}
                                                    onChange={(e) => setNewBorrow({ ...newBorrow, type_id: Number(e.target.value) })}
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
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">จำนวนคงเหลือ</label>
                                            <input
                                                type="number"
                                                placeholder="จำนวนคงเหลือ"
                                                value={newBorrow.quantity}
                                                onChange={(e) => setNewBorrow({ ...newBorrow, quantity: Number(e.target.value) })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea
                                                placeholder="คำอธิบายเพิ่มเติม"
                                                value={newBorrow.description}
                                                onChange={(e) => setNewBorrow({ ...newBorrow, description: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                className="bg-red-500 text-white py-1 px-4 rounded-lg hover:bg-red-600 transition text-sm"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-blue-500 text-white py-1 px-4 rounded-lg hover:bg-blue-600 transition text-sm"
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
                                    <h2 className="text-lg font-medium mb-4 text-center text-gray-800">แก้ไข Borrow</h2>
                                    <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input
                                                type="text"
                                                placeholder="ชื่อสื่อ"
                                                value={newBorrow.borrow_name}
                                                onChange={(e) =>
                                                    setNewBorrow({ ...newBorrow, borrow_name: e.target.value })
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">อัปโหลดรูปภาพ</label>
                                            <input
                                                type="file"
                                                onChange={(e) =>
                                                    setBorrowImage(e.target.files ? e.target.files[0] : null)
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            />
                                            {selectedBorrow && selectedBorrow.borrow_images && !borrowImage && (
                                                <div>
                                                    <img
                                                        src={`/borrows/${selectedBorrow.borrow_images}`}
                                                        alt="Borrow Image"
                                                        className="w-16 h-16 mt-2 rounded-md border"
                                                    />
                                                </div>
                                            )}
                                            {borrowImage && (
                                                <div>
                                                    <img
                                                        src={URL.createObjectURL(borrowImage)}
                                                        alt="Selected Image"
                                                        className="w-16 h-16 mt-2 rounded-md border"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">หน่วยนับ</label>
                                                <input
                                                    type="text"
                                                    placeholder="หน่วยนับ"
                                                    value={newBorrow.unit}
                                                    onChange={(e) =>
                                                        setNewBorrow({ ...newBorrow, unit: e.target.value })
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                                <select
                                                    value={newBorrow.type_id}
                                                    onChange={(e) =>
                                                        setNewBorrow({ ...newBorrow, type_id: Number(e.target.value) })
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
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">จำนวนคงเหลือ</label>
                                            <input
                                                type="number"
                                                placeholder="จำนวนคงเหลือ"
                                                value={newBorrow.quantity}
                                                onChange={(e) =>
                                                    setNewBorrow({ ...newBorrow, quantity: Number(e.target.value) })
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea
                                                placeholder="คำอธิบายเพิ่มเติม"
                                                value={newBorrow.description}
                                                onChange={(e) =>
                                                    setNewBorrow({ ...newBorrow, description: e.target.value })
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <label className="text-gray-700 font-medium">ระบุว่านี้ห้ามยืมหรือไม่</label>
                                            <input
                                                type="checkbox"
                                                checked={newBorrow.is_borro_restricted}
                                                onChange={(e) =>
                                                    setNewBorrow({ ...newBorrow, is_borro_restricted: e.target.checked })
                                                }
                                                className="ml-2"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditModal(false)}
                                                className="bg-red-500 text-white py-1 px-4 rounded-lg hover:bg-red-600 transition text-sm"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-blue-500 text-white py-1 px-4 rounded-lg hover:bg-blue-600 transition text-sm"
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

export default AdminsBorrow_management;