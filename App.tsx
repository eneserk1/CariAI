
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
import AnalysisView from './components/AnalysisView';
import CustomerDetail from './components/CustomerDetail';
import ProductDetail from './components/ProductDetail';
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

  const [formAmount, setFormAmount] = useState<string>('');
  const [formQty, setFormQty] = useState<string>('1');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formSelectedProductId, setFormSelectedProductId] = useState<string>('');
  const [manualTxType, setManualTxType] = useState<'SALE' | 'PURCHASE' | 'PAYMENT'>('SALE');

  useEffect(() => {
    const initData = async () => {
      try {
        await dbService.init();
        const seededState = await dbService.seedData();
        setState(seededState);
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

  const downloadPdfExtre = (customer: Customer, txs: Transaction[]) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`${customer.name} - Hesap Ekstresi`, 20, 20);
    doc.setFontSize(10);
    doc.text(`İşletme: ${state.profile.name} | Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);
    doc.line(20, 35, 190, 35);
    let y = 45;
    doc.setFontSize(10);
    doc.text("Tarih", 20, y);
    doc.text("İşlem", 50, y);
    doc.text("Detay", 80, y);
    doc.text("Tutar", 160, y);
    y += 10;
    txs.forEach(t => {
      doc.text(new Date(t.date).toLocaleDateString('tr-TR'), 20, y);
      doc.text(t.type === 'SALE' ? 'Satış' : t.type === 'PAYMENT' ? 'Tahsilat' : 'Alış', 50, y);
      doc.text(t.productName || 'Nakit Ödeme', 80, y);
      doc.text(`₺${t.totalAmount.toLocaleString('tr-TR')}`, 160, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 20; }
    });
    doc.save(`${customer.name}_Ekstre.pdf`);
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
        if (intent === 'SALE_RECORD' || intent === 'PURCHASE_RECORD') {
            const isSale = intent === 'SALE_RECORD';
            const cName = (data.customerName || 'Bilinmeyen').trim();
            const pName = (data.productName || 'Genel').trim();
            const qty = Number(data.quantity) || 1;
            const price = Number(data.price) || 0;
            const total = qty * price;
            let customer = nextCustomers.find(c => c.name.toLowerCase() === cName.toLowerCase());
            if (!customer) { customer = { id: `c-${Date.now()}`, name: cName, balance: 0 }; nextCustomers.unshift(customer); }
            let product = nextProducts.find(p => p.name.toLowerCase() === pName.toLowerCase());
            if (!product) { product = { id: `p-${Date.now()}`, name: pName, sku: 'AI', stockCount: 0, unitPrice: price, purchasePrice: price*0.8, vatRate: 0.2, category: 'Genel' }; nextProducts.unshift(product); }
            const newTx: Transaction = { id: `t-${Date.now()}`, customerId: customer.id, customerName: customer.name, productName: product.name, quantity: qty, totalAmount: total, date: new Date().toISOString(), type: isSale ? 'SALE' : 'PURCHASE', paymentStatus: 'PENDING' };
            customer.balance += (isSale ? total : -total);
            product.stockCount += (isSale ? -qty : qty);
            await Promise.all([dbService.saveTransaction(newTx), dbService.saveCustomer(customer), dbService.saveProduct(product)]);
            nextTransactions.unshift(newTx);
        } else if (intent === 'COLLECTION_RECORD') {
            const cName = data.customerName?.trim();
            const amount = Number(data.price) || 0;
            let customer = nextCustomers.find(c => c.name.toLowerCase() === cName.toLowerCase());
            if (customer) {
                const newTx: Transaction = { id: `p-${Date.now()}`, customerId: customer.id, customerName: customer.name, totalAmount: amount, date: new Date().toISOString(), type: 'PAYMENT', paymentStatus: 'PAID' };
                customer.balance -= amount;
                await Promise.all([dbService.saveTransaction(newTx), dbService.saveCustomer(customer)]);
                nextTransactions.unshift(newTx);
            }
        }
        const updatedSessions = state.chatSessions.map(s => {
            if (s.id === activeId) {
                const msgs = [...s.messages];
                msgs[messageIndex] = { ...msgs[messageIndex], confirmed: true };
                return { ...s, messages: msgs };
            }
            return s;
        });
        setState(prev => ({ ...prev, customers: nextCustomers, products: nextProducts, transactions: nextTransactions, chatSessions: updatedSessions }));
    } catch (err) { console.error(err); }
  };

  const handleUpdateChat = useCallback(async (userMessage: string, intent: string, data: any, aiMessage: string, isDraft: boolean) => {
    setState(prev => {
      const activeId = prev.currentChatId || (prev.chatSessions.length > 0 ? prev.chatSessions[0].id : null);
      const updatedSessions: ChatSession[] = prev.chatSessions.map(s => {
        if (s.id === activeId) {
          const newMessages: ChatMessage[] = [...s.messages];
          if (userMessage) newMessages.push({ role: 'user' as const, content: userMessage, timestamp: Date.now() });
          newMessages.push({ role: 'assistant' as const, content: aiMessage, timestamp: Date.now(), draft: isDraft ? data : undefined });
          return { ...s, messages: newMessages, lastUpdate: Date.now() };
        }
        return s;
      });
      return { ...prev, chatSessions: updatedSessions };
    });
  }, []);

  const handleManualTxSubmit = async (type: string) => {
    let nextState = { ...state };
    try {
        if (type === 'PAYMENT' && selectedCustomer) {
            const amount = Number(formAmount);
            const newTx: Transaction = { id: `p-${Date.now()}`, customerId: selectedCustomer.id, customerName: selectedCustomer.name, totalAmount: amount, date: new Date().toISOString(), type: 'PAYMENT', paymentStatus: 'PAID' };
            const updatedCust = { ...selectedCustomer, balance: selectedCustomer.balance - amount };
            await dbService.saveTransaction(newTx);
            await dbService.saveCustomer(updatedCust);
            nextState.transactions = [newTx, ...state.transactions];
            nextState.customers = state.customers.map(c => c.id === updatedCust.id ? updatedCust : c);
        } else if ((type === 'SALE' || type === 'PURCHASE') && selectedCustomer) {
            const qty = Number(formQty);
            const price = Number(formPrice);
            const total = qty * price;
            const newTx: Transaction = { id: `tx-${Date.now()}`, customerId: selectedCustomer.id, customerName: selectedCustomer.name, productName: formName || 'Ürün', quantity: qty, totalAmount: total, date: new Date().toISOString(), type: type as any, paymentStatus: 'PENDING' };
            const updatedCust = { ...selectedCustomer, balance: selectedCustomer.balance + (type === 'SALE' ? total : -total) };
            await dbService.saveTransaction(newTx);
            await dbService.saveCustomer(updatedCust);
            nextState.transactions = [newTx, ...state.transactions];
            nextState.customers = state.customers.map(c => c.id === updatedCust.id ? updatedCust : c);
        } else if (type === 'CUSTOMER_ADD') {
            const newC: Customer = { id: `c-${Date.now()}`, name: formName, phone: formPhone, address: formAddress, balance: 0 };
            await dbService.saveCustomer(newC);
            nextState.customers = [newC, ...state.customers];
        } else if (type === 'PRODUCT_ADD') {
            const newP: Product = { id: `p-${Date.now()}`, name: formName, sku: 'M', stockCount: Number(formQty), unitPrice: Number(formPrice), purchasePrice: Number(formPrice)*0.7, vatRate: 0.2, category: formCategory || 'Genel' };
            await dbService.saveProduct(newP);
            nextState.products = [newP, ...state.products];
        }
        setState(nextState);
        setIsDrawerOpen(false);
        resetForms();
    } catch(e) { console.error(e); }
  };

  const resetForms = () => {
    setFormAmount(''); setFormQty('1'); setFormPrice(''); setFormName(''); setFormPhone(''); setFormAddress(''); setFormCategory('');
  };

  const handleQuickAction = (action: string) => {
    resetForms();
    if (action === 'SALE' || action === 'PURCHASE') { setManualTxType(action as any); setDrawerMode('manual_sale_purchase'); }
    else if (action === 'PAYMENT') setDrawerMode('manual_tx');
    else if (action === 'STOCK') setDrawerMode('stock_adjust');
    else if (action === 'CUSTOMER') setDrawerMode('customer_edit');
    setIsDrawerOpen(true);
  };

  const handleDashboardSubmit = async (query: string) => {
    setIsProcessingAI(true);
    setInitialChatValue(query);
    setActiveTab('chat');
    try {
      const response = await geminiService.processMessage(query, state, []);
      const draftIntents = ['SALE_RECORD', 'PURCHASE_RECORD', 'COLLECTION_RECORD', 'CUSTOMER_ADD', 'CUSTOMER_DELETE', 'PRODUCT_ADD', 'STOCK_ADJUST'];
      handleUpdateChat(query, response.intent || 'GENERAL_CHAT', { ...response.data, intent: response.intent }, response.message || "İşlem hazır.", !!response.intent);
    } catch (e) { console.error(e); } finally { setIsProcessingAI(false); }
  };

  const renderContent = () => {
    const commonClass = "page-transition max-w-6xl mx-auto pb-32 md:pb-12";

    if (viewMode === 'detail' && activeTab === 'customers' && selectedCustomer) {
      return (
        <CustomerDetail
          customer={selectedCustomer}
          transactions={state.transactions}
          onBack={() => { setViewMode('list'); setSelectedCustomer(null); }}
          onEdit={(customer) => { setSelectedCustomer(customer); }}
          onUpdate={async (customer) => {
            try {
              await dbService.saveCustomer(customer);
              setState(prev => ({
                ...prev,
                customers: prev.customers.map(c => c.id === customer.id ? customer : c)
              }));
              setSelectedCustomer(customer);
            } catch (err) {
              console.error('Cari güncelleme hatası:', err);
            }
          }}
          onDelete={async (id) => {
            try {
              const customers = state.customers.filter(c => c.id !== id);
              const transactions = state.transactions.filter(t => t.customerId !== id);
              await dbService.deleteCustomer(id);
              setState(prev => ({ ...prev, customers, transactions }));
              setViewMode('list');
              setSelectedCustomer(null);
            } catch (err) {
              console.error('Cari silme hatası:', err);
            }
          }}
          onNewTransaction={() => handleQuickAction('SALE')}
          onUpdateTransaction={async (transaction) => {
            try {
              await dbService.saveTransaction(transaction);
              const updatedTransactions = state.transactions.map(t => t.id === transaction.id ? transaction : t);
              const customer = state.customers.find(c => c.id === transaction.customerId);
              if (customer) {
                const updatedCustomer = { ...customer, balance: updatedTransactions.filter(t => t.customerId === customer.id).reduce((acc, t) => acc + (t.type === 'SALE' ? t.totalAmount : t.type === 'PAYMENT' ? -t.totalAmount : t.type === 'PURCHASE' ? -t.totalAmount : 0), 0) };
                await dbService.saveCustomer(updatedCustomer);
                setState(prev => ({
                  ...prev,
                  transactions: updatedTransactions,
                  customers: prev.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
                }));
                setSelectedCustomer(updatedCustomer);
              }
            } catch (err) {
              console.error('İşlem güncelleme hatası:', err);
            }
          }}
          onDeleteTransaction={async (id) => {
            try {
              const transaction = state.transactions.find(t => t.id === id);
              if (transaction) {
                const updatedTransactions = state.transactions.filter(t => t.id !== id);
                const customer = state.customers.find(c => c.id === transaction.customerId);
                if (customer) {
                  const updatedCustomer = { ...customer, balance: updatedTransactions.filter(t => t.customerId === customer.id).reduce((acc, t) => acc + (t.type === 'SALE' ? t.totalAmount : t.type === 'PAYMENT' ? -t.totalAmount : t.type === 'PURCHASE' ? -t.totalAmount : 0), 0) };
                  await dbService.saveCustomer(updatedCustomer);
                  await dbService.deleteTransaction(id);
                  setState(prev => ({
                    ...prev,
                    transactions: updatedTransactions,
                    customers: prev.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
                  }));
                  setSelectedCustomer(updatedCustomer);
                }
              }
            } catch (err) {
              console.error('İşlem silme hatası:', err);
            }
          }}
        />
      );
    }

    if (viewMode === 'detail' && activeTab === 'products' && selectedProduct) {
      return (
        <ProductDetail
          product={selectedProduct}
          transactions={state.transactions}
          customers={state.customers}
          onBack={() => { setViewMode('list'); setSelectedProduct(null); }}
          onEdit={(product) => { setSelectedProduct(product); }}
          onUpdate={async (product) => {
            try {
              await dbService.saveProduct(product);
              setState(prev => ({
                ...prev,
                products: prev.products.map(p => p.id === product.id ? product : p)
              }));
              setSelectedProduct(product);
            } catch (err) {
              console.error('Ürün güncelleme hatası:', err);
            }
          }}
          onDelete={async (id) => {
            try {
              const products = state.products.filter(p => p.id !== id);
              const transactions = state.transactions.filter(t => t.productId !== id);
              await dbService.deleteProduct(id);
              setState(prev => ({ ...prev, products, transactions }));
              setViewMode('list');
              setSelectedProduct(null);
            } catch (err) {
              console.error('Ürün silme hatası:', err);
            }
          }}
          onNewTransaction={() => {
            setSelectedCustomer(null);
            handleQuickAction('SALE');
          }}
          onStockAdjust={async (productId, newStock) => {
            try {
              const product = state.products.find(p => p.id === productId);
              if (product) {
                const updatedProduct = { ...product, stockCount: newStock };
                await dbService.saveProduct(updatedProduct);
                setState(prev => ({
                  ...prev,
                  products: prev.products.map(p => p.id === productId ? updatedProduct : p)
                }));
                setSelectedProduct(updatedProduct);
              }
            } catch (err) {
              console.error('Stok düzeltme hatası:', err);
            }
          }}
          onUpdateTransaction={async (transaction) => {
            try {
              await dbService.saveTransaction(transaction);
              const updatedTransactions = state.transactions.map(t => t.id === transaction.id ? transaction : t);
              const product = state.products.find(p => p.id === transaction.productId);
              if (product) {
                const updatedProduct = { ...product, stockCount: updatedTransactions.filter(t => t.productId === product.id).reduce((acc, t) => acc + (t.type === 'SALE' ? -(t.quantity || 0) : (t.quantity || 0)), product.stockCount) };
                await dbService.saveProduct(updatedProduct);
                setState(prev => ({
                  ...prev,
                  transactions: updatedTransactions,
                  products: prev.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
                }));
                setSelectedProduct(updatedProduct);
              }
            } catch (err) {
              console.error('İşlem güncelleme hatası:', err);
            }
          }}
          onDeleteTransaction={async (id) => {
            try {
              const transaction = state.transactions.find(t => t.id === id);
              if (transaction) {
                const updatedTransactions = state.transactions.filter(t => t.id !== id);
                const product = state.products.find(p => p.id === transaction.productId);
                if (product) {
                  const updatedProduct = { ...product, stockCount: updatedTransactions.filter(t => t.productId === product.id).reduce((acc, t) => acc + (t.type === 'SALE' ? -(t.quantity || 0) : (t.quantity || 0)), product.stockCount) };
                  await dbService.saveProduct(updatedProduct);
                  await dbService.deleteTransaction(id);
                  setState(prev => ({
                    ...prev,
                    transactions: updatedTransactions,
                    products: prev.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
                  }));
                  setSelectedProduct(updatedProduct);
                }
              }
            } catch (err) {
              console.error('İşlem silme hatası:', err);
            }
          }}
        />
      );
    }

    if (activeTab === 'dashboard' && viewMode === 'transactions') {
        const filteredTxs = state.transactions.filter(t => txFilter === 'ALL' || t.type === txFilter);
        return (
          <div className={commonClass}>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                   <button onClick={() => setViewMode('list')} className="text-slate-400 font-black text-[10px] uppercase mb-4 tracking-widest">← Panel</button>
                   <h2 className="text-4xl font-black text-slate-900 dark:text-white">İşlem Defteri</h2>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                   {(['ALL', 'SALE', 'PURCHASE', 'PAYMENT'] as const).map(f => (
                      <button key={f} onClick={() => setTxFilter(f)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${txFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{f === 'ALL' ? 'Tümü' : f === 'SALE' ? 'Satış' : f === 'PURCHASE' ? 'Alış' : 'Tahsilat'}</button>
                   ))}
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                {filteredTxs.map(t => (
                  <div
                    key={t.id}
                    className="p-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      const c = state.customers.find(x => x.id === t.customerId);
                      if (c) {
                        setSelectedProduct(null);
                        setSelectedCustomer(c);
                        setViewMode('detail');
                        setActiveTab('customers');
                      }
                    }}
                  >
                     <div className="flex items-center space-x-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${t.type === 'SALE' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{t.type[0]}</div>
                        <div>
                          <p className="font-black text-lg text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">{t.customerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{t.productName || 'Nakit'} • {new Date(t.date).toLocaleDateString('tr-TR')}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={`text-2xl font-black ${t.type === 'SALE' ? 'text-slate-900 dark:text-white' : 'text-emerald-600'}`}>₺{t.totalAmount.toLocaleString('tr-TR')}</p>
                        {t.quantity && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.quantity} Adet</p>}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} onAskAI={handleDashboardSubmit} onStartTyping={(c) => { setInitialChatValue(c); setActiveTab('chat'); }} isProcessing={isProcessingAI} onOpenQuickAction={handleQuickAction} onViewTransactions={() => setViewMode('transactions')} onViewAnalysis={() => setActiveTab('analysis')} onSelectCustomer={(id) => { const c = state.customers.find(x => x.id === id); if(c) { setSelectedCustomer(c); setViewMode('detail'); setActiveTab('customers'); } }} />;
      case 'analysis': return <div className={commonClass}><AnalysisView state={state} /></div>;
      case 'chat': return <div className="h-[calc(100vh-8rem)]"><ChatInterface state={state} initialValue={initialChatValue} onUpdateState={handleUpdateChat} onAddUserMessage={(m) => { const s = state.chatSessions.find(x => x.id === state.currentChatId); if(s) s.messages.push({role:'user', content:m, timestamp:Date.now()}); }} onNewChat={() => {}} onSelectChat={(id) => setState(p=>({...p, currentChatId:id}))} onConfirmDraft={handleConfirmDraft} /></div>;
      case 'customers': return <div className={commonClass}><CustomerList customers={state.customers} onSelect={(id) => { const c = state.customers.find(x => x.id === id); if(c) { setSelectedCustomer(c); setViewMode('detail'); setActiveTab('customers'); } }} onAddNew={() => handleQuickAction('CUSTOMER')} onManualSale={() => handleQuickAction('SALE')} /></div>;
      case 'products': return <div className={commonClass}><ProductList products={state.products} onSelect={(p) => { setSelectedProduct(p); setViewMode('detail'); setActiveTab('products'); }} onAddNew={() => handleQuickAction('PRODUCT')} onManualSale={() => handleQuickAction('SALE')} /></div>;
      case 'profile': return <div className={commonClass}><Profile profile={state.profile} onEdit={() => {}} /></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-slate-950 transition-colors">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} businessName={state.profile.name} />
      <main className="pt-10 md:pt-36 px-4 md:px-8 pb-32">{renderContent()}</main>
      <MobileNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-slate-900/5 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-lg"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
      
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="İşlem Yap">
        <div className="space-y-8">
            {selectedCustomer && (
                <>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">İşlem Tipi</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                        {(['SALE', 'PURCHASE', 'PAYMENT'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setManualTxType(type)}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                              manualTxType === type
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500'
                            }`}
                          >
                            {type === 'SALE' ? 'Satış' : type === 'PURCHASE' ? 'Alış' : 'Tahsilat'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Cari</label>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-bold text-slate-900 dark:text-white">
                        {selectedCustomer.name}
                      </div>
                    </div>

                    {manualTxType !== 'PAYMENT' && (
                        <>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Ürün</label>
                              <select
                                value={formSelectedProductId}
                                onChange={e => {
                                  setFormSelectedProductId(e.target.value);
                                  const product = state.products.find(p => p.id === e.target.value);
                                  if (product) {
                                    setFormName(product.name);
                                    setFormPrice(product.unitPrice.toString());
                                  }
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-bold border-none dark:text-white"
                              >
                                <option value="">Ürün Seçiniz...</option>
                                {state.products.map(p => <option key={p.id} value={p.id}>{p.name} (₺{p.unitPrice.toLocaleString('tr-TR')})</option>)}
                              </select>
                            </div>

                            <div><label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Ürün Adı (veya yeni yazın)</label><input type="text" value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Ürün adı..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-bold border-none dark:text-white" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Miktar</label><input type="number" value={formQty} onChange={e=>setFormQty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border-none dark:text-white" /></div>
                                <div><label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Birim Fiyat</label><input type="number" value={formPrice} onChange={e=>setFormPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border-none dark:text-white" /></div>
                            </div>
                        </>
                    )}

                    {manualTxType === 'PAYMENT' && (
                        <div><label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Tahsil Edilen (₺)</label><input type="number" value={formAmount} onChange={e=>setFormAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xl font-black outline-none border-none dark:text-white" /></div>
                    )}

                    <button onClick={() => handleManualTxSubmit(manualTxType)} className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-white shadow-xl ${
                        manualTxType === 'SALE' ? 'bg-blue-600 hover:bg-blue-700' :
                        manualTxType === 'PURCHASE' ? 'bg-red-500 hover:bg-red-600' :
                        'bg-emerald-600 hover:bg-emerald-700'
                    } transition-all`}>
                        {manualTxType === 'SALE' ? 'Satışı Kaydet' : manualTxType === 'PURCHASE' ? 'Alışı Kaydet' : 'Tahsilatı Kaydet'}
                    </button>
                </>
            )}
        </div>
      </SideDrawer>
    </div>
  );
};

export default App;
