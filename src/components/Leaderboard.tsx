import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  fid: string;
}

export default function Leaderboard({ fid }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'points' | 'allowance'>('points');
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        let endpoint = `${baseUrl}/leaderboard`;
        if (activeTab === 'allowance') endpoint = `${baseUrl}/leaderboard/allowance`;
        
        const res = await fetch(endpoint);
        const data = await res.json();
        
        let formattedLeaders: LeaderboardEntry[] = [];

        if (data && data.leaderboard) {
          // Map DB models to LeaderboardEntry
          formattedLeaders = data.leaderboard.map((entry: any, index: number) => {
            let value = '0';
            if (activeTab === 'points') value = entry.points;
            else if (activeTab === 'allowance') value = entry.tipAllowance;
            
            return {
              fid: entry.userFid,
              username: entry.user?.username,
              displayName: entry.user?.displayName,
              pfpUrl: entry.user?.pfpUrl,
              value,
              rank: index + 1
            };
          });
          setLeaders(formattedLeaders);
        }

        // Fetch current user explicitly so they are always at the top
        const userRes = await fetch(`${baseUrl}/user?fid=${fid}`);
        const userData = await userRes.json();

        if (activeTab === 'points') {
          const pointsRes = await fetch(`${baseUrl}/points/week?week=current&fid=${fid}`);
          const pointsData = await pointsRes.json();
          if (pointsData && pointsData.points) {
            setCurrentUserEntry({
              fid,
              username: userData?.username,
              displayName: userData?.displayName,
              pfpUrl: userData?.pfpUrl,
              value: pointsData.points.toString(),
              rank: pointsData.leaderboardRank || 0
            });
          }
        } else {
          const allowanceRes = await fetch(`${baseUrl}/allowance?fid=${fid}`);
          const allowanceData = await allowanceRes.json();
          if (allowanceData && allowanceData.allowances && allowanceData.allowances.length > 0) {
            const currentAllowance = allowanceData.allowances[0]; // the newest one is always first
            setCurrentUserEntry({
              fid,
              username: userData?.username,
              displayName: userData?.displayName,
              pfpUrl: userData?.pfpUrl,
              value: currentAllowance.tipAllowance.toString(),
              rank: currentAllowance.userRank || 0
            });
          }
        }

      } catch (err) {
        console.error('Error fetching leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
        {(['points', 'allowance'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-4 text-center">Loading leaders...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Current User Sticky Row */}
          {currentUserEntry && currentUserEntry.value !== "0" && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-1 ml-1 font-bold uppercase tracking-wider">Your Rank</p>
              <div className="flex items-center gap-4 p-3 rounded-xl border border-sky-500/50 bg-sky-900/20 shadow-lg shadow-sky-900/20 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500"></div>
                <div className="w-8 h-8 flex items-center justify-center font-bold rounded-full text-sky-400 bg-sky-400/10">
                  {currentUserEntry.rank || '-'}
                </div>
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                  {currentUserEntry.pfpUrl ? <img src={currentUserEntry.pfpUrl} alt="" className="w-full h-full rounded-full" /> : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{currentUserEntry.displayName || currentUserEntry.username}</p>
                  <p className="text-xs text-slate-400 truncate">@{currentUserEntry.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sky-400">{currentUserEntry.value}</p>
                </div>
              </div>
            </div>
          )}

          {/* Global Leaderboard */}
          {leaders.map(leader => (
            <div 
              key={leader.fid} 
              className={`flex items-center gap-4 p-3 rounded-xl border ${
                leader.rank <= 3 
                  ? 'bg-slate-800 border-yellow-500/30' 
                  : 'bg-slate-800/50 border-slate-800'
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${
                leader.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                leader.rank === 2 ? 'bg-slate-300/20 text-slate-300' :
                leader.rank === 3 ? 'bg-amber-700/20 text-amber-600' :
                'text-slate-500 bg-slate-800'
              }`}>
                {leader.rank}
              </div>
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                {leader.pfpUrl ? <img src={leader.pfpUrl} alt="" className="w-full h-full rounded-full" /> : '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{leader.displayName || leader.username}</p>
                <p className="text-xs text-slate-400 truncate">@{leader.username}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sky-400">{leader.value}</p>
              </div>
            </div>
          ))}
          
          {leaders.length === 0 && (
             <p className="text-center text-slate-400 py-8">No leaders found for this week.</p>
          )}
        </div>
      )}
    </div>
  );
}
