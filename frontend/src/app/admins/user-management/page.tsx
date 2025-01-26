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

const positionOptions: Record<string, { value: string; label: string }[]> = {
    '1': [
        { value: '10', label: 'กรุงเทพมหานคร' },
        { value: '11', label: 'สมุทรปราการ' },
        { value: '12', label: 'นนทบุรี' },
        { value: '13', label: 'ปทุมธานี' },
        { value: '14', label: 'พระนครศรีอยุธยา' },
        { value: '15', label: 'อ่างทอง' },
        { value: '16', label: 'ลพบุรี' },
        { value: '17', label: 'สิงห์บุรี' },
        { value: '18', label: 'ชัยนาท' },
        { value: '19', label: 'สระบุรี' },
        { value: '20', label: 'ชลบุรี' },
        { value: '21', label: 'ระยอง' },
        { value: '22', label: 'จันทบุรี' },
        { value: '23', label: 'ตราด' },
        { value: '24', label: 'ฉะเชิงเทรา' },
        { value: '25', label: 'ปราจีนบุรี' },
        { value: '26', label: 'นครนายก' },
        { value: '27', label: 'สระแก้ว' },
        { value: '30', label: 'นครราชสีมา' },
        { value: '31', label: 'บุรีรัมย์' },
        { value: '32', label: 'สุรินทร์' },
        { value: '33', label: 'ศรีสะเกษ' },
        { value: '34', label: 'อุบลราชธานี' },
        { value: '35', label: 'ยโสธร' },
        { value: '36', label: 'ชัยภูมิ' },
        { value: '37', label: 'อำนาจเจริญ' },
        { value: '38', label: 'บึงกาฬ' },
        { value: '39', label: 'หนองบัวลำภู' },
        { value: '40', label: 'ขอนแก่น' },
        { value: '41', label: 'อุดรธานี' },
        { value: '42', label: 'เลย' },
        { value: '43', label: 'หนองคาย' },
        { value: '44', label: 'มหาสารคาม' },
        { value: '45', label: 'ร้อยเอ็ด' },
        { value: '46', label: 'กาฬสินธุ์' },
        { value: '47', label: 'สกลนคร' },
        { value: '48', label: 'นครพนม' },
        { value: '49', label: 'มุกดาหาร' },
        { value: '50', label: 'เชียงใหม่' },
        { value: '51', label: 'ลำพูน' },
        { value: '52', label: 'ลำปาง' },
        { value: '53', label: 'อุตรดิตถ์' },
        { value: '54', label: 'แพร่' },
        { value: '55', label: 'น่าน' },
        { value: '56', label: 'พะเยา' },
        { value: '57', label: 'เชียงราย' },
        { value: '58', label: 'แม่ฮ่องสอน' },
        { value: '60', label: 'นครสวรรค์' },
        { value: '61', label: 'อุทัยธานี' },
        { value: '62', label: 'กำแพงเพชร' },
        { value: '63', label: 'ตาก' },
        { value: '64', label: 'สุโขทัย' },
        { value: '65', label: 'พิษณุโลก' },
        { value: '66', label: 'พิจิตร' },
        { value: '67', label: 'เพชรบูรณ์' },
        { value: '70', label: 'ราชบุรี' },
        { value: '71', label: 'กาญจนบุรี' },
        { value: '72', label: 'สุพรรณบุรี' },
        { value: '73', label: 'นครปฐม' },
        { value: '74', label: 'สมุทรสาคร' },
        { value: '75', label: 'สมุทรสงคราม' },
        { value: '76', label: 'เพชรบุรี' },
        { value: '77', label: 'ประจวบคีรีขันธ์' },
        { value: '80', label: 'นครศรีธรรมราช' },
        { value: '81', label: 'กระบี่' },
        { value: '82', label: 'พังงา' },
        { value: '83', label: 'ภูเก็ต' },
        { value: '84', label: 'สุราษฎร์ธานี' },
        { value: '85', label: 'ระนอง' },
        { value: '86', label: 'ชุมพร' },
        { value: '90', label: 'สงขลา' },
        { value: '91', label: 'สตูล' },
        { value: '92', label: 'ตรัง' },
        { value: '93', label: 'พัทลุง' },
        { value: '94', label: 'ปัตตานี' },
        { value: '95', label: 'ยะลา' },
        { value: '96', label: 'นราธิวาส' },
    ],
    '2': [
        { value: '1', label: 'สำนักงานป้องกันควบคุมโรคที่ 1 เชียงใหม่' },
        { value: '2', label: 'สำนักงานป้องกันควบคุมโรคที่ 2 พิษณุโลก' },
        { value: '3', label: 'สำนักงานป้องกันควบคุมโรคที่ 3 นครสวรรค์' },
        { value: '4', label: 'สำนักงานป้องกันควบคุมโรคที่ 4 สระบุรี' },
        { value: '5', label: 'สำนักงานป้องกันควบคุมโรคที่ 5 ราชบุรี' },
        { value: '6', label: 'สำนักงานป้องกันควบคุมโรคที่ 6 ชลบุรี' },
        { value: '7', label: 'สำนักงานป้องกันควบคุมโรคที่ 7 ขอนแก่น' },
        { value: '8', label: 'สำนักงานป้องกันควบคุมโรคที่ 8 อุดรธานี' },
        { value: '9', label: 'สำนักงานป้องกันควบคุมโรคที่ 9 นครราชสีมา' },
        { value: '10', label: 'สำนักงานป้องกันควบคุมโรคที่ 10 อุบลราชธานี' },
        { value: '11', label: 'สำนักงานป้องกันควบคุมโรคที่ 11 นครศรีธรรมราช' },
        { value: '12', label: 'สำนักงานป้องกันควบคุมโรคที่ 12 สงขลา' },
        { value: '13', label: 'สถาบันป้องกันควบคุมโรคเขตเมือง' },
    ],
};

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
        '1': 'สำนักงานสาธารณสุขจังหวัด',
        '2': 'สำนักงานป้องกันควบคุมโรค',
        '3': 'โรงพยาบาล',
        '4': 'สถานประกอบการ',
        '5': 'มหาวิทยาลัย',
        '6': 'องค์กรอิสระ',
        '7': 'เจ้าหน้าที่ภาครัฐ/รัฐวิสาหกิจ',
        '8': 'เจ้าหน้าที่ EnvOcc',
        '9': 'นักเรียน/นักศึกษา',
        '10': 'ประชาชนทั่วไป',
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
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "15%" }}>หน่วยงาน</th>
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
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">
                                                {['1', '2'].includes(user.department) ? (
                                                    positionOptions[user.department]?.find(option => option.value === user.position)?.label || ''
                                                ) : ['3', '4', '5', '6', '7', '9'].includes(user.department) ? (
                                                    user.position || ''
                                                ) : ''}
                                            </td>

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