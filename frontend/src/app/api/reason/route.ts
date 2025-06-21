import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { isRateLimited } from '@/lib/rateLimit';


// ใช้ `GET` แทน `default export`
export async function GET(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    if (isRateLimited(ip, 30, 60_000)) {
        return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
    }

    try {
        const reasons = await prisma.reason.findMany();
        return NextResponse.json(reasons, { status: 200 });
    } catch (error) {
        console.error("Error fetching reasons:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
