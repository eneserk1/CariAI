
import React from 'react';

interface DraftCardProps {
  data: {
    customerName: string;
    productName: string;
    quantity: number;
    price?: number;
    intent?: string;
  };
  onConfirm: () => void;
  onEdit: () => void;
  confirmed: boolean;
}

const DraftCard: React.FC<DraftCardProps> = ({ data, onConfirm, onEdit, confirmed }) => {
  const isSale = data.intent === 'SALE_RECORD';

  return (
    <div className={`mt-4 p-6 rounded-[24px] border-2 transition-all duration-500 ${confirmed ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 shadow-none' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-xl shadow-blue-900/5'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${isSale ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {isSale ? 'S' : 'A'}
          </div>
          <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">İŞLEM TASLAĞI</span>
        </div>
        {confirmed && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            KAYDEDİLDİ
          </span>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Cari Hesap / Müşteri</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{data.customerName}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Ürün Detayı</p>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">{data.productName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Miktar</p>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">{data.quantity} Adet</p>
          </div>
        </div>
        {data.price && (
          <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Birim Fiyat</p>
              <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">₺{data.price.toLocaleString('tr-TR')}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Toplam Tutar</p>
              <p className="text-2xl font-black text-[#1A237E] dark:text-blue-400">₺{(data.price * data.quantity).toLocaleString('tr-TR')}</p>
            </div>
          </div>
        )}
      </div>

      {!confirmed && (
        <div className="flex space-x-3">
          <button 
            onClick={onConfirm}
            className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-[#1A237E] dark:hover:bg-blue-500 transition-all shadow-lg"
          >
            Taslağı Onayla
          </button>
          <button 
            onClick={onEdit}
            className="px-6 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 py-4 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Düzenle
          </button>
        </div>
      )}
    </div>
  );
};

export default DraftCard;
