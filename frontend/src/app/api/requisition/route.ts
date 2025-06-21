import { NextResponse, type NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { protectApiRoute } from '@/lib/protectApi';



// POST - เพิ่ม requisition
export async function POST(request: NextRequest) {

    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;

    try {

        const formData = await request.formData();
        const requisition_name = formData.get('requisition_name')?.toString() || "";
        const unit = formData.get('unit')?.toString() || "";
        const type_id = parseInt(formData.get('type_id')?.toString() || "0");
        const quantity = parseInt(formData.get('quantity')?.toString() || "0");
        const reserved_quantity = parseInt(formData.get('reserved_quantity')?.toString() || "0");
        const description = formData.get('description')?.toString() || "";
        const is_borro_restricted = formData.get('is_borro_restricted') === "true";
        const file = formData.get('file') as File | null;

        let filename = "";
        if (file) {
            const extension = file.type?.split('/')[1] || 'jpg';
            if (!['jpeg', 'png', 'jpg', 'gif', 'webp'].includes(extension)) {
                return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
            }

            filename = `${uuidv4()}.${extension}`;

            const fileDir = path.join(process.cwd(), "public", "uploads");

            // สร้างโฟลเดอร์หากยังไม่มี
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }
            
            const filePath = path.join("/app/filerequisitions", filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, fileBuffer);
        }

        const newRequisition = await prisma.requisition.create({
            data: {
                requisition_name,
                unit,
                type_id,
                quantity,
                reserved_quantity,
                description,
                is_borro_restricted,
                requisition_images: filename,
            },
        });

        await prisma.requisition_updates.create({
            data: {
                requisitionId: newRequisition.id,
                addedQuantity: quantity,
                updateType: quantity > 0 ? "insert" : "insert",
                remarks: "เพิ่ม requisition ใหม่",
            },
        });

        return NextResponse.json(newRequisition);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }

        console.error('Error in POST /api/requisition:', error);
        return NextResponse.json({ error: 'Error creating requisition' }, { status: 500 });
    }
}

// GET - ดึง requisition ทั้งหมดแบบแบ่งหน้า
export async function GET(request: NextRequest) {

    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;
    
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        const requisitions = await prisma.requisition.findMany({
            skip: offset,
            take: limit,
            orderBy: { id: "asc" },
        });

        const totalRecords = await prisma.requisition.count();
        const totalPages = Math.ceil(totalRecords / limit);

        return NextResponse.json({
            items: requisitions,
            totalPages,
            totalRecords
        });
    } catch (error) {
        console.error('Error fetching requisitions:', error);
        return NextResponse.json({ error: 'Error fetching requisitions' }, { status: 500 });
    }
}
