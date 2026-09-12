"use client";

import React, { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/components/Dashboard';
import TipsTracker from '@/components/TipsTracker';
import Leaderboard from '@/components/Leaderboard';
import { useFrameContext } from './providers/providers';
import sdk from '@farcaster/miniapp-sdk';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'tips' | 'leaders'>('home');
  const [fid, setFid] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const frameContext = useFrameContext();

  useEffect(() => {
    // Wait for the Farcaster Frame SDK context to resolve
    if (frameContext?.user?.fid) {
      setFid(frameContext.user.fid.toString());
      setSdkLoaded(true);
    } else {
      // If we are not in the Farcaster app, wait a moment to see if context arrives
      // If it doesn't, fallback to URL params for local browser testing
      const timer = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('fid')) {
          setFid(params.get('fid')!);
        }
        setSdkLoaded(true);
      }, 500); // 500ms delay to give SDK time to inject context
      
      return () => clearTimeout(timer);
    }
  }, [frameContext]);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-sky-500/30">
      <main className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4">
          <h1 className="text-xl font-bold text-center text-sky-400">
            $BOOSTR Tip Tracker
          </h1>
        </header>

        {/* Content Area */}
        <div className="p-4">
          {!sdkLoaded || !fid ? (
             <div className="p-8 text-center text-slate-400 animate-pulse">Connecting to Farcaster...</div>
          ) : (
            <>
              {activeTab === 'home' && <Dashboard fid={fid} />}
              {activeTab === 'tips' && <TipsTracker fid={fid} />}
              {activeTab === 'leaders' && <Leaderboard fid={fid} />}
            </>
          )}
        </div>

        {/* Navigation */}
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </main>
    </div>
  );
}
