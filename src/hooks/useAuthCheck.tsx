import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "admin" | "user";

const useAuthCheck = (requiredRole: Role) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoadingUI, setIsLoadingUI] = useState(true); // เพิ่มสถานะสำหรับการควบคุม UI

    useEffect(() => {
        if (status === "loading") return; // รอให้โหลด session ก่อน

        // หากผู้ใช้ไม่ได้เข้าสู่ระบบ
        if (!session || (status as "unauthenticated" | "authenticated" | "loading") === "unauthenticated") {
            router.replace("/login"); // เปลี่ยนเส้นทางไปหน้า login
            return;
        }

        // หาก role ของผู้ใช้ไม่ตรงกับหน้าที่กำหนด
        if (session.user.role !== requiredRole) {
            if (requiredRole === "admin") {
                router.replace("/users/dashboard"); // User เปลี่ยนไปหน้า /users/dashboard
            } else if (requiredRole === "user") {
                router.replace("/admins/dashboard"); // Admin เปลี่ยนไปหน้า /admins/dashboard
            }
        } else {
            // หากสิทธิ์ถูกต้อง แสดง UI
            setIsLoadingUI(false);
        }
    }, [status, session, router, requiredRole]);

    return { session, isLoading: status === "loading" || isLoadingUI }; // รวมสถานะการโหลด
};

export default useAuthCheck;
