// src/app/api/borrow/route.ts
import { protectApiRoute } from "@/lib/protectApi";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { promises as fsPromises } from "fs";

/* ---------------- Config ---------------- */
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

// โฟลเดอร์เก็บไฟล์จริง (override ได้ด้วย env)
const STORAGE_DIR =
    process.env.BORROW_STORAGE_DIR ||
    path.join(process.cwd(), "public", "borrows");

// โฟลเดอร์ไฟล์เก่าที่เคยใช้
const LEGACY_DIRS = [
    "/app/fileborrows",
    path.join(process.cwd(), "public", "fileborrows-data"),
];

// base path สำหรับไฟล์ใน public/borrows เวลาเสิร์ฟผ่าน Next (static)
const PUBLIC_PATH = "/borrows";

// ถ้าต้องเสิร์ฟผ่านโดเมนอื่น ใส่ไว้ใน .env (optional)
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE || "";

/* ---------------- Schema ---------------- */
const borrowSchema = z.object({
    borrow_name: z.string().min(1, "ชื่อสื่อเป็นข้อมูลที่จำเป็น"),
    unit: z.string().min(1, "หน่วยนับเป็นข้อมูลที่จำเป็น"),
    type_id: z.number().int().min(1, "ต้องระบุประเภท ID"),
    quantity: z.number().int().min(1, "จำนวนต้องมากกว่า 0"),
    is_borro_restricted: z.boolean(),
    description: z.string().optional(),
});

function sanitize(s: string) {
    return s.trim().replace(/<[^>]*>?/gm, "");
}

/* ---------------- Helpers ---------------- */
function fileExists(p: string) {
    try { return fs.existsSync(p); } catch { return false; }
}

function buildPublicUrl(absPath: string) {
    // อยู่ที่ public/borrows => /borrows/<filename>
    const publicBorrows = path.join(process.cwd(), "public", "borrows");
    if (absPath.startsWith(publicBorrows)) {
        const filename = path.basename(absPath);
        return `${ASSET_BASE}${PUBLIC_PATH}/${filename}`;
    }
    // legacy: /app/fileborrows -> map ให้เป็น /borrows/<filename> (ต้องมี nginx map ถ้านอก Next)
    if (absPath.startsWith("/app/fileborrows")) {
        return `${ASSET_BASE}${PUBLIC_PATH}/${path.basename(absPath)}`;
    }
    // legacy: public/fileborrows-data -> /fileborrows-data/<filename>
    const legacyPublic = path.join(process.cwd(), "public", "fileborrows-data");
    if (absPath.startsWith(legacyPublic)) {
        return `${ASSET_BASE}/fileborrows-data/${path.basename(absPath)}`;
    }
    return null;
}

function resolveExistingFile(filename?: string | null): { path?: string; url?: string } {
    if (!filename) return {};
    // ใหม่สุด: STORAGE_DIR
    let p = path.join(STORAGE_DIR, filename);
    if (fileExists(p)) return { path: p, url: buildPublicUrl(p) ?? undefined };

    // legacy 1
    p = path.join(LEGACY_DIRS[0], filename);
    if (fileExists(p)) return { path: p, url: buildPublicUrl(p) ?? undefined };

    // legacy 2
    p = path.join(LEGACY_DIRS[1], filename);
    if (fileExists(p)) return { path: p, url: buildPublicUrl(p) ?? undefined };

    return {};
}

/* ---------------- POST: create ---------------- */
export async function POST(request: NextRequest) {
    const access = await protectApiRoute(request, ["admin"]);
    if (access !== true) return access;

    try {
        const formData = await request.formData();
        const borrowName = formData.get("borrow_name")?.toString() || "";
        const unit = formData.get("unit")?.toString() || "";
        const typeId = parseInt(formData.get("type_id")?.toString() || "0", 10);
        const quantity = parseInt(formData.get("quantity")?.toString() || "0", 10);
        const isBorroRestricted = formData.get("is_borro_restricted") === "true";
        const description = formData.get("description")?.toString() || "";
        const file = formData.get("file") as File | null;

        const validated = borrowSchema.parse({
            borrow_name: sanitize(borrowName),
            unit: sanitize(unit),
            type_id: typeId,
            quantity,
            is_borro_restricted: isBorroRestricted,
            description: sanitize(description),
        });

        let imageFilename = "";

        if (file) {
            if (!ALLOWED_TYPES.has(file.type)) {
                return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
            }
            if (file.size > MAX_SIZE) {
                return NextResponse.json({ error: "File size exceeds 10MB" }, { status: 400 });
            }

            if (!fs.existsSync(STORAGE_DIR)) {
                await fsPromises.mkdir(STORAGE_DIR, { recursive: true });
            }

            const ext = file.type.split("/")[1] || "png";
            const filename = `${uuidv4()}.${ext}`;
            const filePath = path.join(STORAGE_DIR, filename);
            const buf = Buffer.from(await file.arrayBuffer());
            await fsPromises.writeFile(filePath, buf);
            imageFilename = filename;
        }

        const created = await prisma.borrow.create({
            data: {
                borrow_name: validated.borrow_name,
                unit: validated.unit,
                type_id: validated.type_id,
                quantity: validated.quantity,
                is_borro_restricted: validated.is_borro_restricted,
                description: validated.description || null,
                borrow_images: imageFilename,
                // status: 1, // ใส่ถ้ามีคอลัมน์นี้
            },
        });

        // แนบ image_url กลับให้ frontend ใช้ได้ทันที
        const { url } = resolveExistingFile(created.borrow_images);
        return NextResponse.json({ ...created, image_url: url ?? null }, { status: 200 });
    } catch (err: unknown) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input data", details: err.errors }, { status: 400 });
        }
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        console.error("POST /api/borrow ERROR:", { message, stack });
        return NextResponse.json({ error: "Error adding borrow", message }, { status: 500 });
    }
}

/* ---------------- GET: list (with image_url) ---------------- */
export async function GET(request: NextRequest) {
    const access = await protectApiRoute(request, ["admin", 'user']);
    if (access !== true) return access;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        const [rows, totalRecords] = await Promise.all([
            prisma.borrow.findMany({ skip: offset, take: limit, orderBy: { id: "desc" } }),
            prisma.borrow.count(),
        ]);

        const items = rows.map((b) => {
            const { url } = resolveExistingFile(b.borrow_images);
            return { ...b, image_url: url ?? null };
        });

        const totalPages = Math.ceil(totalRecords / limit);
        return NextResponse.json({ items, totalPages, totalRecords }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        console.error("GET /api/borrow ERROR:", { message, stack });
        return NextResponse.json({ error: "Error fetching borrows", message }, { status: 500 });
    }
}
