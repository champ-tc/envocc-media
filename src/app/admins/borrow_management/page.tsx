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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Pagination states
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
            console.error('Error fetching borrows:', error);
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

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        // การตรวจสอบฟิลด์ที่จำเป็น
        if (!newBorrow.borrow_name || !newBorrow.unit || newBorrow.type_id === 0 || newBorrow.quantity === 0) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน");
            setTimeout(() => setError(null), 5000);
            return;
        }

        try {
            const response = await axios.post('/api/borrow', newBorrow);
            if (response.status === 200) {
                fetchBorrows();
                setShowModal(false);
                setSuccessMessage("เพิ่มข้อมูลสำเร็จ!");
                setTimeout(() => setSuccessMessage(null), 5000);
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
            }
        } catch (error) {
            console.error('Error adding borrow:', error);
            setError("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBorrow.borrow_name || !newBorrow.unit || newBorrow.type_id === 0 || newBorrow.quantity === 0) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน");
            setTimeout(() => setError(null), 5000);
            return;
        }

        if (!window.confirm("คุณต้องการแก้ไขข้อมูลหรือไม่?")) {
            return;
        }

        try {
            const response = await axios.put(`/api/borrow/${selectedBorrow?.id}`, newBorrow);
            if (response.status === 200) {
                fetchBorrows();
                setEditModal(false);
                setSuccessMessage("แก้ไขข้อมูลสำเร็จ!");
                setTimeout(() => setSuccessMessage(null), 5000);
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
                setSelectedBorrow(null);
            }
        } catch (error) {
            console.error('Error editing borrow:', error);
            setError("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
            setTimeout(() => setError(null), 5000);
        }
    };

    const openEditModal = (borrow: Borrow) => {
        setSelectedBorrow(borrow);
        setNewBorrow(borrow);
        setEditModal(true);
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

    // Pagination functions
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
                                    <th className="px-4 py-2">คำอธิบาย</th>
                                    <th className="px-4 py-2">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                                {paginatedBorrows.length > 0 ? (
                                    paginatedBorrows.map(borrow => (
                                        <tr key={borrow.id}>
                                            <td className="px-4 py-2 border">{borrow.borrow_name}</td>
                                            <td className="px-4 py-2 border">{borrow.unit}</td>
                                            <td className="px-4 py-2 border">{types.find(type => type.id === borrow.type_id)?.name || '-'}</td>
                                            <td className="px-4 py-2 border">{borrow.quantity}</td>
                                            <td className="px-4 py-2 border">{borrow.description || '-'}</td>
                                            <td className="px-4 py-2 border">
                                                <button onClick={() => openEditModal(borrow)} className="bg-yellow-500 text-white px-2 py-1 mr-2 rounded">แก้ไข</button>
                                                <button onClick={() => handleDelete(borrow.id)} className="bg-red-500 text-white px-2 py-1 rounded">ลบ</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">ไม่มีข้อมูลในตาราง</td>
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

                        {showModal && (
                            <div className="modal fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                                <div className="modal-box w-full max-w-lg bg-white p-6 rounded shadow-lg h-auto">
                                    <h2 className="text-xl font-semibold mb-4 text-center">เพิ่ม Borrow</h2>
                                    <form onSubmit={handleAdd} className="space-y-4">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input type="text" placeholder="ชื่อสื่อ" value={newBorrow.borrow_name} onChange={(e) => setNewBorrow({ ...newBorrow, borrow_name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">หน่วยนับ</label>
                                            <input type="text" placeholder="หน่วยนับ" value={newBorrow.unit} onChange={(e) => setNewBorrow({ ...newBorrow, unit: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                            <select value={newBorrow.type_id} onChange={(e) => setNewBorrow({ ...newBorrow, type_id: Number(e.target.value) })} className="w-full border border-gray-300 rounded px-3 py-2" required>
                                                <option value="">เลือกประเภท</option>
                                                {types.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">จำนวนคงเหลือ</label>
                                            <input type="number" placeholder="จำนวนคงเหลือ" value={newBorrow.quantity} onChange={(e) => setNewBorrow({ ...newBorrow, quantity: Number(e.target.value) })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea placeholder="คำอธิบายเพิ่มเติม" value={newBorrow.description} onChange={(e) => setNewBorrow({ ...newBorrow, description: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
                                        </div>
                                        <div className="text-right">
                                            <button type="button" onClick={() => setShowModal(false)} className="mr-4 bg-red-500 text-white py-2 px-4 rounded">ยกเลิก</button>
                                            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">บันทึก</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {editModal && (
                            <div className="modal fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                                <div className="modal-box w-full max-w-lg bg-white p-6 rounded shadow-lg h-auto">
                                    <h2 className="text-xl font-semibold mb-4 text-center">แก้ไข Borrow</h2>
                                    <form onSubmit={handleEdit} className="space-y-4">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input type="text" placeholder="ชื่อสื่อ" value={newBorrow.borrow_name} onChange={(e) => setNewBorrow({ ...newBorrow, borrow_name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">หน่วยนับ</label>
                                            <input type="text" placeholder="หน่วยนับ" value={newBorrow.unit} onChange={(e) => setNewBorrow({ ...newBorrow, unit: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                            <select value={newBorrow.type_id} onChange={(e) => setNewBorrow({ ...newBorrow, type_id: Number(e.target.value) })} className="w-full border border-gray-300 rounded px-3 py-2" required>
                                                <option value="">เลือกประเภท</option>
                                                {types.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">จำนวนคงเหลือ</label>
                                            <input type="number" placeholder="จำนวนคงเหลือ" value={newBorrow.quantity} onChange={(e) => setNewBorrow({ ...newBorrow, quantity: Number(e.target.value) })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea placeholder="คำอธิบายเพิ่มเติม" value={newBorrow.description} onChange={(e) => setNewBorrow({ ...newBorrow, description: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ระบุว่านี้ห้ามยืมหรือไม่</label>
                                            <input type="checkbox" checked={newBorrow.is_borro_restricted} onChange={(e) => setNewBorrow({ ...newBorrow, is_borro_restricted: e.target.checked })} />
                                        </div>
                                        <div className="text-right">
                                            <button type="button" onClick={() => setEditModal(false)} className="mr-4 bg-red-500 text-white py-2 px-4 rounded">ยกเลิก</button>
                                            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">บันทึก</button>
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