"use client";

import React, { useState, useEffect } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from "axios";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";


interface Type {
    id: number;
    name: string;
    description: string;
    createdAt: string;
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
}

function AdminsType_management() {

    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();

    // ข้อมูลประเภท
    const [types, setTypes] = useState<Type[]>([]);

    // การจัดการ Modal
    const [showModal, setShowModal] = useState(false); // Modal สำหรับเพิ่มข้อมูล
    const [editModalVisible, setEditModalVisible] = useState(false); // Modal สำหรับแก้ไขข้อมูล

    // การจัดการข้อความแจ้งเตือน
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

    // ข้อมูลฟอร์มสำหรับเพิ่มข้อมูลใหม่
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // ข้อมูลฟอร์มสำหรับการแก้ไข**
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    // การจัดการการยืนยัน (Confirm Actions)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false); // Modal ยืนยันการลบ
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false); // Modal ยืนยันการแก้ไข
    const [selectedType, setSelectedType] = useState<{ id: number; name: string; description: string } | null>(null); // ข้อมูลที่เลือก
    const [selectedId, setSelectedId] = useState<number | null>(null); // ID ของข้อมูลที่เลือกสำหรับการลบ


    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!isLoading) {
            fetchTypes();
        }
    }, [isLoading, currentPage]);

    const fetchTypes = async () => {
        try {
            const response = await axios.get(`/api/type?page=${currentPage}&limit=${itemsPerPage}`);

            if (response.status === 200) {
                setTypes(response.data.items || []);
                setTotalPages(response.data.totalPages);
                setTotalRecords(response.data.totalRecords);
            }
        } catch (error) {
            console.error("Failed to fetch types:");
        }
    };



    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTypes = types.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };


    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };




    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        try {
            const response = await axios.post('/api/type', formData);
            if (response.status === 200) {
                const newType = response.data;
                setTypes((prevTypes) => [...prevTypes, newType.type]);
                showAlert('เพิ่มประเภทสำเร็จ!', 'success');
                setShowModal(false);
                setName('');
                setDescription('');
            } else {
                setShowModal(false);
                showAlert('ไม่สามารถเพิ่มข้อมูลได้', 'error');
            }
        } catch (error) {
            setShowModal(false);
            setName('');
            setDescription('');
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
        }
    };

    const openEditModal = (type: { id?: number; name?: string; description?: string }) => {
        if (!type.id) {
            showAlert('ไม่พบข้อมูลสำหรับแก้ไข', 'error');
            return;
        }
        setEditId(type.id);
        setEditName(type.name || '');
        setEditDescription(type.description || '');
        setEditModalVisible(true);
    };

    const handleEditConfirm = () => {
        if (selectedType) {
            setEditId(selectedType.id);
            setEditName(selectedType.name);
            setEditDescription(selectedType.description);
            setEditModalVisible(true); // เปิด Modal แก้ไข
            setIsEditConfirmOpen(false); // ปิด Confirm Modal
        }
    };

    const openEditConfirm = (type: { id: number; name: string; description: string }) => {
        setSelectedType(type); // กำหนดข้อมูลที่เลือก
        setIsEditConfirmOpen(true); // เปิด Confirm Modal
    };


    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editId || typeof editId !== 'number' || editId <= 0) {
            showAlert('ไม่พบข้อมูลสำหรับแก้ไข', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', editName);
            formData.append('description', editDescription);

            const response = await axios.put(`/api/type/${editId}`, formData);

            if (response.status === 200) {
                const updatedType = response.data.type;
                setTypes((prevTypes) =>
                    prevTypes.map((type) =>
                        type.id === updatedType.id ? updatedType : type
                    )
                );
                showAlert('แก้ไขประเภทสำเร็จ!', 'success');
                setEditModalVisible(false);
            } else {
                setEditModalVisible(false);
                showAlert('ไม่สามารถแก้ไขข้อมูลได้', 'error');
            }
        } catch (error) {
            setEditModalVisible(false);
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
        }
    };


    const openDeleteConfirm = (id: number) => {
        setSelectedId(id);
        setIsDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedId) return;

        try {
            const response = await axios.delete(`/api/type/${selectedId}`);
            if (response.status === 200) {
                setTypes((prevTypes) => prevTypes.filter((type) => type.id !== selectedId));
                showAlert('ลบประเภทสำเร็จ!', 'success');
            } else {
                showAlert('ไม่สามารถลบข้อมูลได้', 'error');
            }
        } catch (error) {
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
        } finally {
            setIsDeleteConfirmOpen(false);
            setSelectedId(null);
        }
    };

    const showAlert = (message: string, type: "success" | "error") => {
        setAlertMessage(message);
        setAlertType(type);

        setTimeout(() => {
            setAlertMessage(null);
            setShowModal(false);
        }, 3000);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />


            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">ประเภทสื่อ</h2>

                        <div className="">
                            <div className="w-full">
                                <button onClick={() => setShowModal(true)} className="mb-4 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md  transition">+ เพิ่มประเภท</button>
                                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-600 text-left text-sm uppercase font-semibold tracking-wider">
                                            <th className="px-4 py-2 border-b-2 border-gray-200">ชื่อประเภท</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">รายละเอียด</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">วันที่เพิ่ม</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700 text-sm">
                                        {types.length > 0 ? (
                                            types.map(type => (
                                                <tr key={type.id} className="hover:bg-gray-100 text-sm">
                                                    <td className="px-4 py-2 border-b">{type.name}</td>
                                                    <td className="px-4 py-2 border-b">{type.description}</td>
                                                    <td className="px-4 py-2 border-b">
                                                        {type.createdAt ? new Date(type.createdAt).toLocaleDateString() : "ไม่ทราบวันที่"}
                                                    </td>
                                                    <td className="px-4 py-2 border-b">
                                                        <button onClick={() => openEditConfirm(type)} className="mb-4 py-2 px-2 mr-2 rounded-md">
                                                            <img src="/images/edit.png" alt="Edit Icon" className="h-6 w-6" />
                                                        </button>
                                                        <button onClick={() => openDeleteConfirm(type.id)} className="mb-4 py-2 px-2 rounded-md">
                                                            <img src="/images/delete.png" alt="Delete Icon" className="h-6 w-6" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-4">ไม่มีข้อมูลประเภท</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <div className="flex items-center justify-between mt-6">
                                    <span className="text-sm text-gray-600">
                                        รายการที่ {(currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, totalRecords)} จาก {totalRecords} รายการ
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#fb8124] hover:text-white transition disabled:opacity-50"
                                        >
                                            ก่อนหน้า
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#fb8124] text-white" : "bg-gray-200 text-gray-600"} hover:bg-[#fb8124] hover:text-white transition`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#fb8124] hover:text-white transition disabled:opacity-50"
                                        >
                                            ถัดไป
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {isDeleteConfirmOpen && (
                                <ConfirmModal
                                    isOpen={isDeleteConfirmOpen}
                                    onClose={() => setIsDeleteConfirmOpen(false)} // ปิด Modal หากยกเลิก
                                    onConfirm={handleDelete} // เรียกฟังก์ชันลบเมื่อยืนยัน
                                    title="คุณต้องการลบข้อมูลนี้หรือไม่?"
                                    iconSrc="/images/alert.png"
                                />
                            )}

                            {isEditConfirmOpen && (
                                <ConfirmEditModal
                                    isOpen={isEditConfirmOpen}
                                    onClose={() => setIsEditConfirmOpen(false)} // ปิด Confirm Modal
                                    onConfirm={handleEditConfirm} // เปิด Modal แก้ไขเมื่อยืนยัน
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


                            {showModal && (
                                <div className="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                                    <div className="modal-box bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
                                        <h3 className="font-bold text-xl mb-6 text-center text-gray-800">เพิ่มประเภท</h3>
                                        <form onSubmit={handleSubmit}>
                                            <div className="form-control mb-6">
                                                <label className="label text-gray-700 font-semibold mb-2">ชื่อประเภท</label>
                                                <input
                                                    type="text"
                                                    className="input w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={name} // เปลี่ยนจาก type เป็น name
                                                    onChange={(e) => setName(e.target.value)} // เปลี่ยนจาก setType เป็น setName
                                                    required
                                                />
                                            </div>
                                            <div className="form-control mb-6">
                                                <label className="label text-gray-700 font-semibold mb-2">รายละเอียด</label>
                                                <input
                                                    type="text"
                                                    className="input w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={description} // เปลี่ยนจาก type เป็น description
                                                    onChange={(e) => setDescription(e.target.value)} // เปลี่ยนจาก setType เป็น setDescription
                                                    required
                                                />
                                            </div>
                                            <div className="modal-action flex justify-end space-x-4">
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

                            {editModalVisible && (
                                <div className="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                                    <div className="modal-box bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                                        <h3 className="font-bold text-xl mb-6 text-center text-gray-800">แก้ไขประเภท</h3>
                                        <form onSubmit={handleEditSubmit}>
                                            <div className="form-control mb-6">
                                                <label className="label text-gray-700 font-semibold mb-2">ชื่อประเภท</label>
                                                <input
                                                    type="text"
                                                    className="input w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-control mb-6">
                                                <label className="label text-gray-700 font-semibold mb-2">รายละเอียด</label>
                                                <input
                                                    type="text"
                                                    className="input w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="modal-action flex justify-end space-x-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditModalVisible(false)}
                                                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition"
                                                >
                                                    ยกเลิก
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition"
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
        </div>
    );
}

export default AdminsType_management;