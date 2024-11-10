"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";

interface Image {
    id: number;
    title: string;
    filename: string;
    addedDate: string;
}


function Adminsimage() {
    useAuth('admin');

    const { data: session, status } = useSession();
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


    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(images.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentImages = images.slice(startIndex, endIndex);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session && session.user.role !== 'admin') {
            router.push("/admins/dashboard");
        }
    }, [status, session]);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        const response = await fetch('/api/images');
        if (response.ok) {
            const data = await response.json();
            setImages(Array.isArray(data) ? data : []);
        } else {
            console.error('Failed to fetch images:', response.statusText);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError('กรุณาเลือกไฟล์รูปภาพ');
            setTimeout(() => setError(null), 5000);
            return;
        }

        const maxSize = 10 * 1024 * 1024; // ขนาดไฟล์สูงสุด 10MB
        if (file.size > maxSize) {
            setError('ไฟล์มีขนาดเกิน 10MB');
            setTimeout(() => setError(null), 5000);
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
                setSuccessMessage('เพิ่มรูปภาพสำเร็จ!');
                setShowModal(false);
                fetchImages(); // โหลดข้อมูลใหม่หลังจากเพิ่มรูปภาพสำเร็จ
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                const errorData = await response.json();
                setError(`เกิดข้อผิดพลาดในการเพิ่มรูปภาพ: ${errorData.error}`);
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            setTimeout(() => setError(null), 5000);
        }
    };

    const openEditModal = (image: { id: number; title: string; filename: string }) => {
        setEditTitle(image.title);
        setEditImageId(image.id);
        setEditModalVisible(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('id', editImageId!.toString()); // ใช้ `!` เพื่อระบุว่า editImageId ไม่เป็น null
        formData.append('title', editTitle);
        if (file) {
            formData.append('newFile', file);
        }

        try {
            const response = await fetch(`/api/images/${editImageId}`, {
                method: 'PUT',
                body: formData,
            });

            if (response.ok) {
                setSuccessMessage('อัปเดตข้อมูลสำเร็จ!');
                fetchImages();
                setEditModalVisible(false);
                setEditTitle('');
                setEditImageId(null);
                setFile(null);
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                const errorData = await response.json();
                setError(`เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ${errorData.error}`);
                setTimeout(() => setError(''), 5000);
            }
        } catch (error) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?")) {
            try {
                const response = await fetch(`/api/images/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id }),
                });

                if (response.ok) {
                    fetchImages();
                    setSuccessMessage('ลบข้อมูลและไฟล์สำเร็จ!');
                    setTimeout(() => setSuccessMessage(''), 5000);
                } else {
                    const errorData = await response.json();
                    setError(`เกิดข้อผิดพลาด: ${errorData.error}`);
                    setTimeout(() => setError(''), 5000);
                }
            } catch (error) {
                setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
                setTimeout(() => setError(''), 5000);
            }
        }
    };


    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">จัดการสื่อดาวน์โหลด</h2>

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

                        <div className="">
                            <div className="w-full">
                                <button onClick={() => setShowModal(true)} className="mb-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition">เพิ่มรูปภาพ</button>
                                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-600 text-left text-sm uppercase font-semibold tracking-wider">
                                            <th className="px-4 py-2 border-b-2 border-gray-200">ชื่อเรื่อง</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">รูปภาพ</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">วันที่เพิ่ม</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700 text-sm">
                                        {currentImages.length > 0 ? (
                                            currentImages.map(image => (
                                                <tr key={image.id} className="hover:bg-gray-100 text-xs">
                                                    <td className="px-4 py-2 border-b">{image.title}</td>
                                                    <td className="px-4 py-2 border-b">
                                                        <img
                                                            src={`/uploads/${image.filename}`}
                                                            alt={image.title}
                                                            className="w-16 h-16 object-cover cursor-pointer"
                                                            onClick={() => setSelectedImage(`/uploads/${image.filename}`)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 border-b">{new Date(image.addedDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2 border-b">
                                                        <button onClick={() => openEditModal(image)} className="mb-4 bg-yellow-500 text-white py-2 px-2 mr-2 rounded-md hover:bg-yellow-600 transition">แก้ไข</button>
                                                        <button onClick={() => handleDelete(image.id)} className="mb-4 bg-red-500 text-white py-2 px-2 rounded-md hover:bg-red-600 transition">ลบ</button>
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
                                    <span className="text-sm text-gray-600">Showing {startIndex + 1} to {Math.min(endIndex, images.length)} of {images.length} entries</span>
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
                                                        className="input w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                                        required
                                                    />
                                                </div>
                                                <div className="modal-action flex justify-end space-x-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowModal(false)}
                                                        className="mb-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition"
                                                    >
                                                        ยกเลิก
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="mb-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
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
                                                        className="input w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                                    />
                                                </div>
                                                <div className="modal-action flex justify-end space-x-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditModalVisible(false)}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                                                    >
                                                        ยกเลิก
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
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
                </div>
            </div>
        </div>
    );
}

export default Adminsimage;