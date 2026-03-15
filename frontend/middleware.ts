import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const pathname = url.pathname;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const userAgent = req.headers.get("user-agent") || "";

    // อนุญาต static/public paths ก่อน
    if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname.startsWith("/media") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/uploads") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname.startsWith("/api/auth") ||   // สำคัญ
        pathname.startsWith("/api/images")    // สำคัญ
    ) {
        return NextResponse.next();
    }

    // Block bots or suspicious clients
    if (!userAgent.toLowerCase().includes("mozilla")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // Require only safe HTTP methods for protected routes
    if (!["GET", "POST", "PUT", "DELETE"].includes(req.method)) {
        return new NextResponse("Method Not Allowed", { status: 405 });
    }

    // ถ้าเป็น API ที่ต้อง auth ให้คืน 401 JSON แทน redirect
    if (!token) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (token.role === "user" && pathname.startsWith("/admins")) {
        url.pathname = "/users/main";
        return NextResponse.redirect(url);
    }

    if (token.role === "admin" && pathname.startsWith("/users")) {
        url.pathname = "/admins/dashboard";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admins/:path*", "/users/:path*", "/api/:path*"],
};