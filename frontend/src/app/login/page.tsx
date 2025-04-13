"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Image from "next/image";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // เรียก API signIn
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      if (res.error === "userisalreadylogged") {
        setError("มีผู้ใช้นี้กำลังเข้าสู่ระบบอยู่ในขณะนี้");
      } else {
        setError("การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง");
      }
    }
  };


  useEffect(() => {
    if (status === "authenticated") {
      const userRole = session?.user?.role;
      if (userRole === "admin") {
        router.push("/admins/dashboard");
      } else {
        router.push("/users/requisition");
      }
    }
  }, [status, session, router]);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-[#f3e5f5] px-2">
        <div className="flex w-full max-w-3xl bg-white shadow-lg min-h-[0vh] rounded-lg overflow-hidden">

          <div className="w-2/4 text-white flex flex-col justify-center items-center">
            <Image
              src="/images/login.png"
              alt="login"
              width={300}
              height={420}
              className="rounded object-cover h-[420px] w-[300px]"
              priority
            />
          </div>

          <div className="w-3/4 p-10">
            <div className="mb-20 text-center">
            </div>

            {successMessage && (
              <div
                className="bg-green-50 text-green-500 p-4 mb-6 text-sm rounded-lg"
                role="alert"
              >
                <span>&#10004; </span>
                {successMessage}
              </div>
            )}

            {error && (
              <div
                className="bg-red-50 text-red-500 p-4 mb-6 text-sm rounded-lg"
                role="alert"
              >
                <span>&#10006; </span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                  required
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9063d2] pr-10"
                  required
                />
                <Image
                  src={showPassword ? '/images/hide.png' : '/images/eye.png'}
                  alt="toggle password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-5 h-5 absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                  width={24}
                  height={24}
                  priority
                />
              </div>

              <div className="flex justify-between text-[#9063d2] text-sm mt-2 mb-6 font-bold">
                <Link href="forgot-password">
                  ลืมรหัสผ่าน
                </Link>
                <Link href="/">
                  หน้าแรก
                </Link>
              </div>
              <div className="flex">
                <button
                  type="submit"
                  className="bg-[#9063d2] text-white px-6 py-3 flex w-full justify-center items-center text-center rounded-md hover:bg-[#8753d5] transition"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>

            <div className="flex justify-center text-sm mt-4">
              <Link href="/register">
                ยังไม่เป็นสมาชิก  <span className="text-[#9063d2]">คลิกเพื่อลงทะเบียน</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

    </>
  );
}

export default LoginPage;