// app/api/user-urls/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    // ✅ Get logged-in user
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not signed in",
        urls: [],
      });
    }

    // ✅ Fetch all URLs for this user from DB
    const urls = await prisma.url.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }, // latest first
    });

    return NextResponse.json({
      success: true,
      urls,
    });
  } catch (err) {
    console.error("❌ API Error:", err);
    return NextResponse.json({
      success: false,
      message: "Internal Server Error",
      urls: [],
    });
  }
}
