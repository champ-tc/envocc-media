"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Navbar() {
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // เพิ่ม state สำหรับควบคุมเมนู

    useEffect(() => {
        setIsClient(true); // ตรวจสอบว่าทำงานในฝั่งไคลเอนต์
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen); // ฟังก์ชันเปิด-ปิดเมนู
    };

    if (!isClient) {
        return null; // ป้องกันการเรนเดอร์ก่อนที่จะโหลดไคลเอนต์
    }

    return (
        <nav className="bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2]">
            {/* <nav> */}
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <div className="flex items-center space-x-2">
                    <Link href="/">
                        <img src="/images/logoddc.png" alt="Media Icon" className="h-10" />
                    </Link>
                    <Link href="/">
                        <img src="/images/icon_media.png" alt="icon" className="h-10" />
                    </Link>
                </div>

                <button
                    onClick={toggleMenu}
                    type="button"
                    className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                    aria-controls="navbar-default"
                    aria-expanded={isMenuOpen ? "true" : "false"} // แก้ไขสถานะการขยายของเมนู
                >
                    <span className="sr-only">Open main menu</span>
                    <img src="/images/hamburger.png" alt="menu" className="h-8 w-8" />
                </button>
                <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto  md:bg-white/80 px-4 py-2 border-gray-100 rounded-lg bg-gray-50`} id="navbar-default">
                    <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0">
                        <li>
                            <a href="/media" className="font-bold block py-2 px-3 text-[#46c1a5] rounded md:bg-transparent md:text-[#46c1a5] md:p-0 md:dark:text-[#46c1a5]" aria-current="page">สื่อเผยแพร่</a>
                        </li>
                        <li>
                            <a href="/login" className="font-bold block py-2 px-3 text-[#46c1a5] rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-[#46c1a5] md:p-0 md:dark:hover:text-[#46c1a5]">เข้าสู่ระบบ</a>
                        </li>
                        <li>
                            <a href="/register" className="font-bold block py-2 px-3 text-[#46c1a5] rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:text-[#46c1a5] md:p-0 md:dark:hover:text-[#46c1a5]">สมัครสมาชิก</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default Navbar;
