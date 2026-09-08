import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

const HUB_URL = process.env.HUB_URL || "https://nemes.farcaster.xyz:2281";

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "fid parameter is required" }, { status: 400 });
  }

  try {
    let user = await prisma.user.findUnique({ where: { fid } });

    // If user is new or missing profile data, sync from Hub
    if (!user || !user.username) {
      let pfpUrl = undefined;
      let displayName = undefined;
      let username = undefined;

      try {
        const res = await axios.get(`${HUB_URL}/v1/userDataByFid?fid=${fid}`);
        const messages = res.data.messages || [];

        for (const msg of messages) {
          const type = msg.data?.userDataBody?.type;
          const value = msg.data?.userDataBody?.value;
          if (type === "USER_DATA_TYPE_PFP" || type === 1) pfpUrl = value;
          if (type === "USER_DATA_TYPE_DISPLAY" || type === 2) displayName = value;
          if (type === "USER_DATA_TYPE_USERNAME" || type === 6) username = value;
        }
      } catch (hubErr) {
        console.warn(`Could not fetch Hub data for FID ${fid}`, hubErr);
      }

      user = await prisma.user.upsert({
        where: { fid },
        update: {
          ...(pfpUrl && { pfpUrl }),
          ...(displayName && { displayName }),
          ...(username && { username }),
        },
        create: {
          fid,
          pfpUrl,
          displayName,
          username,
          points: {
            create: {
              points: 0,
              snapshotDay: require('@/lib/dateUtils').getCurrentPeriodStart()
            }
          }
        },
      });
    }

    // Ensure they have a points row
    const userPoints = await prisma.points.findFirst({
      where: { userFid: fid },
    });

    if (!userPoints) {
      const { getCurrentPeriodStart } = require('@/lib/dateUtils');
      await prisma.points.create({
        data: {
          userFid: fid,
          points: 0,
          snapshotDay: getCurrentPeriodStart(),
        }
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return Response.json({ error: "fid parameter is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { isAllowanceEnabled } = body;

    if (typeof isAllowanceEnabled !== 'boolean') {
      return Response.json({ error: "isAllowanceEnabled must be a boolean" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { fid },
      data: { isAllowanceEnabled },
    });

    return Response.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
