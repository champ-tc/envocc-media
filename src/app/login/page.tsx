"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

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
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-orange-300/30 px-4">
        <div className="flex w-full max-w-3xl bg-white shadow-lg min-h-[70vh] rounded-lg overflow-hidden">
          {/* Left Section */}
          <div className="w-1/3 bg-orange-500 m-2 rounded-lg text-white flex flex-col justify-center items-center px-8 py-12">
            <h1 className="text-3xl font-bold mb-6">ยินดีต้อนรับ</h1>
            <p className="text-center text-lg leading-relaxed">
              เว็บนี้ใช้เพื่อการเบิกของ ยืมคืนของจากกองโรคจากการประกอบอาชีพและสิ่งแวดล้อม
            </p>
          </div>

          {/* Right Section */}
          <div className="w-2/3 p-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-orange-500">เข้าสู่ระบบ</h1>
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
              <div className="mb-6">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="flex mb-6">
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 transition"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>

            <div className="flex justify-between text-orange-600 mt-4">
              <a href="#" className="hover:underline">
                ลืมรหัสผ่าน
              </a>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

export default LoginPage;
