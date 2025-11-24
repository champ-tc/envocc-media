import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Block bots or suspicious clients
    const userAgent = req.headers.get('user-agent') || '';
    if (!userAgent.toLowerCase().includes('mozilla')) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // Require only safe HTTP methods for protected routes
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
        return new NextResponse('Method Not Allowed', { status: 405 });
    }

    if (!token) {
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (token.role === "user" && url.pathname.startsWith("/admins")) {
        url.pathname = "/users/main";
        return NextResponse.redirect(url);
    }

    if (token.role === "admin" && url.pathname.startsWith("/users")) {
        url.pathname = "/admins/dashboard";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}


export const config = {
    matcher: [
        "/admins/:path*",
        "/users/:path*",
        "/api/:path*",
    ],
};
