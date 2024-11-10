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
    unit: string;
    type_id: number;
    quantity: number;
    reserved_quantity?: number;
    is_borro_restricted: boolean;
    description?: string;
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
        createdAt: new Date().toISOString(),
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(requisitions.length / itemsPerPage);

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

    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRequisitions = requisitions.slice(startIndex, endIndex);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // ตรวจสอบว่าข้อมูลที่จำเป็นทั้งหมดถูกกรอกหรือไม่
        if (!newRequisition.requisition_name || !newRequisition.unit || newRequisition.type_id === 0 || newRequisition.quantity === 0) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อสื่อ, หน่วยนับ, ประเภท, และจำนวนคงเหลือ");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        // คำนวณ 1% ของจำนวนคงเหลือ
        const reservedQuantity = Math.round(newRequisition.quantity * 0.01);
        const adjustedQuantity = newRequisition.quantity - reservedQuantity;
    
        try {
            const response = await axios.post('/api/requisition', {
                requisition_name: newRequisition.requisition_name,
                unit: newRequisition.unit,
                type_id: newRequisition.type_id,
                quantity: adjustedQuantity,
                reserved_quantity: reservedQuantity,
                description: newRequisition.description,
            });
            if (response.status === 200) {
                setRequisitions([...requisitions, response.data]);
                setShowModal(false);
                setSuccessMessage("เพิ่มข้อมูลสำเร็จ!");
    
                // รีเซ็ตค่า newRequisition ให้เป็นค่าเริ่มต้นหลังจากเพิ่มข้อมูลสำเร็จ
                setNewRequisition({
                    id: 0,
                    requisition_name: '',
                    unit: '',
                    type_id: 0,
                    quantity: 0,
                    reserved_quantity: 0,
                    is_borro_restricted: false,
                    description: '',
                    createdAt: new Date().toISOString(),
                });
    
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
    
        // ตรวจสอบว่าข้อมูลที่จำเป็นทั้งหมดถูกกรอกหรือไม่
        if (!newRequisition.requisition_name || !newRequisition.unit || newRequisition.type_id === 0 || newRequisition.quantity === 0) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อสื่อ, หน่วยนับ, ประเภท, และจำนวนคงเหลือ");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        // ตรวจสอบว่ามีค่าจำนวนที่เก็บไว้ไม่ให้เบิกหรือไม่ ถ้าไม่มี ให้คงค่าจำนวนที่มีอยู่เดิม
        const reservedQuantity = newRequisition.reserved_quantity !== undefined ? newRequisition.reserved_quantity : currentRequisition.reserved_quantity;
    
        // ยืนยันการแก้ไขรายการ
        if (!window.confirm('คุณต้องการแก้ไขรายการนี้หรือไม่?')) {
            return; // ยกเลิกการแก้ไขหากผู้ใช้ไม่ยืนยัน
        }
    
        try {
            const response = await axios.put(`/api/requisition/${newRequisition.id}`, {
                requisition_name: newRequisition.requisition_name,
                unit: newRequisition.unit,
                type_id: newRequisition.type_id,
                quantity: newRequisition.quantity,
                reserved_quantity: reservedQuantity, // ส่งค่า reserved_quantity ที่ถูกต้อง
                is_borro_restricted: newRequisition.is_borro_restricted,
                description: newRequisition.description,
            });
            if (response.status === 200) {
                setRequisitions(requisitions.map(req => req.id === newRequisition.id ? response.data : req));
                setEditModal(false);
                setSuccessMessage("แก้ไขข้อมูลสำเร็จ!");
                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (error) {
            console.error('Error editing requisition:', error);
            setError("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('คุณต้องการลบรายการนี้หรือไม่?')) return;
        try {
            await axios.delete(`/api/requisition/${id}`);
            setRequisitions(requisitions.filter((req) => req.id !== id));
            setSuccessMessage("ลบข้อมูลสำเร็จ!");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error('Error deleting requisition:', error);
            setError("เกิดข้อผิดพลาดในการลบข้อมูล");
            setTimeout(() => setError(null), 5000);
        }
    };

    const openEditModal = (req: Requisition) => {
        setNewRequisition(req);
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
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">จัดการข้อมูล Requisition</h2>

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

                        <button onClick={() => setShowModal(true)} className="mb-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition">เพิ่ม Requisition</button>

                        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                            <thead>
                                <tr className="bg-gray-200 text-gray-600 text-left text-sm uppercase font-semibold tracking-wider">
                                    <th className="px-4 py-2">ชื่อสื่อ</th>
                                    <th className="px-4 py-2">หน่วยนับ</th>
                                    <th className="px-4 py-2">ประเภท</th>
                                    <th className="px-4 py-2">จำนวนคงเหลือ</th>
                                    <th className="px-4 py-2">จำนวนที่เก็บไว้ไม่ให้เบิก</th>
                                    <th className="px-4 py-2">คำอธิบาย</th>
                                    <th className="px-4 py-2">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                                {requisitions.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-4 py-2 border">{req.requisition_name}</td>
                                        <td className="px-4 py-2 border">{req.unit}</td>
                                        <td className="px-4 py-2 border">{types.find(type => type.id === req.type_id)?.name || '-'}</td>
                                        <td className="px-4 py-2 border">{req.quantity}</td>
                                        <td className="px-4 py-2 border">{req.reserved_quantity || 0}</td>
                                        <td className="px-4 py-2 border">{req.description || '-'}</td>
                                        <td className="px-4 py-2 border">
                                            <button onClick={() => openEditModal(req)} className="bg-yellow-500 text-white px-2 py-1 mr-2 rounded">แก้ไข</button>
                                            <button onClick={() => handleDelete(req.id)} className="bg-red-500 text-white px-2 py-1 rounded">ลบ</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, requisitions.length)} of {requisitions.length} entries
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
                                    <h2 className="text-xl font-semibold mb-4 text-center">เพิ่ม Requisition</h2>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input type="text" placeholder="ชื่อสื่อ" value={newRequisition.requisition_name} onChange={(e) => setNewRequisition({ ...newRequisition, requisition_name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">หน่วยนับ</label>
                                            <input type="text" placeholder="หน่วยนับ" value={newRequisition.unit} onChange={(e) => setNewRequisition({ ...newRequisition, unit: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                            <select value={newRequisition.type_id} onChange={(e) => setNewRequisition({ ...newRequisition, type_id: Number(e.target.value) })} className="w-full border border-gray-300 rounded px-3 py-2" required>
                                                <option value="">เลือกประเภท</option>
                                                {types.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">จำนวนคงเหลือ</label>
                                            <input type="number" placeholder="จำนวนคงเหลือ" value={newRequisition.quantity} onChange={(e) => handleQuantityChange(Number(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">จำนวนที่เก็บไว้ไม่ให้เบิก</label>
                                            <input type="number" placeholder="จำนวนที่เก็บไว้ไม่ให้เบิก" value={newRequisition.reserved_quantity} disabled className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea placeholder="คำอธิบายเพิ่มเติม" value={newRequisition.description} onChange={(e) => setNewRequisition({ ...newRequisition, description: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
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
                                    <h2 className="text-xl font-semibold mb-4 text-center">แก้ไข Requisition</h2>
                                    <form onSubmit={handleEditSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ชื่อสื่อ</label>
                                            <input type="text" placeholder="ชื่อสื่อ" value={newRequisition.requisition_name} onChange={(e) => setNewRequisition({ ...newRequisition, requisition_name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">หน่วยนับ</label>
                                            <input type="text" placeholder="หน่วยนับ" value={newRequisition.unit} onChange={(e) => setNewRequisition({ ...newRequisition, unit: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ประเภท</label>
                                            <select value={newRequisition.type_id} onChange={(e) => setNewRequisition({ ...newRequisition, type_id: Number(e.target.value) })} className="w-full border border-gray-300 rounded px-3 py-2" required>
                                                <option value="">เลือกประเภท</option>
                                                {types.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">จำนวนคงเหลือ</label>
                                            <input type="number" placeholder="จำนวนคงเหลือ" value={newRequisition.quantity} onChange={(e) => setNewRequisition({ ...newRequisition, quantity: Number(e.target.value) })} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">คำอธิบายเพิ่มเติม</label>
                                            <textarea placeholder="คำอธิบายเพิ่มเติม" value={newRequisition.description} onChange={(e) => setNewRequisition({ ...newRequisition, description: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">ระบุว่านี้ห้ามเบิกหรือไม่</label>
                                            <input type="checkbox" checked={newRequisition.is_borro_restricted} onChange={(e) => setNewRequisition({ ...newRequisition, is_borro_restricted: e.target.checked })} />
                                        </div>
                                        <div className="text-right">
                                            <button type="button" onClick={() => setEditModal(false)} className="mr-4 bg-red-500 text-white py-2 px-4 rounded">ยกเลิก</button>
                                            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">บันทึกการแก้ไข</button>
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
