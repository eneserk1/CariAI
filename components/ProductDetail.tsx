
import React, { useState } from 'react';
import { Product, Transaction } from '../types';

interface ProductDetailProps {
  product: Product;
  transactions: Transaction[];
  customers: any[];
  onBack: () => void;
  onEdit: (product: Product) => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  onNewTransaction: () => void;
  onStockAdjust: (productId: string, newStock: number) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  transactions,
  customers,
  onBack,
  onEdit,
  onUpdate,
  onDelete,
  onNewTransaction,
  onStockAdjust,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [stockAdjustMode, setStockAdjustMode] = useState(false);
  const [newStockValue, setNewStockValue] = useState(product.stockCount);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product>(product);
  const [transactionEditMode, setTransactionEditMode] = useState<string | null>(null);
  const [editedTransaction, setEditedTransaction] = useState<Transaction | null>(null);

  const productTransactions = transactions
    .filter(t => t.productId === product.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSold = productTransactions.filter(t => t.type === 'SALE').reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalPurchased = productTransactions.filter(t => t.type === 'PURCHASE').reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalRevenue = productTransactions.filter(t => t.type === 'SALE').reduce((sum, t) => sum + t.totalAmount, 0);

  const handleStockAdjust = () => {
    if (confirm(`Stok miktarını ${newStockValue} olarak güncellemek istediğine emin misin?`)) {
      onStockAdjust(product.id, newStockValue);
      setStockAdjustMode(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`${product.name} adlı ürünü silmek istediğine emin misin? Bu işlem geri alınamaz.`)) {
      onDelete(product.id);
    }
  };

  const handleEdit = () => {
    setEditedProduct(product);
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    onUpdate(editedProduct);
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedProduct(product);
    setIsEditMode(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditedTransaction(transaction);
    setTransactionEditMode(transaction.id);
  };

  const handleSaveTransaction = () => {
    if (editedTransaction) {
      onUpdateTransaction(editedTransaction);
      setTransactionEditMode(null);
      setEditedTransaction(null);
    }
  };

  const handleCancelTransactionEdit = () => {
    setTransactionEditMode(null);
    setEditedTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Bu işlemi silmek istediğine emin misin?')) {
      onDeleteTransaction(id);
    }
  };

  const isLowStock = product.stockCount < 20;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <button
            onClick={onBack}
            className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{product.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {product.category}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {product.sku}
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleEdit}
            className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Düzenle
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            Sil
          </button>
        </div>
      </div>

      {/* Stock Card */}
      <div className={`p-10 rounded-[40px] border-2 ${isLowStock ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 dark:text-slate-400">STOK DURUMU</p>
            <p className={`text-5xl font-black tracking-tighter ${isLowStock ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
              {product.stockCount}
            </p>
            {isLowStock && (
              <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-red-600">⚠️ Düşük Stok</p>
            )}
          </div>

          {stockAdjustMode ? (
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={newStockValue}
                onChange={(e) => setNewStockValue(Number(e.target.value))}
                className="w-32 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-black text-2xl text-center outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
              />
              <button
                onClick={handleStockAdjust}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                Kaydet
              </button>
              <button
                onClick={() => { setStockAdjustMode(false); setNewStockValue(product.stockCount); }}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                İptal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setStockAdjustMode(true)}
              className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Stok Düzelt
            </button>
          )}
        </div>
      </div>

      {/* Combined Stats Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-6">
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-500">Satış Fiyatı</p>
            <p className="text-xl font-black text-blue-600">₺{product.unitPrice.toLocaleString('tr-TR')}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-500">Alış Fiyatı</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">₺{product.purchasePrice.toLocaleString('tr-TR')}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-500">Kar Marji</p>
            <p className="text-xl font-black text-emerald-600">
              {((product.unitPrice - product.purchasePrice) / product.unitPrice * 100).toFixed(0)}%
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-500">KDV</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{(product.vatRate * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-500">Satış (Adet)</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{totalSold}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-500">Alış (Adet)</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{totalPurchased}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-500">Ciro</p>
            <p className="text-xl font-black text-blue-600">₺{totalRevenue.toLocaleString('tr-TR')}</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">İşlem Geçmişi</h3>
            <button
              onClick={onNewTransaction}
              className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-blue-700 transition-all"
            >
              Yeni Satış Yap
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {productTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-600">
              <p className="font-black uppercase tracking-widest text-xs">Henüz işlem yok</p>
            </div>
          ) : (
            productTransactions.map(t => (
              transactionEditMode === t.id ? (
                <div key={t.id} className="p-8 bg-slate-50 dark:bg-slate-800/50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-widest">Tutar</label>
                      <input
                        type="number"
                        value={editedTransaction?.totalAmount || 0}
                        onChange={(e) => setEditedTransaction({ ...editedTransaction!, totalAmount: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 font-bold border-none outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-widest">Cari</label>
                      <select
                        value={editedTransaction?.customerId || ''}
                        onChange={(e) => setEditedTransaction({ ...editedTransaction!, customerId: e.target.value, customerName: customers.find(c => c.id === e.target.value)?.name || '' })}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 font-bold border-none outline-none dark:text-white"
                      >
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-widest">Miktar</label>
                      <input
                        type="number"
                        value={editedTransaction?.quantity || 0}
                        onChange={(e) => setEditedTransaction({ ...editedTransaction!, quantity: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 font-bold border-none outline-none dark:text-white"
                      />
                    </div>
                    <div className="flex items-end space-x-2">
                      <button
                        onClick={handleSaveTransaction}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={handleCancelTransactionEdit}
                        className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="px-4 bg-red-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={t.id} className="p-8 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center space-x-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                      t.type === 'SALE' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {t.type[0]}
                    </div>
                    <div>
                      <p className="font-black text-lg text-slate-900 dark:text-white leading-tight">{t.customerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        {new Date(t.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className={`text-2xl font-black ${
                        t.type === 'SALE' ? 'text-slate-900 dark:text-white' : 'text-red-500'
                      }`}>
                        ₺{t.totalAmount.toLocaleString('tr-TR')}
                      </p>
                      {t.quantity && (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.quantity} Adet</p>
                      )}
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditTransaction(t)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditMode && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Ürün Düzenle</h3>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Ürün Adı</label>
                <input
                  type="text"
                  value={editedProduct.name}
                  onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">SKU</label>
                <input
                  type="text"
                  value={editedProduct.sku}
                  onChange={(e) => setEditedProduct({ ...editedProduct, sku: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Satış Fiyatı</label>
                  <input
                    type="number"
                    value={editedProduct.unitPrice}
                    onChange={(e) => setEditedProduct({ ...editedProduct, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Alış Fiyatı</label>
                  <input
                    type="number"
                    value={editedProduct.purchasePrice}
                    onChange={(e) => setEditedProduct({ ...editedProduct, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Stok</label>
                  <input
                    type="number"
                    value={editedProduct.stockCount}
                    onChange={(e) => setEditedProduct({ ...editedProduct, stockCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">KDV Oranı</label>
                  <select
                    value={editedProduct.vatRate}
                    onChange={(e) => setEditedProduct({ ...editedProduct, vatRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                  >
                    <option value={0}>%0</option>
                    <option value={0.01}>%1</option>
                    <option value={0.10}>%10</option>
                    <option value={0.20}>%20</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Kategori</label>
                <input
                  type="text"
                  value={editedProduct.category}
                  onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                />
              </div>
            </div>
            <div className="p-10 border-t border-slate-100 dark:border-slate-800 flex space-x-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              >
                Kaydet
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
