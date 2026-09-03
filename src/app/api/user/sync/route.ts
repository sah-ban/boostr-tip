import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";

const HUB_URL = process.env.HUB_URL || "https://nemes.farcaster.xyz:2281";

export async function POST(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "fid parameter is required" }, { status: 400 });
  }

  try {
    const res = await axios.get(`${HUB_URL}/v1/userDataByFid?fid=${fid}`);
    const messages = res.data.messages || [];
    
    let pfpUrl = undefined;
    let displayName = undefined;
    let username = undefined;

    for (const msg of messages) {
      const type = msg.data?.userDataBody?.type;
      const value = msg.data?.userDataBody?.value;

      // Hub APIs usually return string enums (USER_DATA_TYPE_PFP) but sometimes ints.
      if (type === "USER_DATA_TYPE_PFP" || type === 1) pfpUrl = value;
      if (type === "USER_DATA_TYPE_DISPLAY" || type === 2) displayName = value;
      if (type === "USER_DATA_TYPE_USERNAME" || type === 6) username = value;
    }

    const user = await prisma.user.upsert({
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
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error syncing user from Hub:", error.message);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    return POST(request);
}
