import React from 'react';

type BottomNavProps = {
  activeTab: 'home' | 'tips' | 'leaders';
  onChange: (tab: 'home' | 'tips' | 'leaders') => void;
};

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'tips', label: 'Tips', icon: '💸' },
    { id: 'leaders', label: 'Leaders', icon: '🏆' },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center h-16 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === tab.id ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
