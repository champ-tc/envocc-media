import { protectApiRoute } from '@/lib/protectApi';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';

const borrowSchema = z.object({
    borrow_name: z.string().min(1, 'ชื่อสื่อเป็นข้อมูลที่จำเป็น'),
    unit: z.string().min(1, 'หน่วยนับเป็นข้อมูลที่จำเป็น'),
    type_id: z.number().int().min(1, 'ต้องระบุประเภท ID'),
    quantity: z.number().int().min(1, 'จำนวนต้องมากกว่า 0'),
    is_borro_restricted: z.boolean(),
    description: z.string().optional(),
});


function sanitizeInput(input: string): string {
    return input.trim().replace(/<[^>]*>?/gm, '');
}


export async function POST(request: NextRequest) {

    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;

    try {

        const formData = await request.formData();
        const borrowName = formData.get('borrow_name')?.toString() || '';
        const unit = formData.get('unit')?.toString() || '';
        const typeId = parseInt(formData.get('type_id')?.toString() || '0');
        const quantity = parseInt(formData.get('quantity')?.toString() || '0');
        const isBorroRestricted = formData.get('is_borro_restricted') === 'true';
        const description = formData.get('description')?.toString() || '';
        const file = formData.get('file') as File | null;

        const validatedData = borrowSchema.parse({
            borrow_name: sanitizeInput(borrowName),
            unit: sanitizeInput(unit),
            type_id: typeId,
            quantity,
            is_borro_restricted: isBorroRestricted,
            description: sanitizeInput(description),
        });

        let imageUrl = '';
        if (file) {
            const maxFileSize = 5 * 1024 * 1024;
            const allowedFileTypes = ['image/jpeg', 'image/png'];

            if (!allowedFileTypes.includes(file.type)) {
                return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
            }
            if (file.size > maxFileSize) {
                return NextResponse.json({ error: 'File size exceeds limit' }, { status: 400 });
            }

            const filename = `${uuidv4()}.${file.type.split('/')[1]}`;
            const filePath = path.join('/app/fileborrows', filename);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            await fsPromises.writeFile(filePath, fileBuffer);
            imageUrl = filename;
        }

        const newBorrow = await prisma.borrow.create({
            data: {
                borrow_name: validatedData.borrow_name,
                unit: validatedData.unit,
                type_id: validatedData.type_id,
                quantity: validatedData.quantity,
                is_borro_restricted: validatedData.is_borro_restricted,
                description: validatedData.description || null,
                borrow_images: imageUrl,
            },
        });

        return NextResponse.json(newBorrow, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        console.error('Error adding borrow:', error);
        return NextResponse.json({ error: 'Error adding borrow' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {

    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;

    try {

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const offset = (page - 1) * limit;

        const borrows = await prisma.borrow.findMany({
            skip: offset,
            take: limit,
            orderBy: { id: 'desc' },
        });

        const totalRecords = await prisma.borrow.count();
        const totalPages = Math.ceil(totalRecords / limit);

        return NextResponse.json({
            items: borrows,
            totalPages,
            totalRecords,
        });
    } catch (error) {
        console.error('Error fetching borrows:', error);
        return NextResponse.json({ error: 'Error fetching borrows' }, { status: 500 });
    }
}