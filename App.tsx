
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { INITIAL_STATE } from './constants';
import { BusinessState, Transaction, Customer, Product, ChatSession, BusinessProfile, ChatMessage, DashboardInsight } from './types';
import Header from './components/Header';
import MobileNavBar from './components/MobileNavBar';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import ProductList from './components/ProductList';
import ChatInterface from './components/ChatInterface';
import SideDrawer from './components/SideDrawer';
import Profile from './components/Profile'; 
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<BusinessState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'customer' | 'product' | 'tahsilat' | 'stok_alimi'>('customer');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [initialChatValue, setInitialChatValue] = useState('');
  
  // Controls availability of the Floating Button
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  // Controls the Visibility of the Popup Chat Window
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);

  // Detail View state
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [editCustomer, setEditCustomer] = useState<Partial<Customer>>({});
  const [editProduct, setEditProduct] = useState<Partial<Product>>({});
  
  // Manual transaction states
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [targetCustomerId, setTargetCustomerId] = useState<string | null>(null);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);

  const handleStartTyping = (char: string) => {
    setInitialChatValue(char);
    setActiveTab('chat');
  };

  const handleDashboardSubmit = async (query: string) => {
    setIsProcessingAI(true);
    try {
      const response = await geminiService.processMessage(query, state, []);
      if (response.intent === 'DASHBOARD_INSIGHT' && response.data?.insights) {
        setState(prev => ({ ...prev, dashboardInsights: response.data.insights }));
      } else {
        setInitialChatValue(query);
        setActiveTab('chat');
        handleUpdateChat(query, response.intent || 'GENERAL_CHAT', response.data || {}, response.message || response.text || "", response.intent?.includes('_RECORD'));
      }
    } catch (error) {
      console.error(error);
      setActiveTab('chat');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleUpdateChat = useCallback((userMessage: string, intent: string, data: any, aiMessage: string, isDraft: boolean) => {
    setState(prev => {
      const updatedSessions: ChatSession[] = prev.chatSessions.map(s => {
        if (s.id === prev.currentChatId) {
          const newMessages: ChatMessage[] = [...s.messages];
          if (userMessage) {
            newMessages.push({ role: 'user' as const, content: userMessage, timestamp: Date.now() });
          }
          newMessages.push({ 
            role: 'assistant' as const, 
            content: aiMessage, 
            timestamp: Date.now(), 
            draft: isDraft ? data : undefined,
            confirmed: false
          });
          return { ...s, messages: newMessages, lastUpdate: Date.now() };
        }
        return s;
      });
      return { ...prev, chatSessions: updatedSessions };
    });
  }, []);

  const handleAddUserMessage = (msg: string) => {
    setState(prev => {
      const updatedSessions = prev.chatSessions.map(s => {
        if (s.id === prev.currentChatId) {
          return {
            ...s,
            messages: [...s.messages, { role: 'user' as const, content: msg, timestamp: Date.now() }],
            lastUpdate: Date.now()
          };
        }
        return s;
      });
      return { ...prev, chatSessions: updatedSessions };
    });
  };

  const handleConfirmDraft = (messageIndex: number) => {
    const session = state.chatSessions.find(s => s.id === state.currentChatId);
    if (!session) return;
    const message = session.messages[messageIndex];
    if (!message || !message.draft) return;
    const data = message.draft;
    const isSale = message.content.toLowerCase().includes('sat') || message.draft.intent === 'SALE_RECORD';

    setState(prev => {
      const newState = { ...prev };
      const product = prev.products.find(p => p.name.toLowerCase().includes(data.productName.toLowerCase())) || prev.products[0];
      const customer = prev.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase())) || prev.customers[0];
      const quantity = data.quantity || 1;
      const unitPrice = data.price || (isSale ? product.unitPrice : product.purchasePrice);
      const totalAmount = unitPrice * quantity * (1 + product.vatRate);
      
      const newTx: Transaction = {
        id: Date.now().toString(),
        customerId: customer.id,
        productId: product.id,
        productName: product.name,
        customerName: customer.name,
        quantity: quantity,
        totalAmount: totalAmount,
        vatAmount: totalAmount * product.vatRate,
        date: new Date().toISOString(),
        type: isSale ? 'SALE' : 'PURCHASE',
        paymentStatus: 'PENDING'
      };
      newState.transactions = [newTx, ...prev.transactions];
      newState.customers = prev.customers.map(c => c.id === customer.id ? { ...c, balance: c.balance + (isSale ? totalAmount : -totalAmount) } : c);
      newState.products = prev.products.map(p => p.id === product.id ? { ...p, stockCount: p.stockCount + (isSale ? -quantity : quantity) } : p);
      newState.chatSessions = prev.chatSessions.map(s => {
        if (s.id === prev.currentChatId) {
          const newMessages = [...s.messages];
          newMessages[messageIndex] = { ...newMessages[messageIndex], confirmed: true };
          return { ...s, messages: newMessages };
        }
        return s;
      });
      return newState;
    });
  };

  const handleSaveCustomer = () => {
    if (!editCustomer.name) return alert("Cari adı zorunludur.");
    setState(prev => {
      const exists = prev.customers.find(c => c.id === editCustomer.id);
      if (exists) {
        return { ...prev, customers: prev.customers.map(c => c.id === editCustomer.id ? { ...c, ...editCustomer } as Customer : c) };
      } else {
        const newCustomer: Customer = { 
          id: Date.now().toString(), 
          name: editCustomer.name || '', 
          balance: editCustomer.balance || 0, 
          taxNumber: editCustomer.taxNumber, 
          taxOffice: editCustomer.taxOffice, 
          phone: editCustomer.phone, 
          address: editCustomer.address 
        };
        return { ...prev, customers: [newCustomer, ...prev.customers] };
      }
    });
    setIsDrawerOpen(false);
  };

  const handleSaveProduct = () => {
    if (!editProduct.name) return alert("Ürün adı zorunludur.");
    setState(prev => {
      const exists = prev.products.find(p => p.id === editProduct.id);
      if (exists) {
        return { ...prev, products: prev.products.map(p => p.id === editProduct.id ? { ...p, ...editProduct } as Product : p) };
      } else {
        const newProduct: Product = { 
          id: Date.now().toString(), 
          name: editProduct.name || '', 
          sku: editProduct.sku || `SKU-${Date.now()}`, 
          stockCount: Number(editProduct.stockCount) || 0, 
          unitPrice: Number(editProduct.unitPrice) || 0, 
          purchasePrice: Number(editProduct.purchasePrice) || 0, 
          vatRate: 0.20, 
          category: editProduct.category || 'Genel' 
        };
        return { ...prev, products: [newProduct, ...prev.products] };
      }
    });
    setIsDrawerOpen(false);
  };

  const handleManualPayment = () => {
    if (!targetCustomerId || manualAmount <= 0) return;
    const customer = state.customers.find(c => c.id === targetCustomerId);
    if (!customer) return;

    setState(prev => ({
      ...prev,
      transactions: [{
        id: `pay-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        totalAmount: manualAmount,
        date: new Date().toISOString(),
        type: 'PAYMENT',
        paymentStatus: 'PAID',
        note: 'Manuel Tahsilat'
      }, ...prev.transactions],
      customers: prev.customers.map(c => c.id === targetCustomerId ? { ...c, balance: c.balance - manualAmount } : c)
    }));
    setIsDrawerOpen(false);
    setManualAmount(0);
  };

  const handleManualStockEntry = () => {
    if (!targetProductId || manualAmount <= 0) return;
    const product = state.products.find(p => p.id === targetProductId);
    if (!product) return;

    setState(prev => ({
      ...prev,
      transactions: [{
        id: `stk-${Date.now()}`,
        customerId: '1',
        customerName: 'Stok Girişi',
        productId: product.id,
        productName: product.name,
        quantity: manualAmount,
        totalAmount: manualAmount * product.purchasePrice,
        date: new Date().toISOString(),
        type: 'PURCHASE',
        paymentStatus: 'PAID',
        note: 'Manuel Stok Alımı'
      }, ...prev.transactions],
      products: prev.products.map(p => p.id === targetProductId ? { ...p, stockCount: p.stockCount + manualAmount } : p)
    }));
    setIsDrawerOpen(false);
    setManualAmount(0);
  };

  const handlePrint = (type: 'label' | 'statement', customer: Partial<Customer>) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const txs = state.transactions.filter(t => t.customerId === customer.id);
    const content = `
      <html><head><title>${type === 'statement' ? 'Ekstre' : 'Etiket'}</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }.header { border-bottom: 3px solid #1A237E; padding-bottom: 20px; margin-bottom: 30px; }.label-card { border: 5px solid #1e293b; padding: 50px; border-radius: 30px; text-align: center; max-width: 600px; margin: 40px auto; }table { width: 100%; border-collapse: collapse; margin-top: 30px; }th { text-align: left; padding: 15px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; font-weight: 900; }td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }.total { text-align: right; margin-top: 40px; font-size: 24px; font-weight: 900; }</style></head>
      <body><div class="header"><h1>${state.profile.name}</h1><p>${state.profile.address}</p></div>
      ${type === 'label' ? `<div class="label-card"><p style="font-size: 10px; color: #94a3b8; font-weight: 900; letter-spacing: 2px;">SEVK ADRESİ</p><h2>${customer.name}</h2><p style="font-size: 20px; border-top: 1px dashed #ccc; margin-top: 20px; padding-top: 20px;">${customer.address}</p></div>` : `<h3>${customer.name} - Ekstre</h3><table><thead><tr><th>Tarih</th><th>Detay</th><th>Tutar</th></tr></thead><tbody>${txs.map(t=>`<tr><td>${new Date(t.date).toLocaleDateString()}</td><td>${t.productName || t.note}</td><td>₺${t.totalAmount}</td></tr>`).join('')}</tbody></table><div class="total">Bakiye: ₺${customer.balance}</div>`}
      <script>window.onload=()=>window.print();</script></body></html>`;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const renderContent = () => {
    const commonClass = "page-transition max-w-6xl mx-auto pb-24 md:pb-0";
    
    if (viewMode === 'detail') {
      if (selectedCustomer) {
        const customerTxs = state.transactions.filter(t => t.customerId === selectedCustomer.id);
        return (
          <div className={`${commonClass}`}>
            <div className="flex justify-between items-center mb-12">
               <button onClick={() => setViewMode('list')} className="flex items-center text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">
                 <span className="mr-2 text-xl">←</span> Listeye Dön
               </button>
               <div className="flex space-x-2 md:space-x-3">
                 <button onClick={() => handlePrint('statement', selectedCustomer)} className="hidden md:block px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase hover:bg-slate-50">Ekstre Yazdır</button>
                 <button onClick={() => handlePrint('label', selectedCustomer)} className="hidden md:block px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase hover:bg-slate-50">Adres Yazdır</button>
                 <button onClick={() => { setTargetCustomerId(selectedCustomer.id); setDrawerMode('tahsilat'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-emerald-700">Tahsilat</button>
                 <button onClick={() => { setEditCustomer(selectedCustomer); setDrawerMode('customer'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase hover:bg-blue-900 transition-colors">Düzenle</button>
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
               <div className="lg:col-span-1">
                  <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bakiye</p>
                    <p className={`text-4xl md:text-6xl font-black tracking-tighter ${selectedCustomer.balance > 0 ? 'text-emerald-600' : selectedCustomer.balance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                      ₺{selectedCustomer.balance.toLocaleString('tr-TR')}
                    </p>
                    <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                       <p className="font-bold text-slate-900">{selectedCustomer.name}</p>
                       <p className="text-sm font-medium text-slate-500">{selectedCustomer.address || 'Adres Kaydı Yok'}</p>
                       <div className="flex space-x-2 md:hidden pt-4">
                          <button onClick={() => handlePrint('statement', selectedCustomer)} className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold uppercase">Ekstre</button>
                          <button onClick={() => handlePrint('label', selectedCustomer)} className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold uppercase">Etiket</button>
                       </div>
                    </div>
                  </div>
               </div>
               <div className="lg:col-span-2">
                  <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50"><h3 className="font-black text-lg text-slate-900">Hareketler</h3></div>
                    <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                       {customerTxs.map(t => (
                         <div key={t.id} className="p-6 md:p-8 flex items-center justify-between">
                            <div className="flex items-center space-x-4 md:space-x-6">
                               <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm md:text-base ${t.type === 'SALE' ? 'bg-emerald-50 text-emerald-600' : t.type === 'PAYMENT' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{t.type[0]}</div>
                               <div><p className="font-black text-slate-900 text-sm md:text-base">{t.productName || t.note}</p><p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('tr-TR')}</p></div>
                            </div>
                            <div className="text-right"><p className="font-black text-lg md:text-xl">₺{t.totalAmount}</p></div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        );
      }
      if (selectedProduct) {
        const productTxs = state.transactions.filter(t => t.productId === selectedProduct.id);
        return (
          <div className={`${commonClass}`}>
            <div className="flex justify-between items-center mb-12">
               <button onClick={() => setViewMode('list')} className="flex items-center text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">
                 <span className="mr-2 text-xl">←</span> Listeye Dön
               </button>
               <div className="flex space-x-3">
                 <button onClick={() => { setTargetProductId(selectedProduct.id); setDrawerMode('stok_alimi'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase hover:bg-slate-50">Stok Al</button>
                 <button onClick={() => { setEditProduct(selectedProduct); setDrawerMode('product'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase hover:bg-blue-900 transition-colors">Düzenle</button>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
               <div className="lg:col-span-1">
                  <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">{selectedProduct.name}</h2>
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mt-8">
                       <div className="bg-slate-50 p-4 md:p-6 rounded-3xl"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stok</p><p className={`text-2xl md:text-3xl font-black ${selectedProduct.stockCount < 20 ? 'text-red-500' : 'text-slate-900'}`}>{selectedProduct.stockCount}</p></div>
                       <div className="bg-slate-50 p-4 md:p-6 rounded-3xl"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiyat</p><p className="text-2xl md:text-3xl font-black text-[#1A237E]">₺{selectedProduct.unitPrice}</p></div>
                    </div>
                  </div>
               </div>
               <div className="lg:col-span-2">
                  <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50"><h3 className="font-black text-lg text-slate-900">Ürün Geçmişi</h3></div>
                    <div className="divide-y divide-slate-50">
                       {productTxs.map(t => (
                         <div key={t.id} className="p-6 md:p-8 flex items-center justify-between">
                            <div className="flex items-center space-x-4 md:space-x-6">
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm md:text-base ${t.type === 'SALE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{t.type[0]}</div>
                              <div><p className="font-black text-slate-900 text-sm md:text-base">{t.customerName}</p><p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('tr-TR')}</p></div>
                            </div>
                            <div className="text-right"><p className="font-black text-lg md:text-xl">{t.type === 'SALE' ? '-' : '+'}{t.quantity} Adet</p></div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        );
      }
    }

    switch (activeTab) {
      case 'dashboard': return <div key="dashboard" className={commonClass}><Dashboard state={state} onAskAI={handleDashboardSubmit} onStartTyping={handleStartTyping} isProcessing={isProcessingAI} /></div>;
      
      // FIXED: Adjusted height calculation for Desktop Chat to fit perfectly without window scroll
      case 'chat': return (
        <div key="chat" className="page-transition h-[calc(100vh-6rem)] md:h-[calc(100vh-10rem)] -mt-4 md:mt-0 pb-0">
           <ChatInterface state={state} initialValue={initialChatValue} onUpdateState={handleUpdateChat} onAddUserMessage={handleAddUserMessage} onNewChat={() => {}} onSelectChat={(id) => setState(p=>({...p, currentChatId:id}))} onConfirmDraft={handleConfirmDraft} />
        </div>
      );
      
      case 'customers': return <div key="customers" className={commonClass}><CustomerList customers={state.customers} onSelect={(id) => { const c = state.customers.find(c=>c.id===id); if(c){ setSelectedCustomer(c); setViewMode('detail'); } }} onAddNew={() => { setEditCustomer({name:''}); setDrawerMode('customer'); setIsDrawerOpen(true); }} /></div>;
      case 'profile': return <div key="profile" className={commonClass}><Profile profile={state.profile} /></div>;
      case 'products': 
        return (
          <div key="products" className={commonClass}>
            <ProductList 
                products={state.products} 
                onSelect={(p) => { setSelectedProduct(p); setViewMode('detail'); }} 
                onAddNew={() => { setEditProduct({name:'', stockCount:0}); setDrawerMode('product'); setIsDrawerOpen(true); }}
            />
          </div>
        );
      default: return null;
    }
  };

  useEffect(() => {
    setViewMode('list');
    setSelectedCustomer(null);
    setSelectedProduct(null);
    
    // Logic for Floating Button visibility
    if (activeTab !== 'chat') {
        setShowFloatingButton(true);
    } else {
        setShowFloatingButton(false);
        setIsChatPopupOpen(false);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} businessName={state.profile.name} />
      
      {/* 
        The top padding here pushes the content down. 
        For Chat, we want fixed behavior, for others we want scroll.
        The shrinking header works via window scroll on dashboard/lists.
      */}
      <main className="pt-8 md:pt-36 px-4 md:px-8 pb-32">{renderContent()}</main>

      {/* Floating Mini Chat BUTTON (Desktop only or when needed) */}
      {showFloatingButton && !isChatPopupOpen && (
          <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[999] floating-chat-enter">
            <div className="relative group">
              <div 
                onClick={() => setIsChatPopupOpen(true)}
                className="w-14 h-14 md:w-16 md:h-16 bg-[#1A237E] rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform active:scale-95 shadow-blue-900/40 relative z-20"
              >
                <span className="text-white text-xl md:text-2xl">🧠</span>
                <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
      )}

      {/* POPUP CHAT WINDOW */}
      {isChatPopupOpen && (
          <div className="fixed bottom-24 right-4 md:right-8 w-[calc(100%-2rem)] md:w-96 h-[500px] md:h-[550px] bg-white rounded-[32px] shadow-2xl border border-slate-100 z-[999] animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col overflow-hidden">
             <ChatInterface 
                state={state} 
                initialValue={initialChatValue} 
                onUpdateState={handleUpdateChat} 
                onAddUserMessage={handleAddUserMessage} 
                onNewChat={() => {}} 
                onSelectChat={(id) => setState(p=>({...p, currentChatId:id}))} 
                onConfirmDraft={handleConfirmDraft}
                isPopup={true}
             />
             <button 
                onClick={() => setIsChatPopupOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors z-[1000]"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
      )}

      {/* Mobile Navigation Bar */}
      <MobileNavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={drawerMode === 'customer' ? 'Müşteri Kaydı' : drawerMode === 'product' ? 'Ürün Kaydı' : drawerMode === 'tahsilat' ? 'Tahsilat Girişi' : 'Stok Alımı'}>
         {/* Drawer Content - Unchanged */}
         {drawerMode === 'customer' ? (
           <div className="space-y-10">
              <div className="space-y-6">
                <input className="w-full text-2xl font-bold border-b-2 border-slate-100 focus:border-blue-600 py-3 outline-none" value={editCustomer.name || ''} onChange={e => setEditCustomer({...editCustomer, name: e.target.value})} placeholder="Ünvan" />
                <div className="grid grid-cols-2 gap-4">
                  <input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={editCustomer.taxNumber || ''} onChange={e => setEditCustomer({...editCustomer, taxNumber: e.target.value})} placeholder="Vergi No" />
                  <input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={editCustomer.phone || ''} onChange={e => setEditCustomer({...editCustomer, phone: e.target.value})} placeholder="Telefon" />
                </div>
                <textarea className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-medium" rows={3} placeholder="Adres" value={editCustomer.address || ''} onChange={e => setEditCustomer({...editCustomer, address: e.target.value})} />
              </div>
              <div className="flex space-x-4">
                <button onClick={() => { if(editCustomer.id) {setTargetCustomerId(editCustomer.id!); setDrawerMode('tahsilat');} else {alert('Önce kaydı tamamlayın');} }} className="flex-1 py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50">Ödeme Al</button>
                <button onClick={handleSaveCustomer} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#1A237E] shadow-xl">Kaydet</button>
              </div>
           </div>
         ) : drawerMode === 'product' ? (
           <div className="space-y-10">
              <div className="space-y-6">
               <input className="w-full text-2xl font-bold border-b-2 border-slate-100 focus:border-[#1A237E] py-3 outline-none" value={editProduct.name || ''} onChange={e => setEditProduct({...editProduct, name: e.target.value})} placeholder="Ürün Adı" />
               <div className="grid grid-cols-2 gap-4">
                 <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={editProduct.unitPrice || ''} onChange={e => setEditProduct({...editProduct, unitPrice: Number(e.target.value)})} placeholder="Satış" />
                 <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={editProduct.stockCount || ''} onChange={e => setEditProduct({...editProduct, stockCount: Number(e.target.value)})} placeholder="Stok" />
               </div>
               <input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={editProduct.category || ''} onChange={e => setEditProduct({...editProduct, category: e.target.value})} placeholder="Kategori" />
             </div>
             <button onClick={handleSaveProduct} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-[#1A237E]">{editProduct.id ? 'Güncelle' : 'Ekle'}</button>
           </div>
         ) : drawerMode === 'tahsilat' ? (
           <div className="space-y-10">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ödeme Alınan Cari</p><p className="text-2xl font-black text-slate-900">{state.customers.find(c=>c.id===targetCustomerId)?.name}</p></div>
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alınan Tutar (₺)</label>
                <input type="number" autoFocus className="w-full text-6xl font-black border-none bg-transparent outline-none tracking-tighter" value={manualAmount} onChange={e => setManualAmount(Number(e.target.value))} />
              </div>
              <button onClick={handleManualPayment} className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-emerald-700">Tahsilatı Tamamla</button>
           </div>
         ) : drawerMode === 'stok_alimi' ? (
           <div className="space-y-10">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stok Alınan Ürün</p><p className="text-2xl font-black text-slate-900">{state.products.find(p=>p.id===targetProductId)?.name}</p></div>
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alınan Miktar (Adet)</label>
                <input type="number" autoFocus className="w-full text-6xl font-black border-none bg-transparent outline-none tracking-tighter" value={manualAmount} onChange={e => setManualAmount(Number(e.target.value))} />
              </div>
              <button onClick={handleManualStockEntry} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-900">Stok Girişini Yap</button>
           </div>
         ) : (
           <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Form Detayları...</div>
         )}
      </SideDrawer>
    </div>
  );
};

export default App;
