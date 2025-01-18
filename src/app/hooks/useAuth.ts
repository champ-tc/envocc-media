import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function useAuth(role?: string) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") {
            return; // รอให้สถานะ session พร้อม
        }

        if (status === "unauthenticated") {
            router.push("/login");
        } else if (role && (session?.user as any).role !== role) {
            // หากมีการระบุบทบาท (ใช้ Type Assertion "as any")
            router.push(role === 'admin' ? "/admins/dashboard" : "/users/dashboard");
        }
    }, [status, session, role, router]);
}