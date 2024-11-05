"use client";

import React, { useState, useEffect } from 'react';
import { useSession, getCsrfToken } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_User";
import TopBar from "@/components/TopBar";

function UsersPersonal() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [title, setTitle] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [department, setDepartment] = useState("");
    const [position, setPosition] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [csrfToken, setCsrfToken] = useState<string | null>(null);

    // ตรวจสอบสถานะการ login
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session && session.user.role !== 'user') {
            router.push("/admins/dashboard");
        }
    }, [status, session, router]);

    // ดึงข้อมูล CSRF Token จาก NextAuth
    useEffect(() => {
        const fetchCsrfToken = async () => {
            try {
                const token = await getCsrfToken();
                setCsrfToken(token || null);
            } catch (error) {
                console.error("Error fetching CSRF token:", error);
                setError("มีข้อผิดพลาดในการดึง CSRF Token");
            }
        };

        fetchCsrfToken();
    }, []);

    const saveToDatabase = async (userData: any) => {
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken || "",
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "การบันทึกข้อมูลล้มเหลว");
            }

            setSuccessMessage("ลงทะเบียนสำเร็จ! กำลังไปที่หน้าเข้าสู่ระบบ...");
            setTimeout(() => {
                router.push("/login");
            }, 1000);
        } catch (error: any) {
            setError(error.message || "มีข้อผิดพลาดในการบันทึกข้อมูล");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const userData = {
            username,
            password,
            title,
            firstName,
            lastName,
            phoneNumber,
            email,
            department,
            position,
        };

        await saveToDatabase(userData);
    };

    const resetForm = () => {
        setUsername("");
        setPassword("");
        setTitle("");
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
        setEmail("");
        setDepartment("");
        setPosition("");
        setError(null);
        setSuccessMessage(null);
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-8 mt-4">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">ข้อมูลส่วนตัว</h2>
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
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                                <div className="w-full">
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input type="text" maxLength={20} id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                                </div>
                                <div className="w-full">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input type="password" maxLength={20} id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                                    <p className="text-xs text-gray-500 mt-1">ต้องมีความยาวอย่างน้อย 8 ตัว A-Z, a-z และตัวเลข</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-5">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 col-span-5">ชื่อ - นามสกุล</label>
                                <div className="w-full col-span-5 md:col-span-1">
                                    <select id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                                        <option value="">คำนำหน้า</option>
                                        <option value="Mr">นาย</option>
                                        <option value="Ms">นางสาว</option>
                                        <option value="Mrs">นาง</option>
                                    </select>
                                </div>
                                <div className="w-full col-span-5 md:col-span-2">
                                    <input type="text" maxLength={20} id="firstName" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                                </div>
                                <div className="w-full col-span-5 md:col-span-2">
                                    <input type="text" maxLength={20} id="lastName" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-2">
                                <div className="w-full mt-2 col-span-2 md:col-span-1">
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                                    <input type="tel" maxLength={10} id="phoneNumber" name="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} pattern="[0-9]*" className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                                </div>
                                <div className="w-full mt-2 col-span-2 md:col-span-1">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" maxLength={30} id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                                </div>
                                <div className="w-full mt-2 col-span-2 md:col-span-1">
                                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">เลือกประเภทผู้ใช้</label>
                                    <select id="department" name="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm" required>
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
                                    <input type="text" maxLength={30} id="position" name="position" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                                </div>
                            </div>

                            <div className="flex justify-center mt-6 gap-2">
                                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition">ยืนยัน</button>
                                <button type="button" onClick={resetForm} className="bg-red-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition">ยกเลิก</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UsersPersonal;
