import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'points' | 'rain' | 'allowance'>('points');
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Mock fetch
    setTimeout(() => {
      setLeaders([
        { fid: '101', username: 'danny', displayName: 'Danny', pfpUrl: null, value: '150000', rank: 1 },
        { fid: '102', username: 'sarah', displayName: 'Sarah', pfpUrl: null, value: '120000', rank: 2 },
        { fid: '103', username: 'mike', displayName: 'Mike', pfpUrl: null, value: '95000', rank: 3 },
        { fid: '104', username: 'alex', displayName: 'Alex', pfpUrl: null, value: '80000', rank: 4 },
        { fid: '105', username: 'jess', displayName: 'Jess', pfpUrl: null, value: '75000', rank: 5 },
      ]);
      setLoading(false);
    }, 500);
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
