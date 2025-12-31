
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
    { id: 'dashboard', label: 'Panel', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'chat', label: 'Asistan', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'customers', label: 'Cariler', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'products', label: 'Ürünler', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ];

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-[100] justify-center pt-6 px-4">
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-[40px] saturate-150 border border-white/50 dark:border-slate-800 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] rounded-[32px] flex items-center justify-between relative overflow-hidden w-full max-w-7xl px-6 py-4 group transition-all duration-500">
        
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 dark:via-white/5 skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>

        <div 
          className="flex items-center cursor-pointer group/logo relative z-10"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="bg-slate-900 dark:bg-blue-600 rounded-[14px] flex items-center justify-center text-white font-black shadow-lg shadow-slate-900/20 transform group-hover/logo:scale-105 group-hover/logo:rotate-3 transition-all duration-500 w-11 h-11 text-xl">
            D
          </div>
          
          <div className="flex flex-col ml-3 overflow-hidden">
             <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap">Defter<span className="text-[#1A237E] dark:text-blue-400">AI</span></span>
             <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5 whitespace-nowrap">Asistan v4</span>
          </div>
        </div>

        <nav className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-full border border-white/50 dark:border-slate-700 relative z-10 p-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-2 px-6 py-2.5 ${
                  isActive 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <svg className={`transition-all duration-300 w-4 h-4 ${isActive ? 'text-[#1A237E] dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                </svg>
                <span className="whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-4 relative z-10">
          {/* Gelişmiş Tema Switcher */}
          <button 
            onClick={onToggleDarkMode}
            className="group/theme relative w-16 h-9 bg-slate-100 dark:bg-slate-800 rounded-full p-1 transition-all duration-500 hover:ring-2 hover:ring-blue-500/20"
          >
            <div className={`absolute top-1 left-1 w-7 h-7 bg-white dark:bg-slate-900 rounded-full shadow-sm transform transition-all duration-500 flex items-center justify-center ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`}>
               {isDarkMode ? (
                 <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
               ) : (
                 <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
               )}
            </div>
          </button>

          <div className="hidden lg:flex flex-col items-end border-r border-slate-200/60 dark:border-slate-800 pr-5 whitespace-nowrap">
            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{businessName}</p>
            <div className="flex items-center mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5"></span>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Aktif</p>
            </div>
          </div>
          
          <div 
            onClick={() => setActiveTab('profile')}
            className={`w-11 h-11 border rounded-[14px] flex items-center justify-center transition-all active:scale-95 cursor-pointer ${activeTab === 'profile' ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-[#1A237E] dark:hover:text-blue-400 hover:border-[#1A237E]/20 hover:shadow-lg shadow-blue-900/10'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
