
import React, { useState } from 'react';
import { BusinessState } from '../types';

interface DashboardProps {
  state: BusinessState;
  onAskAI: (query: string) => void;
  onStartTyping: (initialChar: string) => void;
  isProcessing: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAskAI, onStartTyping, isProcessing }) => {
  const [query, setQuery] = useState('');

  const totalReceivable = state.customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const totalPayable = Math.abs(state.customers.reduce((acc, c) => acc + (c.balance < 0 ? c.balance : 0), 0));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length === 1) {
      onStartTyping(val);
    } else {
      setQuery(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onAskAI(query);
      setQuery('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 page-transition">
      {/* AI Magic Bar - Hero Section */}
      <div className="relative z-10">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-[40px] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative bg-white/70 backdrop-blur-3xl border border-white p-10 rounded-[40px] shadow-2xl shadow-blue-900/5">
          <div className="flex items-center space-x-8">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-2xl transition-all duration-700 transform ${isProcessing ? 'bg-blue-600 animate-pulse rotate-12 scale-110' : 'bg-slate-900 hover:rotate-6'}`}>
              {isProcessing ? '✨' : '🧠'}
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Defter AI Magic Bar</h2>
              <input
                type="text"
                autoFocus
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Yazmaya başlayın, gerisini DefterAI halleder..."
                className="w-full bg-transparent border-none text-3xl font-black text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-0 leading-tight"
              />
              <div className="flex items-center space-x-6 mt-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hızlı Sorular:</span>
                <button onClick={() => onAskAI("Finansal sağlık raporu oluştur")} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest border-b border-blue-100 pb-0.5">Finansal Sağlık</button>
                <button onClick={() => onAskAI("Alacaklarımı listele")} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest border-b border-blue-100 pb-0.5">Alacak Listesi</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-4 relative z-10">ALACAKLAR</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter relative z-10">₺{totalReceivable.toLocaleString('tr-TR')}</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-4 relative z-10">BORÇLAR</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter relative z-10">₺{totalPayable.toLocaleString('tr-TR')}</p>
        </div>

        {state.dashboardInsights.map((insight) => (
          <div 
            key={insight.id}
            className={`p-8 rounded-[32px] border transition-all hover:shadow-2xl hover:-translate-y-1 cursor-default animate-in zoom-in-95 duration-500 relative overflow-hidden group ${
              insight.type === 'positive' ? 'bg-emerald-50/50 border-emerald-100' :
              insight.type === 'negative' ? 'bg-red-50/50 border-red-100' :
              insight.type === 'info' ? 'bg-blue-50/50 border-blue-100' :
              'bg-white border-slate-100'
            }`}
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className={`text-[11px] font-black uppercase tracking-widest ${
                insight.type === 'positive' ? 'text-emerald-600' :
                insight.type === 'negative' ? 'text-red-600' :
                insight.type === 'info' ? 'text-blue-600' :
                'text-slate-400'
              }`}>{insight.title}</p>
              <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{insight.icon || '✨'}</span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter relative z-10">{insight.value}</p>
            <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed relative z-10">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
