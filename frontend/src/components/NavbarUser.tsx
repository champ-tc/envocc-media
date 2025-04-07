import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

function Navbar() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false); // เมนูมือถือ
    const [userMenuOpen, setUserMenuOpen] = useState(false); // เมนูผู้ใช้งาน
    const user = session?.user;
    const menuRef = useRef<HTMLUListElement | null>(null);

    // ปิด dropdown เมื่อคลิกนอกเมนู
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [userMenuOpen]);

    return (
        <div className="bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2] text-white">
            <div className="flex justify-between items-center py-3 px-6 h-16 relative">
                {/* โลโก้ */}
                <div className="flex items-center space-x-6">
                    <img src="/images/logoddc.png" alt="โลโก้" className="h-10" />
                    <img src="/images/icon_media.png" alt="โลโก้ media" className="h-10" />
                </div>

                {/* เมนู Desktop */}
                <div className="hidden lg:flex space-x-4 text-base font-medium">
                    {[{
                        href: "/users/requisition", label: "เบิกสื่อ", icon: "/images/requisition.png"
                    }, {
                        href: "/users/borrow", label: "ยืม/คืน สื่อ", icon: "/images/borrow.png"
                    }, {
                        href: "/users/summary", label: "ตะกร้า", icon: "/images/Usersbasket.png"
                    }, {
                        href: "/users/status", label: "ตรวจสอบสถานะ", icon: "/images/status.png"
                    }].map(({ href, label, icon }) => (
                        <Link key={href} href={href} className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-white/30 transition">
                            <img src={icon} alt={label} className="h-5" />
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>

                {/* ผู้ใช้งาน */}
                <div className="hidden lg:flex relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center bg-white/20 px-4 py-2 rounded-md text-sm font-medium hover:bg-white/30 transition"
                    >
                        <img src="/images/profile.png" alt="menu" className="h-8 w-6 rounded-full" /> : {session?.user?.name || "Guest"}
                    </button>
                    {userMenuOpen && (
                        <ul ref={menuRef} className="absolute right-0 mt-12 w-44 bg-white text-gray-800 rounded-lg shadow-lg z-50 overflow-hidden">
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

                {/* Hamburger สำหรับ Mobile */}
                <div className="lg:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
                        <img src="/images/hamburger.png" alt="เมนู" className="h-8 w-8" />
                    </button>
                </div>
            </div>

            {/* เมนู Mobile */}
            {isOpen && (
                <div className="lg:hidden bg-white text-gray-800 rounded-b-xl shadow-md px-4 py-4 space-y-2">
                    {[{
                        href: "/users/requisition", label: "เบิกสื่อ"
                    }, {
                        href: "/users/borrow", label: "ยืม/คืน สื่อ"
                    }, {
                        href: "/users/summary", label: "ตะกร้า"
                    }, {
                        href: "/users/status", label: "ตรวจสอบสถานะ"
                    }].map(({ href, label }) => (
                        <Link key={href} href={href}>
                            <span
                                onClick={() => setIsOpen(false)}
                                className="block px-4 py-2 rounded-md hover:bg-gray-100"
                            >
                                {label}
                            </span>
                        </Link>
                    ))}

                    <hr className="my-2" />

                    <Link
                        href={`/users/personal/${user?.id}`}
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-100 rounded-md"
                    >
                        ข้อมูลส่วนตัว
                    </Link>
                    <button
                        className="block text-left text-red-500 hover:bg-gray-100 px-4 py-2 rounded-md w-full"
                        onClick={() => {
                            setIsOpen(false);
                            signOut({ callbackUrl: "/login" });
                        }}
                    >
                        ออกจากระบบ
                    </button>
                </div>
            )}
        </div>
    );
}

export default Navbar;