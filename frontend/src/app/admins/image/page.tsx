"use client";

import React, { useState, useEffect } from 'react';
import useAuthCheck from "@/hooks/useAuthCheck";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from "axios";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";


interface Image {
    id: number;
    title: string;
    filename: string;
    addedDate: string;
}


function Adminsimage() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();


    const [images, setImages] = useState<Image[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editImageId, setEditImageId] = useState<number | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(images.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentImages = images.slice(startIndex, endIndex);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        const response = await fetch('/api/images');
        if (response.ok) {
            const data = await response.json();
            setImages(Array.isArray(data) ? data : []);
        } else {
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
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



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            showAlert('กรุณาเลือกไฟล์รูปภาพ', 'error');
            return;
        }

        const maxSize = 10 * 1024 * 1024; // ขนาดไฟล์สูงสุด 10MB
        if (file.size > maxSize) {
            showAlert('ไฟล์มีขนาดเกิน 10MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);

        try {
            const response = await fetch('/api/images', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                showAlert('เพิ่มรูปภาพสำเร็จ!', 'success');
                setShowModal(false); // ปิด Modal
                fetchImages(); // โหลดข้อมูลใหม่หลังจากเพิ่มสำเร็จ
                setTitle(''); // รีเซ็ต Title
                setFile(null); // รีเซ็ตไฟล์
            } else {
                const errorData = await response.json();
                showAlert(`เกิดข้อผิดพลาดในการเพิ่มรูปภาพ: ${errorData.error}`, 'error');
            }
        } catch (error) {
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
        }
    };



    const openEditConfirm = (image: Image) => {
        setEditImageId(image.id); // ตั้งค่า ID
        setEditTitle(image.title); // ตั้งค่า Title
        setIsEditConfirmOpen(true); // เปิด Confirm Modal
    };


    const handleEditConfirm = () => {
        if (!editImageId) {
            setAlertMessage('ไม่สามารถเปิดหน้าต่างแก้ไขได้: ไม่พบข้อมูล');
            setAlertType('error');
            return;
        }
        setEditModalVisible(true); // เปิด Modal แก้ไข
        setIsEditConfirmOpen(false); // ปิด Confirm Modal
    };



    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (!editImageId) {
            showAlert('เกิดข้อผิดพลาด: ไม่พบ ID ที่ต้องการแก้ไข', 'error');
            return;
        }
    
        const formData = new FormData();
        formData.append('id', editImageId.toString());
        formData.append('title', editTitle);
        if (file) {
            formData.append('newFile', file);
        }
    
        try {
            const response = await axios.put(`/api/images/${editImageId}`, formData);
    
            if (response.status === 200) {
                showAlert('อัปเดตข้อมูลสำเร็จ!', 'success');
                fetchImages(); // โหลดข้อมูลใหม่
                setEditModalVisible(false); // ปิด Modal
                setEditTitle('');
                setEditImageId(null);
                setFile(null);
            } else {
                showAlert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error');
            }
        } catch (error) {
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
        }
    };
    




    const openDeleteConfirm = (id: number) => {
        setSelectedImageId(id); // เก็บ ID ของข้อมูลที่จะลบ
        setIsDeleteConfirmOpen(true); // เปิด Modal ยืนยันการลบ
    };



    const handleDelete = async () => {
        if (!selectedImageId) return;

        try {
            const response = await fetch(`/api/images/${selectedImageId}`, { method: 'DELETE' });
            if (response.ok) {
                fetchImages(); // โหลดข้อมูลใหม่
                setAlertMessage("ลบข้อมูลสำเร็จ!");
                setAlertType("success");

                // ปิด AlertModal หลัง 3 วินาที
                setTimeout(() => {
                    setAlertMessage(null);
                    setAlertType(null);
                }, 3000);
            } else {
                setAlertMessage("เกิดข้อผิดพลาดในการลบข้อมูล");
                setAlertType("error");

                // ปิด AlertModal หลัง 3 วินาที
                setTimeout(() => {
                    setAlertMessage(null);
                    setAlertType(null);
                }, 3000);
            }
        } catch {
            setAlertMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
            setAlertType("error");

            // ปิด AlertModal หลัง 3 วินาที
            setTimeout(() => {
                setAlertMessage(null);
                setAlertType(null);
            }, 3000);
        } finally {
            setIsDeleteConfirmOpen(false); // ปิด Confirm Modal
            setSelectedImageId(null); // รีเซ็ต ID
        }
    };



    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };
    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">สื่อดาวน์โหลด</h2>

                        <div className="">
                            <div className="w-full">
                                <button onClick={() => setShowModal(true)} className="mb-4 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition">+เพิ่มสื่อดาวน์โหลด</button>
                                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-600 text-left text-sm uppercase font-semibold tracking-wider">
                                            <th className="px-4 py-2 border-b-2 border-gray-200">รูปภาพ</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">ชื่อเรื่อง</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">วันที่เพิ่ม</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700">
                                        {currentImages.length > 0 ? (
                                            currentImages.map(image => (
                                                <tr key={image.id} className="hover:bg-gray-100 text-sm">
                                                    <td className="px-4 py-2 border-b">
                                                        <img
                                                            src={`/uploads/${image.filename}`}
                                                            alt={image.title}
                                                            className="w-16 h-16 object-cover cursor-pointer"
                                                            onClick={() => setSelectedImage(`/uploads/${image.filename}`)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 border-b">{image.title}</td>
                                                    <td className="px-4 py-2 border-b">{new Date(image.addedDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2 border-b">
                                                        <button
                                                            onClick={() => openEditConfirm(image)}
                                                            className="mb-4 py-2 px-2 mr-2 rounded-md transition"
                                                        >
                                                            <img
                                                                src="/images/edit.png"
                                                                alt="Edit Icon"
                                                                className="h-6 w-6"
                                                            />
                                                        </button>


                                                        <button
                                                            onClick={() => openDeleteConfirm(image.id)}
                                                            className="mb-4  py-2 px-2 rounded-md htransition"
                                                        >
                                                            <img
                                                                src="/images/delete.png"
                                                                alt="Success Icon"
                                                                className="h-6 w-6"
                                                            />
                                                        </button>

                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-4">ไม่มีข้อมูลรูปภาพ</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <div className="flex items-center justify-between mt-6">
                                    <span className="text-sm text-gray-600">รายการที่ {startIndex + 1} ถึง {Math.min(endIndex, images.length)} จาก {images.length} รายการ</span>
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

                                {showModal && (
                                    <div className="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                                        <div className="modal-box bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
                                            <h3 className="font-bold text-xl mb-6 text-center text-gray-800">เพิ่มรูปภาพ</h3>
                                            <form onSubmit={handleSubmit}>
                                                <div className="form-control mb-6">
                                                    <label className="label text-gray-700 font-semibold mb-2">ชื่อเรื่อง</label>
                                                    <input
                                                        type="text"
                                                        className="input w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-control mb-6">
                                                    <label className="label text-gray-700 font-semibold mb-2">ไฟล์รูปภาพ</label>
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.png"
                                                        className="block w-full text-sm p-2 text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none  dark:placeholder-gray-400"
                                                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                                        required
                                                    />
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">PNG, JPG (10MB)</p>
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
                                            <h3 className="font-bold text-xl mb-6 text-center text-gray-800">แก้ไขรูปภาพ</h3>
                                            <form onSubmit={handleEditSubmit}>
                                                <div className="form-control mb-6">
                                                    <label className="label text-gray-700 font-semibold mb-2">ชื่อเรื่อง</label>
                                                    <input
                                                        type="text"
                                                        className="input w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-control mb-6">
                                                    <label className="label text-gray-700 font-semibold mb-2">ไฟล์รูปภาพใหม่ (ถ้ามี)</label>
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.png"
                                                        className="block w-full text-sm p-2 text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none  dark:placeholder-gray-400"
                                                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                                    />
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">PNG, JPG (10MB)</p>
                                                </div>
                                                <div className="modal-action flex justify-end space-x-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditModalVisible(false)}
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
                            isOpen={!!alertMessage} // แสดงเมื่อมีข้อความ
                            message={alertMessage}
                            type={alertType ?? 'error'}
                            iconSrc={alertType === 'success' ? '/images/check.png' : '/images/close.png'}
                        />
                    )}


                </div>
            </div>
        </div>
    );
}

export default Adminsimage;