'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from "next/image";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัว และประกอบด้วยตัวอักษรใหญ่ เล็ก และตัวเลข');
            return;
        }

        if (password !== confirmPassword) {
            setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
            return;
        }

        setError('');

        const res = await fetch('/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword: password }),
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (res.ok) {
            setDone(true);
        } else {
            setError(data.error || 'เกิดข้อผิดพลาด');
        }
    };

    if (!token) {
        return <p className="text-red-500 text-center mt-10">ไม่พบ token</p>;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#f3e5f5] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl border border-gray-200">
                    <h1 className="text-2xl font-bold text-center text-[#9063d2] mb-6">ตั้งรหัสผ่านใหม่</h1>

                    {done ? (
                        <p className="text-green-600 text-center text-sm">รีเซ็ตรหัสผ่านเรียบร้อยแล้ว ✅</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Password */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="รหัสผ่านใหม่"
                                    maxLength={20}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9063d2] focus:outline-none pr-10"
                                />
                                <Image
                                    src={showPassword ? '/images/hide.png' : '/images/eye.png'}
                                    alt="toggle password"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="w-5 h-5 absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                                    width={24}
                                    height={24}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="ยืนยันรหัสผ่าน"
                                    maxLength={20}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9063d2] focus:outline-none pr-10"
                                />
                                <Image
                                    src={showConfirmPassword ? '/images/hide.png' : '/images/eye.png'}
                                    alt="toggle confirm"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="w-5 h-5 absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                                    width={24}
                                    height={24}
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <button
                                type="submit"
                                className="w-full bg-[#9063d2] hover:bg-[#8753d5] text-white py-3 rounded-lg font-medium transition"
                            >
                                ตั้งรหัสผ่านใหม่
                            </button>
                        </form>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default ResetPasswordForm;
