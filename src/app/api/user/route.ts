import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return Response.json({ error: "fid parameter is required" }, { status: 400 });
  }

  try {
    let user = await prisma.user.findUnique({ where: { fid } });

    if (!user) {
      user = await prisma.user.create({
        data: { fid },
      });
    }

    return Response.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
