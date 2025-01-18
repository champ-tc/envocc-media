import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.clone(); // Clone URL เพื่อเปลี่ยนเส้นทาง

    // ดึง JWT Token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // หากไม่ได้เข้าสู่ระบบ (ไม่มี token)
    if (!token) {
        url.pathname = "/login"; // เปลี่ยนเส้นทางไปหน้า login
        return NextResponse.redirect(url);
    }

    // หากเป็น user และพยายามเข้าถึงหน้า admin
    if (token.role === "user" && url.pathname.startsWith("/admins")) {
        url.pathname = "/users/borrow"; // เปลี่ยนเส้นทางไปหน้า /users/dashboard
        return NextResponse.redirect(url);
    }

    // หากเป็น admin และพยายามเข้าถึงหน้า user
    if (token.role === "admin" && url.pathname.startsWith("/users")) {
        url.pathname = "/admins/dashboard"; // เปลี่ยนเส้นทางไปหน้า /admins/dashboard
        return NextResponse.redirect(url);
    }

    return NextResponse.next(); // อนุญาตให้ผ่าน
}

// กำหนด matcher สำหรับ middleware
export const config = {
    matcher: [
        "/admins/:path*", // ทุกหน้าใน /admins/*
        "/users/:path*",  // ทุกหน้าใน /users/*
    ],
};
