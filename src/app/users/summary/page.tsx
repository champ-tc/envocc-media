"use client";

import useAuthCheck from "@/hooks/useAuthCheck";
import Sidebar from "@/components/Sidebar_User";
import NavbarUser from "@/components/NavbarUser";

function UsersSummary() {
    const { session, isLoading } = useAuthCheck("user");

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!session) {
        return null;
    }

    return (
            <div className="flex-1 flex flex-col">
                <NavbarUser />

                {/* Main content */}
                <div className="flex-1 flex items-start justify-center p-6">
                    <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-8 mt-4">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">ยืม/คืน สื่อ</h2>
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
    );
}

export default UsersSummary;