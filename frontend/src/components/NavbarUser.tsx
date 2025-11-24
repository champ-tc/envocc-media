"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useOrderStore } from "@/stores/useOrderStore";

function NavbarUser() {
    const { data: session } = useSession();
    const user = session?.user;
    const [isOpen, setIsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLUListElement | null>(null);

    const { orderCount, setOrderCount } = useOrderStore();

    // ✅ ดึงจำนวน order
    useEffect(() => {
        const fetchOrderCount = async () => {
            if (!user?.id) return;

            try {
                const res = await fetch(`/api/order?userId=${user.id}`);
                const data = await res.json();

                // 👉 ถ้า data เป็น array
                if (Array.isArray(data)) {
                    setOrderCount(data.length);
                } else if (Array.isArray(data.orders)) {
                    setOrderCount(data.orders.length);
                } else {
                    setOrderCount(0);
                }
            } catch (error) {
                console.error("โหลดจำนวนตะกร้าไม่สำเร็จ:", error);
            }
        };

        fetchOrderCount();
    }, [user?.id, setOrderCount]);



    // ✅ ปิดเมนูผู้ใช้เมื่อคลิกข้างนอก
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2] text-white">
            <div className="flex justify-between items-center py-3 px-6 h-16 relative">
                {/* โลโก้ */}
                <div className="flex items-center space-x-6">
                    <Link href="/users/main" className="flex items-center space-x-6 cursor-pointer">
                        <Image src="/images/logoddc.png" alt="Media Icon" width={35} height={40} priority />
                        <Image src="/images/icon_media.png" alt="icon" width={80} height={40} priority />
                    </Link>
                </div>

                {/* เมนู Desktop */}
                <div className="hidden lg:flex space-x-4 text-base font-medium">
                    {[
                        { href: "/users/requisition", label: "เบิกสื่อ", icon: "/images/requisition.png" },
                        { href: "/users/borrow", label: "ยืม/คืน สื่อ", icon: "/images/borrow.png" },
                        { href: "/users/media", label: "โหลดสื่อ", icon: "/images/poster.png" },
                        { href: "/users/summary", label: "ตะกร้า", icon: "/images/Usersbasket.png" },
                        { href: "/users/status", label: "ตรวจสอบสถานะ", icon: "/images/status.png" },
                    ].map(({ href, label, icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-white/30 transition"
                        >
                            <div className="relative">
                                <Image src={icon} alt={label} width={20} height={20} />
                                {label === "ตะกร้า" && orderCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
                                        {orderCount}
                                    </span>
                                )}
                            </div>
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>

                {/* เมนูผู้ใช้ */}
                <div className="hidden lg:flex relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center bg-white/20 px-4 py-2 rounded-md text-sm font-medium hover:bg-white/30 transition"
                    >
                        <Image src="/images/profile.png" alt="profile" width={24} height={30} priority />
                        <span className="ml-2">: {user?.name || "Guest"}</span>
                    </button>
                    {userMenuOpen && (
                        <ul
                            ref={menuRef}
                            className="absolute right-0 mt-12 w-44 bg-white text-gray-800 rounded-lg shadow-lg z-50 overflow-hidden"
                        >
                            <li>
                                <Link
                                    href={`/users/personal/${user?.id}`}
                                    className="block px-4 py-2 hover:bg-gray-100"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    ข้อมูลส่วนตัว
                                </Link>
                            </li>
                            <li>
                                <button
                                    className="w-full text-left text-red-500 px-4 py-2 hover:bg-gray-100"
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

                {/* เมนู Mobile Toggle */}
                <div className="lg:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
                        <Image src="/images/hamburger.png" alt="เมนู" width={32} height={32} priority />
                    </button>
                </div>
            </div>

            {/* เมนู Mobile */}
            {isOpen && (
                <div className="lg:hidden bg-white text-gray-800 rounded-b-xl shadow-md px-4 py-4 space-y-2">
                    {[
                        { href: "/users/requisition", label: "เบิกสื่อ", icon: "/images/requisition.png" },
                        { href: "/users/borrow", label: "ยืม/คืน สื่อ", icon: "/images/borrow.png" },
                        { href: "/users/media", label: "โหลดสื่อ", icon: "/images/poster.png" },
                        { href: "/users/summary", label: "ตะกร้า", icon: "/images/Usersbasket.png" },
                        { href: "/users/status", label: "ตรวจสอบสถานะ", icon: "/images/status.png" },
                    ].map(({ href, label, icon }) => (
                        <Link key={href} href={href}>
                            <span
                                onClick={() => setIsOpen(false)}
                                className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-gray-100"
                            >
                                <div className="relative">
                                    <Image src={icon} alt={label} width={20} height={20} />
                                    {label === "ตะกร้า" && orderCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex justify-center items-center">
                                            {orderCount}
                                        </span>
                                    )}
                                </div>
                                <span>{label}</span>
                            </span>
                        </Link>
                    ))}

                    <hr className="my-2" />

                    <Link
                        href={`/users/personal/${user?.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-gray-100"
                    >
                        <span>ข้อมูลส่วนตัว</span>
                    </Link>

                    <button
                        className="flex items-center space-x-2 text-left text-red-500 hover:bg-gray-100 px-4 py-2 rounded-md w-full"
                        onClick={() => {
                            setIsOpen(false);
                            signOut({ callbackUrl: "/login" });
                        }}
                    >
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default NavbarUser;
