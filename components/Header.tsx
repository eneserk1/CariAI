
import React, { useEffect, useState } from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  businessName: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, businessName }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'chat', label: 'Asistan', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'customers', label: 'Cariler', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'products', label: 'Ürünler', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'profile', label: 'Profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <header className={`hidden md:flex fixed top-0 left-0 right-0 z-[100] justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isScrolled ? 'pt-4' : 'pt-6'}`}>
      {/* Liquid Glass Container */}
      <div 
        className={`bg-white/70 backdrop-blur-[40px] saturate-150 border border-white/50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] rounded-[32px] flex items-center justify-between relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group ${
          isScrolled 
            ? 'px-3 py-2 max-w-fit gap-4 bg-white/80' 
            : 'w-full max-w-7xl px-6 py-4'
        }`}
      >
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>

        {/* Logo Section */}
        <div 
          className="flex items-center cursor-pointer group/logo relative z-10 transition-all duration-500"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className={`bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-black shadow-lg shadow-slate-900/20 transform group-hover/logo:scale-105 group-hover/logo:rotate-3 transition-all duration-500 ${isScrolled ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-xl'}`}>
            D
          </div>
          
          <div className={`flex flex-col ml-3 overflow-hidden transition-all duration-500 ${isScrolled ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100'}`}>
             <span className="text-lg font-black tracking-tight text-slate-900 leading-none whitespace-nowrap">Defter<span className="text-[#1A237E]">AI</span></span>
             <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5 whitespace-nowrap">Asistan v4</span>
          </div>
        </div>

        {/* Navigation Pills */}
        <nav className={`flex items-center bg-slate-100/50 rounded-full border border-white/50 relative z-10 transition-all duration-500 ${isScrolled ? 'p-1' : 'p-1.5'}`}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative rounded-full text-sm font-bold transition-all duration-500 flex items-center justify-center space-x-2 ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                } ${isScrolled ? 'w-10 h-10 px-0' : 'px-6 py-2.5'}`}
                title={isScrolled ? item.label : ''}
              >
                <svg className={`transition-all duration-300 ${isActive ? 'text-[#1A237E]' : 'text-slate-400'} ${isScrolled ? 'w-5 h-5' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                </svg>
                <span className={`transition-all duration-500 overflow-hidden whitespace-nowrap ${isScrolled ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Profile & Info Section */}
        <div className={`flex items-center transition-all duration-500 overflow-hidden relative z-10 ${isScrolled ? 'w-0 opacity-0 gap-0' : 'w-auto opacity-100 space-x-5'}`}>
          <div className="hidden lg:flex flex-col items-end border-r border-slate-200/60 pr-5 whitespace-nowrap">
            <p className="text-sm font-black text-slate-900 leading-none">{businessName}</p>
            <div className="flex items-center mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5"></span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Çevrimiçi</p>
            </div>
          </div>
          
          <div 
            onClick={() => setActiveTab('profile')}
            className="w-11 h-11 bg-white border border-slate-100 rounded-[14px] flex items-center justify-center text-slate-400 hover:text-[#1A237E] hover:border-[#1A237E]/20 hover:shadow-lg hover:shadow-blue-900/10 cursor-pointer transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
