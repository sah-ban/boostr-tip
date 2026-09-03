import { PrismaClient, TipStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Create test users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { fid: "1001" },
      update: {},
      create: {
        fid: "1001",
        username: "alice.eth",
        displayName: "Alice",
        pfpUrl: "https://i.pravatar.cc/150?u=alice",
        walletAddresses: ["0xAlice1234567890abcdef"],
      },
    }),
    prisma.user.upsert({
      where: { fid: "1002" },
      update: {},
      create: {
        fid: "1002",
        username: "bob.eth",
        displayName: "Bob",
        pfpUrl: "https://i.pravatar.cc/150?u=bob",
        walletAddresses: ["0xBob1234567890abcdef"],
      },
    }),
    prisma.user.upsert({
      where: { fid: "1003" },
      update: {},
      create: {
        fid: "1003",
        username: "charlie",
        displayName: "Charlie",
        pfpUrl: "https://i.pravatar.cc/150?u=charlie",
        walletAddresses: ["0xCharlie1234567890abcdef"],
      },
    }),
    prisma.user.upsert({
      where: { fid: "1004" },
      update: {},
      create: {
        fid: "1004",
        username: "dana.cast",
        displayName: "Dana",
        pfpUrl: "https://i.pravatar.cc/150?u=dana",
        walletAddresses: ["0xDana1234567890abcdef"],
      },
    }),
    prisma.user.upsert({
      where: { fid: "1005" },
      update: {},
      create: {
        fid: "1005",
        username: "eve.base",
        displayName: "Eve",
        pfpUrl: "https://i.pravatar.cc/150?u=eve",
        walletAddresses: ["0xEve1234567890abcdef"],
      },
    }),
  ]);
  console.log(`Created ${users.length} users`);

  // Create tips
  const tips = await Promise.all([
    prisma.tip.create({ data: { castHash: "0xabc1", senderFid: "1001", recipientFid: "1002", amount: 500, status: TipStatus.valid, snapshotDay: today } }),
    prisma.tip.create({ data: { castHash: "0xabc2", senderFid: "1001", recipientFid: "1003", amount: 200, status: TipStatus.valid, snapshotDay: today } }),
    prisma.tip.create({ data: { castHash: "0xabc3", senderFid: "1002", recipientFid: "1001", amount: 1000, status: TipStatus.valid, snapshotDay: today } }),
    prisma.tip.create({ data: { castHash: "0xabc4", senderFid: "1003", recipientFid: "1001", amount: 300, status: TipStatus.invalid, snapshotDay: today } }),
    prisma.tip.create({ data: { castHash: "0xabc5", senderFid: "1004", recipientFid: "1005", amount: 750, status: TipStatus.valid, snapshotDay: yesterday } }),
    prisma.tip.create({ data: { castHash: "0xabc6", senderFid: "1005", recipientFid: "1001", amount: 150, status: TipStatus.valid, snapshotDay: yesterday } }),
    prisma.tip.create({ data: { castHash: "0xabc7", senderFid: "1002", recipientFid: "1004", amount: 400, status: TipStatus.valid, snapshotDay: twoDaysAgo } }),
  ]);
  console.log(`Created ${tips.length} tips`);

  // Create allowances
  const fidAllowances: Record<string, number> = { "1001": 5000, "1002": 3000, "1003": 2000, "1004": 4000, "1005": 1500 };
  let allowanceCount = 0;
  for (const [fid, allowance] of Object.entries(fidAllowances)) {
    for (const [i, day] of [today, yesterday, twoDaysAgo].entries()) {
      await prisma.allowance.upsert({
        where: { userFid_snapshotDay: { userFid: fid, snapshotDay: day } },
        update: {},
        create: {
          userFid: fid,
          snapshotDay: day,
          userRank: parseInt(fid) - 1000 + i,
          tipAllowance: allowance,
          remainingAllowance: Math.round(allowance * (0.3 + Math.random() * 0.5)),
        },
      });
      allowanceCount++;
    }
  }
  console.log(`Created ${allowanceCount} allowance records`);

  // Create points
  const fidPoints: Record<string, { points: number }> = {
    "1001": { points: 15000 },
    "1002": { points: 12000 },
    "1003": { points: 8000 },
    "1004": { points: 20000 },
    "1005": { points: 6000 },
  };
  let pointsCount = 0;
  for (const [fid, data] of Object.entries(fidPoints)) {
    await prisma.points.upsert({
      where: { userFid_snapshotDay: { userFid: fid, snapshotDay: today } },
      update: {},
      create: {
        userFid: fid,
        snapshotDay: today,
        points: data.points,
        leaderboardRank: pointsCount + 1,
      },
    });
    pointsCount++;
  }
  console.log(`Created ${pointsCount} points records`);
  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
