"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && session.user.role !== 'user') {
      router.push("/admins/dashboard");
    }
  }, [status, session]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col">
        {/* TopBar */}
        <TopBar />

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">
              ยินดีต้อนรับ User {session?.user?.name || "ผู้ใช้"}!
            </h1>
            <p className="text-gray-700 mb-6">
              คุณได้เข้าสู่ระบบ User เรียบร้อยแล้ว
            </p>
            
            <button
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
