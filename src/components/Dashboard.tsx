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
  const [invalidTipsSent, setInvalidTipsSent] = useState<number>(0);
  const [tipsReceived, setTipsReceived] = useState<number>(0);
  const [countdown, setCountdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const d = new Date();
      const now = d.getTime();
      d.setUTCHours(0, 0, 0, 0);
      const day = d.getUTCDay();
      const daysUntilMonday = (8 - day) % 7 || 7;
      d.setUTCDate(d.getUTCDate() + daysUntilMonday);
      const target = d.getTime();
      
      const diff = target - now;
      if (diff <= 0) {
        setCountdown('Resetting...');
        return;
      }
      
      const dDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const dHours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const dMins = Math.floor((diff / 1000 / 60) % 60);
      const dSecs = Math.floor((diff / 1000) % 60);
      
      setCountdown(`${dDays}d ${dHours}h ${dMins}m ${dSecs}s`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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
        
        let currentWeekTime = 0;
        
        if (allowanceRes && allowanceRes.allowances && allowanceRes.allowances.length > 0) {
          const latestAllowance = allowanceRes.allowances[0];
          setAllowance(latestAllowance);
          currentWeekTime = new Date(latestAllowance.snapshotDay).getTime();
        }
        
        if (pointsRes && !pointsRes.error) {
          if (!currentWeekTime || (pointsRes.snapshotDay && new Date(pointsRes.snapshotDay).getTime() === currentWeekTime)) {
            setPoints(pointsRes);
          } else {
            setPoints({ points: "0", leaderboardRank: null });
          }
        }
        
        if (tipsSentRes && tipsSentRes.tips) {
          const currentTips = tipsSentRes.tips.filter((t: any) => !currentWeekTime || new Date(t.snapshotDay).getTime() === currentWeekTime);
          setTipsSent(currentTips.filter((t: any) => t.status === 'valid').length);
          setInvalidTipsSent(currentTips.filter((t: any) => t.status === 'invalid').length);
        }
        
        if (tipsReceivedRes && tipsReceivedRes.tips) {
          const currentTips = tipsReceivedRes.tips.filter((t: any) => !currentWeekTime || new Date(t.snapshotDay).getTime() === currentWeekTime);
          setTipsReceived(currentTips.length);
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

  const toggleAllowance = async () => {
    if (!user) return;
    const previousState = user.isAllowanceEnabled;
    
    // Optimistic UI update
    setUser({ ...user, isAllowanceEnabled: !previousState });
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${baseUrl}/user?fid=${fid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAllowanceEnabled: !previousState })
      });
      if (!res.ok) throw new Error('Failed to update toggle');
    } catch (err) {
      console.error(err);
      // Revert on error
      setUser({ ...user, isAllowanceEnabled: previousState });
    }
  };

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
          <p className="text-slate-400">@{user?.username || 'unknown'}</p>
        </div>
      </div>

      {/* Allowance Toggle Section */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
        <div>
          <p className="font-bold text-white">Receive Allowance</p>
          <p className="text-xs text-slate-400 max-w-[200px]">Enable to receive weekly $BOOSTR allowance based on your $BOOSTR holdings.</p>
        </div>
        <button 
          onClick={toggleAllowance}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user?.isAllowanceEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user?.isAllowanceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="flex justify-between items-end mb-[-8px]">
        <div>
          <h3 className="text-lg font-bold">Weekly Stats</h3>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Resets in {countdown}</p>
        </div>
        <p className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-1 rounded-full">
          {allowance?.snapshotDay 
            ? `Week of ${new Date(allowance.snapshotDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` 
            : 'Current Week'}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Allowance (Remaining)</p>
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
          <p className="text-xs text-slate-400 mb-1">Tips Sent</p>
          <p className="text-lg font-bold text-sky-400">
            {tipsSent}
            {invalidTipsSent > 0 && <span className="text-xs font-normal text-red-400 ml-2">({invalidTipsSent} invalid)</span>}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Tips Received</p>
          <p className="text-lg font-bold text-sky-400">{tipsReceived}</p>
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

    </div>
  );
}
