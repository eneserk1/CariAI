
import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  businessName: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, businessName, isDarkMode, onToggleDarkMode }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: 'M4 6h16M4 12h16M4 18h16' },
    { id: 'analysis', label: 'Analiz', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'chat', label: 'Asistan', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'customers', label: 'Cariler', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'products', label: 'Ürünler', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ];

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-[100] justify-center pt-6 px-4 pointer-events-none">
      <div className="pointer-events-auto bg-white/70 dark:bg-slate-900/70 glass-effect border border-white/40 dark:border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] rounded-[32px] flex items-center justify-between w-full max-w-7xl px-8 py-4 transition-all duration-500">
        
        <div className="flex items-center cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
          <div className="bg-slate-900 dark:bg-blue-600 rounded-[14px] flex items-center justify-center text-white font-black shadow-lg transform group-hover:scale-110 transition-transform w-11 h-11 text-xl">D</div>
          <div className="flex flex-col ml-3">
             <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">DefterAI</span>
             <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-0.5">V4 Premium</span>
          </div>
        </div>

        <nav className="flex items-center bg-slate-100/50 dark:bg-slate-800/60 rounded-[24px] p-1.5 border border-white/30 dark:border-slate-700">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center px-6 py-2.5 space-x-2 ${
                  isActive 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <svg className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-5">
          <button 
            onClick={onToggleDarkMode}
            className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-inner"
          >
             {isDarkMode ? '🌙' : '☀️'}
          </button>
          
          <div className="hidden lg:flex flex-col items-end border-r border-slate-100 dark:border-slate-800 pr-5">
            <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-none">{businessName}</p>
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Sistem Çevrimiçi</p>
          </div>
          
          <div 
            onClick={() => setActiveTab('profile')}
            className={`w-11 h-11 border rounded-2xl flex items-center justify-center transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:shadow-md'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
