
import React, { useState, useCallback, useEffect } from 'react';
import { INITIAL_STATE } from './constants';
import { BusinessState, Transaction, Customer, Product, ChatSession, BusinessProfile, ChatMessage } from './types';
import Header from './components/Header';
import MobileNavBar from './components/MobileNavBar';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import ProductList from './components/ProductList';
import ChatInterface from './components/ChatInterface';
import SideDrawer from './components/SideDrawer';
import Profile from './components/Profile'; 
import { geminiService } from './services/geminiService';
import { dbService } from './services/db';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [state, setState] = useState<BusinessState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'customer_edit' | 'product_edit' | 'manual_tx' | 'stock_adjust' | 'manual_sale_purchase'>('manual_tx');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [initialChatValue, setInitialChatValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'transactions'>('list');
  const [txFilter, setTxFilter] = useState<'ALL' | Transaction['type']>('ALL');
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form States for SideDrawer
  const [formAmount, setFormAmount] = useState<string>('');
  const [formQty, setFormQty] = useState<string>('1');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formSelectedProductId, setFormSelectedProductId] = useState<string>('');
  const [manualTxType, setManualTxType] = useState<'SALE' | 'PURCHASE'>('SALE');

  useEffect(() => {
    const initData = async () => {
      try {
        await dbService.init();
        const loadedState = await dbService.getState();
        if (loadedState.chatSessions.length === 0) {
            loadedState.chatSessions = [...INITIAL_STATE.chatSessions];
            loadedState.currentChatId = loadedState.chatSessions[0].id;
        }
        setState(loadedState);
      } catch (err) {
        console.error("DB Başlatma Hatası:", err);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // --- PDF Export Logic ---
  const downloadPdfExtre = (customer: Customer, txs: Transaction[]) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`${customer.name} - Hesap Ekstresi`, 20, 20);
    doc.setFontSize(10);
    doc.text(`İşletme: ${state.profile.name}`, 20, 30);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 35);
    doc.text(`Adres: ${customer.address || '-'}`, 20, 40);
    doc.text(`Telefon: ${customer.phone || '-'}`, 20, 45);
    doc.line(20, 50, 190, 50);

    let y = 60;
    doc.setFontSize(11);
    doc.text("Tarih", 20, y);
    doc.text("İşlem Tipi", 50, y);
    doc.text("Detay", 85, y);
    doc.text("Tutar", 160, y);
    doc.line(20, y+2, 190, y+2);
    y += 10;

    txs.forEach(t => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(new Date(t.date).toLocaleDateString('tr-TR'), 20, y);
      doc.text(t.type === 'SALE' ? 'Satış' : t.type === 'PURCHASE' ? 'Alış' : 'Tahsilat', 50, y);
      doc.text(t.productName || 'Nakit Ödeme', 85, y);
      doc.text(`₺${t.totalAmount.toLocaleString('tr-TR')}`, 160, y);
      y += 8;
    });

    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(14);
    doc.text(`Güncel Toplam Bakiye: ₺${customer.balance.toLocaleString('tr-TR')}`, 20, y);

    doc.save(`${customer.name}_Ekstre_${new Date().getTime()}.pdf`);
  };

  const handleConfirmDraft = async (messageIndex: number) => {
    const activeId = state.currentChatId || (state.chatSessions.length > 0 ? state.chatSessions[0].id : null);
    const session = state.chatSessions.find(s => s.id === activeId);
    if (!session) return;
    
    const message = session.messages[messageIndex];
    if (!message || !message.draft) return;
    
    const data = message.draft;
    const intent = data.intent;

    let nextCustomers = [...state.customers];
    let nextProducts = [...state.products];
    let nextTransactions = [...state.transactions];

    try {
        switch (intent) {
            case 'SALE_RECORD':
            case 'PURCHASE_RECORD': {
                const isSale = intent === 'SALE_RECORD';
                const cName = (data.customerName || 'Bilinmeyen Müşteri').trim();
                const pName = (data.productName || 'Genel Ürün').trim();
                const qty = Number(data.quantity) || 1;
                const price = Number(data.price) || 0;
                const total = qty * price;

                let customer = nextCustomers.find(c => c.name.toLowerCase() === cName.toLowerCase());
                if (!customer) {
                    customer = { id: `c-${Date.now()}`, name: cName, balance: 0, address: data.address };
                    nextCustomers.unshift(customer);
                }

                let product = nextProducts.find(p => p.name.toLowerCase() === pName.toLowerCase());
                if (!product) {
                    product = { id: `p-${Date.now()}`, name: pName, sku: 'AI', stockCount: 0, unitPrice: price, purchasePrice: price * 0.8, vatRate: 0.2, category: 'AI' };
                    nextProducts.unshift(product);
                }

                const newTx: Transaction = {
                    id: `t-${Date.now()}`,
                    customerId: customer.id,
                    customerName: customer.name,
                    productId: product.id,
                    productName: product.name,
                    quantity: qty,
                    totalAmount: total,
                    date: new Date().toISOString(),
                    type: isSale ? 'SALE' : 'PURCHASE',
                    paymentStatus: 'PENDING'
                };

                customer.balance += (isSale ? total : -total);
                product.stockCount += (isSale ? -qty : qty);

                await Promise.all([
                    dbService.saveTransaction(newTx),
                    dbService.saveCustomer(customer),
                    dbService.saveProduct(product)
                ]);

                nextTransactions.unshift(newTx);
                break;
            }

            case 'COLLECTION_RECORD': {
                const cName = (data.customerName || '').trim();
                const amount = Number(data.price) || 0;
                let customer = nextCustomers.find(c => c.name.toLowerCase() === cName.toLowerCase());
                if (!customer) return alert("Cari bulunamadı.");
                const newTx: Transaction = {
                    id: `pay-${Date.now()}`,
                    customerId: customer.id,
                    customerName: customer.name,
                    totalAmount: amount,
                    date: new Date().toISOString(),
                    type: 'PAYMENT',
                    paymentStatus: 'PAID'
                };
                customer.balance -= amount;
                await Promise.all([dbService.saveTransaction(newTx), dbService.saveCustomer(customer)]);
                nextTransactions.unshift(newTx);
                break;
            }

            case 'CUSTOMER_UPDATE': {
                const cName = data.customerName;
                let customer = nextCustomers.find(c => c.name.toLowerCase() === cName.toLowerCase());
                if (customer) {
                    if (data.phone) customer.phone = data.phone;
                    if (data.address) customer.address = data.address;
                    await dbService.saveCustomer(customer);
                }
                break;
            }

            case 'PRODUCT_UPDATE': {
                const pName = data.productName;
                let product = nextProducts.find(p => p.name.toLowerCase() === pName.toLowerCase());
                if (product) {
                    if (data.price) product.unitPrice = Number(data.price);
                    if (data.category) product.category = data.category;
                    await dbService.saveProduct(product);
                }
                break;
            }
        }

        const updatedSessions = state.chatSessions.map(s => {
            if (s.id === activeId) {
                const msgs = [...s.messages];
                msgs[messageIndex] = { ...msgs[messageIndex], confirmed: true };
                const upd = { ...s, messages: msgs };
                dbService.saveChatSession(upd);
                return upd;
            }
            return s;
        });

        setState(prev => ({
            ...prev,
            customers: nextCustomers,
            products: nextProducts,
            transactions: nextTransactions,
            chatSessions: updatedSessions
        }));

    } catch (err) {
        console.error("Onay Hatası:", err);
    }
  };

  const handleUpdateChat = useCallback(async (userMessage: string, intent: string, data: any, aiMessage: string, isDraft: boolean) => {
    if (intent === 'CONFIRM_ACTION') {
        const activeId = state.currentChatId || (state.chatSessions.length > 0 ? state.chatSessions[0].id : null);
        const session = state.chatSessions.find(s => s.id === activeId);
        if (session) {
            const lastDraftIndex = [...session.messages].reverse().findIndex(m => m.draft && !m.confirmed);
            if (lastDraftIndex !== -1) {
                const actualIndex = session.messages.length - 1 - lastDraftIndex;
                handleConfirmDraft(actualIndex);
                setState(prev => {
                    const updated = prev.chatSessions.map(s => {
                        if (s.id === activeId) {
                            return { ...s, messages: [...s.messages, 
                                { role: 'user' as const, content: userMessage, timestamp: Date.now() },
                                { role: 'assistant' as const, content: "Harika, işlemi onayladım!", timestamp: Date.now() }
                            ]};
                        }
                        return s;
                    });
                    return { ...prev, chatSessions: updated };
                });
                return;
            }
        }
    }

    setState(prev => {
      const activeId = prev.currentChatId || (prev.chatSessions.length > 0 ? prev.chatSessions[0].id : null);
      if (!activeId) return prev;

      const updatedSessions = prev.chatSessions.map(s => {
        if (s.id === activeId) {
          const newMessages = [...s.messages];
          if (userMessage) newMessages.push({ role: 'user' as const, content: userMessage, timestamp: Date.now() });
          newMessages.push({ role: 'assistant' as const, content: aiMessage, timestamp: Date.now(), draft: isDraft ? data : undefined, confirmed: false });
          const upd = { ...s, messages: newMessages, lastUpdate: Date.now() };
          dbService.saveChatSession(upd).catch(console.error);
          return upd;
        }
        return s;
      });
      return { ...prev, chatSessions: updatedSessions };
    });
  }, [state.chatSessions, state.currentChatId, handleConfirmDraft]);

  const handleAddUserMessage = (msg: string) => {
    setState(prev => {
      const activeId = prev.currentChatId || (prev.chatSessions.length > 0 ? prev.chatSessions[0].id : null);
      const updatedSessions = prev.chatSessions.map(s => {
        if (s.id === activeId) {
          const upd = { ...s, messages: [...s.messages, { role: 'user' as const, content: msg, timestamp: Date.now() }], lastUpdate: Date.now() };
          dbService.saveChatSession(upd).catch(console.error);
          return upd;
        }
        return s;
      });
      return { ...prev, chatSessions: updatedSessions };
    });
  };

  const handleDashboardSubmit = async (query: string) => {
    setIsProcessingAI(true);
    setInitialChatValue(query);
    setActiveTab('chat');
    try {
      const response = await geminiService.processMessage(query, state, []);
      const draftIntents = ['SALE_RECORD', 'PURCHASE_RECORD', 'COLLECTION_RECORD', 'CUSTOMER_ADD', 'CUSTOMER_DELETE', 'PRODUCT_ADD', 'STOCK_ADJUST', 'CUSTOMER_UPDATE', 'PRODUCT_UPDATE'];
      const isDraft = draftIntents.includes(response.intent);
      handleUpdateChat(query, response.intent || 'GENERAL_CHAT', { ...response.data, intent: response.intent }, response.message || "İşlem hazır.", isDraft);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleManualTxSubmit = async (type: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'STOCK' | 'CUSTOMER_EDIT' | 'PRODUCT_EDIT') => {
    let nextState = { ...state };

    if (type === 'PAYMENT' && selectedCustomer) {
        const amount = Number(formAmount);
        const newTx: Transaction = {
            id: `pay-${Date.now()}`,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            totalAmount: amount,
            date: new Date().toISOString(),
            type: 'PAYMENT',
            paymentStatus: 'PAID'
        };
        const updatedCust = { ...selectedCustomer, balance: selectedCustomer.balance - amount };
        await dbService.saveTransaction(newTx);
        await dbService.saveCustomer(updatedCust);
        nextState.transactions = [newTx, ...state.transactions];
        nextState.customers = state.customers.map(c => c.id === updatedCust.id ? updatedCust : c);
        setSelectedCustomer(updatedCust);
    } else if (type === 'STOCK' && selectedProduct) {
        const qty = Number(formQty);
        const updatedProd = { ...selectedProduct, stockCount: qty };
        await dbService.saveProduct(updatedProd);
        nextState.products = state.products.map(p => p.id === updatedProd.id ? updatedProd : p);
        setSelectedProduct(updatedProd);
    } else if ((type === 'SALE' || type === 'PURCHASE') && selectedCustomer) {
        const qty = Number(formQty);
        const price = Number(formPrice);
        const total = qty * price;
        
        let product = state.products.find(p => p.id === formSelectedProductId);
        if (!product) {
            product = { id: `p-${Date.now()}`, name: formName, sku: 'MANUAL', stockCount: 0, unitPrice: price, purchasePrice: price * 0.8, vatRate: 0.2, category: 'Genel' };
            nextState.products.unshift(product);
        }

        const newTx: Transaction = {
            id: `t-${Date.now()}`,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            productId: product.id,
            productName: product.name,
            quantity: qty,
            totalAmount: total,
            date: new Date().toISOString(),
            type: type,
            paymentStatus: 'PENDING'
        };

        const updatedCust = { ...selectedCustomer, balance: selectedCustomer.balance + (type === 'SALE' ? total : -total) };
        const updatedProd = { ...product, stockCount: product.stockCount + (type === 'SALE' ? -qty : qty) };
        
        await dbService.saveTransaction(newTx);
        await dbService.saveCustomer(updatedCust);
        await dbService.saveProduct(updatedProd);

        nextState.transactions = [newTx, ...state.transactions];
        nextState.customers = state.customers.map(c => c.id === updatedCust.id ? updatedCust : c);
        nextState.products = nextState.products.map(p => p.id === updatedProd.id ? updatedProd : p);
        setSelectedCustomer(updatedCust);
    } else if (type === 'CUSTOMER_EDIT' && selectedCustomer) {
        const updatedCust = { ...selectedCustomer, name: formName, phone: formPhone, address: formAddress };
        await dbService.saveCustomer(updatedCust);
        nextState.customers = state.customers.map(c => c.id === updatedCust.id ? updatedCust : c);
        setSelectedCustomer(updatedCust);
    } else if (type === 'PRODUCT_EDIT' && selectedProduct) {
        const updatedProd = { ...selectedProduct, name: formName, category: formCategory, unitPrice: Number(formPrice) };
        await dbService.saveProduct(updatedProd);
        nextState.products = state.products.map(p => p.id === updatedProd.id ? updatedProd : p);
        setSelectedProduct(updatedProd);
    }

    setState(nextState);
    setIsDrawerOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormAmount('');
    setFormQty('1');
    setFormPrice('');
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormCategory('');
    setFormSelectedProductId('');
  };

  const renderContent = () => {
    const commonClass = "page-transition max-w-6xl mx-auto pb-24 md:pb-0";

    // --- TÜM İŞLEMLER (İŞLEM DEFTERİ) ---
    if (activeTab === 'dashboard' && viewMode === 'transactions') {
       const filteredTxs = state.transactions.filter(t => txFilter === 'ALL' || t.type === txFilter);
       return (
         <div className={commonClass}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
               <div>
                  <button onClick={() => setViewMode('list')} className="text-slate-400 font-black text-xs uppercase mb-4 hover:text-slate-900 transition-colors">← Panale Dön</button>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white">İşlem Defteri</h2>
               </div>
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                  {(['ALL', 'SALE', 'PURCHASE', 'PAYMENT'] as const).map(f => (
                    <button 
                      key={f}
                      onClick={() => setTxFilter(f)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txFilter === f ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                    >
                      {f === 'ALL' ? 'Tümü' : f === 'SALE' ? 'Satış' : f === 'PURCHASE' ? 'Alış' : 'Ödeme'}
                    </button>
                  ))}
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
               <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTxs.length === 0 ? <p className="p-20 text-center text-slate-400 font-bold">Herhangi bir kayıt bulunamadı.</p> : filteredTxs.map(t => (
                    <div key={t.id} className="p-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                       <div className="flex items-center space-x-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${t.type === 'SALE' ? 'bg-slate-100 text-slate-900' : t.type === 'PURCHASE' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>{t.type[0]}</div>
                          <div>
                             <p className="font-black text-lg text-slate-900 dark:text-white leading-tight">{t.customerName}</p>
                             <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{t.productName || 'Nakit İşlem'} • {new Date(t.date).toLocaleDateString('tr-TR')}</p>
                          </div>
                       </div>
                       <p className={`text-2xl font-black ${t.type === 'SALE' ? 'text-slate-900 dark:text-white' : t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-red-500'}`}>₺{t.totalAmount.toLocaleString('tr-TR')}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       );
    }

    // --- MÜŞTERİ DETAY ---
    if (activeTab === 'customers' && viewMode === 'detail' && selectedCustomer) {
        const custTxs = state.transactions.filter(t => t.customerId === selectedCustomer.id);
        return (
            <div className={commonClass}>
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="text-slate-400 font-black text-xs uppercase hover:text-slate-900 transition-colors">← Listeye Dön</button>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => downloadPdfExtre(selectedCustomer, custTxs)} className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">PDF Ekstre</button>
                        <button onClick={() => { setFormName(selectedCustomer.name); setFormPhone(selectedCustomer.phone || ''); setFormAddress(selectedCustomer.address || ''); setDrawerMode('customer_edit'); setIsDrawerOpen(true); }} className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Bilgileri Düzenle</button>
                        <button onClick={() => { setManualTxType('PURCHASE'); setDrawerMode('manual_sale_purchase'); setIsDrawerOpen(true); }} className="px-5 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-red-600">Alış Yap</button>
                        <button onClick={() => { setManualTxType('SALE'); setDrawerMode('manual_sale_purchase'); setIsDrawerOpen(true); }} className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-blue-700">Satış Yap</button>
                        <button onClick={() => { setDrawerMode('manual_tx'); setIsDrawerOpen(true); }} className="px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-emerald-700">Tahsilat Gir</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                            <div className="w-24 h-24 bg-slate-900 dark:bg-blue-600 rounded-[32px] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-2xl">{selectedCustomer.name.charAt(0)}</div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{selectedCustomer.name}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedCustomer.phone || 'Telefon Kaydı Yok'}</p>
                            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TOPLAM BAKİYE</p>
                                <p className={`text-5xl font-black tracking-tighter ${selectedCustomer.balance > 0 ? 'text-emerald-600' : selectedCustomer.balance < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                    ₺{selectedCustomer.balance.toLocaleString('tr-TR')}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Adres / İletişim Detay</h4>
                             <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{selectedCustomer.address || 'Adres bilgisi girilmemiş.'}</p>
                             <div className="flex flex-col gap-3">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3">
                                    <span className="text-lg">📞</span>
                                    <span className="text-xs font-bold text-slate-500">{selectedCustomer.phone || 'Belirtilmedi'}</span>
                                </div>
                             </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-black text-xl text-slate-900 dark:text-white">İşlem Defteri</h3>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800 flex-1 overflow-y-auto custom-scrollbar">
                                {custTxs.length === 0 ? (
                                    <div className="p-20 text-center"><p className="text-slate-300 font-bold">Bu cariye ait henüz hareket bulunmuyor.</p></div>
                                ) : custTxs.map(t => (
                                    <div key={t.id} className="p-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${t.type === 'SALE' ? 'bg-slate-100 text-slate-900' : t.type === 'PURCHASE' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>{t.type[0]}</div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white">{t.productName || 'Nakit Ödeme'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(t.date).toLocaleDateString('tr-TR')} • {t.quantity || 1} Birim</p>
                                            </div>
                                        </div>
                                        <p className={`text-2xl font-black ${t.type === 'SALE' ? 'text-slate-900 dark:text-white' : t.type === 'PURCHASE' ? 'text-red-500' : 'text-emerald-600'}`}>₺{t.totalAmount.toLocaleString('tr-TR')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- ÜRÜN DETAY ---
    if (activeTab === 'products' && viewMode === 'detail' && selectedProduct) {
        const prodTxs = state.transactions.filter(t => t.productId === selectedProduct.id);
        return (
            <div className={commonClass}>
                <div className="mb-10 flex justify-between items-center">
                    <button onClick={() => setViewMode('list')} className="text-slate-400 font-black text-xs uppercase hover:text-slate-900 transition-colors">← Listeye Dön</button>
                    <div className="flex space-x-2">
                        <button onClick={() => { setFormName(selectedProduct.name); setFormCategory(selectedProduct.category); setFormPrice(selectedProduct.unitPrice.toString()); setDrawerMode('product_edit'); setIsDrawerOpen(true); }} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Ürünü Düzenle</button>
                        <button onClick={() => { setFormQty(selectedProduct.stockCount.toString()); setDrawerMode('stock_adjust'); setIsDrawerOpen(true); }} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Stok Ayarla</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 rounded-[32px] flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-xl">📦</div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{selectedProduct.name}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedProduct.category} • SKU: {selectedProduct.sku}</p>
                            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-around">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GÜNCEL STOK</p>
                                    <p className={`text-4xl font-black ${selectedProduct.stockCount < 10 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{selectedProduct.stockCount}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BİRİM FİYAT</p>
                                    <p className="text-4xl font-black text-blue-600">₺{selectedProduct.unitPrice.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800">
                                <h3 className="font-black text-xl text-slate-900 dark:text-white">Hareket Geçmişi</h3>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800 flex-1 overflow-y-auto custom-scrollbar">
                                {prodTxs.length === 0 ? (
                                    <div className="p-20 text-center"><p className="text-slate-300 font-bold">Bu ürünle ilgili henüz satış/alış kaydı yok.</p></div>
                                ) : prodTxs.map(t => (
                                    <div key={t.id} className="p-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white">{t.customerName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.type === 'SALE' ? 'Satış' : 'Alış'} • {t.quantity} Adet • {new Date(t.date).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                        <p className={`text-2xl font-black ${t.type === 'SALE' ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>₺{t.totalAmount.toLocaleString('tr-TR')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- GENEL GÖRÜNÜMLER ---
    switch (activeTab) {
      case 'dashboard': return <div className={commonClass}><Dashboard state={state} onAskAI={handleDashboardSubmit} onStartTyping={(c) => { setInitialChatValue(c); setActiveTab('chat'); }} isProcessing={isProcessingAI} onManualSale={() => { setDrawerMode('manual_tx'); setIsDrawerOpen(true); }} onViewTransactions={() => setViewMode('transactions')} onSelectCustomer={(id) => { const c = state.customers.find(x => x.id === id); if (c) { setSelectedProduct(null); setSelectedCustomer(c); setViewMode('detail'); setActiveTab('customers'); } }} onSelectProduct={(id) => { const p = state.products.find(x => x.id === id); if (p) { setSelectedCustomer(null); setSelectedProduct(p); setViewMode('detail'); setActiveTab('products'); } }} /></div>;
      case 'chat': return <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-10rem)]"><ChatInterface state={state} initialValue={initialChatValue} onUpdateState={handleUpdateChat} onAddUserMessage={handleAddUserMessage} onNewChat={() => {}} onSelectChat={(id) => setState(p=>({...p, currentChatId:id}))} onConfirmDraft={handleConfirmDraft} /></div>;
      case 'customers': return <div className={commonClass}><CustomerList customers={state.customers} onSelect={(id) => { const c = state.customers.find(x => x.id === id); if (c) { setSelectedProduct(null); setSelectedCustomer(c); setViewMode('detail'); setActiveTab('customers'); } }} onAddNew={() => { resetForm(); setDrawerMode('customer_edit'); setIsDrawerOpen(true); }} onManualSale={() => { setDrawerMode('manual_tx'); setIsDrawerOpen(true); }} /></div>;
      case 'products': return <div className={commonClass}><ProductList products={state.products} onSelect={(p) => { setSelectedCustomer(null); setSelectedProduct(p); setViewMode('detail'); setActiveTab('products'); }} onAddNew={() => { resetForm(); setDrawerMode('product_edit'); setIsDrawerOpen(true); }} onManualSale={() => { setDrawerMode('manual_tx'); setIsDrawerOpen(true); }} /></div>;
      case 'profile': return <div className={commonClass}><Profile profile={state.profile} onEdit={() => { /* Edit Profile logic if needed */ }} /></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} businessName={state.profile.name} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      <main className="pt-8 md:pt-36 px-4 md:px-8 pb-32">{renderContent()}</main>
      <MobileNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={
          drawerMode === 'manual_tx' ? 'Hızlı Tahsilat' : 
          drawerMode === 'stock_adjust' ? 'Stok Düzenle' : 
          drawerMode === 'customer_edit' ? 'Cari Bilgileri' :
          drawerMode === 'product_edit' ? 'Ürün Bilgileri' :
          drawerMode === 'manual_sale_purchase' ? (manualTxType === 'SALE' ? 'Hızlı Satış' : 'Hızlı Alış') :
          'İşlem Girişi'
      }>
        <div className="space-y-8">
            {drawerMode === 'manual_tx' && (
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Alınan Ödeme (₺)</label>
                        <input type="number" value={formAmount} onChange={e=>setFormAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 text-2xl font-black focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <button onClick={() => handleManualTxSubmit('PAYMENT')} className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl transition-all active:scale-95">Kaydet ve Tamamla</button>
                </div>
            )}

            {drawerMode === 'stock_adjust' && (
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Güncel Stok Adedi</label>
                        <input type="number" value={formQty} onChange={e=>setFormQty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 text-2xl font-black focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <button onClick={() => handleManualTxSubmit('STOCK')} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl transition-all active:scale-95">Sayımı Kaydet</button>
                </div>
            )}

            {drawerMode === 'customer_edit' && (
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">İsim / Ticari Unvan</label>
                        <input type="text" value={formName} onChange={e=>setFormName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Telefon No</label>
                        <input type="text" value={formPhone} onChange={e=>setFormPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Adres Bilgisi</label>
                        <textarea rows={3} value={formAddress} onChange={e=>setFormAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                    </div>
                    <button onClick={() => handleManualTxSubmit('CUSTOMER_EDIT')} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[24px] font-black text-lg uppercase tracking-widest transition-all active:scale-95">Güncelle</button>
                </div>
            )}

            {drawerMode === 'product_edit' && (
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ürün Adı</label>
                        <input type="text" value={formName} onChange={e=>setFormName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Kategori</label>
                            <input type="text" value={formCategory} onChange={e=>setFormCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Satış Fiyatı (₺)</label>
                            <input type="number" value={formPrice} onChange={e=>setFormPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                    </div>
                    <button onClick={() => handleManualTxSubmit('PRODUCT_EDIT')} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[24px] font-black text-lg uppercase tracking-widest transition-all active:scale-95">Kaydet</button>
                </div>
            )}

            {drawerMode === 'manual_sale_purchase' && (
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ürün Seçimi</label>
                        <select 
                            value={formSelectedProductId} 
                            onChange={e => {
                                setFormSelectedProductId(e.target.value);
                                const p = state.products.find(x => x.id === e.target.value);
                                if (p) setFormPrice(p.unitPrice.toString());
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10"
                        >
                            <option value="">-- Mevcut Ürün Seç --</option>
                            <option value="new">+ Listede Yok (Yeni Ürün)</option>
                            {state.products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stockCount})</option>)}
                        </select>
                    </div>

                    {formSelectedProductId === 'new' && (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Yeni Ürün İsmi</label>
                            <input type="text" value={formName} onChange={e=>setFormName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Miktar</label>
                            <input type="number" value={formQty} onChange={e=>setFormQty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Birim Fiyat (₺)</label>
                            <input type="number" value={formPrice} onChange={e=>setFormPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl text-center border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">İŞLEM TOPLAMI</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white">₺{(Number(formQty) * Number(formPrice)).toLocaleString('tr-TR')}</p>
                    </div>

                    <button 
                        onClick={() => handleManualTxSubmit(manualTxType)} 
                        className={`w-full text-white py-5 rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl transition-all active:scale-95 ${manualTxType === 'SALE' ? 'bg-blue-600' : 'bg-red-500'}`}
                    >
                        {manualTxType === 'SALE' ? 'Satış Kaydını Yap' : 'Alış Kaydını Yap'}
                    </button>
                </div>
            )}
        </div>
      </SideDrawer>
    </div>
  );
};

export default App;
