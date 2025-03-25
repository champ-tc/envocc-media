'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function ResetPasswordPage() {
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
            <div className="max-w-md mx-auto mt-16 p-6 border rounded shadow bg-white relative">
                <h1 className="text-2xl font-bold mb-6 text-center text-green-700">ตั้งรหัสผ่านใหม่</h1>

                {done ? (
                    <p className="text-green-600 text-center">รีเซ็ตรหัสผ่านเรียบร้อยแล้ว ✅</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Password Field */}
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="รหัสผ่านใหม่"
                                maxLength={20}
                                className="w-full border px-3 py-2 rounded pr-10"
                            />
                            <img
                                src={showPassword ? '/images/hide.png' : '/images/eye.png'}
                                alt="toggle password"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="w-5 h-5 absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="ยืนยันรหัสผ่าน"
                                maxLength={20}
                                className="w-full border px-3 py-2 rounded pr-10"
                            />
                            <img
                                src={showConfirmPassword ? '/images/hide.png' : '/images/eye.png'}
                                alt="toggle confirm"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="w-5 h-5 absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                        >
                            ตั้งรหัสผ่านใหม่
                        </button>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </form>
                )}
            </div>
            <div className="h-32" />
            <Footer />
        </>
    );
}

export default ResetPasswordPage;