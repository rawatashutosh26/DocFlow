import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if the email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    // 2. Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save the new user to the database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name } 
    });

  } catch (error: any) {
    console.error("Registration Error:", error);
    if (error?.code === "P1000") {
      return NextResponse.json(
        { error: "Database authentication failed. Please verify PostgreSQL credentials in your .env file." },
        { status: 500 }
      );
    }
    if (error?.code === "P1001") {
      return NextResponse.json(
        { error: "Cannot reach database server at localhost:5432. Please verify PostgreSQL service is running." },
        { status: 500 }
      );
    }
    if (error?.code === "P2021" || error?.message?.includes("does not exist in the current database")) {
      return NextResponse.json(
        { error: "Database tables are not initialized. Please run `npx prisma db push`." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Registration failed due to a server error." },
      { status: 500 }
    );
  }
}