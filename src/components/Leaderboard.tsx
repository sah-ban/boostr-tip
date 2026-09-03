import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'points' | 'rain' | 'allowance'>('points');
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = '/api/leaderboard';
        if (activeTab === 'rain') endpoint = '/api/leaderboard/rain';
        if (activeTab === 'allowance') endpoint = '/api/leaderboard/allowance';
        
        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (data && data.leaderboard) {
          // Map DB models to LeaderboardEntry
          const formatted = data.leaderboard.map((entry: any, index: number) => {
            let value = '0';
            if (activeTab === 'points') value = entry.points;
            else if (activeTab === 'rain') value = entry.rainPoints;
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
          setLeaders(formatted);
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
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
        {(['points', 'rain', 'allowance'] as const).map(tab => (
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
          {leaders.map(leader => (
            <div 
              key={leader.fid} 
              className={`flex items-center gap-4 p-3 rounded-xl border ${
                leader.rank <= 3 
                  ? 'bg-slate-800 border-sky-900/50' 
                  : 'bg-slate-800/50 border-slate-800'
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${
                leader.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                leader.rank === 2 ? 'bg-slate-300/20 text-slate-300' :
                leader.rank === 3 ? 'bg-amber-700/20 text-amber-600' :
                'text-slate-500'
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
        </div>
      )}
    </div>
  );
}
