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
        <nav className="bg-white">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <Link href="/"><img src="/images/icon_media.png" alt="icon" className="h-10" /></Link>
                <button 
                    onClick={toggleMenu} // เพิ่ม onClick เพื่อควบคุมเมนู
                    type="button" 
                    className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" 
                    aria-controls="navbar-default" 
                    aria-expanded={isMenuOpen ? "true" : "false"} // แก้ไขสถานะการขยายของเมนู
                >
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                    </svg>
                </button>
                <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`} id="navbar-default">
                    <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white">
                        <li>
                            <a href="/media" className="font-bold block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500" aria-current="page">สื่อเผยแพร่</a>
                        </li>
                        <li>
                            <a href="/login" className="font-bold block py-2 px-3 text-orange-500 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500">เข้าสู่ระบบ</a>
                        </li>
                        <li>
                            <a href="/register" className="font-bold block py-2 px-3 text-orange-500 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500">สมัครสมาชิก</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default Navbar;
