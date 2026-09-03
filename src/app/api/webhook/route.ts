import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TipStatus } from "@prisma/client";

interface TipEvent {
  cast_hash: string;
  fid: string;
  recipient_fid: string;
  tip_amount: string;
  tip_status: string;
  remaining_tip_allowance: string;
  recipient_username?: string;
  username?: string;
}

export async function POST(req: NextRequest) {
  try {
    const tips: TipEvent[] = await req.json();
    console.log(`Received ${tips.length} tips via webhook`);
    
    let processed = 0;
    
    for (const tip of tips) {
      // 1. Ensure both users exist
      await prisma.user.upsert({
        where: { fid: tip.fid },
        update: { 
          username: tip.username || undefined 
        },
        create: { 
          fid: tip.fid, 
          username: tip.username 
        }
      });
      
      await prisma.user.upsert({
        where: { fid: tip.recipient_fid },
        update: { 
          username: tip.recipient_username || undefined 
        },
        create: { 
          fid: tip.recipient_fid, 
          username: tip.recipient_username 
        }
      });
      
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      // 2. Create Tip record
      await prisma.tip.create({
        data: {
          castHash: tip.cast_hash,
          senderFid: tip.fid,
          recipientFid: tip.recipient_fid,
          amount: parseFloat(tip.tip_amount),
          status: tip.tip_status.toLowerCase() === 'valid' ? TipStatus.valid : TipStatus.invalid,
          snapshotDay: today
        }
      });
      
      // 3. Update sender's allowance if valid
      if (tip.tip_status.toLowerCase() === 'valid' && tip.remaining_tip_allowance) {
        // We just update the remaining allowance for today
        await prisma.allowance.updateMany({
          where: { 
            userFid: tip.fid,
            snapshotDay: today
          },
          data: {
            remainingAllowance: parseFloat(tip.remaining_tip_allowance)
          }
        });
      }
      
      processed++;
    }
    
    return NextResponse.json({ status: "ok", received: tips.length, processed });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Invalid payload or processing error" }, { status: 400 });
  }
}
