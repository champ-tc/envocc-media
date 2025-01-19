import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (token.role === "user" && url.pathname.startsWith("/admins")) {
        url.pathname = "/users/requisition";
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
    ],
};
