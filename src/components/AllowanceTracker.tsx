import React, { useState, useEffect } from 'react';
import { AllowanceData } from '../types';
import { getAppWeekNumber } from '../lib/dateUtils';

interface AllowanceTrackerProps {
  fid: string;
}

export default function AllowanceTracker({ fid }: AllowanceTrackerProps) {
  const [history, setHistory] = useState<AllowanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${baseUrl}/allowance?fid=${fid}`);
        const data = await res.json();
        if (data && data.allowances) {
          setHistory(data.allowances);
        }
      } catch (err) {
        console.error('Error fetching allowance history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fid]);

  if (loading) return <div className="p-4 text-center">Loading allowance history...</div>;

  return (
    <div className="flex flex-col gap-3 pb-24">
      <h2 className="text-2xl font-bold mb-2">Weekly Allowance History</h2>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Allowance</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
                <th className="px-4 py-3 font-medium">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {history.map((entry: any) => {
                const formattedDate = `Week ${getAppWeekNumber(entry.snapshotDay)}`;
                
                return (
                  <tr key={entry.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 text-slate-300">{formattedDate}</td>
                    <td className="px-4 py-3 font-medium text-sky-400">{entry.tipAllowance}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{entry.remainingAllowance}</td>
                    <td className="px-4 py-3 font-medium text-emerald-400">+{entry.points || '0'}</td>
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
