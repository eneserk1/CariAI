
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onAddNew: () => void;
  onManualSale: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onSelect, onAddNew, onManualSale }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price_desc' | 'price_asc' | 'stock_asc' | 'stock_desc'>('name');

  const filtered = products
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price_desc') return b.unitPrice - a.unitPrice;
        if (sortBy === 'price_asc') return a.unitPrice - b.unitPrice;
        if (sortBy === 'stock_desc') return b.stockCount - a.stockCount;
        if (sortBy === 'stock_asc') return a.stockCount - b.stockCount;
        return 0;
    });

  return (
    <div className="space-y-6 page-transition pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 md:mb-10">
         <div className="w-full md:w-auto">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Ürünler</h2>
            <div className="flex space-x-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
              <button onClick={() => setSortBy('name')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${sortBy === 'name' ? 'bg-slate-900 dark:bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>İsim</button>
              <button onClick={() => setSortBy('price_desc')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${sortBy === 'price_desc' ? 'bg-slate-900 dark:bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>Fiyat (↓)</button>
              <button onClick={() => setSortBy('price_asc')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${sortBy === 'price_asc' ? 'bg-slate-900 dark:bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>Fiyat (↑)</button>
              <button onClick={() => setSortBy('stock_asc')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${sortBy === 'stock_asc' ? 'bg-slate-900 dark:bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>Stok (Az)</button>
           </div>
         </div>
         <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <input type="text" placeholder="Ürün ara..." className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <div className="flex w-full md:w-auto space-x-2">
                <button onClick={onManualSale} className="flex-1 md:w-auto bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-700 transition-all">Satış Yap</button>
                <button onClick={onAddNew} className="flex-1 md:w-auto bg-slate-900 dark:bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-900 dark:hover:bg-blue-500 transition-all">+ Yeni Ürün</button>
            </div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filtered.map(p => (
          <div key={p.id} onClick={() => onSelect(p)} className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-6">
                <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{p.name}</p>
                <span className="text-[10px] font-black bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3 py-1 rounded-full uppercase shrink-0 ml-2">{p.category}</span>
            </div>
            <div className="flex justify-between items-end pt-6 border-t border-slate-50 dark:border-slate-800">
                <div>
                    <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase mb-1">STOK</p>
                    <p className={`text-3xl md:text-4xl font-black tracking-tighter ${p.stockCount < 20 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{p.stockCount}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl md:text-3xl font-black text-[#1A237E] dark:text-blue-400">₺{p.unitPrice}</p>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
