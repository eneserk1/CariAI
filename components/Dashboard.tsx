
import React, { useState, useMemo } from 'react';
import { BusinessState, Transaction } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts';

interface DashboardProps {
  state: BusinessState;
  onAskAI: (query: string) => void;
  onStartTyping: (initialChar: string) => void;
  onManualSale: () => void;
  onViewTransactions: () => void;
  onSelectCustomer: (id: string) => void;
  onSelectProduct: (id: string) => void;
  isProcessing: boolean;
}

type TimeFilter = '1M' | '3M' | '1Y';

const Dashboard: React.FC<DashboardProps> = ({ 
  state, 
  onAskAI, 
  onStartTyping, 
  onManualSale, 
  onViewTransactions, 
  onSelectCustomer,
  onSelectProduct,
  isProcessing 
}) => {
  const [query, setQuery] = useState('');
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [analysisFilter, setAnalysisFilter] = useState<TimeFilter>('1M');

  const totalReceivable = state.customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const totalPayable = Math.abs(state.customers.reduce((acc, c) => acc + (c.balance < 0 ? c.balance : 0), 0));

  const COLORS = ['#1A237E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  // --- Veri İşleme (Dashboard Özet Görünüm) ---
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

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.transactions.filter(t => t.type === 'SALE').forEach(t => {
      const category = state.products.find(p => p.id === t.productId)?.category || 'Diğer';
      counts[category] = (counts[category] || 0) + t.totalAmount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state.transactions, state.products]);

  // --- Detaylı Analiz Veri İşleme ---
  const analysisData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    if (analysisFilter === '1M') startDate.setMonth(now.getMonth() - 1);
    if (analysisFilter === '3M') startDate.setMonth(now.getMonth() - 3);
    if (analysisFilter === '1Y') startDate.setFullYear(now.getFullYear() - 1);

    const filteredTxs = state.transactions.filter(t => new Date(t.date) >= startDate);

    // 1. Nakit Akışı Zaman Serisi
    const timeGroups: Record<string, { date: string, satış: number, tahsilat: number }> = {};
    filteredTxs.forEach(t => {
      const dateKey = analysisFilter === '1Y' 
        ? new Date(t.date).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
        : new Date(t.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      
      if (!timeGroups[dateKey]) timeGroups[dateKey] = { date: dateKey, satış: 0, tahsilat: 0 };
      if (t.type === 'SALE') timeGroups[dateKey].satış += t.totalAmount;
      if (t.type === 'PAYMENT') timeGroups[dateKey].tahsilat += t.totalAmount;
    });

    // 2. Cari Hacmi (Top Customers)
    const customerVolume: Record<string, number> = {};
    filteredTxs.forEach(t => {
      customerVolume[t.customerName] = (customerVolume[t.customerName] || 0) + t.totalAmount;
    });
    const topCustomers = Object.entries(customerVolume)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // 3. En Çok Satan Ürünler
    const productSales: Record<string, number> = {};
    filteredTxs.filter(t => t.type === 'SALE').forEach(t => {
      if (t.productName) {
        productSales[t.productName] = (productSales[t.productName] || 0) + (t.quantity || 1);
      }
    });
    const topProducts = Object.entries(productSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      timeSeries: Object.values(timeGroups),
      topCustomers,
      topProducts,
      summary: {
        totalSales: filteredTxs.filter(t => t.type === 'SALE').reduce((s, t) => s + t.totalAmount, 0),
        totalPayments: filteredTxs.filter(t => t.type === 'PAYMENT').reduce((s, t) => s + t.totalAmount, 0),
      }
    };
  }, [state.transactions, analysisFilter]);

  // --- Handlers ---
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
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-[40px] blur-2xl opacity-10 dark:opacity-20 transition duration-1000"></div>
        <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white dark:border-slate-800 p-10 rounded-[40px] shadow-2xl shadow-blue-900/5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex items-center space-x-6 flex-1">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-2xl transition-all duration-700 transform ${isProcessing ? 'bg-blue-600 animate-pulse rotate-12 scale-110' : 'bg-slate-900 dark:bg-blue-600'}`}>
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
                    className="w-full bg-transparent border-none text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-0"
                />
                </div>
            </div>
            <button 
                onClick={onManualSale}
                className="bg-slate-900 dark:bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 dark:shadow-blue-900/20 hover:bg-[#1A237E] transition-all"
            >
                İşlem Yap
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-4">ALACAKLAR</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">₺{totalReceivable.toLocaleString('tr-TR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-4">BORÇLAR</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">₺{totalPayable.toLocaleString('tr-TR')}</p>
        </div>

        {state.dashboardInsights.slice(0, 2).map((insight) => (
          <div key={insight.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{insight.title}</p>
              <span className="text-2xl">{insight.icon || '✨'}</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{insight.value}</p>
          </div>
        ))}
      </div>

      {/* Business Pulse - Dashboard Özet Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white">İşletme Nabzı</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Son 7 Günlük Nakit Akışı</p>
                </div>
                <button 
                  onClick={() => setShowFullAnalysis(true)}
                  className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Detaylı Analiz
                </button>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniChartData}>
                        <defs>
                            <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1A237E" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#1A237E" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700 }}
                            cursor={{ stroke: '#1A237E', strokeWidth: 2, strokeDasharray: '5 5' }}
                        />
                        <Area type="monotone" dataKey="satış" stroke="#1A237E" strokeWidth={3} fillOpacity={1} fill="url(#colorSale)" />
                        <Area type="monotone" dataKey="tahsilat" stroke="#10B981" strokeWidth={3} fill="transparent" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h3 className="font-black text-xl text-slate-900 dark:text-white w-full text-left mb-2">Satış Dağılımı</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest w-full text-left mb-8">Kategori Bazlı</p>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData.length > 0 ? categoryData : [{name: 'Yok', value: 1}]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            {categoryData.length === 0 && <Cell fill="#f1f5f9" />}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                {categoryData.slice(0, 4).map((cat, i) => (
                    <div key={cat.name} className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                        <span className="text-[10px] font-bold text-slate-500 truncate">{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Global Activity Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
         <div className="p-8 md:p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
            <h3 className="font-black text-xl text-slate-900 dark:text-white">Son Hareketler</h3>
            <button onClick={onViewTransactions} className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Tümünü Gör →</button>
         </div>
         <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {state.transactions.slice(0, 5).map(t => (
               <div key={t.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group/row" onClick={() => onSelectCustomer(t.customerId)}>
                  <div className="flex items-center space-x-6">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm md:text-base ${t.type === 'SALE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : t.type === 'PAYMENT' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>{t.type[0]}</div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-sm md:text-base leading-tight group-hover/row:text-blue-600 transition-colors">{t.customerName}</p>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1" onClick={(e) => { if (t.productId) { e.stopPropagation(); onSelectProduct(t.productId); } }}>
                        {t.productName || t.note} {t.quantity ? `• ${t.quantity} Adet` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-base md:text-lg ${t.type === 'SALE' ? 'text-slate-900 dark:text-white' : t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-red-500'}`}>₺{t.totalAmount.toLocaleString('tr-TR')}</p>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase mt-0.5">{new Date(t.date).toLocaleDateString('tr-TR')}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Detaylı Analiz Modalı (Apple Style Overlay) */}
      {showFullAnalysis && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto animate-in fade-in zoom-in-95 duration-300 p-6 md:p-12">
            <div className="max-w-6xl mx-auto pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">İşletme Analizi</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Kapsamlı Finansal Görünüm</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                            {(['1M', '3M', '1Y'] as TimeFilter[]).map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setAnalysisFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${analysisFilter === f ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                                >
                                    {f === '1M' ? '1 Ay' : f === '3M' ? '3 Ay' : '1 Yıl'}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setShowFullAnalysis(false)}
                            className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-900 dark:text-white hover:scale-110 transition-transform"
                        >
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Özet Satırı */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TOPLAM CİRO</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white">₺{analysisData.summary.totalSales.toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TOPLAM TAHSİLAT</p>
                        <p className="text-4xl font-black text-emerald-600">₺{analysisData.summary.totalPayments.toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TAHSİLAT ORANI</p>
                        <p className="text-4xl font-black text-blue-600">%{(analysisData.summary.totalPayments / (analysisData.summary.totalSales || 1) * 100).toFixed(1)}</p>
                    </div>
                </div>

                {/* Grafikler Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Nakit Akışı Zaman Serisi */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 flex flex-col">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">Zaman Bazlı Performans</h4>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={analysisData.timeSeries}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="satış" fill="#1A237E" radius={[6, 6, 0, 0]} barSize={20} />
                                    <Line type="monotone" dataKey="tahsilat" stroke="#10B981" strokeWidth={3} dot={{r: 4, fill: '#10B981'}} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Cari Hacmi */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 flex flex-col">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">Cari İşlem Hacmi (Top 8)</h4>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analysisData.topCustomers} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} width={100} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="value" fill="#1A237E" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* En Çok Satan Ürünler */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 flex flex-col">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">En Çok Satan Ürünler (Miktar)</h4>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analysisData.topProducts}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} interval={0} />
                                    <YAxis hide />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Satış Dağılımı */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 w-full">Gelir Dağılımı</h4>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                            {categoryData.map((cat, i) => (
                                <div key={cat.name} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center space-x-2 overflow-hidden">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                        <span className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-widest">{cat.name}</span>
                                    </div>
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white ml-2">₺{cat.value.toLocaleString('tr-TR')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
