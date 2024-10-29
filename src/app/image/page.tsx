"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ImagePage() {
    const [images, setImages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editImageId, setEditImageId] = useState(null);

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

    const openEditModal = (image) => {
        setEditTitle(image.title);
        setEditImageId(image.id);
        setEditModalVisible(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('id', editImageId);
        formData.append('title', editTitle);
        if (file) {
            formData.append('newFile', file); // เพิ่มไฟล์ใหม่ถ้ามี
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

    const handleDelete = async (id) => {
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
                    fetchImages(); // ดึงข้อมูลใหม่หลังจากลบรูปภาพสำเร็จ
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('กรุณาเลือกไฟล์รูปภาพ');
            setTimeout(() => setError(null), 5000);
            return;
        }

        const maxSize = 10 * 1024 * 1024;
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
                fetchImages();
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                const errorData = await response.json();
                setError(`เกิดข้อผิดพลาดในการเพิ่มรูปภาพ: ${errorData.error}`);
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            setTimeout(() => setError(null), 5000);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mx-auto p-4">
                {successMessage && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
                        <p>{successMessage}</p>
                    </div>
                )}
                {error && (
                    <div className="mb-4 text-red-500 font-bold">
                        {error}
                    </div>
                )}

                <button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mb-4">เพิ่มรูปภาพ</button>
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b-2 border-gray-200">ชื่อเรื่อง</th>
                            <th className="px-4 py-2 border-b-2 border-gray-200">รูปภาพ</th>
                            <th className="px-4 py-2 border-b-2 border-gray-200">วันที่เพิ่ม</th>
                            <th className="px-4 py-2 border-b-2 border-gray-200">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(images) && images.length > 0 ? (
                            images.map(image => (
                                <tr key={image.id} className="hover:bg-gray-100">
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
                                        <button onClick={() => openEditModal(image)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">แก้ไข</button>
                                        <button onClick={() => handleDelete(image.id)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full ml-2">ลบ</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-4">ไม่มีข้อมูลรูปภาพ</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Modal สำหรับดูรูปภาพขนาดใหญ่ */}
                {selectedImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
                        <div className="relative">
                            <img src={selectedImage} alt="Large View" className="max-w-full max-h-screen" />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-2 right-2 text-white text-2xl font-bold"
                            >
                                ✖
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                    <div className="modal-box bg-white p-6 rounded-md">
                        <h3 className="font-bold text-lg mb-4">เพิ่มรูปภาพ</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-control mb-4">
                                <label className="label">ชื่อเรื่อง</label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-control mb-4">
                                <label className="label">ไฟล์รูปภาพ</label>
                                <input
                                    type="file"
                                    accept=".jpg,.png"
                                    className="input input-bordered w-full"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    required
                                />
                            </div>
                            <div className="modal-action flex justify-end">
                                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">บันทึก</button>
                                <button onClick={() => setShowModal(false)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full ml-2">ยกเลิก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editModalVisible && (
                <div className="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                    <div className="modal-box bg-white p-6 rounded-md">
                        <h3 className="font-bold text-lg mb-4">แก้ไขรูปภาพ</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-control mb-4">
                                <label className="label">ชื่อเรื่อง</label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-control mb-4">
                                <label className="label">ไฟล์รูปภาพใหม่ (ถ้ามี)</label>
                                <input
                                    type="file"
                                    accept=".jpg,.png"
                                    className="input input-bordered w-full"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                            </div>
                            <div className="modal-action flex justify-end">
                                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">บันทึก</button>
                                <button onClick={() => setEditModalVisible(false)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full ml-2">ยกเลิก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
