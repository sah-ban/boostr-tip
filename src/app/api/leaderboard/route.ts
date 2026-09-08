export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const topPoints = await prisma.points.findMany({
      orderBy: [
        { snapshotDay: "desc" },
        { points: "desc" }
      ],
      take: 100,
      include: {
        user: {
          select: { fid: true, username: true, displayName: true, pfpUrl: true }
        }
      }
    });
    
    // De-duplicate by userFid taking the latest snapshot due to order
    const seen = new Set();
    const latestPoints = topPoints.filter(p => {
      if (seen.has(p.userFid)) return false;
      seen.add(p.userFid);
      return true;
    });

    // Sort by actual points descending
    latestPoints.sort((a, b) => Number(b.points) - Number(a.points));

    const leaderboard = latestPoints.slice(0, 100);

    return Response.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
