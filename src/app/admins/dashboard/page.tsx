"use client";

import { useAuth } from "../../hooks/useAuth"; // เปลี่ยนเป็นการนำเข้าจากเส้นทางสัมบูรณ์
import { signOut } from "next-auth/react";

export default function AdminDashboard() {
  useAuth('admin'); 

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">
          ยินดีต้อนรับ Admin!
        </h1>
        <p className="text-gray-700 mb-6">
          คุณได้เข้าสู่ระบบ Admin เรียบร้อยแล้ว
        </p>

        <button
          className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
