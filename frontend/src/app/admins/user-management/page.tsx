"use client";

import React, { useEffect, useState, useCallback } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";
import axios from "axios";
import Image from "next/image";
import type { Session } from "next-auth";

/** ---------- Safe session helpers (เลิกใช้ session?.token ตรงๆ) ---------- */
type AuthSession = Session & {
    accessToken?: string;
    token?: string;
    user?: { token?: string };
};
const getAccessToken = (s?: Session | null): string => {
    const ss = s as AuthSession | null | undefined;
    return ss?.accessToken ?? ss?.token ?? ss?.user?.token ?? "";
};

type ApiErrorPayload = { message?: string; error?: string;[k: string]: unknown };
const readErrorPayload = async (res: Response): Promise<ApiErrorPayload | null> => {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    try {
        return (await res.json()) as ApiErrorPayload;
    } catch {
        return null;
    }
};

/** ---------- Types ---------- */
interface User {
    id: string | number;
    username: string;
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    tel: string;
    department: string;
    position: string;
    role: string;
}

const positionOptions: Record<string, { value: string; label: string }[]> = {
    "1": [
        { value: "10", label: "กรุงเทพมหานคร" },
        { value: "11", label: "สมุทรปราการ" },
        { value: "12", label: "นนทบุรี" },
        { value: "13", label: "ปทุมธานี" },
        { value: "14", label: "พระนครศรีอยุธยา" },
        { value: "15", label: "อ่างทอง" },
        { value: "16", label: "ลพบุรี" },
        { value: "17", label: "สิงห์บุรี" },
        { value: "18", label: "ชัยนาท" },
        { value: "19", label: "สระบุรี" },
        { value: "20", label: "ชลบุรี" },
        { value: "21", label: "ระยอง" },
        { value: "22", label: "จันทบุรี" },
        { value: "23", label: "ตราด" },
        { value: "24", label: "ฉะเชิงเทรา" },
        { value: "25", label: "ปราจีนบุรี" },
        { value: "26", label: "นครนายก" },
        { value: "27", label: "สระแก้ว" },
        { value: "30", label: "นครราชสีมา" },
        { value: "31", label: "บุรีรัมย์" },
        { value: "32", label: "สุรินทร์" },
        { value: "33", label: "ศรีสะเกษ" },
        { value: "34", label: "อุบลราชธานี" },
        { value: "35", label: "ยโสธร" },
        { value: "36", label: "ชัยภูมิ" },
        { value: "37", label: "อำนาจเจริญ" },
        { value: "38", label: "บึงกาฬ" },
        { value: "39", label: "หนองบัวลำภู" },
        { value: "40", label: "ขอนแก่น" },
        { value: "41", label: "อุดรธานี" },
        { value: "42", label: "เลย" },
        { value: "43", label: "หนองคาย" },
        { value: "44", label: "มหาสารคาม" },
        { value: "45", label: "ร้อยเอ็ด" },
        { value: "46", label: "กาฬสินธุ์" },
        { value: "47", label: "สกลนคร" },
        { value: "48", label: "นครพนม" },
        { value: "49", label: "มุกดาหาร" },
        { value: "50", label: "เชียงใหม่" },
        { value: "51", label: "ลำพูน" },
        { value: "52", label: "ลำปาง" },
        { value: "53", label: "อุตรดิตถ์" },
        { value: "54", label: "แพร่" },
        { value: "55", label: "น่าน" },
        { value: "56", label: "พะเยา" },
        { value: "57", label: "เชียงราย" },
        { value: "58", label: "แม่ฮ่องสอน" },
        { value: "60", label: "นครสวรรค์" },
        { value: "61", label: "อุทัยธานี" },
        { value: "62", label: "กำแพงเพชร" },
        { value: "63", label: "ตาก" },
        { value: "64", label: "สุโขทัย" },
        { value: "65", label: "พิษณุโลก" },
        { value: "66", label: "พิจิตร" },
        { value: "67", label: "เพชรบูรณ์" },
        { value: "70", label: "ราชบุรี" },
        { value: "71", label: "กาญจนบุรี" },
        { value: "72", label: "สุพรรณบุรี" },
        { value: "73", label: "นครปฐม" },
        { value: "74", label: "สมุทรสาคร" },
        { value: "75", label: "สมุทรสงคราม" },
        { value: "76", label: "เพชรบุรี" },
        { value: "77", label: "ประจวบคีรีขันธ์" },
        { value: "80", label: "นครศรีธรรมราช" },
        { value: "81", label: "กระบี่" },
        { value: "82", label: "พังงา" },
        { value: "83", label: "ภูเก็ต" },
        { value: "84", label: "สุราษฎร์ธานี" },
        { value: "85", label: "ระนอง" },
        { value: "86", label: "ชุมพร" },
        { value: "90", label: "สงขลา" },
        { value: "91", label: "สตูล" },
        { value: "92", label: "ตรัง" },
        { value: "93", label: "พัทลุง" },
        { value: "94", label: "ปัตตานี" },
        { value: "95", label: "ยะลา" },
        { value: "96", label: "นราธิวาส" },
    ],
    "2": [
        { value: "1", label: "สำนักงานป้องกันควบคุมโรคที่ 1 เชียงใหม่" },
        { value: "2", label: "สำนักงานป้องกันควบคุมโรคที่ 2 พิษณุโลก" },
        { value: "3", label: "สำนักงานป้องกันควบคุมโรคที่ 3 นครสวรรค์" },
        { value: "4", label: "สำนักงานป้องกันควบคุมโรคที่ 4 สระบุรี" },
        { value: "5", label: "สำนักงานป้องกันควบคุมโรคที่ 5 ราชบุรี" },
        { value: "6", label: "สำนักงานป้องกันควบคุมโรคที่ 6 ชลบุรี" },
        { value: "7", label: "สำนักงานป้องกันควบคุมโรคที่ 7 ขอนแก่น" },
        { value: "8", label: "สำนักงานป้องกันควบคุมโรคที่ 8 อุดรธานี" },
        { value: "9", label: "สำนักงานป้องกันควบคุมโรคที่ 9 นครราชสีมา" },
        { value: "10", label: "สำนักงานป้องกันควบคุมโรคที่ 10 อุบลราชธานี" },
        { value: "11", label: "สำนักงานป้องกันควบคุมโรคที่ 11 นครศรีธรรมราช" },
        { value: "12", label: "สำนักงานป้องกันควบคุมโรคที่ 12 สงขลา" },
        { value: "13", label: "สถาบันป้องกันควบคุมโรคเขตเมือง" },
    ],
};

