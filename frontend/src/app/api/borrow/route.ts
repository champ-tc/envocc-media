// src/app/api/borrow/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const STORAGE_DIR =
    process.env.BORROW_STORAGE_DIR || path.join(process.cwd(), "public", "borrows");

const LEGACY_DIRS = [
    "/app/fileborrows",
    path.join(process.cwd(), "public", "fileborrows-data"),
];

const PUBLIC_PATH = "/borrows";
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE || "";

/* ---------------- Local Types (แก้ TS error b) ---------------- */
// ✅ ทำให้ rows.map((b)=>...) ไม่ error โดยไม่ต้อง import Prisma types
type BorrowRow = {
    borrow_images?: string | null;
    [key: string]: any;
};

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
    return String(s ?? "").trim().replace(/<[^>]*>?/gm, "");
}

/* ---------------- Helpers ---------------- */
function fileExists(p: string) {
    try {
        return fs.existsSync(p);
    } catch {
        return false;
    }
}

function buildPublicUrl(absPath: string) {
    const publicBorrows = path.join(process.cwd(), "public", "borrows");
    if (absPath.startsWith(publicBorrows)) {
        const filename = path.basename(absPath);
        return `${ASSET_BASE}${PUBLIC_PATH}/${filename}`;
    }

    if (absPath.startsWith("/app/fileborrows")) {
        return `${ASSET_BASE}${PUBLIC_PATH}/${path.basename(absPath)}`;
    }

    const legacyPublic = path.join(process.cwd(), "public", "fileborrows-data");
    if (absPath.startsWith(legacyPublic)) {
        return `${ASSET_BASE}/fileborrows-data/${path.basename(absPath)}`;
    }

    return null;
}

function resolveExistingFile(filename?: string | null): { path?: string; url?: string } {
    const safe = (filename ?? "").trim();
    if (!safe) return {};

    // STORAGE_DIR
    let p = path.join(STORAGE_DIR, safe);
    if (fileExists(p)) return { path: p, url: buildPublicUrl(p) ?? undefined };

    // legacy 1
    p = path.join(LEGACY_DIRS[0], safe);
    if (fileExists(p)) return { path: p, url: buildPublicUrl(p) ?? undefined };

    // legacy 2
    p = path.join(LEGACY_DIRS[1], safe);
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
                borrow_images: imageFilename || "",
                status: 1, // ✅ default 1 แต่อยากชัดเจน
            },
        });

        const { url } = resolveExistingFile((created as any).borrow_images ?? null);
        return NextResponse.json({ ...created, image_url: url ?? null }, { status: 200 });
    } catch (err: unknown) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input data", details: err.errors }, { status: 400 });
        }
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: "Error adding borrow", message }, { status: 500 });
    }
}

/* ---------------- GET: list (with image_url) ---------------- */
export async function GET(request: NextRequest) {
    const access = await protectApiRoute(request, ["admin", "user"]);
    if (access !== true) return access;

    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 50);
        const offset = (page - 1) * limit;

        // ✅ เฉพาะรายการที่แสดง
        const where = { status: 1 };

        // ✅ cast เพื่อให้ b ใน map ไม่ error แน่นอน
        const rows = (await prisma.borrow.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { id: "desc" },
            include: { type: true },
        })) as unknown as BorrowRow[];

        const totalRecords = await prisma.borrow.count({ where });

        const items = rows.map((b) => {
            const { url } = resolveExistingFile(b.borrow_images ?? null);
            return { ...b, image_url: url ?? null };
        });

        const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
        return NextResponse.json({ items, totalPages, totalRecords }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: "Error fetching borrows", message }, { status: 500 });
    }
}