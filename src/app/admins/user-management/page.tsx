"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";

function AdminsUserManagement() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: "", password: "", title: "", firstName: "", lastName: "", tel: "", email: "", department: "", position: "", role: "user" });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState(null); // Updated: Initial state is null
    const itemsPerPage = 10;

    useAuth('admin'); // ตรวจสอบสิทธิ์ก่อนเข้าถึงหน้าเพจนี้

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session?.token}` // ส่ง token เพื่อยืนยันตัวตน
                    }
                });
                if (!res.ok) throw new Error("Error fetching users");
                const data = await res.json();
                setUsers(data);
            } catch (error) {
                setError("Error fetching users: " + error.message);
            } finally {
                setLoading(false);
            }
        };
        if (session) {
            fetchUsers();
        }
    }, [session]);

    const handleDelete = async (id) => {
        if (!confirm("คุณต้องการลบผู้ใช้งานหรือไม่")) return;

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${session?.token}`, // ส่ง token เพื่อยืนยันตัวตน
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error("Failed to delete user");
            setUsers(users.filter(user => user.id !== id));
            setSuccessMessage("ลบผู้ใช้งานสำเร็จ");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            setError("ลบผู้ใช้งานไม่สำเร็จ: " + error.message);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();

        // Validate ข้อมูลก่อนส่งไปที่ backend
        if (!newUser.username || !newUser.password || !newUser.email) {
            setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
            return;
        }

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.token}`, // ส่ง token เพื่อยืนยันตัวตน
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });
            if (!res.ok) throw new Error("Error adding user");
            const addedUser = await res.json();
            setUsers([...users, addedUser]);
            setIsModalOpen(false);
            setNewUser({ username: "", password: "", title: "", firstName: "", lastName: "", tel: "", email: "", department: "", position: "", role: "user" });
            setSuccessMessage("เพิ่มผู้ใช้งานสำเร็จ");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            setError("เพิ่มผู้ใช้งานไม่สำเร็จ: " + error.message);
        }
    };

    const filteredUsers = selectedRole ? users.filter(user => user.role === selectedRole) : [];
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredUsers.length);

    const handlePageChange = (page) => setCurrentPage(page);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const departmentNames = {
        "1": "เจ้าหน้าที่ envocc",
        "2": "สคร.",
        "3": "โรงพยาบาล",
        "4": "สถานะประกอบการ",
        "5": "มหาวิทยาลัย",
        "6": "นักเรียน/นักศึกษา",
        "7": "ประชาชนทั่วไป"
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4">
                        <h1 className="text-2xl font-bold mb-4">จัดการผู้ใช้งาน</h1>

                        {/* Role Filter Buttons */}
                        <div className="flex mb-4 space-x-4">
                            <button
                                onClick={() => setSelectedRole('user')}
                                className={`py-2 px-4 rounded-md ${selectedRole === 'user' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"} hover:bg-blue-400 hover:text-white transition`}
                            >
                                แสดงข้อมูลผู้ใช้งาน
                            </button>
                            <button
                                onClick={() => setSelectedRole('admin')}
                                className={`py-2 px-4 rounded-md ${selectedRole === 'admin' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"} hover:bg-blue-400 hover:text-white transition`}
                            >
                                แสดงข้อมูลผู้ดูแลระบบ
                            </button>
                        </div>

                        {selectedRole && (
                            <>
                                <button onClick={() => setIsModalOpen(true)} className="mb-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition">
                                    เพิ่มผู้ใช้งาน
                                </button>

                                {successMessage && (
                                    <div className="bg-green-50 text-green-700 p-6 mb-10 text-sm rounded-2xl shadow-sm" role="alert">
                                        <span>&#10004; </span>
                                        <span>{successMessage}</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 text-red-700 p-6 mb-10 text-sm rounded-2xl shadow-sm" role="alert">
                                        <span>&#10006; </span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="overflow-x-auto w-full">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
                                        <thead>
                                            <tr className="bg-gray-200 text-gray-600 text-left text-sm uppercase font-semibold tracking-wider">
                                                <th className="py-2 px-4" style={{ width: "80px" }}>ID</th>
                                                <th className="py-2 px-4" style={{ width: "120px" }}>Username</th>
                                                <th className="py-2 px-4" style={{ width: "200px" }}>Full Name</th>
                                                <th className="py-2 px-4" style={{ width: "200px" }}>Email</th>
                                                <th className="py-2 px-4" style={{ width: "120px" }}>Phone</th>
                                                <th className="py-2 px-4" style={{ width: "160px" }}>Department</th>
                                                <th className="py-2 px-4" style={{ width: "200px" }}>Position</th>
                                                <th className="py-2 px-4" style={{ width: "200px" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-700 text-sm">
                                            {paginatedUsers.map(user => (
                                                <tr key={user.id} className="border-t border-gray-200">
                                                    <td className="py-2 px-4">{user.id}</td>
                                                    <td className="py-2 px-4">{user.username}</td>
                                                    <td className="py-2 px-4">{`${user.title}${user.firstName} ${user.lastName}`}</td>
                                                    <td className="py-2 px-4">{user.email}</td>
                                                    <td className="py-2 px-4">{user.tel}</td>
                                                    <td className="py-2 px-4">{departmentNames[user.department] || "N/A"}</td>
                                                    <td className="py-2 px-4">{user.position}</td>
                                                    <td className="py-2 px-4">
                                                        <button className="mb-4 bg-yellow-500 text-white py-2 px-2 mr-2 rounded-md hover:bg-yellow-600 transition" onClick={() => router.push(`/admins/edit-user/${user.id}`)}>Edit</button>
                                                        <button className="mb-4 bg-red-500 text-white py-2 px-2 rounded-md hover:bg-red-600 transition" onClick={() => handleDelete(user.id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between mt-6">
                                    <span className="text-sm text-gray-600">Showing {startIndex} to {endIndex} of {filteredUsers.length} entries</span>
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsUserManagement;
