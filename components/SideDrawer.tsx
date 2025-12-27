
import React from 'react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[110] transition-opacity duration-500" 
        onClick={onClose} 
      />
      <div className="fixed top-4 bottom-4 right-4 w-full max-w-xl bg-white z-[120] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[40px] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 ease-out">
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
          >
            <svg className="w-6 h-6 text-slate-400 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
};

export default SideDrawer;
