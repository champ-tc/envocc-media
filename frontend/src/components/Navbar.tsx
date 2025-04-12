'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // ✅ ใช้ Image แทน img

function Navbar() {
    const [isClient, setIsClient] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    if (!isClient) return null;

    return (
        <nav className="bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2]">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <div className="flex items-center space-x-2">
                    <Link href="/">
                        <Image
                            src="/images/logoddc.png"
                            alt="Media Icon"
                            width={35}
                            height={40}
                            style={{ height: "40px", width: "35px" }} // ✅ เพิ่มทั้ง 2 ฝั่ง
                            priority
                        />
                    </Link>
                    <Link href="/">
                        <Image
                            src="/images/icon_media.png"
                            alt="icon"
                            width={80}
                            height={40}
                            style={{ height: "40px", width: "80px" }} // ✅ เช่นเดียวกัน
                            priority
                        />
                    </Link>
                </div>


                <button
                    onClick={toggleMenu}
                    type="button"
                    className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                    aria-controls="navbar-default"
                    aria-expanded={isMenuOpen ? "true" : "false"}
                >
                    <span className="sr-only">Open main menu</span>
                    <Image src="/images/hamburger.png" alt="menu" width={32} height={32} />
                </button>

                <div
                    className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto md:bg-white/80 px-4 py-2 border-gray-100 rounded-lg bg-gray-50`}
                    id="navbar-default"
                >
                    <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0">
                        <li>
                            <a href="/media" className="font-bold block py-2 px-3 text-[#46c1a5] rounded md:bg-transparent md:text-[#46c1a5] md:p-0 md:dark:text-[#46c1a5]">
                                สื่อเผยแพร่
                            </a>
                        </li>
                        <li>
                            <a href="/login" className="font-bold block py-2 px-3 text-[#46c1a5] rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-[#46c1a5] md:p-0 md:dark:hover:text-[#46c1a5]">
                                เข้าสู่ระบบ
                            </a>
                        </li>
                        <li>
                            <a href="/register" className="font-bold block py-2 px-3 text-[#46c1a5] rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:text-[#46c1a5] md:p-0 md:dark:hover:text-[#46c1a5]">
                                สมัครสมาชิก
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar