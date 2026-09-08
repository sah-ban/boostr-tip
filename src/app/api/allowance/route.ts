import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return Response.json({ error: "fid parameter is required" }, { status: 400 });
  }

  try {
    const [allowances, points] = await Promise.all([
      prisma.allowance.findMany({ where: { userFid: fid }, orderBy: { snapshotDay: "desc" } }),
      prisma.points.findMany({ where: { userFid: fid }, orderBy: { snapshotDay: "desc" } })
    ]);

    const mergedAllowances = allowances.map(a => {
      const p = points.find(p => p.snapshotDay.getTime() === a.snapshotDay.getTime());
      return {
        ...a,
        points: p ? p.points.toString() : "0"
      };
    });

    return Response.json({ allowances: mergedAllowances });
  } catch (error) {
    console.error("Error fetching allowance:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
