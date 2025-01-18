import { PrismaClient } from "@prisma/client";

declare global {
    var prisma: PrismaClient | undefined;
}

// ทำให้ TypeScript สามารถจัดการโมดูลได้อย่างเหมาะสม
export { };
