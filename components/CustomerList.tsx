
import React, { useState } from 'react';
import { Customer } from '../types';

interface CustomerListProps {
  customers: Customer[];
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelect, onAddNew }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance_desc' | 'balance_asc'>('name');

  const filtered = customers
    .filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.taxOffice && c.taxOffice.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
    )
    .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'balance_desc') return b.balance - a.balance; // Highest first
        if (sortBy === 'balance_asc') return a.balance - b.balance; // Lowest first
        return 0;
    });

  return (
    <div className="space-y-6 page-transition pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 md:mb-10">
         <div className="w-full md:w-auto">
           <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Cari Hesaplar</h2>
           <div className="flex space-x-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setSortBy('name')} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${sortBy === 'name' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
              >İsme Göre (A-Z)</button>
              <button 
                onClick={() => setSortBy('balance_desc')} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${sortBy === 'balance_desc' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
              >Borçlu (Çoktan Aza)</button>
              <button 
                onClick={() => setSortBy('balance_asc')} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${sortBy === 'balance_asc' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
              >Alacaklı (Çoktan Aza)</button>
           </div>
         </div>
         <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <input 
                type="text"
                placeholder="İsim, telefon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-sm"
              />
            </div>
            <button 
                onClick={onAddNew}
                className="w-full md:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl hover:bg-blue-900 transition-all whitespace-nowrap text-sm uppercase tracking-widest"
            >
                + Yeni Cari
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {filtered.map((c) => (
          <div 
            key={c.id} 
            onClick={() => onSelect(c.id)}
            className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group shadow-sm relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-2 h-full ${c.balance > 0 ? 'bg-emerald-500' : c.balance < 0 ? 'bg-red-500' : 'bg-slate-200'}`} />
            
            <div className="flex justify-between items-start mb-6 md:mb-8">
              <div>
                <p className="text-xl md:text-3xl font-black text-slate-900 group-hover:text-blue-900 transition-colors leading-tight">{c.name}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">{c.taxOffice || 'Bireysel'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] md:text-xs font-black text-slate-300 uppercase tracking-widest mb-1">BAKİYE</p>
                <p className={`text-2xl md:text-4xl font-black tracking-tighter ${c.balance > 0 ? 'text-emerald-600' : c.balance < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                  ₺{c.balance.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-between items-center text-[#1A237E] font-black text-sm uppercase tracking-widest">
              <span>{c.phone || 'No Belirtilmedi'}</span>
              <span className="group-hover:translate-x-2 transition-transform hidden md:inline-block">DETAYLAR →</span>
              <span className="md:hidden">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerList;