function AdminsUserManagement() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();

    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<User | null>(null);
    const [selectedId, setSelectedId] = useState<string | number | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const itemsPerPage = 10;

    const filteredUsers = selectedRole ? users.filter((user) => user.role === selectedRole) : users; // แสดงทั้งหมดถ้าไม่เลือก role
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredUsers.length);

    const showAlert = (message: string, type: "success" | "error") => {
        setAlertMessage(message);
        setAlertType(type);
        setTimeout(() => {
            setAlertMessage(null);
            setAlertType(null);
        }, 3000);
    };

    /** ---------- Fetch users (no session?.token) ---------- */
    const fetchUsers = useCallback(async () => {
        try {
            const accessToken = getAccessToken(session);
            const res = await fetch("/api/users", {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            });
            if (!res.ok) {
                const payload = await readErrorPayload(res);
                const msg = payload?.message || payload?.error || "Failed to fetch users";
                throw new Error(msg);
            }
            const data = (await res.json()) as User[];
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setAlertMessage("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
            setAlertType("error");
        }
    }, [session]);

    useEffect(() => {
        if (!isLoading) {
            void fetchUsers();
        }
    }, [isLoading, fetchUsers]);

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
            const accessToken = getAccessToken(session);
            const res = await axios.delete(`/api/users/${selectedId}`, {
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            if (res.status === 200) {
                setUsers((prev) => prev.filter((u) => u.id !== selectedId));
                showAlert("ลบข้อมูลสำเร็จ!", "success");
            } else {
                throw new Error((res.data as ApiErrorPayload)?.message || "Failed to delete user");
            }
        } catch (e) {
            console.error(e);
            showAlert("เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้", "error");
        }
    };

    const departmentNames: Record<string, string> = {
        "1": "สำนักงานสาธารณสุขจังหวัด",
        "2": "สำนักงานป้องกันควบคุมโรค",
        "3": "โรงพยาบาล",
        "4": "สถานประกอบการ",
        "5": "มหาวิทยาลัย",
        "6": "องค์กรอิสระ",
        "7": "เจ้าหน้าที่ภาครัฐ/รัฐวิสาหกิจ",
        "8": "เจ้าหน้าที่ EnvOcc",
        "9": "นักเรียน/นักศึกษา",
        "10": "ประชาชนทั่วไป",
    };

    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
    const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

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
                                onClick={() => setSelectedRole("user")}
                                className={`py-2 px-4 rounded-md ${selectedRole === "user" ? "bg-[#9063d2] text-white" : "bg-gray-200 text-gray-700"
                                    } hover:bg-[#9063d2] hover:text-white transition`}
                            >
                                แสดงข้อมูลผู้ใช้งาน
                            </button>
                            <button
                                onClick={() => setSelectedRole("admin")}
                                className={`py-2 px-4 rounded-md ${selectedRole === "admin" ? "bg-[#9063d2] text-white" : "bg-gray-200 text-gray-700"
                                    } hover:bg-[#9063d2] hover:text-white transition`}
                            >
                                แสดงข้อมูลผู้ดูแลระบบ
                            </button>
                            <button
                                onClick={() => setSelectedRole(null)}
                                className={`py-2 px-4 rounded-md ${selectedRole === null ? "bg-[#9063d2] text-white" : "bg-gray-200 text-gray-700"
                                    } hover:bg-[#9063d2] hover:text-white transition`}
                            >
                                แสดงทั้งหมด
                            </button>
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                                <thead>
                                    <tr className="bg-[#9063d2] text-white text-left text-sm uppercase font-semibold tracking-wider">
                                        <th className="py-2 px-4 whitespace-nowrap" style={{ width: "5%" }}>
                                            รหัส
                                        </th>
                                        <th className="py-2 px-4 whitespace-nowrap" style={{ width: "10%" }}>
                                            ชื่อผู้ใช้
                                        </th>
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "18%" }}>
                                            ชื่อ-นามสกุล
                                        </th>
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "12%" }}>
                                            Email
                                        </th>
                                        <th className="py-2 px-4 whitespace-nowrap" style={{ width: "10%" }}>
                                            เบอร์
                                        </th>
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "15%" }}>
                                            ประเภทผู้ใช้
                                        </th>
                                        <th className="py-2 px-4 overflow-hidden text-ellipsis" style={{ width: "15%" }}>
                                            หน่วยงาน
                                        </th>
                                        <th className="py-2 px-4 whitespace-nowrap" style={{ width: "15%" }}>
                                            จัดการ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUsers.map((user) => (
                                        <tr key={user.id} className="border-t border-gray-200 text-xs font-normal">
                                            <td className="py-2 px-4">{user.id}</td>
                                            <td className="py-2 px-4">{user.username}</td>
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">
                                                {`${user.title}${user.firstName} ${user.lastName}`}
                                            </td>
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">{user.email}</td>
                                            <td className="py-2 px-4">{user.tel}</td>
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">
                                                {departmentNames[user.department as keyof typeof departmentNames] || "N/A"}
                                            </td>
                                            <td className="py-2 px-4 overflow-hidden text-ellipsis min-w-0">
                                                {["1", "2"].includes(user.department)
                                                    ? positionOptions[user.department]?.find((o) => o.value === user.position)?.label || ""
                                                    : ["3", "4", "5", "6", "7", "9"].includes(user.department)
                                                        ? user.position || ""
                                                        : ""}
                                            </td>

                                            <td className="py-2 px-4">
                                                <button onClick={() => openEditConfirm(user)} className="mb-4 py-2 px-2 mr-2 rounded-md transition">
                                                    <Image src="/images/edit.png" alt="Edit Icon" className="h-6 w-6" width={40} height={40} priority />
                                                </button>
                                                <button className="mb-4 py-2 px-2 rounded-md htransition" onClick={() => openDeleteConfirm(user.id)}>
                                                    <Image src="/images/delete.png" alt="Delete Icon" className="h-6 w-6" width={40} height={40} priority />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {filteredUsers.length ? startIndex : 0} ถึง {filteredUsers.length ? endIndex : 0} จาก{" "}
                                {filteredUsers.length} รายการ
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                                >
                                    ก่อนหน้า
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#9063d2] text-white" : "bg-gray-200 text-gray-600"
                                            } hover:bg-[#9063d2] hover:text-white transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>

                        {isDeleteConfirmOpen && (
                            <ConfirmModal
                                isOpen={isDeleteConfirmOpen}
                                onClose={() => setIsDeleteConfirmOpen(false)}
                                onConfirm={handleDelete}
                                title="คุณต้องการลบข้อมูลนี้หรือไม่?"
                                iconSrc="/images/alert.png"
                            />
                        )}

                        {isEditConfirmOpen && (
                            <ConfirmEditModal
                                isOpen={isEditConfirmOpen}
                                onClose={() => setIsEditConfirmOpen(false)}
                                onConfirm={handleEditConfirm}
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
