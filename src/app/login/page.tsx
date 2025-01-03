"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await signIn("credentials", {
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
      if (userRole === "admin") {
        router.push("/admins/dashboard");
      } else {
        router.push("/users/borrow");
      }
    }
  }, [status, session, router]);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-orange-500/10 px-2">
        <div className="flex w-full max-w-3xl bg-white shadow-lg min-h-[0vh] rounded-lg overflow-hidden">
          <div className="w-2/4 px-4 py-2  m-2 rounded-lg text-white flex flex-col justify-center items-center">
            <img src="/images/login.png" alt="banner" className="w-80" />
          </div>

          <div className="w-2/4 p-10">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="flex justify-between text-orange-600 text-sm mt-2 mb-6">
                <Link href="#">
                  ลืมรหัสผ่าน
                </Link>
                <Link href="/">
                  หน้าแรก
                </Link>
              </div>
              <div className="flex">
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-6 py-3 flex w-full justify-center items-center text-center rounded-md hover:bg-orange-600 transition"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>

            <div className="flex justify-center text-sm mt-4">
              <Link href="/register">
                ยังไม่เป็นสมาชิก  <span className="text-orange-600">คลิกเพื่อลงทะเบียน</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

    </>
  );
}

export default LoginPage;