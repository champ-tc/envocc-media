'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setMessage('กรุณากรอกอีเมลให้ถูกต้อง');
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว');
                setIsError(false);
                setIsSent(true);
            } else {
                setMessage(data.message || 'เกิดข้อผิดพลาด');
                setIsError(true);
            }
        } catch (err) {
            setMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-lg mx-auto mt-16 p-6 border rounded-lg shadow-lg bg-white">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">ลืมรหัสผ่าน</h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isSent && (
                        <>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="กรอกอีเมลที่ลงทะเบียนไว้"
                                className="w-full border px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-500"
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                            >
                                {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                            </button>
                        </>
                    )}

                    {message && (
                        <p className={`text-center text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
                            {message}
                        </p>
                    )}
                </form>
            </div>
            <div className="h-32" />
            <Footer />
        </>
    );
}

export default ForgotPasswordPage;
