import { NextRequest, NextResponse } from "next/server";
import {
  Message,
  NobleEd25519Signer,
  CastAddBody,
  makeCastAdd,
  makeReactionAdd,
} from "@farcaster/core";
import axios from "axios";
import crypto from "crypto";

const SIGNER = process.env.SIGNER || "";
const HUB_URL = process.env.HUB_URL || "";
const HOOK_SECRET = process.env.HOOK_SECRET || "";
const APP_FID = 1041440;
const APP_URL = process.env.NEXT_PUBLIC_URL || "https://pro.itscashless.com";

const hexToBytes = (hex: string) => new Uint8Array(Buffer.from(hex.replace("0x", ""), "hex"));

function verifySignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha512", HOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function reply(parentFid: number, parentHash: string) {
  if (!SIGNER || !HUB_URL) {
    throw new Error("SIGNER or HUB_URL not configured");
  }
  
  const privateKeyBytes = hexToBytes(SIGNER);
  const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);
  
  const hexToByteArray = (hex: string): number[] => {
    if (hex.startsWith("0x")) hex = hex.slice(2);
    return Array.from({ length: 20 }, (_, i) =>
      parseInt(hex.substr(i * 2, 2), 16),
    );
  };
  
  const castBody: CastAddBody = {
    text: "You can subscribe to farcaster pro for 30 days with this miniapp!",
    parentCastId: {
      fid: parentFid,
      hash: new Uint8Array(hexToByteArray(parentHash)),
    },
    embeds: [{ url: APP_URL }],
    embedsDeprecated: [],
    mentions: [],
    mentionsPositions: [],
    type: 0,
  };

  const dataOptions = { fid: APP_FID, network: 1 };
  const castAddReq = await makeCastAdd(castBody, dataOptions, ed25519Signer);
  const castAdd = castAddReq._unsafeUnwrap();
  const messageBytes = Buffer.from(Message.encode(castAdd).finish());
  await axios.post(`${HUB_URL}/v1/submitMessage`, messageBytes, {
    headers: { "Content-Type": "application/octet-stream" },
  });
}

async function like(targetFid: number, targetHash: string) {
  if (!SIGNER || !HUB_URL) {
    throw new Error("SIGNER or HUB_URL env var not set");
  }
  const privateKeyBytes = hexToBytes(SIGNER);
  const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);
  const castBody = {
    type: 1,
    targetCastId: {
      fid: targetFid,
      hash: hexToBytes(targetHash.replace(/^0x/, "")),
    },
  };
  const dataOptions = { fid: APP_FID, network: 1 };
  const reactionAddReq = await makeReactionAdd(
    castBody,
    dataOptions,
    ed25519Signer,
  );
  const reactionAdd = reactionAddReq._unsafeUnwrap();
  const messageBytes = Buffer.from(Message.encode(reactionAdd).finish());
  await axios.post(`${HUB_URL}/v1/submitMessage`, messageBytes, {
    headers: { "Content-Type": "application/octet-stream" },
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-hypersnap-signature");
  const rawBody = await request.text();
  
  if (!signature || !HOOK_SECRET || !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { 
    type?: string; 
    data?: { 
      hash?: string; 
      author?: { fid?: number };
      text?: string;
      embeds?: any[];
    } 
  } | null;
  
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body?.type !== "cast.created") {
    // Only process new casts, ignore likes/recasts if they are sent to this webhook
    return NextResponse.json({ success: true, message: "Ignored non-cast event" });
  }
  
  const cast = body?.data;
  const parentHash = cast?.hash;
  const parentFid = cast?.author?.fid;
  
  if (!parentHash || !parentFid) {
    return NextResponse.json({ error: "Missing cast data" }, { status: 400 });
  }

  try {
    await like(parentFid, parentHash);

    const castResponse = await axios.get(
      `${HUB_URL}/v1/castById?fid=${parentFid}&hash=${parentHash}`
    );
    
    const embeds = castResponse.data?.data?.castAddBody?.embeds || [];
    const hasAppUrl = embeds.some(
      (embed: { url?: string }) => embed.url === APP_URL
    );

    if (hasAppUrl) {
      return NextResponse.json({
        success: true,
        message: "Skipped reply, APP_URL exists in embeds",
      });
    }

    await reply(parentFid, parentHash);
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
