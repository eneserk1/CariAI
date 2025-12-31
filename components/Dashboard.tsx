
import React, { useState } from 'react';
import { BusinessState } from '../types';

interface DashboardProps {
  state: BusinessState;
  onAskAI: (query: string) => void;
  onStartTyping: (initialChar: string) => void;
  onManualSale: () => void;
  onViewTransactions: () => void;
  isProcessing: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAskAI, onStartTyping, onManualSale, onViewTransactions, isProcessing }) => {
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
      {/* Magic Bar Section */}
      <div className="relative z-10">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-[40px] blur-2xl opacity-10 dark:opacity-20 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white dark:border-slate-800 p-10 rounded-[40px] shadow-2xl shadow-blue-900/5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex items-center space-x-6 flex-1">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-2xl transition-all duration-700 transform ${isProcessing ? 'bg-blue-600 animate-pulse rotate-12 scale-110' : 'bg-slate-900 dark:bg-blue-600 hover:rotate-6'}`}>
                {isProcessing ? '✨' : '🧠'}
                </div>
                <div className="flex-1">
                <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Defter AI Magic Bar</h2>
                <input
                    type="text"
                    autoFocus
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Yazmaya başlayın, gerisini DefterAI halleder..."
                    className="w-full bg-transparent border-none text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-0 leading-tight"
                />
                <div className="flex items-center space-x-6 mt-4">
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Hızlı Sorular:</span>
                    <button onClick={() => onAskAI("Finansal sağlık raporu oluştur")} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-widest border-b border-blue-100 dark:border-blue-900/30 pb-0.5">Finansal Sağlık</button>
                    <button onClick={() => onAskAI("Alacaklarımı listele")} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-widest border-b border-blue-100 dark:border-blue-900/30 pb-0.5">Alacak Listesi</button>
                </div>
                </div>
            </div>
            <button 
                onClick={onManualSale}
                className="bg-emerald-600 text-white px-10 py-5 rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"
            >
                Satış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-4 relative z-10">ALACAKLAR</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter relative z-10">₺{totalReceivable.toLocaleString('tr-TR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-4 relative z-10">BORÇLAR</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter relative z-10">₺{totalPayable.toLocaleString('tr-TR')}</p>
        </div>

        {state.dashboardInsights.map((insight) => (
          <div 
            key={insight.id}
            className={`p-8 rounded-[32px] border transition-all hover:shadow-2xl hover:-translate-y-1 cursor-default animate-in zoom-in-95 duration-500 relative overflow-hidden group ${
              insight.type === 'positive' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' :
              insight.type === 'negative' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30' :
              insight.type === 'info' ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' :
              'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className={`text-[11px] font-black uppercase tracking-widest ${
                insight.type === 'positive' ? 'text-emerald-600 dark:text-emerald-400' :
                insight.type === 'negative' ? 'text-red-600 dark:text-red-400' :
                insight.type === 'info' ? 'text-blue-600 dark:text-blue-400' :
                'text-slate-400 dark:text-slate-600'
              }`}>{insight.title}</p>
              <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{insight.icon || '✨'}</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter relative z-10">{insight.value}</p>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed relative z-10">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Global Activity Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
         <div className="p-8 md:p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
            <h3 className="font-black text-xl text-slate-900 dark:text-white">Son Hareketler</h3>
            <button 
              onClick={onViewTransactions}
              className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:text-blue-800 transition-colors"
            >
              Tümünü Gör →
            </button>
         </div>
         <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {state.transactions.slice(0, 5).map(t => (
               <div key={t.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center space-x-6">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm md:text-base ${t.type === 'SALE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : t.type === 'PAYMENT' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>{t.type[0]}</div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-sm md:text-base leading-tight">{t.customerName}</p>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.productName || t.note} {t.quantity ? `• ${t.quantity} Adet` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-base md:text-lg ${t.type === 'SALE' ? 'text-slate-900 dark:text-white' : t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-red-500'}`}>
                      ₺{t.totalAmount.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase mt-0.5">{new Date(t.date).toLocaleDateString('tr-TR')}</p>
                  </div>
               </div>
            ))}
            {state.transactions.length === 0 && (
              <div className="p-20 text-center">
                <p className="text-slate-400 font-bold">Henüz bir hareket bulunmuyor.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
