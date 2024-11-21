"use client";

import useAuthCheck from "@/hooks/useAuthCheck";  // นำเข้า useAuthCheck
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";

function AdminsBorrow() {
    const { session, isLoading } = useAuthCheck("admin");

    // แสดงสถานะ Loading หากยังตรวจสอบสิทธิ์ไม่เสร็จ
    if (isLoading) {
        return <p>Loading...</p>;
    }

    // หากไม่มี session ไม่แสดงผลใด ๆ
    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-8 mt-4">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">ยืม คืน</h2>
                        <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                            <div className="w-full">
                                test
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsBorrow;