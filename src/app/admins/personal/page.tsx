"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";

const PersonalPage: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useAuth('admin'); // Ensure user is authorized as admin

    const [userData, setUserData] = useState({
        username: '',
        title: '',
        firstName: '',
        lastName: '',
        tel: '',
        email: '',
        department: '',
        position: '',
        role: 'user'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false); // Initialize showPassword state

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const fetchUser = async () => {
                try {
                    const res = await fetch('/api/users/profile', {
                        method: 'GET',
                        credentials: 'include', // Ensure cookies are included
                    });

                    if (!res.ok) {
                        throw new Error("Failed to fetch user");
                    }

                    const data = await res.json();
                    setUserData(data);
                } catch (err) {
                    console.error(err);
                    setError(err.message);
                } finally {
                    setLoading(false); // Set loading to false after fetching
                }
            };

            fetchUser();
        }
    }, [status, router]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        const { username, password, title, firstName, lastName, tel, email, department, position } = userData;
    
        // Check for required fields
        if (!username || !title || !firstName || !lastName || !tel || !email || !department || !position) {
            setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError("รูปแบบอีเมลไม่ถูกต้อง");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        // Validate phone number (must be 10 digits)
        if (!/^\d{10}$/.test(tel)) {
            setError("เบอร์โทรต้องเป็นตัวเลข 10 หลัก");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        // Validate name length
        if (firstName.length > 20 || lastName.length > 20) {
            setError("ชื่อและนามสกุลต้องไม่เกิน 20 ตัวอักษร");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        // Validate position length
        if (position.length > 30) {
            setError("ตำแหน่ง/อาชีพต้องไม่เกิน 30 ตัวอักษร");
            setTimeout(() => setError(null), 5000);
            return;
        }
    
        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    title,
                    firstName,
                    lastName,
                    tel,
                    email,
                    department,
                    position,
                    ...(password && { password }) // Include password only if it's provided
                }),
            });
    
            if (!res.ok) {
                throw new Error("Error updating user");
            }
    
            const data = await res.json();
            setSuccessMessage(data.message);
            setTimeout(() => {
                setSuccessMessage(null);
                router.push('/admins/user-management'); // Redirect or update as needed
            }, 3000);
        } catch (err) {
            setError((err as Error).message);
            setTimeout(() => setError(null), 5000);
        }
    };
    

    if (loading) return <p>Loading...</p>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h1 className="text-2xl font-bold mb-4">ข้อมูลส่วนตัว</h1>

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
                                            onChange={(e) => setUserData({ ...userData, password: e.target.value })}
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
