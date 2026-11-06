// app/api/analytics/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "User not signed in" });
    }

    // Fetch all URLs for the user
    const urls = await prisma.url.findMany({
      where: { userId },
      select: { id: true, shorturl: true, url: true, createdAt: true },
    });

    const urlIds = urls.map(u => u.id);

    if (urlIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalVisits: 0,
          devices: {},
          locations: {},
          visitsOverTime: [],
          urls: [],
        },
      });
    }

    // Fetch analytics from visits table
    const visits = await prisma.visit.findMany({
      where: { urlId: { in: urlIds } },
      select: { device: true, location: true, createdAt: true, urlId: true },
    });

    // Total visits
    const totalVisits = visits.length;

    // Count visits per device
    const devices = visits.reduce((acc, v) => {
      const key = v.device || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Count visits per location
    const locations = visits.reduce((acc, v) => {
      const key = v.location || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} );

    // Visits over last 7 days
    const visitsOverTime = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().split('T')[0];
      const count = visits.filter(v => v.createdAt.toISOString().startsWith(day)).length;
      return { date: day, count };
    }).reverse();

    return NextResponse.json({
      success: true,
      data: {
        totalVisits,
        devices,
        locations,
        visitsOverTime,
        urls,
      },
    });
  } catch (err) {
    console.error("❌ Analytics API Error:", err);
    return NextResponse.json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
