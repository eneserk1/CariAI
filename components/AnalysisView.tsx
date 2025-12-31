
import React, { useMemo } from 'react';
import { BusinessState, Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

interface AnalysisViewProps {
  state: BusinessState;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ state }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const stats = useMemo(() => {
    const sales = state.transactions.filter(t => t.type === 'SALE').reduce((sum, t) => sum + t.totalAmount, 0);
    const collection = state.transactions.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + t.totalAmount, 0);
    const purchase = state.transactions.filter(t => t.type === 'PURCHASE').reduce((sum, t) => sum + t.totalAmount, 0);
    
    // Top 5 Products by Sales
    const productSales: Record<string, number> = {};
    state.transactions.filter(t => t.type === 'SALE').forEach(t => {
      const name = t.productName || 'Diğer';
      productSales[name] = (productSales[name] || 0) + t.totalAmount;
    });
    const topProducts = Object.entries(productSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Top 5 Customers by Volume
    const customerVolume: Record<string, number> = {};
    state.transactions.filter(t => t.type === 'SALE').forEach(t => {
      customerVolume[t.customerName] = (customerVolume[t.customerName] || 0) + t.totalAmount;
    });
    const topCustomers = Object.entries(customerVolume)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { sales, collection, purchase, topProducts, topCustomers };
  }, [state.transactions]);

  return (
    <div className="space-y-10 page-transition">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Rapor ve Analiz</h2>
        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase">Canlı Veri</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">TOPLAM CİRO</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white">₺{stats.sales.toLocaleString('tr-TR')}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">TOPLAM TAHSİLAT</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white">₺{stats.collection.toLocaleString('tr-TR')}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">TOPLAM ALIŞ</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white">₺{stats.purchase.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="font-black text-xl text-slate-900 dark:text-white mb-8">En Çok Satan Ürünler (₺)</h3>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.topProducts} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: 'transparent'}} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={30} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="font-black text-xl text-slate-900 dark:text-white mb-8">Müşteri İşlem Hacmi (₺)</h3>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={stats.topCustomers} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name">
                   {stats.topCustomers.map((_, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
