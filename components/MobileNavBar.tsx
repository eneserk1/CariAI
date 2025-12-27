
import React from 'react';

interface MobileNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Panel', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { id: 'customers', label: 'Cariler', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    )},
    { id: 'chat', label: 'Asistan', icon: (
      <div className="w-14 h-14 bg-[#1A237E] rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-900/40 ring-4 ring-[#FBFBFD] transform transition-all duration-300 hover:scale-105 active:scale-95 hover:rotate-3">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
    )},
    { id: 'products', label: 'Ürünler', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    )},
    { id: 'profile', label: 'Profil', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-5 right-5 z-[1000] floating-chat-enter">
      {/* Container wrapper */}
      <div className="relative h-16">
        
        {/* Glass Background Layer (Clipped) */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[20px] saturate-150 border border-white/50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden">
             {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 skew-x-12 opacity-40 pointer-events-none"></div>
        </div>

        {/* Content Layer (Visible Overflow for Floating Button) */}
        <div className="absolute inset-0 flex justify-between items-center px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isChat = tab.id === 'chat';

            if (isChat) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative -top-6 mx-1 group z-20"
                >
                  {tab.icon}
                  {/* Status Indicator */}
                  <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1A237E] transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></div>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center h-full relative z-10"
              >
                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white text-[#1A237E] shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab.icon}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileNavBar;
