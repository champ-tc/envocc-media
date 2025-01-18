import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export const useAuth = (role?: 'user' | 'admin') => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // รอจนกว่าจะโหลดเซสชันเสร็จ
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (role && session?.user.role !== role) {
      // หากมีการระบุบทบาท
      router.push(role === 'admin' ? "/users/dashboard" : "/admins/dashboard");
    }
  }, [status, session, router, role]);
};
