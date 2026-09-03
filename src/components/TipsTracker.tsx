import React, { useState, useEffect } from 'react';
import { TipData } from '../types';

interface TipsTrackerProps {
  fid: string;
}

export default function TipsTracker({ fid }: TipsTrackerProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [tips, setTips] = useState<TipData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Mock fetch
    setTimeout(() => {
      const mockData: TipData[] = activeTab === 'received' ? [
        { id: '1', castHash: '0x123', senderFid: '2', recipientFid: fid, amount: '100', status: 'valid', snapshotDay: '2023-10-15', createdAt: '2023-10-15T12:00:00Z', sender: { id: '2', fid: '2', username: 'alice', displayName: 'Alice', pfpUrl: null, walletAddresses: [] } }
      ] : [
        { id: '2', castHash: '0x456', senderFid: fid, recipientFid: '3', amount: '500', status: 'invalid', snapshotDay: '2023-10-15', createdAt: '2023-10-15T14:00:00Z', recipient: { id: '3', fid: '3', username: 'bob', displayName: 'Bob', pfpUrl: null, walletAddresses: [] } }
      ];
      setTips(mockData);
      setLoading(false);
    }, 500);
  }, [fid, activeTab]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'received' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
        >
          Received
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'sent' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
        >
          Sent
        </button>
      </div>

      {loading ? (
        <div className="p-4 text-center">Loading tips...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {tips.map(tip => (
            <div key={tip.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {activeTab === 'received' ? `@${tip.sender?.username || 'unknown'}` : `@${tip.recipient?.username || 'unknown'}`}
                </p>
                <a href={`https://warpcast.com/~/conversations/${tip.castHash}`} target="_blank" rel="noreferrer" className="text-xs text-sky-400 hover:underline">
                  View Cast
                </a>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{tip.amount} $BOOSTR</p>
                <span className={`text-xs px-2 py-1 rounded-full ${tip.status === 'valid' ? 'bg-emerald-400/20 text-emerald-400' : 'bg-red-400/20 text-red-400'}`}>
                  {tip.status}
                </span>
              </div>
            </div>
          ))}
          {tips.length === 0 && <p className="text-center text-slate-400 py-8">No tips found</p>}
        </div>
      )}
    </div>
  );
}
