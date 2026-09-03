import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return Response.json({ error: "fid parameter is required" }, { status: 400 });
  }

  try {
    const allowances = await prisma.allowance.findMany({
      where: { userFid: fid },
      orderBy: { snapshotDay: "desc" },
    });

    return Response.json({ allowances });
  } catch (error) {
    console.error("Error fetching allowance:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
