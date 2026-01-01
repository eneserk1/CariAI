
import React, { useState } from 'react';
import { Customer, Transaction } from '../types';
import { jsPDF } from 'jspdf';

interface CustomerDetailProps {
  customer: Customer;
  transactions: Transaction[];
  onBack: () => void;
  onEdit: (customer: Customer) => void;
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onNewTransaction: () => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer,
  transactions,
  onBack,
  onEdit,
  onUpdate,
  onDelete,
  onNewTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SALE' | 'PURCHASE' | 'PAYMENT'>('ALL');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer>(customer);
  const [transactionEditMode, setTransactionEditMode] = useState<string | null>(null);
  const [editedTransaction, setEditedTransaction] = useState<Transaction | null>(null);

  const customerTransactions = transactions
    .filter(t => t.customerId === customer.id)
    .filter(t => filter === 'ALL' || t.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const downloadAddressLabel = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');

    const companyName = customer.name || '';
    const address = customer.address || '';

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    doc.text(companyName, centerX, centerY - 30, { align: 'center' });
    doc.setFontSize(28);
    doc.setFont('helvetica', 'normal');
    doc.text(address, centerX, centerY + 20, { align: 'center' });

    doc.save(`${customer.name}_Adres-Etiketi.pdf`);
  };

  const downloadPdfExtre = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(22);
    doc.text(`${customer.name} - Hesap Ekstresi`, 20, 20);
    doc.setFontSize(10);
    doc.text(`Isletme: DefterAI | Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);
    doc.line(20, 36, 190, 36);

    let y = 46;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Tarih", 20, y);
    doc.text("Islem", 50, y);
    doc.text("Detay", 80, y);
    doc.text("Tutar", 160, y);
    y += 10;

    customerTransactions.forEach(t => {
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(t.date).toLocaleDateString('tr-TR'), 20, y);
      doc.text(t.type === 'SALE' ? 'Satis' : t.type === 'PAYMENT' ? 'Tahsilat' : 'Alis', 50, y);
      doc.text(t.productName || 'Nakit Odeme', 80, y);
      doc.text(`TL${t.totalAmount.toLocaleString('tr-TR')}`, 160, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 20; }
    });

    doc.save(`${customer.name}_Ekstre.pdf`);
  };

  const handleDelete = () => {
    if (confirm(`${customer.name} adlı cari hesabı silmek istediğine emin misin?`)) {
      onDelete(customer.id);
    }
  };

  const handleEdit = () => {
    setEditedCustomer(customer);
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    onUpdate(editedCustomer);
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedCustomer(customer);
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

  const totalSales = customerTransactions.filter(t => t.type === 'SALE').reduce((sum, t) => sum + t.totalAmount, 0);
  const totalCollections = customerTransactions.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + t.totalAmount, 0);
  const totalPurchases = customerTransactions.filter(t => t.type === 'PURCHASE').reduce((sum, t) => sum + t.totalAmount, 0);

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
            <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{customer.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {customer.taxOffice || 'Bireysel'} {customer.taxNumber ? `• ${customer.taxNumber}` : ''}
            </p>
            <div className="flex items-center space-x-4 mt-2">
              {customer.phone && (
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {customer.phone}
                </p>
              )}
              {customer.address && (
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {customer.address}
                </p>
              )}
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
            onClick={downloadAddressLabel}
            className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Adres Etiketi
          </button>
          <button
            onClick={downloadPdfExtre}
            className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Ekstre İndir
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            Sil
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className={`p-10 rounded-[40px] border-2 ${customer.balance > 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : customer.balance < 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 dark:text-slate-400">BAKİYE DURUMU</p>
            <p className={`text-5xl font-black tracking-tighter ${customer.balance > 0 ? 'text-emerald-600' : customer.balance < 0 ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'}`}>
              ₺{customer.balance.toLocaleString('tr-TR')}
            </p>
          </div>
          <div className="flex space-x-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">TOPLAM SATIŞ</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">₺{totalSales.toLocaleString('tr-TR')}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">TOPLAM TAHSİLAT</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">₺{totalCollections.toLocaleString('tr-TR')}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">TOPLAM ALIŞ</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">₺{totalPurchases.toLocaleString('tr-TR')}</p>
            </div>
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
              Yeni İşlem Yap
            </button>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {(['ALL', 'SALE', 'PURCHASE', 'PAYMENT'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  filter === f
                    ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {f === 'ALL' ? 'Tümü' : f === 'SALE' ? 'Satış' : f === 'PURCHASE' ? 'Alış' : 'Tahsilat'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {customerTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-600">
              <p className="font-black uppercase tracking-widest text-xs">Henüz işlem yok</p>
            </div>
          ) : (
            customerTransactions.map(t => (
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
                      <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-widest">Ürün/Hizmet</label>
                      <input
                        type="text"
                        value={editedTransaction?.productName || ''}
                        onChange={(e) => setEditedTransaction({ ...editedTransaction!, productName: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 font-bold border-none outline-none dark:text-white"
                      />
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
                      t.type === 'SALE' ? 'bg-blue-50 text-blue-600' :
                      t.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {t.type[0]}
                    </div>
                    <div>
                      <p className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                        {t.productName || (t.type === 'PAYMENT' ? 'Nakit Tahsilat' : 'Genel')}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        {new Date(t.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className={`text-2xl font-black ${
                    t.type === 'SALE' ? 'text-slate-900 dark:text-white' :
                    t.type === 'PAYMENT' ? 'text-emerald-600' :
                    'text-red-500'
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

      {/* Notes */}
      {customer.notes && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-slate-500 dark:text-slate-400">NOTLAR</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{customer.notes}</p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditMode && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Cari Düzenle</h3>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Cari Adı</label>
                <input
                  type="text"
                  value={editedCustomer.name}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Telefon</label>
                <input
                  type="text"
                  value={editedCustomer.phone || ''}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Vergi Dairesi</label>
                <input
                  type="text"
                  value={editedCustomer.taxOffice || ''}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, taxOffice: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Vergi Numarası</label>
                <input
                  type="text"
                  value={editedCustomer.taxNumber || ''}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, taxNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Adres</label>
                <textarea
                  value={editedCustomer.address || ''}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none min-h-[120px] dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">E-Posta</label>
                <input
                  type="email"
                  value={editedCustomer.email || ''}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Notlar</label>
                <textarea
                  value={editedCustomer.notes || ''}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold border-none outline-none min-h-[120px] dark:text-white"
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

export default CustomerDetail;
