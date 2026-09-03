import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const topAllowances = await prisma.allowance.findMany({
      orderBy: [
        { snapshotDay: "desc" },
        { tipAllowance: "desc" }
      ],
      take: 100,
      include: {
        user: {
          select: { fid: true, username: true, displayName: true, pfpUrl: true }
        }
      }
    });
    
    const seen = new Set();
    const leaderboard = topAllowances.filter(a => {
      if (seen.has(a.userFid)) return false;
      seen.add(a.userFid);
      return true;
    }).slice(0, 100);

    return Response.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching allowance leaderboard:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
