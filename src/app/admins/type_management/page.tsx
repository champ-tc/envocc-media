"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from 'axios';

interface Type {
    id: number;
    name: string;
    description: string;
    createdAt: string;
}

function AdminsType_management() {
    useAuth('admin'); // ตรวจสอบสิทธิ์ของผู้ใช้เพื่อเข้าใช้งานหน้า admin

    const { data: session, status } = useSession();
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editDescription, setEditDescription] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const [types, setTypes] = useState<Type[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(types.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTypes = types.slice(startIndex, endIndex);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session && session.user.role !== 'admin') {
            router.push("/admins/dashboard");
        }
    }, [status, session]);

    useEffect(() => {
        fetchType();
    }, []);

    const fetchType = async () => {
        const response = await fetch('/api/type');
        if (response.ok) {
            const data = await response.json();
            setTypes(Array.isArray(data) ? data : []);
        } else {
            console.error('Failed to fetch type:');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // ป้องกันการรีเฟรชหน้าจอเมื่อส่งฟอร์ม

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        try {
            const response = await axios.post('/api/type', formData);
            if (response.status === 200) {
                const newType = response.data;
                setTypes((prevTypes) => [...prevTypes, newType.type]);
                setSuccessMessage('เพิ่มประเภทสำเร็จ!');
                setShowModal(false);
                fetchType();
                setName('');
                setDescription('');
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError('ไม่สามารถเพิ่มข้อมูลได้');
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error('Error uploading type:', error);
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
            return; // ถ้าผู้ใช้กดยกเลิก จะไม่ทำการลบข้อมูล
        }

        try {
            const response = await axios.delete(`/api/type/${id}`);
            if (response.status === 200) {
                setSuccessMessage('ลบประเภทสำเร็จ!');
                setTypes((prevTypes) => prevTypes.filter((type) => type.id !== id));
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError('ไม่สามารถลบข้อมูลได้');
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error('Error deleting type:', error);
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!window.confirm('คุณต้องการแก้ไขข้อมูลนี้หรือไม่?')) {
            return; // ถ้าผู้ใช้กดยกเลิก จะไม่ทำการแก้ไขข้อมูล
        }

        if (editId === null) {
            setError('ไม่พบข้อมูลสำหรับแก้ไข');
            setTimeout(() => setError(null), 5000);
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
                setSuccessMessage('แก้ไขประเภทสำเร็จ!');
                setEditModalVisible(false);
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError('ไม่สามารถแก้ไขข้อมูลได้');
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error('Error updating type:', error);
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            setTimeout(() => setError(null), 5000);
        }
    };


    const openEditModal = (type: { id: number; name: string; description: string }) => {
        setEditId(type.id);
        setEditName(type.name);
        setEditDescription(type.description);
        setEditModalVisible(true);
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
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar is fixed on the left */}
            <Sidebar />

            {/* Content Area (TopBar + Main Content) */}
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">ประเภทสื่อ</h2>

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
                                            <th className="px-4 py-2 border-b-2 border-gray-200">ชื่อประเภท</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">รายละเอียด</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">วันที่เพิ่ม</th>
                                            <th className="px-4 py-2 border-b-2 border-gray-200">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700 text-sm">
                                        {currentTypes.length > 0 ? (
                                            currentTypes.map(type => (
                                                <tr key={type.id} className="hover:bg-gray-100 text-xs">
                                                    <td className="px-4 py-2 border-b">{type.name}</td>
                                                    <td className="px-4 py-2 border-b">{type.description}</td>
                                                    <td className="px-4 py-2 border-b">
                                                        {type.createdAt ? new Date(String(type.createdAt)).toLocaleDateString() : 'ไม่ทราบวันที่'}
                                                    </td>

                                                    <td className="px-4 py-2 border-b">
                                                        <button onClick={() => openEditModal(type)} className="mb-4 bg-yellow-500 text-white py-2 px-2 mr-2 rounded-md hover:bg-yellow-600 transition">แก้ไข</button>
                                                        <button onClick={() => handleDelete(type.id)} className="mb-4 bg-red-500 text-white py-2 px-2 rounded-md hover:bg-red-600 transition">ลบ</button>
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
                                    <span className="text-sm text-gray-600">Showing {startIndex + 1} to {Math.min(endIndex, types.length)} of {types.length} entries</span>
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
        </div>
    );
}

export default AdminsType_management;