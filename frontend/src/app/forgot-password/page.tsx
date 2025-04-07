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
            <div className="flex flex-col items-center justify-center py-8 min-h-screen bg-[#f3e5f5]">
                <div className="max-w-md w-full mx-auto mt-4 px-6 py-8 rounded-2xl bg-white">
                    <div className="flex flex-col items-center mb-6">
                        <h1 className="text-2xl font-bold text-[#9063d2]">ลืมรหัสผ่าน</h1>
                        <p className="text-sm text-gray-500 mt-1 text-center">
                            กรอกอีเมลที่คุณใช้สมัครสมาชิก เราจะส่งลิงก์ให้คุณ
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isSent && (
                            <>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                                />

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#9063d2] hover:bg-[#8753d5] text-white py-3 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                                </button>
                            </>
                        )}

                        {message && (
                            <p className={`text-center text-sm mt-3 ${isError ? 'text-red-600' : 'text-green-600'}`}>
                                {message}
                            </p>
                        )}
                    </form>
                </div>
            </div>


            <Footer />
        </>
    );
}

export default ForgotPasswordPage;
