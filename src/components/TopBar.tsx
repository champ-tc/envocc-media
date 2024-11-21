import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

function TopBar() {
    const { data: session } = useSession();

    return (
        <div className="w-full bg-gray-50 text-dark py-4 px-8 shadow-md flex justify-end items-center">
            <div className="flex items-center space-x-4">
                <Link href="/admins/requisition_summary">
                    <button className="text-blue-500 hover:text-blue-600 font-semibold">
                        ตะกร้า
                    </button>
                </Link>
                <span className="text-sm">ชื่อผู้ใช้งาน : {session?.user?.name || "User"}</span>
                <button
                    className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    ออกจากระบบ
                </button>
            </div>
        </div>
    );
}

export default TopBar;
