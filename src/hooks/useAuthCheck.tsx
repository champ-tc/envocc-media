"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "admin" | "user";

const useAuthCheck = (requiredRole: Role) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoadingUI, setIsLoadingUI] = useState(true); // ควบคุม UI ระหว่างโหลด

    useEffect(() => {
        if (status === "loading") return; // รอให้โหลด session

        // หากผู้ใช้ไม่ได้เข้าสู่ระบบ
        if (status === "unauthenticated" || !session) {
            router.replace("/login"); // เปลี่ยนไปหน้า login
            return;
        }

        // หาก role ไม่ตรงกับที่ต้องการ
        if (session.user.role !== requiredRole) {
            router.replace(
                session.user.role === "admin" ? "/admins/dashboard" : "/users/requisition"
            );
            return;
        }

        // หาก role ตรงกับที่ต้องการ แสดง UI
        setIsLoadingUI(false);
    }, [status, session, router, requiredRole]);

    return { session, isLoading: status === "loading" || isLoadingUI };
};

export default useAuthCheck;
