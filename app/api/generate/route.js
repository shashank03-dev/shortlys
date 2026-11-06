// app/api/generate/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // use named export
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    // ✅ Pass the request to auth() to get the logged-in user
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not signed in",
      });
    }

    const body = await request.json();
    console.log("🚀 Received body:", body);

    if (!body.url || !body.shorturl) {
      console.log("❌ Missing url or shorturl");
      return NextResponse.json({
        success: false,
        message: "Missing url or shorturl",
      });
    }

    const { url, shorturl } = body;

    // ✅ Check if short URL already exists
    const existing = await prisma.url.findFirst({
      where: { shorturl },
    });
    console.log("🔍 Existing doc:", existing);

    if (existing) {
      console.log("⚠️ URL already exists");
      return NextResponse.json({
        success: false,
        message: "Alias already taken",
      });
    }

    // ✅ Normalize URL (ensure it starts with http/https)
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = "https://" + fullUrl;
    }

    // ✅ Save to DB with userId
    const data = await prisma.url.create({
      data: {
        url: fullUrl,
        shorturl,
        userId,
      },
    });
    console.log("✅ Inserted document:", data);

    return NextResponse.json({
      success: true,
      message: "URL Generated Successfully",
      shorturl, // ✅ Return the shorturl so the client can display it
      url: fullUrl,
    });
  } catch (err) {
    console.error("❌ API Error:", err);
    return NextResponse.json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
