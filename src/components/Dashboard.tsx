import React, { useEffect, useState } from 'react';
import { User, PriceData, AllowanceData, PointsData } from '../types';

interface DashboardProps {
  fid: string;
}

export default function Dashboard({ fid }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [price, setPrice] = useState<PriceData | null>(null);
  const [allowance, setAllowance] = useState<AllowanceData | null>(null);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [tipsSent, setTipsSent] = useState<number>(0);
  const [tipsReceived, setTipsReceived] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated API calls since we don't have real endpoints
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mock data
        setUser({ id: '1', fid, username: 'testuser', displayName: 'Test User', pfpUrl: null, walletAddresses: [] });
        setPrice({ price: 0.045, priceChange1h: 1.2, priceChange24h: -5.4 });
        setAllowance({ id: '1', snapshotDay: '2023-10-01', userRank: 42, tipAllowance: '1000', remainingAllowance: '250' });
        setPoints({ points: '5400', leaderboardRank: 12, rainPoints: '300' });
        setTipsSent(45);
        setTipsReceived(12);
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fid]);

  if (loading) {
    return <div className="p-4 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Profile Section */}
      <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-2xl">
          {user?.pfpUrl ? <img src={user.pfpUrl} alt="pfp" className="rounded-full w-full h-full object-cover" /> : '👤'}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user?.displayName || 'Unknown User'}</h2>
          <p className="text-slate-400">@{user?.username || 'unknown'} • fid: {user?.fid}</p>
        </div>
      </div>

      {/* Price Widget */}
      {price && (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-400">$BOOSTR Price</p>
            <p className="text-2xl font-bold">${price.price.toFixed(4)}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${price.priceChange1h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              1h: {price.priceChange1h >= 0 ? '+' : ''}{price.priceChange1h}%
            </p>
            <p className={`text-sm ${price.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              24h: {price.priceChange24h >= 0 ? '+' : ''}{price.priceChange24h}%
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Allowance / Rem</p>
          <p className="text-lg font-bold text-sky-400">
            {allowance?.tipAllowance || '0'} / {allowance?.remainingAllowance || '0'}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Points (Rank)</p>
          <p className="text-lg font-bold text-sky-400">
            {points?.points || '0'} <span className="text-sm font-normal text-slate-300">({points?.leaderboardRank || '-'})</span>
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Valid Tips Sent</p>
          <p className="text-lg font-bold text-sky-400">{tipsSent}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Tips Received</p>
          <p className="text-lg font-bold text-sky-400">{tipsReceived}</p>
        </div>
      </div>

      {/* Rain Points */}
      <div className="bg-gradient-to-r from-sky-900 to-slate-800 p-4 rounded-xl border border-sky-700 flex justify-between items-center">
        <div>
          <p className="text-sm text-sky-200">🌧️ Rain Points</p>
          <p className="text-2xl font-bold text-white">{points?.rainPoints || '0'}</p>
        </div>
      </div>
    </div>
  );
}
