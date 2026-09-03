import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { base } from "viem/chains"; // Adjust if not on Base

import { getCurrentPeriodStart } from "../lib/dateUtils";

const prisma = new PrismaClient();

// Configuration
const TOTAL_WEEKLY_ALLOWANCE = 100_000;
const HUB_URL = process.env.HUB_URL || "https://nemes.farcaster.xyz:2281"; // Fallback to public hub if not set
const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org"; // Assuming Base
const BOOSTR_CONTRACT_ADDRESS = process.env.BOOSTR_CONTRACT_ADDRESS as `0x${string}`;

if (!BOOSTR_CONTRACT_ADDRESS) {
  console.error("❌ BOOSTR_CONTRACT_ADDRESS environment variable is not set.");
  process.exit(1);
}

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
]);

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL)
});

async function main() {
  console.log("🚀 Starting Weekly Allowance Allotment...");
  const currentPeriod = getCurrentPeriodStart();

  // 1. Fetch opted-in users
  const users = await prisma.user.findMany({
    where: { isAllowanceEnabled: true }
  });

  if (users.length === 0) {
    console.log("No users have allowance enabled. Exiting.");
    return;
  }

  console.log(`Found ${users.length} opted-in users.`);

  let decimals = 18;
  try {
    decimals = await publicClient.readContract({
      address: BOOSTR_CONTRACT_ADDRESS,
      abi: erc20Abi,
      functionName: "decimals"
    });
  } catch (e) {
    console.warn("Could not fetch decimals, defaulting to 18");
  }

  const userHoldings: { fid: string; holding: number }[] = [];
  let totalHoldings = 0;

  // 2. Fetch wallets and calculate holdings for each user
  for (const user of users) {
    try {
      // Fetch verified addresses from the Hub
      const res = await axios.get(`${HUB_URL}/v1/verificationsByFid?fid=${user.fid}`);
      const messages = res.data.messages || [];
      
      let userTotalBalance = BigInt(0);

      for (const msg of messages) {
        const addressBytes = msg.data?.verificationAddAddressBody?.address;
        if (!addressBytes) continue;
        
        // Convert base64/bytes to hex address
        const addressHex = "0x" + Buffer.from(addressBytes, "base64").toString("hex");

        // Fetch balance from contract
        const balance = await publicClient.readContract({
          address: BOOSTR_CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [addressHex as `0x${string}`]
        });

        userTotalBalance += balance;
      }

      const formattedBalance = parseFloat(formatUnits(userTotalBalance, decimals));
      userHoldings.push({ fid: user.fid, holding: formattedBalance });
      totalHoldings += formattedBalance;
      
      console.log(`FID ${user.fid} total balance: ${formattedBalance} $BOOSTR`);
      
    } catch (err: any) {
      console.error(`Error processing FID ${user.fid}:`, err.message);
      // Push 0 so they don't break the loop, but they get 0 allowance
      userHoldings.push({ fid: user.fid, holding: 0 });
    }
  }

  // 3. Allot allowances based on percentage
  console.log(`Total opted-in holdings: ${totalHoldings} $BOOSTR`);

  let rank = 1;
  // Sort by holding to assign rank
  userHoldings.sort((a, b) => b.holding - a.holding);

  let createdCount = 0;

  for (const { fid, holding } of userHoldings) {
    let allowanceAmount = 0;
    
    if (totalHoldings > 0 && holding > 0) {
      const percentage = holding / totalHoldings;
      allowanceAmount = Math.floor(percentage * TOTAL_WEEKLY_ALLOWANCE);
    }

    await prisma.allowance.upsert({
      where: {
        userFid_snapshotDay: {
          userFid: fid,
          snapshotDay: currentPeriod
        }
      },
      update: {
        tipAllowance: allowanceAmount,
        remainingAllowance: allowanceAmount,
        userRank: rank
      },
      create: {
        userFid: fid,
        snapshotDay: currentPeriod,
        tipAllowance: allowanceAmount,
        remainingAllowance: allowanceAmount,
        userRank: rank
      }
    });

    console.log(`Allotted ${allowanceAmount} to FID ${fid} (Rank ${rank})`);
    rank++;
    createdCount++;
  }

  console.log(`✅ Successfully processed and updated allowances for ${createdCount} users.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
