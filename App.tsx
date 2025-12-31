
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

const App: React.FC = () => {
  const [state, setState] = useState<BusinessState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'customer' | 'product' | 'tahsilat' | 'stok_alimi' | 'profile' | 'manual_sale'>('customer');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [initialChatValue, setInitialChatValue] = useState('');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [editCustomer, setEditCustomer] = useState<Partial<Customer>>({});
  const [editProduct, setEditProduct] = useState<Partial<Product>>({});
  const [editProfile, setEditProfile] = useState<Partial<BusinessProfile>>({});
  
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualQuantity, setManualQuantity] = useState<number>(1);
  const [targetCustomerId, setTargetCustomerId] = useState<string | null>(null);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        await dbService.init();
        const loadedState = await dbService.seedData();
        setState(loadedState);
      } catch (err) {
        console.error("DB Init Error:", err);
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

  // Navigasyon Yardımcıları
  const showCustomerDetail = (customer: Customer) => {
    setSelectedProduct(null);
    setSelectedCustomer(customer);
    setViewMode('detail');
    setActiveTab('customers');
  };

  const showProductDetail = (product: Product) => {
    setSelectedCustomer(null);
    setSelectedProduct(product);
    setViewMode('detail');
    setActiveTab('products');
  };

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

  const handleUpdateChat = useCallback(async (userMessage: string, intent: string, data: any, aiMessage: string, isDraft: boolean) => {
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
          
          const updatedSession = { ...s, messages: newMessages, lastUpdate: Date.now() };
          dbService.saveChatSession(updatedSession).catch(console.error);
          return updatedSession;
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
          const updatedSession = {
            ...s,
            messages: [...s.messages, { role: 'user' as const, content: msg, timestamp: Date.now() }],
            lastUpdate: Date.now()
          };
          dbService.saveChatSession(updatedSession).catch(console.error);
          return updatedSession;
        }
        return s;
      });
      return { ...prev, chatSessions: updatedSessions };
    });
  };

  const handleConfirmDraft = async (messageIndex: number) => {
    const session = state.chatSessions.find(s => s.id === state.currentChatId);
    if (!session) return;
    const message = session.messages[messageIndex];
    if (!message || !message.draft) return;
    
    const data = message.draft;
    const isSale = data.intent === 'SALE_RECORD' || (!data.intent && message.content.toLowerCase().includes('sat'));

    const draftProductName = (data.productName || "").toLowerCase();
    let product = state.products.find(p => p.name.toLowerCase().includes(draftProductName));
    
    if (!product) {
       product = state.products.length > 0 ? state.products[0] : { id: 'unknown', name: 'Genel Ürün', stockCount: 0, unitPrice: 0, purchasePrice: 0, vatRate: 0.20, sku: 'UNK', category: 'Genel' };
    }

    const draftCustomerName = (data.customerName || "").toLowerCase();
    let customer = state.customers.find(c => c.name.toLowerCase().includes(draftCustomerName));
    
    if (!customer) {
        customer = state.customers.length > 0 ? state.customers[0] : { id: 'unknown', name: 'Genel Müşteri', balance: 0 };
    }

    const quantity = Number(data.quantity) || 1;
    const unitPrice = data.price ? Number(data.price) : (isSale ? product.unitPrice : product.purchasePrice);
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

    const updatedCustomer: Customer = {
        ...customer,
        balance: customer.balance + (isSale ? totalAmount : -totalAmount)
    };

    const updatedProduct: Product = {
        ...product,
        stockCount: product.stockCount + (isSale ? -quantity : quantity)
    };

    await Promise.all([
        dbService.saveTransaction(newTx),
        dbService.saveCustomer(updatedCustomer),
        dbService.saveProduct(updatedProduct)
    ]);

    setState(prev => {
        const newChatSessions = prev.chatSessions.map(s => {
            if (s.id === prev.currentChatId) {
                const newMessages = [...s.messages];
                newMessages[messageIndex] = { ...newMessages[messageIndex], confirmed: true };
                const updatedSession = { ...s, messages: newMessages };
                dbService.saveChatSession(updatedSession);
                return updatedSession;
            }
            return s;
        });

        return {
            ...prev,
            transactions: [newTx, ...prev.transactions],
            customers: prev.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c),
            products: prev.products.map(p => p.id === updatedProduct.id ? updatedProduct : p),
            chatSessions: newChatSessions
        };
    });
  };

  const handleSaveCustomer = async () => {
    if (!editCustomer.name) return alert("Cari adı zorunludur.");
    let updatedCustomer: Customer;
    if (editCustomer.id) {
        const existing = state.customers.find(c => c.id === editCustomer.id);
        updatedCustomer = { ...existing, ...editCustomer } as Customer;
    } else {
        updatedCustomer = { 
          id: Date.now().toString(), 
          name: editCustomer.name || '', 
          balance: editCustomer.balance || 0, 
          taxNumber: editCustomer.taxNumber, 
          taxOffice: editCustomer.taxOffice, 
          phone: editCustomer.phone, 
          address: editCustomer.address 
        };
    }
    await dbService.saveCustomer(updatedCustomer);
    setState(prev => {
      const exists = prev.customers.find(c => c.id === updatedCustomer.id);
      if (exists) {
        return { ...prev, customers: prev.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c) };
      } else {
        return { ...prev, customers: [updatedCustomer, ...prev.customers] };
      }
    });
    setIsDrawerOpen(false);
  };

  const handleSaveProduct = async () => {
    if (!editProduct.name) return alert("Ürün adı zorunludur.");
    let updatedProduct: Product;
    if (editProduct.id) {
        const existing = state.products.find(p => p.id === editProduct.id);
        updatedProduct = { ...existing, ...editProduct } as Product;
    } else {
        updatedProduct = { 
          id: Date.now().toString(), 
          name: editProduct.name || '', 
          sku: editProduct.sku || `SKU-${Date.now()}`, 
          stockCount: Number(editProduct.stockCount) || 0, 
          unitPrice: Number(editProduct.unitPrice) || 0, 
          purchasePrice: Number(editProduct.purchasePrice) || 0, 
          vatRate: 0.20, 
          category: editProduct.category || 'Genel' 
        };
    }
    await dbService.saveProduct(updatedProduct);
    setState(prev => {
      const exists = prev.products.find(p => p.id === updatedProduct.id);
      if (exists) {
        return { ...prev, products: prev.products.map(p => p.id === updatedProduct.id ? updatedProduct : p) };
      } else {
        return { ...prev, products: [updatedProduct, ...prev.products] };
      }
    });
    setIsDrawerOpen(false);
  };

  const handleSaveProfile = async () => {
    if (!editProfile.name) return alert("İşletme adı zorunludur.");
    const updatedProfile = { ...state.profile, ...editProfile } as BusinessProfile;
    await dbService.saveProfile(updatedProfile);
    setState(prev => ({ ...prev, profile: updatedProfile }));
    setIsDrawerOpen(false);
  };

  const handleManualPayment = async () => {
    if (!targetCustomerId || manualAmount <= 0) return;
    const customer = state.customers.find(c => c.id === targetCustomerId);
    if (!customer) return;
    const newTx: Transaction = {
        id: `pay-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        totalAmount: manualAmount,
        date: new Date().toISOString(),
        type: 'PAYMENT',
        paymentStatus: 'PAID',
        note: 'Manuel Tahsilat'
    };
    const updatedCustomer = { ...customer, balance: customer.balance - manualAmount };
    await Promise.all([dbService.saveTransaction(newTx), dbService.saveCustomer(updatedCustomer)]);
    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      customers: prev.customers.map(c => c.id === targetCustomerId ? updatedCustomer : c)
    }));
    setIsDrawerOpen(false);
    setManualAmount(0);
  };

  const handleManualStockEntry = async () => {
    if (!targetProductId || manualAmount <= 0) return;
    const product = state.products.find(p => p.id === targetProductId);
    if (!product) return;
    const newTx: Transaction = {
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
    };
    const updatedProduct = { ...product, stockCount: product.stockCount + manualAmount };
    await Promise.all([dbService.saveTransaction(newTx), dbService.saveProduct(updatedProduct)]);
    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      products: prev.products.map(p => p.id === targetProductId ? updatedProduct : p)
    }));
    setIsDrawerOpen(false);
    setManualAmount(0);
  };

  const handleCompleteManualSale = async () => {
    if (!targetCustomerId || !targetProductId || manualQuantity <= 0 || manualAmount <= 0) return alert("Eksik bilgileri doldurun.");
    const customer = state.customers.find(c => c.id === targetCustomerId);
    const product = state.products.find(p => p.id === targetProductId);
    if (!customer || !product) return;

    const totalAmount = manualAmount * manualQuantity * (1 + product.vatRate);
    const newTx: Transaction = {
        id: `msale-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        productId: product.id,
        productName: product.name,
        quantity: manualQuantity,
        totalAmount: totalAmount,
        vatAmount: totalAmount * product.vatRate,
        date: new Date().toISOString(),
        type: 'SALE',
        paymentStatus: 'PENDING',
        note: 'Manuel Satış'
    };

    const updatedCustomer = { ...customer, balance: customer.balance + totalAmount };
    const updatedProduct = { ...product, stockCount: product.stockCount - manualQuantity };

    await Promise.all([
        dbService.saveTransaction(newTx),
        dbService.saveCustomer(updatedCustomer),
        dbService.saveProduct(updatedProduct)
    ]);

    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      customers: prev.customers.map(c => c.id === targetCustomerId ? updatedCustomer : c),
      products: prev.products.map(p => p.id === targetProductId ? updatedProduct : p)
    }));
    setIsDrawerOpen(false);
    setManualAmount(0);
    setManualQuantity(1);
    setTargetCustomerId(null);
    setTargetProductId(null);
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

  const onManualSaleTrigger = () => {
    setDrawerMode('manual_sale');
    setIsDrawerOpen(true);
  };

  const renderContent = () => {
    const commonClass = "page-transition max-w-6xl mx-auto pb-24 md:pb-0";
    if (viewMode === 'detail') {
      if (selectedCustomer) {
        const customerTxs = state.transactions.filter(t => t.customerId === selectedCustomer.id);
        return (
          <div className={`${commonClass}`}>
            <div className="flex justify-between items-center mb-12">
               <button onClick={() => setViewMode('list')} className="flex items-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-slate-900 dark:hover:text-white transition-colors">
                 <span className="mr-2 text-xl">←</span> Listeye Dön
               </button>
               <div className="flex space-x-2 md:space-x-3">
                 <button onClick={() => { setTargetCustomerId(selectedCustomer.id); setDrawerMode('manual_sale'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">Satış Yap</button>
                 <button onClick={() => handlePrint('statement', selectedCustomer)} className="hidden md:block px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">Ekstre</button>
                 <button onClick={() => { setTargetCustomerId(selectedCustomer.id); setDrawerMode('tahsilat'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-emerald-700">Tahsilat</button>
                 <button onClick={() => { setEditCustomer(selectedCustomer); setDrawerMode('customer'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold text-xs uppercase hover:bg-blue-900 dark:hover:bg-blue-800 transition-colors">Düzenle</button>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
               <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bakiye</p>
                    <p className={`text-4xl md:text-6xl font-black tracking-tighter ${selectedCustomer.balance > 0 ? 'text-emerald-600' : selectedCustomer.balance < 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      ₺{selectedCustomer.balance.toLocaleString('tr-TR')}
                    </p>
                    <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 space-y-4">
                       <p className="font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</p>
                       <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{selectedCustomer.address || 'Adres Kaydı Yok'}</p>
                    </div>
                  </div>
               </div>
               <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><h3 className="font-black text-lg text-slate-900 dark:text-white">Hareketler</h3></div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar">
                       {customerTxs.map(t => (
                         <div key={t.id} className="p-6 md:p-8 flex items-center justify-between">
                            <div className="flex items-center space-x-4 md:space-x-6">
                               <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm md:text-base ${t.type === 'SALE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : t.type === 'PAYMENT' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>{t.type[0]}</div>
                               <div>
                                  <p 
                                    onClick={() => {
                                        if(t.productId) {
                                            const prod = state.products.find(p => p.id === t.productId);
                                            if(prod) showProductDetail(prod);
                                        }
                                    }}
                                    className={`font-black text-slate-900 dark:text-white text-sm md:text-base ${t.productId ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                                  >
                                    {t.productName || t.note} {t.quantity ? `(${t.quantity} Adet)` : ''}
                                  </p>
                                  <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('tr-TR')}</p>
                               </div>
                            </div>
                            <div className="text-right"><p className="font-black text-lg md:text-xl dark:text-white">₺{t.totalAmount.toLocaleString('tr-TR')}</p></div>
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
               <button onClick={() => setViewMode('list')} className="flex items-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-slate-900 dark:hover:text-white transition-colors">
                 <span className="mr-2 text-xl">←</span> Listeye Dön
               </button>
               <div className="flex space-x-3">
                 <button onClick={() => { setTargetProductId(selectedProduct.id); setDrawerMode('manual_sale'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-emerald-700">Satış Yap</button>
                 <button onClick={() => { setTargetProductId(selectedProduct.id); setDrawerMode('stok_alimi'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">Stok Al</button>
                 <button onClick={() => { setEditProduct(selectedProduct); setDrawerMode('product'); setIsDrawerOpen(true); }} className="px-4 md:px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold text-xs uppercase hover:bg-blue-900 dark:hover:bg-blue-800 transition-colors">Düzenle</button>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
               <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{selectedProduct.name}</h2>
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mt-8">
                       <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-3xl"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stok</p><p className={`text-2xl md:text-3xl font-black ${selectedProduct.stockCount < 20 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{selectedProduct.stockCount}</p></div>
                       <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-3xl"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiyat</p><p className="text-2xl md:text-3xl font-black text-[#1A237E] dark:text-blue-400">₺{selectedProduct.unitPrice}</p></div>
                    </div>
                  </div>
               </div>
               <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><h3 className="font-black text-lg text-slate-900 dark:text-white">Ürün Geçmişi</h3></div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                       {productTxs.map(t => (
                         <div key={t.id} className="p-6 md:p-8 flex items-center justify-between">
                            <div className="flex items-center space-x-4 md:space-x-6">
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm md:text-base ${t.type === 'SALE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>{t.type[0]}</div>
                              <div>
                                <p 
                                    onClick={() => {
                                        const cust = state.customers.find(c => c.id === t.customerId);
                                        if(cust) showCustomerDetail(cust);
                                    }}
                                    className="font-black text-slate-900 dark:text-white text-sm md:text-base cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                    {t.customerName}
                                </p>
                                <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('tr-TR')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-lg md:text-xl dark:text-white">{t.type === 'SALE' ? '-' : '+'}{t.quantity} Adet</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Tutar: ₺{t.totalAmount.toLocaleString('tr-TR')}</p>
                            </div>
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
      case 'dashboard': return <div key="dashboard" className={commonClass}><Dashboard state={state} onAskAI={handleDashboardSubmit} onStartTyping={handleStartTyping} isProcessing={isProcessingAI} onManualSale={onManualSaleTrigger} /></div>;
      case 'chat': return (
        <div key="chat" className="page-transition h-[calc(100vh-6rem)] md:h-[calc(100vh-10rem)] -mt-4 md:mt-0 pb-0">
           <ChatInterface state={state} initialValue={initialChatValue} onUpdateState={handleUpdateChat} onAddUserMessage={handleAddUserMessage} onNewChat={() => {}} onSelectChat={(id) => setState(p=>({...p, currentChatId:id}))} onConfirmDraft={handleConfirmDraft} />
        </div>
      );
      case 'customers': return <div key="customers" className={commonClass}><CustomerList customers={state.customers} onSelect={(id) => { const c = state.customers.find(c=>c.id===id); if(c){ showCustomerDetail(c); } }} onAddNew={() => { setEditCustomer({name:''}); setDrawerMode('customer'); setIsDrawerOpen(true); }} onManualSale={onManualSaleTrigger} /></div>;
      case 'profile': return <div key="profile" className={commonClass}><Profile profile={state.profile} onEdit={() => { setEditProfile(state.profile); setDrawerMode('profile'); setIsDrawerOpen(true); }} /></div>;
      case 'products': return <div key="products" className={commonClass}><ProductList products={state.products} onSelect={(p) => { showProductDetail(p); }} onAddNew={() => { setEditProduct({name:'', stockCount:0}); setDrawerMode('product'); setIsDrawerOpen(true); }} onManualSale={onManualSaleTrigger} /></div>;
      default: return null;
    }
  };

  useEffect(() => {
    setViewMode('list');
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setShowFloatingButton(activeTab !== 'chat');
    if (activeTab === 'chat') setIsChatPopupOpen(false);
  }, [activeTab]);

  return (
    <div className={`min-h-screen bg-[#FBFBFD] dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-blue-100 selection:text-blue-900 relative transition-colors duration-500`}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} businessName={state.profile.name} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      <main className="pt-8 md:pt-36 px-4 md:px-8 pb-32">{renderContent()}</main>

      {showFloatingButton && !isChatPopupOpen && (
          <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[999] floating-chat-enter">
            <div onClick={() => setIsChatPopupOpen(true)} className="w-14 h-14 md:w-16 md:h-16 bg-[#1A237E] dark:bg-blue-700 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform active:scale-95 shadow-blue-900/40 relative z-20">
                <span className="text-white text-xl md:text-2xl">🧠</span>
            </div>
          </div>
      )}

      {isChatPopupOpen && (
          <div className="fixed bottom-24 right-4 md:right-8 w-[calc(100%-2rem)] md:w-96 h-[500px] md:h-[550px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 z-[999] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
             <ChatInterface state={state} initialValue={initialChatValue} onUpdateState={handleUpdateChat} onAddUserMessage={handleAddUserMessage} onNewChat={() => {}} onSelectChat={(id) => setState(p=>({...p, currentChatId:id}))} onConfirmDraft={handleConfirmDraft} isPopup={true} />
             <button onClick={() => setIsChatPopupOpen(false)} className="absolute top-3 right-3 w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 z-[1000]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
      )}

      <MobileNavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={drawerMode === 'customer' ? 'Müşteri Kaydı' : drawerMode === 'product' ? 'Ürün Kaydı' : drawerMode === 'tahsilat' ? 'Tahsilat Girişi' : drawerMode === 'profile' ? 'İşletme Profili' : drawerMode === 'manual_sale' ? 'Hızlı Satış Yap' : 'Stok Alımı'}>
         {drawerMode === 'customer' ? (
           <div className="space-y-10">
              <div className="space-y-6">
                <input className="w-full text-2xl font-bold border-b-2 border-slate-100 dark:border-slate-800 bg-transparent dark:text-white focus:border-blue-600 py-3 outline-none" value={editCustomer.name || ''} onChange={e => setEditCustomer({...editCustomer, name: e.target.value})} placeholder="Ünvan" />
                <div className="grid grid-cols-2 gap-4">
                  <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editCustomer.taxNumber || ''} onChange={e => setEditCustomer({...editCustomer, taxNumber: e.target.value})} placeholder="Vergi No" />
                  <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editCustomer.phone || ''} onChange={e => setEditCustomer({...editCustomer, phone: e.target.value})} placeholder="Telefon" />
                </div>
                <textarea className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-medium dark:text-white" rows={3} placeholder="Adres" value={editCustomer.address || ''} onChange={e => setEditCustomer({...editCustomer, address: e.target.value})} />
              </div>
              <button onClick={handleSaveCustomer} className="w-full bg-slate-900 dark:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#1A237E] shadow-xl">Kaydet</button>
           </div>
         ) : drawerMode === 'product' ? (
           <div className="space-y-10">
              <div className="space-y-6">
               <input className="w-full text-2xl font-bold border-b-2 border-slate-100 dark:border-slate-800 bg-transparent dark:text-white focus:border-[#1A237E] py-3 outline-none" value={editProduct.name || ''} onChange={e => setEditProduct({...editProduct, name: e.target.value})} placeholder="Ürün Adı" />
               <div className="grid grid-cols-2 gap-4">
                 <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editProduct.unitPrice || ''} onChange={e => setEditProduct({...editProduct, unitPrice: Number(e.target.value)})} placeholder="Satış" />
                 <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editProduct.stockCount || ''} onChange={e => setEditProduct({...editProduct, stockCount: Number(e.target.value)})} placeholder="Stok" />
               </div>
               <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editProduct.category || ''} onChange={e => setEditProduct({...editProduct, category: e.target.value})} placeholder="Kategori" />
             </div>
             <button onClick={handleSaveProduct} className="w-full bg-slate-900 dark:bg-blue-700 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-[#1A237E]">{editProduct.id ? 'Güncelle' : 'Ekle'}</button>
           </div>
         ) : drawerMode === 'manual_sale' ? (
            <div className="space-y-10">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cari Seçin</label>
                        <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold outline-none dark:text-white" value={targetCustomerId || ''} onChange={e => setTargetCustomerId(e.target.value)}>
                            <option value="">Cari Seçin...</option>
                            {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ürün Seçin</label>
                        <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold outline-none dark:text-white" value={targetProductId || ''} onChange={e => {
                            setTargetProductId(e.target.value);
                            const p = state.products.find(x => x.id === e.target.value);
                            if(p) setManualAmount(p.unitPrice);
                        }}>
                            <option value="">Ürün Seçin...</option>
                            {state.products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stockCount})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Adet</label>
                            <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={manualQuantity} onChange={e => setManualQuantity(Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Birim Fiyat (₺)</label>
                            <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={manualAmount} onChange={e => setManualAmount(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
                <button onClick={handleCompleteManualSale} className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-emerald-700">Satışı Onayla ve Kaydet</button>
            </div>
         ) : drawerMode === 'tahsilat' ? (
           <div className="space-y-10">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ödeme Alınan Cari</p><p className="text-2xl font-black text-slate-900 dark:text-white">{state.customers.find(c=>c.id===targetCustomerId)?.name}</p></div>
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alınan Tutar (₺)</label>
                <input type="number" autoFocus className="w-full text-6xl font-black border-none bg-transparent outline-none tracking-tighter dark:text-white" value={manualAmount} onChange={e => setManualAmount(Number(e.target.value))} />
              </div>
              <button onClick={handleManualPayment} className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-emerald-700">Tahsilatı Tamamla</button>
           </div>
         ) : drawerMode === 'stok_alimi' ? (
           <div className="space-y-10">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stok Alınan Ürün</p><p className="text-2xl font-black text-slate-900 dark:text-white">{state.products.find(p=>p.id===targetProductId)?.name}</p></div>
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alınan Miktar (Adet)</label>
                <input type="number" autoFocus className="w-full text-6xl font-black border-none bg-transparent outline-none tracking-tighter dark:text-white" value={manualAmount} onChange={e => setManualAmount(Number(e.target.value))} />
              </div>
              <button onClick={handleManualStockEntry} className="w-full bg-slate-900 dark:bg-blue-700 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-900">Stok Girişini Yap</button>
           </div>
         ) : drawerMode === 'profile' ? (
            <div className="space-y-10">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">İşletme Adı</label>
                        <input className="w-full text-xl font-bold border-b-2 border-slate-100 dark:border-slate-800 bg-transparent dark:text-white focus:border-[#1A237E] py-2 outline-none" value={editProfile.name || ''} onChange={e => setEditProfile({...editProfile, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editProfile.ownerName || ''} onChange={e => setEditProfile({...editProfile, ownerName: e.target.value})} placeholder="Sahibi" />
                        <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editProfile.sector || ''} onChange={e => setEditProfile({...editProfile, sector: e.target.value})} placeholder="Sektör" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editProfile.taxOffice || ''} onChange={e => setEditProfile({...editProfile, taxOffice: e.target.value})} placeholder="V.D." />
                        <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editProfile.taxNumber || ''} onChange={e => setEditProfile({...editProfile, taxNumber: e.target.value})} placeholder="VKN" />
                    </div>
                    <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold dark:text-white" value={editProfile.phone || ''} onChange={e => setEditProfile({...editProfile, phone: e.target.value})} placeholder="Telefon" />
                    <textarea className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-medium dark:text-white" rows={3} placeholder="Adres" value={editProfile.address || ''} onChange={e => setEditProfile({...editProfile, address: e.target.value})} />
                </div>
                <button onClick={handleSaveProfile} className="w-full bg-slate-900 dark:bg-blue-700 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl">Güncelle</button>
            </div>
         ) : null}
      </SideDrawer>
    </div>
  );
};

export default App;
