import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

function Navbar() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false); // ควบคุมเมนูมือถือ
    const [userMenuOpen, setUserMenuOpen] = useState(false); // ควบคุม dropdown ของผู้ใช้งาน
    const user = session?.user;

    return (
        <div className="relative bg-gradient-to-r from-[#f5b83c] via-[#f89c2b] to-[#fb8124] text-white shadow-md">
            <div className="flex justify-between items-center py-4 px-8 h-16 z-20 relative">
                <div className="flex items-center space-x-8">
                    <img src="/images/icon_media.png" alt="Media Icon" className="h-10" />
                </div>

                <div className="hidden lg:flex space-x-8 text-lg">
                    <Link href="/users/requisition"
                        className="text-white hover:bg-white/50 hover:rounded-md px-6 py-2 cursor-pointer flex items-center">
                        <img src="/images/requisition.png" alt="เบิกสื่อ" className="h-5 mr-2" />
                        <span>เบิกสื่อ</span>
                    </Link>
                    <Link href="/users/borrow"
                        className="text-white hover:bg-white/50 hover:rounded-md px-6 py-2 cursor-pointer flex items-center">
                        <img src="/images/borrow.png" alt="เบิกสื่อ" className="h-5 mr-2" />
                        <span>ยืม/คืน สื่อ</span>
                    </Link>
                    <Link href="/users/summary"
                        className="text-white hover:bg-white/50 hover:rounded-md px-6 py-2 cursor-pointer flex items-center">
                        <img src="/images/Usersbasket.png" alt="เบิกสื่อ" className="h-5 mr-2" />
                        <span>ตะกร้า</span>
                    </Link>
                    <Link href="/users/status"
                        className="text-white hover:bg-white/50 hover:rounded-md px-6 py-2 cursor-pointer flex items-center">
                        <img src="/images/status.png" alt="เบิกสื่อ" className="h-5 mr-2" />
                        <span>ตรวจสอบสถานะ</span>
                    </Link>
                </div>

                <div className="hidden lg:flex relative items-center bg-white/50 px-6 py-2 rounded-md shadow-md">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center text-sm font-medium text-gray-700 hover:text-black focus:outline-none"
                    >
                        <span>ผู้ใช้งาน: {session?.user?.name || "Guest"}</span>
                    </button>
                    {userMenuOpen && (
                        <ul className="absolute right-0 mt-36 w-48 bg-white text-gray-800 rounded-lg shadow-lg p-2 z-50">
                            <li>
                                <Link
                                    href={`/users/personal/${user?.id}`}
                                    className="block px-4 py-2 hover:bg-gray-200 rounded-md"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    ข้อมูลส่วนตัว
                                </Link>
                            </li>
                            <li>
                                <button
                                    className="block w-full text-red-500 text-left px-4 py-2 hover:bg-gray-200 rounded-md"
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        signOut({ callbackUrl: "/login" });
                                    }}
                                >
                                    ออกจากระบบ
                                </button>
                            </li>
                        </ul>
                    )}
                </div>

                {/* Mobile Hamburger Menu */}
                <div className="lg:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
                        <img src="/images/hamburger.png" alt="menu" className="h-8 w-8" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div
                    className="lg:hidden bg-white text-gray-800 rounded-md shadow-md p-4 absolute top-16 left-0 right-0 z-50"
                >
                    <Link href="/users/requisition">
                        <span
                            className="block text-gray-800 hover:bg-gray-200 px-4 py-2 rounded-md cursor-pointer"
                            onClick={() => setIsOpen(false)}
                        >
                            เบิกสื่อ
                        </span>
                    </Link>
                    <Link href="/users/borrow">
                        <span
                            className="block text-gray-800 hover:bg-gray-200 px-4 py-2 rounded-md cursor-pointer"
                            onClick={() => setIsOpen(false)}
                        >
                            ยืม/คืน สื่อ
                        </span>
                    </Link>
                    <Link href="/users/summary">
                        <span
                            className="block text-gray-800 hover:bg-gray-200 px-4 py-2 rounded-md cursor-pointer"
                            onClick={() => setIsOpen(false)}
                        >
                            ตะกร้า
                        </span>
                    </Link>
                    <Link href="/users/status">
                        <span
                            className="block text-gray-800 hover:bg-gray-200 px-4 py-2 rounded-md cursor-pointer"
                            onClick={() => setIsOpen(false)}
                        >
                            ตรวจสอบสถานะ
                        </span>
                    </Link>
                    <Link
                        href={`/users/personal/${user?.id}`}
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md"
                        onClick={() => setUserMenuOpen(false)}
                    >
                        ข้อมูลส่วนตัว
                    </Link>
                    <button
                        className="block text-left text-red-500 hover:bg-gray-200 px-4 py-2 rounded-md w-full mt-4"
                        onClick={() => {
                            setIsOpen(false);
                            signOut({ callbackUrl: "/login" });
                        }}
                    >
                        ออกจากระบบ
                    </button>
                </div>
            )}

            {/* Underline Divider */}
            <div className="w-3/4 mx-auto h-[2px] bg-white/30 mt-0"></div>

            {/* Background Below Navbar */}
            <div className="bg-gradient-to-r from-[#f5b83c] via-[#f89c2b] to-[#fb8124] h-32 w-full"></div>
        </div>
    );
}

export default Navbar;
