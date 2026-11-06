import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("📊 Dashboard API: Fetching data for user:", userId);

    const urls = await prisma.url.findMany({
      where: { userId },
      select: {
        id: true,
        url: true,
        shorturl: true,
        qrCode: { select: { id: true, scanCount: true, label: true } },
        visits: {
          select: {
            id: true,
            device: true,
            os: true,
            location: true,
            createdAt: true,
          },
        },
      },
    });

    console.log("✅ Dashboard API: Raw URLs fetched:", urls.length);

    const visits = urls.flatMap((url) =>
      url.visits.map((v) => ({
        ...v,
        urlId: url.id,
        shorturl: url.shorturl,
      }))
    );

    console.log("📈 Total visits found:", visits.length);
    console.log("📍 Sample visit:", visits[0]);

    // Count visits per device
    const devices = visits.reduce((acc, v) => {
      const key = v.device || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Count visits per OS
    const osStats = visits.reduce((acc, v) => {
      const key = v.os || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Count visits per location
    const locations = visits.reduce((acc, v) => {
      const key = v.location || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    console.log("📊 Computed stats:", { devices, osStats, locations });

    return NextResponse.json({
      success: true,
      urls,
      analytics: {
        visits,
        qrScans: urls.reduce((total, url) => total + (url.qrCode?.scanCount || 0), 0),
        deviceStats: devices,
        osStats,
        locationStats: locations,
      },
    });
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
