import React, { useState, useEffect } from 'react';
import { AllowanceData } from '../types';

interface AllowanceTrackerProps {
  fid: string;
}

export default function AllowanceTracker({ fid }: AllowanceTrackerProps) {
  const [history, setHistory] = useState<AllowanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetch
    setTimeout(() => {
      setHistory([
        { id: '1', snapshotDay: '2023-10-15', userRank: 42, tipAllowance: '1000', remainingAllowance: '250' },
        { id: '2', snapshotDay: '2023-10-14', userRank: 45, tipAllowance: '900', remainingAllowance: '0' },
        { id: '3', snapshotDay: '2023-10-13', userRank: 40, tipAllowance: '1100', remainingAllowance: '1100' },
      ]);
      setLoading(false);
    }, 500);
  }, [fid]);

  if (loading) return <div className="p-4 text-center">Loading allowance history...</div>;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h2 className="text-2xl font-bold mb-2">Allowance History</h2>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Allowance</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {history.map((entry) => {
                const date = new Date(entry.snapshotDay);
                const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                return (
                  <tr key={entry.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 text-slate-300">{formattedDate}</td>
                    <td className="px-4 py-3 text-slate-300">{entry.userRank || '-'}</td>
                    <td className="px-4 py-3 font-medium text-sky-400">{entry.tipAllowance}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{entry.remainingAllowance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
