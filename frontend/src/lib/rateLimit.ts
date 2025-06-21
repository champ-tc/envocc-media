const ipRateLimitMap = new Map<string, { count: number; timestamp: number }>();

/**
 * ตรวจสอบว่า IP นี้ยิงเกิน limit ในช่วงเวลา window หรือไม่
 * @param ip string - IP address ของผู้ใช้
 * @param limit number - จำนวน request สูงสุดที่อนุญาต
 * @param windowMs number - ระยะเวลา window (ms) เช่น 60_000 = 1 นาที
 * @returns boolean - true = โดน block, false = ยังยิงได้
 */
export function isRateLimited(
    ip: string,
    limit = 30,
    windowMs = 60_000
): boolean {
    const now = Date.now();
    const entry = ipRateLimitMap.get(ip);

    if (!entry) {
        ipRateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }

    // ถ้าเลยช่วงเวลา → reset counter
    if (now - entry.timestamp > windowMs) {
        ipRateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }

    // ถ้ายิงเกิน limit → block
    if (entry.count >= limit) {
        return true;
    }

    // เพิ่ม count แล้วอนุญาต
    entry.count += 1;
    return false;
}
