import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return Response.json({ error: "fid parameter is required" }, { status: 400 });
  }

  try {
    const points = await prisma.points.findFirst({
      where: { userFid: fid },
      orderBy: { snapshotDay: "desc" },
    });

    if (!points) {
      return Response.json({ points: "0", leaderboardRank: null });
    }

    // Dynamically calculate rank by counting users with more points in this period
    const higherRankCount = await prisma.points.count({
      where: {
        snapshotDay: points.snapshotDay,
        points: { gt: points.points }
      }
    });
    
    const trueRank = higherRankCount + 1;

    return Response.json({
      points: points.points.toString(),
      leaderboardRank: trueRank,
    });
  } catch (error) {
    console.error("Error fetching points:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
