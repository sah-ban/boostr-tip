import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const topRain = await prisma.points.findMany({
      orderBy: [
        { snapshotDay: "desc" },
        { rainPoints: "desc" }
      ],
      take: 100,
      include: {
        user: {
          select: { fid: true, username: true, displayName: true, pfpUrl: true }
        }
      }
    });
    
    const seen = new Set();
    const leaderboard = topRain.filter(p => {
      if (seen.has(p.userFid)) return false;
      seen.add(p.userFid);
      return true;
    }).slice(0, 100);

    return Response.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching rain leaderboard:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
