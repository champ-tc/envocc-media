"use client";
import React, { useState, useEffect } from 'react';
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";
import axios from "axios";


interface User {
    id: string | number;
    username: string;
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    tel: string;
    department: string; // หรือใช้ number ถ้า department เป็นหมายเลข
    position: string;
    role: string;
}

function AdminsUserManagement() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();

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
    const [selectedType, setSelectedType] = useState<User | null>(null);
    const [selectedId, setSelectedId] = useState<string | number | null>(null);


    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const itemsPerPage = 10;

    const filteredUsers = selectedRole ? users.filter(user => user.role === selectedRole) : [];
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredUsers.length);

    useEffect(() => {
        if (!isLoading) {
            fetchUsers(); // เรียกฟังก์ชันที่ถูกต้อง
        }
    }, [isLoading]);


    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users", {
                headers: {
                    Authorization: `Bearer ${session?.token}`, // ส่ง token เพื่อยืนยันตัวตน
                },
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data || []); // ตั้งค่าข้อมูลผู้ใช้งานใน state
            setLoading(false);
        } catch (error) {
            setError("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
            setLoading(false);
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


    const openEditConfirm = (user: User) => {
        setSelectedType(user);
        setIsEditConfirmOpen(true);
    };

    const openDeleteConfirm = (id: string | number) => {
        setSelectedId(id);
        setIsDeleteConfirmOpen(true);
    };

    const handleEditConfirm = () => {
        if (selectedType) {
            setIsEditConfirmOpen(false);
            router.push(`/admins/edit-user/${selectedType.id}`);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;

        try {
            const res = await axios.delete(`/api/users/${selectedId}`, {
                headers: {
                    Authorization: `Bearer ${session?.token}`,
                },
            });

            if (res.status === 200) {
                setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedId));
                showAlert("ลบข้อมูลสำเร็จ!", "success");
            } else {
                throw new Error(res.data?.message || "Failed to delete user");
            }
        } catch (error: any) {
            showAlert("เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้", "error"); // แสดงข้อความเมื่อเกิดข้อผิดพลาด
        } finally {
            setIsDeleteConfirmOpen(false);
            setSelectedId(null);
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

    const handlePageChange = (page: number) => setCurrentPage(page);

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

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h1 className="text-2xl font-bold mb-4">จัดการผู้ใช้งาน</h1>

                        <div className="flex mb-4 space-x-4">
                            <button
                                onClick={() => setSelectedRole('user')}
                                className={`py-2 px-4 rounded-md ${selectedRole === 'user' ? "bg-[#fb8124] text-white" : "bg-gray-200 text-gray-700"} hover:bg-[#fb8124] hover:text-white transition`}
                            >
                                แสดงข้อมูลผู้ใช้งาน
                            </button>
                            <button
                                onClick={() => setSelectedRole('admin')}
                                className={`py-2 px-4 rounded-md ${selectedRole === 'admin' ? "bg-[#fb8124] text-white" : "bg-gray-200 text-gray-700"} hover:bg-[#fb8124] hover:text-white transition`}
                            >
                                แสดงข้อมูลผู้ดูแลระบบ
                            </button>
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-600 text-left text-sm uppercase font-semibold tracking-wider">
                                        <th className="py-2 px-4 whitespace-nowrap" style={{ width: "5%" }}>รหัส</th>
                                        <th className="py-2 px-4 whitespace-nowrap" style={{ width: "10%" }}>ชื่อผู้ใช้</th>
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "15%" }}>ชื่อ-นามสกุล</th>
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "15%" }}>Email</th>
                                        <th className="py-2 px-4 whitespace-nowrap" style={{ width: "10%" }}>เบอร์</th>
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "10%" }}>ประเภทผู้ใช้</th>
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "15%" }}>ตำแหน่ง/อาชีพ</th>
                                        <th className="py-2 px-4 whitespace-nowrap" style={{ width: "15%" }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 text-sm">
                                    {paginatedUsers.map(user => (
                                        <tr key={user.id} className="border-t border-gray-200">
                                            <td className="py-2 px-4">{user.id}</td>
                                            <td className="py-2 px-4">{user.username}</td>
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">{`${user.title}${user.firstName} ${user.lastName}`}</td>
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">{user.email}</td>
                                            <td className="py-2 px-4">{user.tel}</td>
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">{departmentNames[user.department as keyof typeof departmentNames] || "N/A"}</td>
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">{user.position}</td>
                                            <td className="py-2 px-4">
                                                <button
                                                    onClick={() => openEditConfirm(user)}
                                                    className="mb-4 py-2 px-2 mr-2 rounded-md transition">
                                                    <img
                                                        src="/images/edit.png"
                                                        alt="Edit Icon"
                                                        className="h-6 w-6"
                                                    />
                                                </button>
                                                <button
                                                    className="mb-4 py-2 px-2 rounded-md htransition"
                                                    onClick={() => openDeleteConfirm(user.id)}
                                                >
                                                    <img
                                                        src="/images/delete.png"
                                                        alt="Delete Icon"
                                                        className="h-6 w-6"
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">รายการที่ {startIndex} ถึง {endIndex} จาก {filteredUsers.length} รายการ</span>
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
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#fb8124] text-white" : "bg-gray-200 text-gray-600"
                                            } hover:bg-[#fb8124] hover:text-white transition`}
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

                        {isDeleteConfirmOpen && (
                            <ConfirmModal
                                isOpen={isDeleteConfirmOpen}
                                onClose={() => setIsDeleteConfirmOpen(false)} // ปิด Modal
                                onConfirm={handleDelete} // เรียก handleDelete เมื่อต้องการลบ
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
                                type={alertType ?? "error"}
                                iconSrc={alertType === "success" ? "/images/check.png" : "/images/close.png"}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsUserManagement;