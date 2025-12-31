
import React, { useState, useMemo } from 'react';
import { BusinessState, Transaction } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardProps {
  state: BusinessState;
  onAskAI: (query: string) => void;
  onStartTyping: (initialChar: string) => void;
  onOpenQuickAction: (action: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'STOCK' | 'CUSTOMER') => void;
  onViewTransactions: () => void;
  onViewAnalysis: () => void;
  onSelectCustomer: (id: string) => void;
  isProcessing: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  state, 
  onAskAI, 
  onStartTyping, 
  onOpenQuickAction, 
  onViewTransactions, 
  onViewAnalysis,
  onSelectCustomer,
  isProcessing 
}) => {
  const [query, setQuery] = useState('');
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const totalReceivable = state.customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const totalPayable = Math.abs(state.customers.reduce((acc, c) => acc + (c.balance < 0 ? c.balance : 0), 0));

  const miniChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTxs = state.transactions.filter(t => t.date.startsWith(date));
      return {
        date: new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' }),
        satış: dayTxs.filter(t => t.type === 'SALE').reduce((sum, t) => sum + t.totalAmount, 0),
        tahsilat: dayTxs.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + t.totalAmount, 0),
      };
    });
  }, [state.transactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length === 1 && !query) onStartTyping(val);
    else setQuery(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onAskAI(query);
      setQuery('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 page-transition">
      {/* Magic Bar */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-[38px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 md:p-10 rounded-[40px] shadow-2xl">
          <div className="flex items-center space-x-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all duration-500 ${isProcessing ? 'bg-blue-600 animate-pulse' : 'bg-slate-900 dark:bg-blue-600'}`}>
                  {isProcessing ? '✨' : '🧠'}
              </div>
              <div className="flex-1">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Akıllı Defter Asistanı</h2>
                  <input
                      type="text"
                      value={query}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Örn: 'Global Lojistik'e 2500 TL lastik sat'..."
                      className="w-full bg-transparent border-none text-xl md:text-2xl font-black text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 focus:outline-none focus:ring-0"
                  />
              </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Hızlı İşlemler - Interactive Hub */}
        <div 
          className="relative bg-blue-600 dark:bg-blue-700 p-8 rounded-[32px] shadow-lg cursor-pointer group overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
          onClick={() => setShowQuickMenu(!showQuickMenu)}
        >
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-3">HIZLI MENÜ</p>
            <h3 className="text-2xl font-black text-white">İşlem Ekle</h3>
            <p className="text-blue-100 text-[10px] font-bold mt-1 uppercase opacity-80">Satış, Alış, Tahsilat...</p>
          </div>
          <span className="absolute -bottom-4 -right-4 text-7xl opacity-10 group-hover:rotate-12 transition-transform">⚡</span>
          
          {/* Popover/Overlay Menu */}
          {showQuickMenu && (
            <div className="absolute inset-0 bg-slate-900 z-20 p-4 grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
               {[
                 { id: 'SALE', label: 'Satış', icon: '💰' },
                 { id: 'PAYMENT', label: 'Tahsilat', icon: '📥' },
                 { id: 'PURCHASE', label: 'Alış', icon: '🛒' },
                 { id: 'STOCK', label: 'Stok', icon: '📦' },
                 { id: 'CUSTOMER', label: 'Cari', icon: '👤' },
                 { id: 'CLOSE', label: 'Kapat', icon: '✕' },
               ].map(item => (
                 <button 
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if(item.id === 'CLOSE') setShowQuickMenu(false);
                    else onOpenQuickAction(item.id as any);
                  }}
                  className={`flex items-center justify-center space-x-1.5 p-2 rounded-xl text-[9px] font-black uppercase tracking-tighter ${item.id === 'CLOSE' ? 'bg-red-500/20 text-red-500 col-span-2' : 'bg-white/10 text-white hover:bg-white/20'}`}
                 >
                   <span>{item.icon}</span>
                   <span>{item.label}</span>
                 </button>
               ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">ALACAKLAR</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">₺{totalReceivable.toLocaleString('tr-TR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">BORÇLAR</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">₺{totalPayable.toLocaleString('tr-TR')}</p>
        </div>

        <div onClick={onViewAnalysis} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ANALİZ</p>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Detaylı<br/>Raporlar</h3>
            <span className="text-2xl">📊</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Charts & Recents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white">İşletme Özeti</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Son 7 Günlük Hareket</p>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniChartData}>
                        <defs>
                            <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 800 }} />
                        <Area type="monotone" dataKey="satış" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSale)" />
                        <Area type="monotone" dataKey="tahsilat" stroke="#10B981" strokeWidth={4} fill="transparent" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
           <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Son Kayıtlar</h3>
              <button onClick={onViewTransactions} className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tümü →</button>
           </div>
           <div className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto custom-scrollbar flex-1">
              {state.transactions.slice(0, 6).map(t => (
                 <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onSelectCustomer(t.customerId)}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${t.type === 'SALE' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{t.type[0]}</div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-sm truncate max-w-[120px]">{t.customerName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(t.date).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm ${t.type === 'SALE' ? 'text-slate-900 dark:text-white' : 'text-emerald-600'}`}>₺{t.totalAmount.toLocaleString('tr-TR')}</p>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
