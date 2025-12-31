
import React from 'react';

interface DraftCardProps {
  data: {
    customerName?: string;
    productName?: string;
    quantity?: number;
    price?: number;
    intent?: string;
    phone?: string;
  };
  onConfirm: () => void;
  onEdit: () => void;
  confirmed: boolean;
}

const DraftCard: React.FC<DraftCardProps> = ({ data, onConfirm, onEdit, confirmed }) => {
  const intent = data.intent;
  const quantity = Number(data.quantity) || 1;
  const price = Number(data.price) || 0;
  const total = quantity * price;
  
  const getHeader = () => {
    switch(intent) {
        case 'SALE_RECORD': return { label: 'SATIŞ TASLAĞI', color: 'bg-emerald-500', icon: 'S' };
        case 'PURCHASE_RECORD': return { label: 'ALIŞ/GİDER TASLAĞI', color: 'bg-red-500', icon: 'A' };
        case 'COLLECTION_RECORD': return { label: 'TAHSİLAT TASLAĞI', color: 'bg-blue-500', icon: 'T' };
        case 'CUSTOMER_ADD': return { label: 'YENİ CARİ KAYDI', color: 'bg-indigo-500', icon: '+' };
        case 'CUSTOMER_DELETE': return { label: 'CARİ SİLME ONAYI', color: 'bg-slate-900', icon: 'x' };
        case 'PRODUCT_ADD': return { label: 'YENİ ÜRÜN KAYDI', color: 'bg-orange-500', icon: 'P' };
        case 'STOCK_ADJUST': return { label: 'STOK DÜZENLEME', color: 'bg-purple-500', icon: '±' };
        default: return { label: 'İŞLEM TASLAĞI', color: 'bg-slate-500', icon: '?' };
    }
  };

  const header = getHeader();

  return (
    <div className={`mt-4 p-6 rounded-[24px] border-2 transition-all duration-500 ${confirmed ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-xl'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${header.color}`}>
            {header.icon}
          </div>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{header.label}</span>
        </div>
        {confirmed && <span className="text-xs font-bold text-emerald-600 uppercase">✓ TAMAMLANDI</span>}
      </div>

      <div className="space-y-4 mb-6">
        {data.customerName && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cari Hesap</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{data.customerName}</p>
          </div>
        )}
        {data.productName && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ürün / Hizmet</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{data.productName}</p>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 border-t border-slate-50 dark:border-slate-800 pt-4">
          {data.quantity !== undefined && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Miktar</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{quantity} Adet</p>
            </div>
          )}
          {data.price !== undefined && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fiyat</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">₺{price.toLocaleString('tr-TR')}</p>
            </div>
          )}
          {intent?.includes('SALE') || intent?.includes('PURCHASE') || intent?.includes('COLLECTION') ? (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Toplam</p>
              <p className="text-xl font-black text-blue-600">₺{total.toLocaleString('tr-TR')}</p>
            </div>
          ) : null}
        </div>
      </div>

      {!confirmed && (
        <div className="flex space-x-3 mt-8">
          <button onClick={onConfirm} className={`flex-1 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg ${intent === 'CUSTOMER_DELETE' ? 'bg-red-600' : 'bg-slate-900 dark:bg-blue-600'} hover:scale-[1.02] active:scale-95 transition-all`}>
            {intent === 'CUSTOMER_DELETE' ? 'SİL' : 'Onayla'}
          </button>
          <button onClick={onEdit} className="px-6 border py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Düzenle</button>
        </div>
      )}
    </div>
  );
};

export default DraftCard;
