//app/api/webhooks/customer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, User } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    console.log("Webhook user creation request received");

    await connectToDatabase();
    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    //Name validation
    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    //Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    //Role validation
    const validRoles = ['customer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    // Check if user already exists using email
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const user = await User.create({
      name,
      email,
      role,
      password: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      emailVerified: false,
      preferences: {
        notifications: {
          email: true,
          browser: true,
          ticketUpdates: true,
          comments: true,
        },
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
      },
      profile: {},
    });

    return NextResponse.json(user, { status: 201 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
