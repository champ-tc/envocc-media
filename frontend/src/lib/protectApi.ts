// lib/protectApi.ts

import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

// 🧠 In-memory store สำหรับจำกัดจำนวน request ต่อ IP
const ipRateLimitMap = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = ipRateLimitMap.get(ip);

    if (!entry) {
        ipRateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }

    if (now - entry.timestamp > windowMs) {
        ipRateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }

    if (entry.count >= limit) {
        return true;
    }

    entry.count += 1;
    return false;
}

/**
 * ป้องกัน API ด้วย: 1) ตรวจ JWT 2) เช็ค role 3) เช็ค rate limit
 * 
 * @param request NextRequest
 * @param allowedRoles ['admin'], ['user'], ['admin', 'user'] ฯลฯ
 * @param limit จำนวน request สูงสุดต่อช่วงเวลา (default: 30)
 * @param windowMs ระยะเวลา (ms) ที่นับ limit (default: 60000 ms = 1 นาที)
 * @returns true (ถ้าผ่าน), หรือ NextResponse 403 / 429
 */
export async function protectApiRoute(
    request: NextRequest,
    allowedRoles: string[],
    limit = 30,
    windowMs = 60_000
): Promise<true | NextResponse> {
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';

    // ✅ ตรวจ rate limit
    if (isRateLimited(ip, limit, windowMs)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // ✅ ตรวจ JWT + role
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !allowedRoles.includes(token.role as string)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return true;
}
