import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriodStart } from "@/lib/dateUtils";

function getDateFromAppWeek(week: number): Date {
  const epoch = new Date('2026-09-07T00:00:00.000Z');
  return new Date(epoch.getTime() + week * 7 * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  const weekParam = request.nextUrl.searchParams.get("week");
  const fid = request.nextUrl.searchParams.get("fid");

  if (!weekParam) {
    return Response.json({ error: "week parameter is required (e.g. 'current', '0', '1', or '2026-09-07')" }, { status: 400 });
  }

  let snapshotDay: Date;

  if (weekParam.toLowerCase() === "current") {
    snapshotDay = getCurrentPeriodStart();
  } else if (!isNaN(Number(weekParam))) {
    // Treat as absolute app week number (0, 1, 2...)
    snapshotDay = getDateFromAppWeek(Number(weekParam));
  } else {
    // Attempt to parse as date string
    snapshotDay = new Date(weekParam);
    if (isNaN(snapshotDay.getTime())) {
      return Response.json({ error: "Invalid week format" }, { status: 400 });
    }
  }

  try {
    if (fid) {
      // Get points for specific user
      const points = await prisma.points.findUnique({
        where: {
          userFid_snapshotDay: {
            userFid: fid,
            snapshotDay: snapshotDay
          }
        },
        include: {
          user: {
            select: { username: true, displayName: true, pfpUrl: true }
          }
        }
      });

      if (!points) {
        return Response.json({ points: "0", snapshotDay: snapshotDay.toISOString() });
      }

      return Response.json(points);
    } else {
      // Get points for ALL users for this week
      const allPoints = await prisma.points.findMany({
        where: { snapshotDay: snapshotDay },
        orderBy: { points: "desc" },
        include: {
          user: {
            select: { fid: true, username: true, displayName: true, pfpUrl: true }
          }
        }
      });

      return Response.json({ snapshotDay: snapshotDay.toISOString(), users: allPoints });
    }
  } catch (error) {
    console.error("Error fetching points by week:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
