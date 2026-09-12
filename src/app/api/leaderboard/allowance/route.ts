export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriodStart } from "@/lib/dateUtils";

export async function GET(request: NextRequest) {
  try {
    const currentPeriod = getCurrentPeriodStart();
    
    const leaderboard = await prisma.allowance.findMany({
      where: { 
        snapshotDay: currentPeriod,
        tipAllowance: { gt: 0 }
      },
      orderBy: { tipAllowance: "desc" },
      take: 100,
      include: {
        user: {
          select: { fid: true, username: true, displayName: true, pfpUrl: true }
        }
      }
    });

    return Response.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching allowance leaderboard:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
