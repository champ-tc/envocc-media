import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

function TopBar() {
    const { data: session } = useSession();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null); // กำหนดประเภทของ ref
    const user = session?.user; // ดึงข้อมูลผู้ใช้จาก session

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    const handleClickOutside = (event: MouseEvent) => {
        // ตรวจสอบว่าคลิกนอก dropdown หรือไม่
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full bg-gray-50 text-dark py-4 px-8 shadow-md flex justify-end items-center">
            <div className="flex items-center space-x-4 relative">
                <Link href="/admins/requisition_summary">
                    <button className="py-1 px-1 rounded-md hover:bg-gray-200 font-semibold">
                        <img src="/images/basket.png" alt="menu" className="h-8 w-8" />
                    </button>
                </Link>
                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={toggleDropdown}
                        className="text-dark py-1 px-1 rounded-md hover:bg-gray-200 flex items-center space-x-3"
                    >
                        <img src="/images/profile.png" alt="menu" className="h-8 w-8 rounded-full" />
                        <span>{session?.user?.name || "User"}</span>
                        <img src="/images/right-arrow.png" alt="menu" className="h-4 w-4 rounded-full" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-48">
                            <div className="p-2">
                                <Link href={`/admins/personal/${user?.id}`}>
                                    <button className="w-full text-left px-4 py-2 hover:bg-slate-200">
                                        ข้อมูลส่วนตัว
                                    </button>
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-slate-200"
                                >
                                    ออกจากระบบ
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TopBar;