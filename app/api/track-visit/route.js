import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    console.log("📥 Visit received:", data);

    // Validate required fields
    const required = ["urlId", "device", "os", "browser", "location"];
    for (const field of required) {
      if (!data[field]) {
        console.warn(`⚠️ Missing field "${field}" in visit data`);
        return NextResponse.json({ success: false, error: `Missing field: ${field}` });
      }
    }

    // Save visit
    await prisma.visit.create({ data });
    console.log("✅ Visit saved to DB");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Tracking API Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
