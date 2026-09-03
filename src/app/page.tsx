"use client";

import React, { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/components/Dashboard';
import AllowanceTracker from '@/components/AllowanceTracker';
import TipsTracker from '@/components/TipsTracker';
import Leaderboard from '@/components/Leaderboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'allowance' | 'tips' | 'leaders'>('home');
  const [fid, setFid] = useState<string>('123'); // Hardcoded test fid
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // In a real mini app, you'd get the FID from the Farcaster context
    // const params = new URLSearchParams(window.location.search);
    // if (params.has('fid')) setFid(params.get('fid')!);
  }, []);

  if (!isClient) return null; // Prevent hydration errors

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-sky-500/30">
      <main className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4">
          <h1 className="text-xl font-bold text-center bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            $BOOSTR Tip Tracker
          </h1>
        </header>

        {/* Content Area */}
        <div className="p-4">
          {activeTab === 'home' && <Dashboard fid={fid} />}
          {activeTab === 'allowance' && <AllowanceTracker fid={fid} />}
          {activeTab === 'tips' && <TipsTracker fid={fid} />}
          {activeTab === 'leaders' && <Leaderboard />}
        </div>

        {/* Navigation */}
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </main>
    </div>
  );
}
