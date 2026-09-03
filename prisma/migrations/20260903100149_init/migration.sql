-- CreateEnum
CREATE TYPE "TipStatus" AS ENUM ('valid', 'invalid');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fid" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "pfpUrl" TEXT,
    "walletAddresses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "castHash" TEXT NOT NULL,
    "senderFid" TEXT NOT NULL,
    "recipientFid" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "TipStatus" NOT NULL DEFAULT 'valid',
    "snapshotDay" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allowance" (
    "id" TEXT NOT NULL,
    "userFid" TEXT NOT NULL,
    "snapshotDay" TIMESTAMP(3) NOT NULL,
    "userRank" INTEGER,
    "tipAllowance" DECIMAL(65,30) NOT NULL,
    "remainingAllowance" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allowance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Points" (
    "id" TEXT NOT NULL,
    "userFid" TEXT NOT NULL,
    "points" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "leaderboardRank" INTEGER,
    "rainPoints" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "snapshotDay" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_fid_key" ON "User"("fid");

-- CreateIndex
CREATE INDEX "Tip_senderFid_idx" ON "Tip"("senderFid");

-- CreateIndex
CREATE INDEX "Tip_recipientFid_idx" ON "Tip"("recipientFid");

-- CreateIndex
CREATE INDEX "Tip_snapshotDay_idx" ON "Tip"("snapshotDay");

-- CreateIndex
CREATE INDEX "Allowance_snapshotDay_idx" ON "Allowance"("snapshotDay");

-- CreateIndex
CREATE UNIQUE INDEX "Allowance_userFid_snapshotDay_key" ON "Allowance"("userFid", "snapshotDay");

-- CreateIndex
CREATE INDEX "Points_snapshotDay_idx" ON "Points"("snapshotDay");

-- CreateIndex
CREATE UNIQUE INDEX "Points_userFid_snapshotDay_key" ON "Points"("userFid", "snapshotDay");

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_senderFid_fkey" FOREIGN KEY ("senderFid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_recipientFid_fkey" FOREIGN KEY ("recipientFid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allowance" ADD CONSTRAINT "Allowance_userFid_fkey" FOREIGN KEY ("userFid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Points" ADD CONSTRAINT "Points_userFid_fkey" FOREIGN KEY ("userFid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;
