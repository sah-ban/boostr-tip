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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const [userRes, priceRes, allowanceRes, pointsRes, tipsSentRes, tipsReceivedRes] = await Promise.all([
          fetch(`${baseUrl}/user?fid=${fid}`).then(r => { if(!r.ok) throw new Error('user fetch failed'); return r.json(); }),
          fetch(`${baseUrl}/price`).then(r => r.json()),
          fetch(`${baseUrl}/allowance?fid=${fid}`).then(r => r.json()),
          fetch(`${baseUrl}/points?fid=${fid}`).then(r => r.json()),
          fetch(`${baseUrl}/tips?fid=${fid}`).then(r => r.json()),
          fetch(`${baseUrl}/tips/received?fid=${fid}`).then(r => r.json())
        ]);

        if (userRes && !userRes.error) setUser(userRes);
        if (priceRes && !priceRes.error) setPrice(priceRes);
        
        if (allowanceRes && allowanceRes.allowances && allowanceRes.allowances.length > 0) {
          setAllowance(allowanceRes.allowances[0]);
        }
        
        if (pointsRes && !pointsRes.error) setPoints(pointsRes);
        
        if (tipsSentRes && tipsSentRes.tips) {
          setTipsSent(tipsSentRes.tips.filter((t: any) => t.status === 'valid').length);
        }
        
        if (tipsReceivedRes && tipsReceivedRes.tips) {
          setTipsReceived(tipsReceivedRes.tips.length);
        }

      } catch (err: any) {
        console.error('Error fetching dashboard data', err);
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fid]);

  if (loading) {
    return <div className="p-4 text-center">Loading dashboard...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-center text-red-400">Error: {error}</div>;
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

    </div>
  );
}
