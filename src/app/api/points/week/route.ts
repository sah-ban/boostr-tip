import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriodStart } from "@/lib/dateUtils";

function getDateFromIsoWeek(week: number, year: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  return ISOweekStart;
}

export async function GET(request: NextRequest) {
  const weekParam = request.nextUrl.searchParams.get("week");
  const fid = request.nextUrl.searchParams.get("fid");

  if (!weekParam) {
    return Response.json({ error: "week parameter is required (e.g. 'current', '37', or '2024-09-09')" }, { status: 400 });
  }

  let snapshotDay: Date;

  if (weekParam.toLowerCase() === "current") {
    snapshotDay = getCurrentPeriodStart();
  } else if (!isNaN(Number(weekParam)) && Number(weekParam) < 54) {
    // Treat as ISO week number
    const currentYear = new Date().getUTCFullYear();
    snapshotDay = getDateFromIsoWeek(Number(weekParam), currentYear);
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
