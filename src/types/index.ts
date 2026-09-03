export interface User {
  id: string;
  fid: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  walletAddresses: string[];
  isAllowanceEnabled: boolean;
}

export interface TipData {
  id: string;
  castHash: string;
  senderFid: string;
  recipientFid: string;
  amount: string;
  status: 'valid' | 'invalid';
  snapshotDay: string;
  createdAt: string;
  sender?: User;
  recipient?: User;
}

export interface AllowanceData {
  id: string;
  snapshotDay: string;
  userRank: number | null;
  tipAllowance: string;
  remainingAllowance: string;
}

export interface PointsData {
  points: string;
  leaderboardRank: number | null;
}

export interface PriceData {
  price: number;
  priceChange1h: number;
  priceChange24h: number;
}

export interface LeaderboardEntry {
  fid: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  value: string;
  rank: number;
}
