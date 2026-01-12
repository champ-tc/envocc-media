// import { getToken } from 'next-auth/jwt';
// import { NextResponse, type NextRequest } from 'next/server';

// // 🧠 Store สำหรับ rate limit: นับ request ต่อ IP
// const ipRateLimitMap = new Map<string, { count: number; timestamp: number }>();

// function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
//     const now = Date.now();
//     const entry = ipRateLimitMap.get(ip);

//     if (!entry) {
//         ipRateLimitMap.set(ip, { count: 1, timestamp: now });
//         return false;
//     }

//     if (now - entry.timestamp > windowMs) {
//         // reset window
//         ipRateLimitMap.set(ip, { count: 1, timestamp: now });
//         return false;
//     }

//     if (entry.count >= limit) {
//         return true;
//     }

//     entry.count += 1;
//     return false;
// }

// export async function protectApiRoute(
//     request: NextRequest,
//     allowedRoles: string[],
//     limit = 30,
//     windowMs = 60_000
// ): Promise<true | NextResponse> {
//     const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';

//     // ✅ ตรวจ rate limit
//     if (isRateLimited(ip, limit, windowMs)) {
//         console.warn(`🚨 Rate limit exceeded for IP: ${ip}`);
//         return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
//     }

//     // ✅ ตรวจ JWT และ role
//     // ใน protectApiRoute.ts
//     const token = await getToken({
//         req: request,
//         secret: process.env.NEXTAUTH_SECRET,
//         cookieName: '__Secure-next-auth.session-token', // ✅ ตรงกับ authOptions
//     });


//     if (!token) {
//         console.warn(`🚨 No token found in request from IP: ${ip}`);
//         return NextResponse.json({ error: 'Missing or invalid token' }, { status: 403 });
//     }

//     if (!token.role) {
//         console.warn(`🚨 Token missing role for IP: ${ip}`, token);
//         return NextResponse.json({ error: 'Token missing role' }, { status: 403 });
//     }

//     if (!allowedRoles.includes(token.role as string)) {
//         console.warn(`🚨 Token role not allowed: ${token.role} for IP: ${ip}`);
//         return NextResponse.json({ error: 'Role not allowed' }, { status: 403 });
//     }

//     // ✅ ผ่านทุกการตรวจสอบ
//     return true;
// }

import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

// 🧠 Store สำหรับ rate limit: นับ request ต่อ IP
const ipRateLimitMap = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = ipRateLimitMap.get(ip);

    if (!entry) {
        ipRateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }

    if (now - entry.timestamp > windowMs) {
        // reset window
        ipRateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }

    if (entry.count >= limit) {
        return true;
    }

    entry.count += 1;
    return false;
}

export async function protectApiRoute(
    request: NextRequest,
    allowedRoles: string[],
    limit = 30,
    windowMs = 60_000
): Promise<true | NextResponse> {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';

    // ✅ 1. ตรวจ rate limit
    if (isRateLimited(ip, limit, windowMs)) {
        console.warn(`🚨 Rate limit exceeded for IP: ${ip}`);
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // ✅ 2. ตรวจสอบ Environment เพื่อเลือกชื่อ Cookie ให้ถูก
    const isProd = process.env.NODE_ENV === "production";
    const cookieName = isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token";

    // ✅ 3. ดึง Token โดยระบุ cookieName ที่ถูกต้อง
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: cookieName,
    });

    if (!token) {
        console.warn(`🚨 No token found in request from IP: ${ip} (Env: ${process.env.NODE_ENV})`);
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 403 });
    }

    if (!token.role) {
        console.warn(`🚨 Token missing role for IP: ${ip}`, token);
        return NextResponse.json({ error: 'Token missing role' }, { status: 403 });
    }

    if (!allowedRoles.includes(token.role as string)) {
        console.warn(`🚨 Token role not allowed: ${token.role} for IP: ${ip}`);
        return NextResponse.json({ error: 'Role not allowed' }, { status: 403 });
    }

    // ✅ ผ่านทุกการตรวจสอบ
    return true;
}