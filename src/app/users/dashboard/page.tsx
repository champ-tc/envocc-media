"use client";

import useAuthCheck from "@/hooks/useAuthCheck";  // นำเข้า useAuthCheck
import Sidebar from "@/components/Sidebar_User";
import TopBar from "@/components/TopBar";

function UserDashboard() {
  const { session, isLoading } = useAuthCheck("user"); // ตรวจสอบว่าเป็น User

  if (isLoading) {
    return <p>Loading...</p>; // แสดงข้อความ Loading หากกำลังโหลด session
  }

  if (!session) {
    return null; // ไม่แสดงผลใด ๆ หากไม่มี session
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-start justify-center p-6">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-8 mt-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to your Dashboard</h2>
            <p className="text-gray-600 mb-6">
              This is your main dashboard area. Here, you can access all the information you need.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm text-center">
                <h3 className="text-lg font-medium text-gray-700">Section 1</h3>
                <p className="text-sm text-gray-500">Brief description or content for section 1.</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm text-center">
                <h3 className="text-lg font-medium text-gray-700">Section 2</h3>
                <p className="text-sm text-gray-500">Brief description or content for section 2.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;