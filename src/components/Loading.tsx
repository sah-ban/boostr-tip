import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium animate-pulse">Loading $BOOSTR data...</p>
    </div>
  );
}
