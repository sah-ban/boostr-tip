import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return Response.json({ error: "fid parameter is required" }, { status: 400 });
  }

  try {
    const tips = await prisma.tip.findMany({
      where: { recipientFid: fid },
      include: {
        sender: {
          select: { fid: true, username: true, displayName: true, pfpUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ tips });
  } catch (error) {
    console.error("Error fetching tips received:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
