import React from 'react';
import { Grid, Clock, Users, Voicemail } from 'lucide-react';
import { ActiveTab } from '../../types/telephony.ts';
import { dtmfAudio } from '../../services/dtmfAudio.ts';
import { LiquidGlassNav } from '../LiquidGlassNav.tsx';

interface SubNavigationBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  unreadVoicemailsCount?: number;
  missedCallsCount?: number;
}

export const SubNavigationBar: React.FC<SubNavigationBarProps> = ({
  activeTab,
  onChangeTab,
  unreadVoicemailsCount = 1,
  missedCallsCount = 1,
}) => {
  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: 'keypad',
      label: 'Keypad',
      icon: <Grid className="w-5 h-5" />,
    },
    {
      key: 'recents',
      label: 'Recents',
      icon: <Clock className="w-5 h-5" />,
      badge: missedCallsCount,
    },
    {
      key: 'contacts',
      label: 'Contacts',
      icon: <Users className="w-5 h-5" />,
    },
    {
      key: 'voicemail',
      label: 'Voicemail/AI',
      icon: <Voicemail className="w-5 h-5" />,
      badge: unreadVoicemailsCount,
    },
  ];

  return (
    <nav className="fixed bottom-3 inset-x-0 z-40 max-w-sm sm:max-w-md mx-auto px-4 select-none">
      {/* HyperOS 4 Floating Liquid Glass Pill */}
      <LiquidGlassNav
        activeId={activeTab}
        className="rounded-full p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/20 backdrop-blur-2xl grid grid-cols-4 items-center"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              data-nav-id={tab.key}
              onClick={() => {
                dtmfAudio.playTone(isActive ? 600 : 520, 35, 0.04);
                onChangeTab(tab.key);
              }}
              className={`liquid-nav-btn relative flex flex-col items-center justify-center py-2 rounded-full transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={tab.label}
            >
              {/* Icon Container with Badge */}
              <div className="relative">
                <span className={`block transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]' : ''}`}>
                  {tab.icon}
                </span>

                {/* Badge Count */}
                {tab.badge && tab.badge > 0 && !isActive && (
                  <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-slate-950 shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] font-medium tracking-tight mt-1 transition-colors leading-none ${
                isActive ? 'text-cyan-300 font-bold' : 'text-slate-400 group-hover:text-slate-300'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </LiquidGlassNav>
    </nav>
  );
};
