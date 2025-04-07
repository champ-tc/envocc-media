"use client";

import React, { useState, useEffect } from 'react';
import useAuthCheck from "@/hooks/useAuthCheck";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from 'axios';
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";

interface Borrow {
    id: number;
    borrow_name: string;
    unit: string;
    type_id: number;
    quantity: number;
    is_borro_restricted: boolean;
    description?: string;
    createdAt: string;
    borrow_images?: string;
    status?: number;
}



interface Type {
    id: number;
    name: string;
}

function AdminsBorrow_management() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();


    const [borrows, setBorrows] = useState<Borrow[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [borrowImage, setBorrowImage] = useState<File | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<Type | null>(null);



    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [selectedBorrow, setSelectedBorrow] = useState<Borrow | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isEnableConfirmOpen, setIsEnableConfirmOpen] = useState(false);


    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);




    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1); // ✅ ใช้ State รองรับ API
    const [totalRecords, setTotalRecords] = useState(0); // ✅ เพิ่ม State สำหรับ totalRecords


    useEffect(() => {
        fetchBorrows();
    }, [currentPage]);



    const fetchBorrows = async () => {
        try {
            const response = await axios.get(`/api/borrow?page=${currentPage}&limit=${itemsPerPage}`);

            if (response.status === 200) {
                setBorrows(response.data.items || []);
                setTotalPages(response.data.totalPages);
                setTotalRecords(response.data.totalRecords);
            }
        } catch (error) {
            console.error("Error fetching borrows:");
        }
    };



    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + borrows.length - 1, totalRecords);
    const paginatedBorrows = borrows;


    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));


    const [types, setTypes] = useState<Type[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState<boolean>(true); // เพิ่ม state โหลดข้อมูล


    const fetchTypes = async () => {
        try {
            const response = await axios.get("/api/type");
            if (response.status === 200 && response.data.items && Array.isArray(response.data.items)) {
                setTypes(response.data.items);
            } else {
                setTypes([]);
            }
        } catch (error) {
            console.error("Error fetching types:", error);
            setTypes([]);
        } finally {
            setIsLoadingTypes(false);
        }
    };


    useEffect(() => {
        fetchTypes();
    }, []);






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



    const resetForm = () => {
        // รีเซ็ตค่า `newBorrow` และ `borrowImage` เป็นค่าเริ่มต้น
        setNewBorrow({
            id: 0,
            borrow_name: '',
            unit: '',
            type_id: 0,
            quantity: 0,
            is_borro_restricted: false,
            description: '',
            createdAt: new Date().toISOString(),
        });
        setBorrowImage(null); // รีเซ็ตภาพ
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        // ตรวจสอบฟิลด์ที่จำเป็นต้องกรอก
        if (!newBorrow.borrow_name || !newBorrow.unit || newBorrow.type_id === 0 || newBorrow.quantity === 0) {
            setAlertMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
            setAlertType("error");
            setTimeout(() => setAlertMessage(null), 3000);
            return;
        }

        if (!borrowImage) {
            setAlertMessage("กรุณาเลือกไฟล์รูปภาพ");
            setAlertType("error");
            setTimeout(() => setAlertMessage(null), 3000);
            return;
        }

        const maxSize = 10 * 1024 * 1024; // ขนาดสูงสุด 10MB
        if (borrowImage.size > maxSize) {
            setAlertMessage("ไฟล์มีขนาดเกิน 10MB");
            setAlertType("error");
            setTimeout(() => setAlertMessage(null), 3000);
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
                await fetchBorrows(); // รีโหลดข้อมูล
                setShowModal(false); // ปิด Modal
                setAlertMessage("เพิ่มข้อมูลสำเร็จ!");
                setAlertType("success");
            }
        } catch (error) {
            setAlertMessage("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
            setAlertType("error");
        } finally {
            resetForm(); // รีเซ็ตค่า
            setTimeout(() => {
                setAlertMessage(null);
                setAlertType(null);
            }, 3000);
        }
    };






    const openEditModal = (borrow: Borrow) => {
        setSelectedBorrow(borrow); // เก็บ Borrow ที่เลือกไว้ใน State
        setIsEditConfirmOpen(true); // เปิด Modal ยืนยัน
    };

    const confirmEditHandler = () => {
        if (selectedBorrow) {
            setNewBorrow({
                id: selectedBorrow.id,
                borrow_name: selectedBorrow.borrow_name,
                unit: selectedBorrow.unit,
                type_id: selectedBorrow.type_id,
                quantity: selectedBorrow.quantity,
                is_borro_restricted: selectedBorrow.is_borro_restricted,
                description: selectedBorrow.description || '',
                createdAt: selectedBorrow.createdAt,
            });
            setEditModal(true); // เปิด Modal แก้ไข
            setIsEditConfirmOpen(false); // ปิด Modal ยืนยัน
        }
    };


    const openEnableConfirm = (id: number) => {
        setSelectedId(id); // เก็บ ID ของรายการ
        setIsEnableConfirmOpen(true); // เปิด Modal ยืนยัน
    };

    const openDeleteConfirm = (id: number) => {
        setSelectedId(id); // กำหนด ID ที่จะปิดการใช้งาน
        setIsDeleteConfirmOpen(true); // เปิด Modal ยืนยันการปิด
    };


    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (borrowImage && borrowImage.size > 10 * 1024 * 1024) {
            setAlertMessage("ไฟล์มีขนาดเกิน 10MB");
            setAlertType("error");
            setTimeout(() => setAlertMessage(null), 5000);
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
            setAlertMessage("ไม่มีการเปลี่ยนแปลงข้อมูล");
            setAlertType("error");
            setTimeout(() => setAlertMessage(null), 5000);
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
                fetchBorrows(); // รีโหลดข้อมูล
                setEditModal(false); // ปิด Modal ก่อน
                setAlertMessage("แก้ไขข้อมูลสำเร็จ!");
                setAlertType("success");
            }
        } catch (error) {
            setAlertMessage("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
            setAlertType("error");
        } finally {
            setTimeout(() => {
                setAlertMessage(null);
            }, 3000);
        }
    };



    const handleDisable = async (id: number | null) => {
        if (!id) return;
        try {
            await axios.patch(`/api/borrow/${id}`, { status: 0 });
            await fetchBorrows(); // อัปเดตข้อมูลใหม่
            setIsDeleteConfirmOpen(false); // ปิด Modal
            setAlertMessage("ปิดการใช้งานสำเร็จ");
            setAlertType("success");
        } catch (error) {
            setAlertMessage("เกิดข้อผิดพลาดในการปิดการใช้งาน");
            setAlertType("error");
        } finally {
            setTimeout(() => {
                setAlertMessage(null);
                setAlertType(null);
            }, 3000); // ปิดแจ้งเตือนใน 3 วินาที
        }
    };


    const handleEnable = async (id: number | null) => {
        if (!id) return;
        try {
            await axios.patch(`/api/borrow/${id}`, { status: 1 });
            await fetchBorrows(); // อัปเดตข้อมูลใหม่
            setIsEnableConfirmOpen(false); // ปิด Modal
            setAlertMessage("เปิดการใช้งานสำเร็จ");
            setAlertType("success");
        } catch (error) {
            setAlertMessage("เกิดข้อผิดพลาดในการเปิดการใช้งาน");
            setAlertType("error");
        } finally {
            setTimeout(() => {
                setAlertMessage(null);
                setAlertType(null);
            }, 3000); // ปิดแจ้งเตือนใน 3 วินาที
        }
    };



    if (status === "loading") return <p>Loading...</p>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">ยืม / คืน</h2>

                        <button onClick={() => setShowModal(true)} className="mb-4 bg-[#9063d2] hover:bg-[#8753d5] text-white py-2 px-4 rounded-md transition">+ เพิ่ม ยืม / คืน</button>

                        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                            {/* Table Header */}
                            <thead>
                                <tr className="bg-[#9063d2] text-white text-left text-sm uppercase font-semibold tracking-wider">
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>รูปภาพ</th>
                                    <th className="border px-4 py-2" style={{ width: "20%" }}>ชื่อสื่อ</th>
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>หน่วยนับ</th>
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>ประเภท</th>
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>จำนวนคงเหลือ</th>
                                    <th className="border px-4 py-2" style={{ width: "15%" }}>คำอธิบาย</th>
                                    <th className="border px-4 py-2" style={{ width: "10%" }}>สถานะเบิก</th>
                                    <th className="border px-4 py-2" style={{ width: "15%" }}>จัดการ</th>
                                </tr>
                            </thead>


                            <tbody>
                                {Array.isArray(paginatedBorrows) && paginatedBorrows.length > 0 ? (
                                    paginatedBorrows.map((borrow) => (
                                        <tr key={borrow.id} className="border-t border-gray-200 text-xs font-normal">
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
                                            <td className="px-4 py-2 border">{borrow.borrow_name}</td>
                                            <td className="px-4 py-2 border">{borrow.unit}</td>
                                            <td className="px-4 py-2 border">
                                                {Array.isArray(types) && types.length > 0
                                                    ? types.find((type) => type.id === borrow.type_id)?.name || '-'
                                                    : 'กำลังโหลด...'}
                                            </td>
                                            <td className="px-4 py-2 border">{borrow.quantity}</td>
                                            <td className="px-4 py-2 border">{borrow.description || '-'}</td>
                                            <td className="px-4 py-2 border">{borrow.is_borro_restricted ? "ห้ามเบิก" : "เบิกได้"}</td>
                                            <td className="px-4 py-2 border">
                                                <button
                                                    onClick={() => openEditModal(borrow)}
                                                    className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                                >
                                                    <img src="/images/edit.png" alt="Edit Icon" className="h-6 w-6" />
                                                </button>
                                                {borrow.status === 1 ? (
                                                    <button
                                                        onClick={() => openDeleteConfirm(borrow.id)}
                                                        className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                                        title="ปิดใช้งาน"
                                                    >
                                                        <img src="/images/turn-on.png" alt="Turn Off Icon" className="h-6 w-6" />
                                                    </button>

                                                ) : (
                                                    <button
                                                        onClick={() => openEnableConfirm(borrow.id)}
                                                        className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                                        title="เปิดใช้งาน"
                                                    >
                                                        <img src="/images/turn-off.png" alt="Turn On Icon" className="h-6 w-6" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-4">ไม่มีข้อมูลในตาราง</td>
                                    </tr>
                                )}
                            </tbody>

                        </table>


                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {totalRecords === 0 ? 0 : startIndex + 1} ถึง {endIndex} จาก {totalRecords} รายการ
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
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">เลือกรูปภาพ</label>
                                            <input
                                                type="file"
                                                onChange={(e) => handleImageChange(e)}
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
                                                    value={newBorrow.unit}
                                                    onChange={(e) => setNewBorrow({ ...newBorrow, unit: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                                <select
                                                    value={newBorrow.type_id}
                                                    onChange={(e) => setNewBorrow({ ...newBorrow, type_id: Number(e.target.value) })}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
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
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea
                                                placeholder="คำอธิบายเพิ่มเติม"
                                                value={newBorrow.description}
                                                onChange={(e) => setNewBorrow({ ...newBorrow, description: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                type="submit"
                                                className="mb-4 bg-[#9063d2] hover:bg-[#8753d5] text-white py-2 px-4 rounded-md transition"
                                            >
                                                บันทึก
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
                            <div className="modal fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                                <div className="modal-box w-full max-w-md bg-white p-6 rounded-lg shadow-md max-h-[100vh]">
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
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
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
                                                className="block w-full text-sm p-2 text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none  dark:placeholder-gray-400"
                                            />
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">PNG, JPG (10MB)</p>
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
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                                <select
                                                    value={newBorrow.type_id}
                                                    onChange={(e) => setNewBorrow({ ...newBorrow, type_id: Number(e.target.value) })}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
                                                    required
                                                >
                                                    <option value="">เลือกประเภท</option>
                                                    {Array.isArray(types) && types.length > 0 ? (
                                                        types.map((type) => (  // ✅ ใช้ types ตรงๆ ได้เลย
                                                            <option key={type.id} value={type.id}>
                                                                {type.name}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option disabled>กำลังโหลด...</option>
                                                    )}

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
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
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
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#9063d2] focus:outline-none"
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

                        {isDeleteConfirmOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
                                <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-86 h-80 max-w-5xl text-center border-2 border-orange-500">
                                    <div className="text-red-500 mb-4">
                                        <img src="/images/alert.png" alt="Confirm Icon" className="h-40 w-40 mx-auto" />
                                    </div>
                                    <h2 className="text-lg font-semibold mb-4">คุณต้องการปิดการใช้งานรายการนี้หรือไม่?</h2>
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                                            onClick={() => setIsDeleteConfirmOpen(false)} // ปิด Modal
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                                            onClick={() => {
                                                handleDisable(selectedId); // เรียกฟังก์ชันปิดการใช้งาน
                                            }}
                                        >
                                            ปิด
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEnableConfirmOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
                                <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-86 h-80 max-w-5xl text-center border-2 border-orange-500">
                                    <div className="text-red-500 mb-4">
                                        <img src="/images/alert.png" alt="Confirm Icon" className="h-40 w-40 mx-auto" />
                                    </div>
                                    <h2 className="text-lg font-semibold mb-4">คุณต้องการเปิดการใช้งานรายการนี้หรือไม่?</h2>
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                                            onClick={() => setIsEnableConfirmOpen(false)} // ปิด Modal
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                                            onClick={() => {
                                                handleEnable(selectedId); // เรียกฟังก์ชันเปิดการใช้งาน
                                            }}
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
                                onConfirm={confirmEditHandler} // ดำเนินการแก้ไขเมื่อยืนยัน
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
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsBorrow_management;