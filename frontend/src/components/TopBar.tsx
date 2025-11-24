"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useOrderStore } from "@/stores/useOrderStore";

function TopBar() {
    const { data: session } = useSession();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const user = session?.user;

    const { orderCount, setOrderCount } = useOrderStore(); // ✅ ต้องมี setOrderCount ด้วย

    // ✅ โหลด orderCount เหมือน NavbarUser
    useEffect(() => {
        const fetchOrderCount = async () => {
            if (!user?.id) return;

            try {
                const res = await fetch(`/api/order?userId=${user.id}`);
                const data = await res.json();

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

    // ✅ dropdown เมนู
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full bg-gray-50 text-dark py-4 px-8 shadow-md flex justify-end items-center">
            <div className="flex items-center space-x-4 relative">
                <Link href="/admins/requisition_summary" prefetch={false}>
                    <div className="relative">
                        <Image
                            src="/images/basket.png"
                            alt="basket"
                            width={20}
                            height={20}
                            className="w-10 h-10"
                            priority
                        />
                        {orderCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {orderCount}
                            </span>
                        )}
                    </div>
                </Link>

                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="text-dark py-1 px-1 rounded-md hover:bg-gray-200 flex items-center space-x-3"
                    >
                        <Image src="/images/profile.png" alt="profile" width={20} height={20} className="h-8 w-6" priority />
                        <span>{user?.name || "User"}</span>
                        <Image src="/images/right-arrow.png" alt="arrow" width={20} height={20} className="h-4 w-4" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-48">
                            <Link href={`/admins/personal/${user?.id}`} prefetch={false}>
                                <button className="w-full text-left px-4 py-2 hover:bg-slate-200">ข้อมูลส่วนตัว</button>
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full text-left px-4 py-2 text-red-500 hover:bg-slate-200"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TopBar;
