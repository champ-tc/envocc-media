"use client";

import React, { useState, useEffect } from 'react';
import useAuthCheck from "@/hooks/useAuthCheck";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import AlertModal from "@/components/AlertModal";
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



function PersonalPage() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();
    const { id } = params;
    const [users, setUsers] = useState([]);
    const [userData, setUserData] = useState({
        username: "",
        password: "", // เพิ่ม password
        title: "",
        firstName: "",
        lastName: "",
        tel: "",
        email: "",
        department: "",
        position: "",
        role: "user",
    });

    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // การจัดการข้อความแจ้งเตือน
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);


    const showAlert = (message: string, type: "success" | "error") => {
        setAlertMessage(message);
        setAlertType(type);
        setTimeout(() => {
            setAlertMessage(null);
            setAlertType(null);
        }, 3000);
    };

    // ฟังก์ชันดึงข้อมูลผู้ใช้
    const fetchUserData = async (url: string, setData: Function, errorMessage: string) => {
        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${session?.token}`,
                },
            });

            if (!res.ok) {
                throw new Error(`API Error: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            setData(data); // อัปเดตข้อมูลใน state
        } catch (err) {
            showAlert(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    // ใช้ useEffect เพื่อดึงข้อมูล
    useEffect(() => {
        if (session) {
            fetchUserData(`/api/users/${id}`, setUserData, "ไม่สามารถดึงข้อมูลส่วนตัวได้");
        }
    }, [session, id]);

    if (isLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }




    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { username, password, title, firstName, lastName, tel, email, department, position } = userData;

        // ตรวจสอบฟิลด์ที่จำเป็น
        if (!username || !title || !firstName || !lastName || !tel || !email || !department || !position) {
            showAlert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", "error");
            return;
        }

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (password && !passwordPattern.test(password)) {
            showAlert("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัว ประกอบด้วยตัวอักษร A-Z, a-z และตัวเลข", "error");
            return;
        }

        // ตรวจสอบรูปแบบอีเมล
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showAlert("รูปแบบอีเมลไม่ถูกต้อง", "error");
            return;
        }

        // ตรวจสอบเบอร์โทร
        if (!/^\d{10}$/.test(tel)) {
            showAlert("เบอร์โทรต้องเป็นตัวเลข 10 หลัก", "error");
            return;
        }

        // ตรวจสอบความยาวชื่อ
        if (firstName.length > 20 || lastName.length > 20) {
            showAlert("ชื่อและนามสกุลต้องไม่เกิน 20 ตัวอักษร", "error");
            return;
        }

        // ตรวจสอบความยาวตำแหน่ง
        if (position.length > 30) {
            showAlert("ตำแหน่ง/อาชีพต้องไม่เกิน 30 ตัวอักษร", "error");
            return;
        }

        try {
            const response = await axios.put("/api/users/profile", {
                username,
                title,
                firstName,
                lastName,
                tel,
                email,
                department,
                position,
                ...(password && { password }),
            });

            showAlert("อัปเดตข้อมูลสำเร็จ", "success");
            setTimeout(() => {
                router.push("/admins/user-management");
            }, 3000);
        } catch (err: any) {
            showAlert(err.response?.data?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล", "error");
        }
    };


    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h1 className="text-2xl font-bold mb-4">ข้อมูลส่วนตัว</h1>

                        {alertMessage && (
                            <AlertModal
                                isOpen={!!alertMessage}
                                message={alertMessage}
                                type={alertType ?? "error"}
                                iconSrc={alertType === "success" ? "/images/check.png" : "/images/close.png"}
                            />
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                                <div className="w-full">
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        maxLength={20}
                                        id="username"
                                        name="username"
                                        value={userData.username}
                                        onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                <div className="w-full">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            maxLength={20}
                                            id="password"
                                            name="password"
                                            onChange={(e) => {
                                                setUserData((prev) => ({
                                                    ...prev,
                                                    password: e.target.value,
                                                }));
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-3 py-2"
                                        >
                                            <img
                                                src={showPassword ? "/images/hide.png" : "/images/eye.png"}
                                                alt={showPassword ? "Hide Password" : "Show Password"}
                                                className="h-5 w-5"
                                            />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">ต้องมีความยาวอย่างน้อย 8 ตัว A-Z, a-z และตัวเลข</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-5">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 col-span-5">ชื่อ - นามสกุล</label>
                                <div className="w-full col-span-5 md:col-span-1">
                                    <select
                                        id="title"
                                        name="title"
                                        value={userData.title}
                                        onChange={(e) => setUserData({ ...userData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    >
                                        <option value="">คำนำหน้า</option>
                                        <option value="Mr">นาย</option>
                                        <option value="Ms">นางสาว</option>
                                        <option value="Mrs">นาง</option>
                                    </select>
                                </div>
                                <div className="w-full col-span-5 md:col-span-2">
                                    <input
                                        type="text"
                                        maxLength={20}
                                        id="firstName"
                                        name="firstName"
                                        value={userData.firstName}
                                        onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                <div className="w-full col-span-5 md:col-span-2">
                                    <input
                                        type="text"
                                        maxLength={20}
                                        id="lastName"
                                        name="lastName"
                                        value={userData.lastName}
                                        onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-2">
                                <div className="w-full mt-2 col-span-2 md:col-span-1">
                                    <label htmlFor="tel" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        id="tel"
                                        name="tel"
                                        value={userData.tel}
                                        onChange={(e) => setUserData({ ...userData, tel: e.target.value })}
                                        pattern="[0-9]*"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                <div className="w-full mt-2 col-span-2 md:col-span-1">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        maxLength={30}
                                        id="email"
                                        name="email"
                                        value={userData.email}
                                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                <div className="w-full mt-2 col-span-2 md:col-span-1">
                                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">เลือกประเภทผู้ใช้</label>
                                    <select
                                        id="department"
                                        name="department"
                                        value={userData.department}
                                        onChange={(e) => setUserData({ ...userData, department: e.target.value })}
                                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm"
                                        required
                                    >
                                        <option value="">เลือกประเภทผู้ใช้</option>
                                        <option value="1">เจ้าหน้าที่ envocc</option>
                                        <option value="2">สคร.</option>
                                        <option value="3">โรงพยาบาล</option>
                                        <option value="4">สถานะประกอบการ</option>
                                        <option value="5">มหาวิทยาลัย</option>
                                        <option value="6">นักเรียน/นักศึกษา</option>
                                        <option value="7">ประชาชนทั่วไป</option>
                                    </select>
                                </div>
                                <div className="w-full mt-2 col-span-2 md:col-span-1">
                                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง/อาชีพ</label>
                                    <input
                                        type="text"
                                        maxLength={30}
                                        id="position"
                                        name="position"
                                        value={userData.position}
                                        onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center mt-6 gap-2">
                                <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition">ยืนยัน</button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalPage;