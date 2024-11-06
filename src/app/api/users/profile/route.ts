// src/app/api/users/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // Use getServerSession for server routes
import { prisma } from "@/lib/prisma"; 
import { authOptions } from "@/lib/auth"; // Ensure to import your authOptions
import bcrypt from "bcryptjs";

export async function GET(req) {
    const session = await getServerSession(authOptions); // Correctly retrieve the session

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data from the database using Prisma
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare the user data to return
    const userData = {
        username: user.username,
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        tel: user.tel,
        email: user.email,
        department: user.department,
        position: user.position,
    };

    return NextResponse.json(userData);
}

export async function PUT(req) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { username, title, firstName, lastName, tel, email, department, position, password } = body;

    const updatedData: any = {
        username,
        title,
        firstName,
        lastName,
        tel,
        email,
        department,
        position,
    };

    // Hash the password if it is provided
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        updatedData.password = hashedPassword;
    }

    // Update the user data in the database
    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updatedData,
    });

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
}
