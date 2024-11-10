// LoginPage Component (LoginPage.tsx)

"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError("การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง");
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      const userRole = session?.user?.role;
      if (userRole === 'admin') {
        router.push('/admins/dashboard');
      } else {
        router.push('/users/dashboard');
      }
    }
  }, [status, session, router]);

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center h-screen bg-pink-100">
        <div className="bg-white p-10 rounded-lg shadow-lg w-[400px]">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/icon_media.png"
              alt="Shopping Icon"
              width={150}
              height={150}
            />
          </div>

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
            <div className="mb-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex justify-center mb-4">
              <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition">
                เข้าสู่ระบบ
              </button>
            </div>
          </form>
          <div className="flex justify-between text-orange-600">
            <a href="/register" className="hover:underline">ลงทะเบียน</a>
            <a href="#" className="hover:underline">ลืมรหัสผ่าน</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;