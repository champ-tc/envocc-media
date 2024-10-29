"use client";

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Image from 'next/image';


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
    } else if (res?.ok) {
      const userRole = session?.user?.role;
      if (userRole === 'admin') {
        router.push('/admins/dashboard');
      } else {
        router.push('/users/dashboard');
      }
    }
  };

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
          <h2 className="text-blue-700 text-xl font-bold text-center mb-6">LOGIN</h2>
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex justify-center mb-4">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
                LOGIN
              </button>
            </div>
          </form>
          <div className="flex justify-between text-blue-600">
            <a href="#" className="hover:underline">ลงทะเบียน</a>
            <a href="#" className="hover:underline">ลืมรหัสผ่าน</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage