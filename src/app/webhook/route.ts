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
import { prisma } from "@/lib/prisma";
import { TipStatus } from "@prisma/client";
import { getCurrentPeriodStart } from "@/lib/dateUtils";

const SIGNER = process.env.SIGNER || "";
const HUB_URL = process.env.HUB_URL || "";
const HOOK_SECRET = process.env.HOOK_SECRET || "";
const APP_FID = parseInt(process.env.BOT_FID || "545039", 10);
const APP_URL = process.env.NEXT_PUBLIC_URL || "https://pro.itscashless.com";

const hexToBytes = (hex: string) => new Uint8Array(Buffer.from(hex.replace("0x", ""), "hex"));

async function syncUserFromHub(fid: string) {
  try {
    // If HUB_URL is missing, gracefully fail
    if (!HUB_URL) return;

    const res = await axios.get(`${HUB_URL}/v1/userDataByFid?fid=${fid}`);
    const messages = res.data.messages || [];
    
    let pfpUrl = undefined;
    let displayName = undefined;
    let username = undefined;

    for (const msg of messages) {
      const type = msg.data?.userDataBody?.type;
      const value = msg.data?.userDataBody?.value;

      if (type === "USER_DATA_TYPE_PFP" || type === 1) pfpUrl = value;
      if (type === "USER_DATA_TYPE_DISPLAY" || type === 2) displayName = value;
      if (type === "USER_DATA_TYPE_USERNAME" || type === 6) username = value;
    }

    await prisma.user.upsert({
      where: { fid },
      update: {
        ...(pfpUrl && { pfpUrl }),
        ...(displayName && { displayName }),
        ...(username && { username }),
      },
      create: { fid, pfpUrl, displayName, username },
    });
  } catch (err: any) {
    console.warn(`Could not sync user ${fid} from Hub:`, err.message);
  }
}

function verifySignature(rawBody: string, signature: string): boolean {
  if (!HOOK_SECRET) return false;
  const expected = crypto
    .createHmac("sha512", HOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function reply(targetFid: number, targetHash: string, text: string) {
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
    text: text,
    parentCastId: {
      fid: targetFid,
      hash: new Uint8Array(hexToByteArray(targetHash)),
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
  const signature = request.headers.get("x-hypersnap-signature") || request.headers.get("x-neynar-signature");
  const rawBody = await request.text();

  console.log("--- INCOMING WEBHOOK ---");
  console.log("Headers:", Object.fromEntries(request.headers.entries()));
  console.log("Signature Header:", signature);
  console.log("Raw Body:", rawBody);
  
  if (!signature || !verifySignature(rawBody, signature)) {
    console.error("Webhook Unauthorized: Invalid or missing signature");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { 
    type?: string; 
    data?: { 
      hash?: string; 
      author?: { fid?: number; username?: string };
      text?: string;
      embeds?: any[];
      parent_hash?: string | null;
      parent_author?: { fid?: number | null };
    } 
  } | null;
  
  try {
    body = JSON.parse(rawBody);
    console.log("Incoming Webhook Payload:", JSON.stringify(body, null, 2));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body?.type !== "cast.created") {
    return NextResponse.json({ success: true, message: "Ignored non-cast event" });
  }
  
  const cast = body?.data;
  const senderHash = cast?.hash;
  const senderFid = cast?.author?.fid;
  const senderUsername = cast?.author?.username;
  
  if (!senderHash || !senderFid) {
    return NextResponse.json({ error: "Missing cast data" }, { status: 400 });
  }

  try {
    
    const text = cast?.text || "";
    
    // Check if this cast is a bot reply by looking for our app embed
    const embeds = cast?.embeds || [];
    const hasAppUrl = embeds.some((e: any) => e.url === APP_URL);
    if (hasAppUrl) {
      return NextResponse.json({ success: true, message: "Skipped processing, this is a bot reply" });
    }

    // Match "100 $boostr" or "100$boostr"
    const tipMatch = text.match(/(\d+)\s*\$boostr/i);
    const recipientFid = cast?.parent_author?.fid;
    
    if (!tipMatch || !recipientFid) {
      return NextResponse.json({ success: true, message: "No tip detected, skipping" });
    }

    let replyText = "";
    const tipAmount = parseInt(tipMatch[1], 10);
    const currentPeriod = getCurrentPeriodStart();

    // Upsert Users by fetching rich data from the Farcaster Hub
    // We execute these asynchronously in parallel
    await Promise.all([
      syncUserFromHub(senderFid.toString()),
      syncUserFromHub(recipientFid.toString())
    ]);

    // Check allowance
    const allowance = await prisma.allowance.findUnique({
      where: {
        userFid_snapshotDay: {
          userFid: senderFid.toString(),
          snapshotDay: currentPeriod
        }
      }
    });

    const hasAllowance = allowance && Number(allowance.remainingAllowance) >= tipAmount;

    // Create Tip
    await prisma.tip.create({
      data: {
        castHash: senderHash,
        senderFid: senderFid.toString(),
        recipientFid: recipientFid.toString(),
        amount: tipAmount,
        status: hasAllowance ? TipStatus.valid : TipStatus.invalid,
        snapshotDay: currentPeriod
      }
    });

    if (hasAllowance) {
      // Deduct allowance
      await prisma.allowance.update({
        where: { id: allowance.id },
        data: {
          remainingAllowance: {
            decrement: tipAmount
          }
        }
      });

      // Reward the sender with 1 Point per $BOOSTR tipped
      await prisma.points.upsert({
        where: {
          userFid_snapshotDay: {
            userFid: senderFid.toString(),
            snapshotDay: currentPeriod
          }
        },
        update: {
          points: {
            increment: tipAmount
          }
        },
        create: {
          userFid: senderFid.toString(),
          snapshotDay: currentPeriod,
          points: tipAmount
        }
      });

      // Also reward the recipient with 1 Point per $BOOSTR received!
      await prisma.points.upsert({
        where: {
          userFid_snapshotDay: {
            userFid: recipientFid.toString(),
            snapshotDay: currentPeriod
          }
        },
        update: {
          points: {
            increment: tipAmount
          }
        },
        create: {
          userFid: recipientFid.toString(),
          snapshotDay: currentPeriod,
          points: tipAmount
        }
      });

      replyText = `✅ Tipped ${tipAmount} $BOOSTR to @${recipientFid}!\n🎉 Earned ${tipAmount} Points!\n\nCheck your ranking in the Farcaster Mini App!`;
    } else {
      replyText = `❌ Tip failed. You don't have enough $BOOSTR allowance for today.\n\nCheck your stats in the Farcaster Mini App!`;
    }

    // Like the incoming cast
    await like(senderFid, senderHash);

    // Fetch incoming cast from hub to check embeds (to avoid duplicate replies if re-processed)
    const castResponse = await axios.get(
      `${HUB_URL}/v1/castById?fid=${senderFid}&hash=${senderHash}`
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

    // Reply to the incoming cast
    await reply(senderFid, senderHash, replyText);
    
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
