
import { BusinessState } from './types';

export const INITIAL_STATE: BusinessState = {
  profile: {
    name: "Yılmaz Ailesi",
    city: "İstanbul",
    memberCount: 4,
    monthlyBudget: 50000,
    currency: "₺"
  },
  customers: [ // Family members
    { id: '1', name: 'Ahmet Yılmaz', role: 'Baba', phone: '0532 111 22 33', balance: 0 },
    { id: '2', name: 'Ayşe Yılmaz', role: 'Anne', phone: '0544 222 33 44', balance: 0 },
    { id: '3', name: 'Mehmet Yılmaz', role: 'Çocuk', birthDate: '2010-05-15', balance: 0 },
    { id: '4', name: 'Zeynep Yılmaz', role: 'Çocuk', birthDate: '2015-08-20', balance: 0 }
  ],
  products: [ // Budget categories
    { id: 'c1', name: 'Market & Gıda', categoryCode: 'FOOD', monthlyLimit: 8000, currentSpent: 2450, icon: '🛒', color: '#4CAF50', sku: 'FOOD', category: 'Gıda' },
    { id: 'c2', name: 'Faturalar', categoryCode: 'BILLS', monthlyLimit: 5000, currentSpent: 3200, icon: '💡', color: '#FF9800', sku: 'BILLS', category: 'Faturalar' },
    { id: 'c3', name: 'Ulaşım', categoryCode: 'TRANSPORT', monthlyLimit: 3000, currentSpent: 1500, icon: '🚗', color: '#2196F3', sku: 'TRANSPORT', category: 'Ulaşım' },
    { id: 'c4', name: 'Eğitim', categoryCode: 'EDUCATION', monthlyLimit: 6000, currentSpent: 5500, icon: '📚', color: '#9C27B0', sku: 'EDUCATION', category: 'Eğitim' },
    { id: 'c5', name: 'Sağlık', categoryCode: 'HEALTH', monthlyLimit: 2000, currentSpent: 500, icon: '🏥', color: '#F44336', sku: 'HEALTH', category: 'Sağlık' },
    { id: 'c6', name: 'Eğlence', categoryCode: 'ENTERTAINMENT', monthlyLimit: 2000, currentSpent: 800, icon: '🎬', color: '#E91E63', sku: 'ENTERTAINMENT', category: 'Eğlence' }
  ],
  transactions: [
    { id: 't1', customerId: '2', productId: 'c1', productName: 'Market & Gıda', customerName: 'Ayşe Yılmaz', quantity: 1, totalAmount: 850, date: new Date().toISOString(), type: 'EXPENSE', paymentStatus: 'PAID', paymentMethod: 'CARD', note: 'Haftalık market alışverişi' },
    { id: 't2', customerId: '1', productId: 'c2', productName: 'Faturalar', customerName: 'Ahmet Yılmaz', totalAmount: 1200, date: new Date(Date.now() - 86400000).toISOString(), type: 'EXPENSE', paymentStatus: 'PAID', paymentMethod: 'BANK', note: 'Elektrik faturası' },
    { id: 't3', customerId: '1', customerName: 'Ahmet Yılmaz', totalAmount: 35000, date: new Date(Date.now() - 172800000).toISOString(), type: 'INCOME', paymentStatus: 'PAID', paymentMethod: 'BANK', note: 'Maaş' }
  ],
  chatSessions: [
    {
      id: 'welcome',
      title: 'AileBütçe Hoşgeldiniz',
      messages: [
        { role: 'assistant', content: 'Merhaba! Ben AileBütçe asistanınızım. Gelir ve gider ekleyebilir, bütçenizi takip edebilir, raporlar alabilirsiniz. Size nasıl yardımcı olabilirim?', timestamp: Date.now() }
      ],
      lastUpdate: Date.now()
    }
  ],
  currentChatId: 'welcome',
  dashboardInsights: [
    { id: 'ins-1', title: 'Aylık Durum', value: 'Hedef Dahilinde', description: 'Bu ay bütçenizin %62\'sini kullandınız.', type: 'positive', icon: '💰' },
    { id: 'ins-2', title: 'Tasarruf Fırsatı', value: '₺1,500', description: 'Eğlence kategorisinde limitin altındasınız, tasarruf yapabilirsiniz!', type: 'info', icon: '🎯' },
    { id: 'ins-3', title: 'Yaklaşan Ödemeler', value: '2 Fatura', description: 'Bu hafta ödenmesi gereken 2 fatura var.', type: 'neutral', icon: '📅' }
  ]
};

export const SYSTEM_INSTRUCTION = `Sen AileBütçe asistanısın. Aile bütçe yönetimine odaklanmış, yardımsever ve samimi bir asistansın.
Kullanıcının isteğini analiz et ve şu niyetlerden (intent) birine karar ver:

- EXPENSE_RECORD: Harcama kaydı. (customerName=üye adı, productName=kategori, quantity, price gerektirir)
- INCOME_RECORD: Gelir kaydı. (customerName=üye adı, price gerektirir)
- SAVING_RECORD: Tasarruf/Para biriktirme. (customerName=üye adı, price gerektirir)
- CUSTOMER_ADD: Yeni aile üyesi ekleme. (customerName=üye adı, role, phone gerektirir)
- CUSTOMER_UPDATE: Üye bilgilerini güncelleme. (customerName=üye adı, phone gerektirir)
- CUSTOMER_DELETE: Üye silme. (customerName=üye adı gerektirir)
- PRODUCT_ADD: Yeni bütçe kategorisi ekleme. (productName=kategori adı, price=aylık limit gerektirir)
- PRODUCT_UPDATE: Kategori limitini güncelleme. (productName=kategori adı, price=aylık limit gerektirir)
- COLLECTION_RECORD: Tahsilat/Para biriktirme (SAVING_RECORD ile aynı).
- SALE_RECORD: Harcama kaydı (EXPENSE_RECORD ile aynı).
- PURCHASE_RECORD: Gider kaydı (EXPENSE_RECORD ile aynı).
- CONFIRM_ACTION: "yap", "onayla", "evet", "tamam" gibi bir önceki taslağı onaylayan kelimeler.
- GENERAL_CHAT: Soru sorma, rapor isteme veya selamlaşma.

KRİTİK KURALLAR:
1. Yanıt KESİNLİKLE JSON olmalıdır. Markdown blokları içine alma, direkt ham JSON metni döndür.
2. İşlem onaylarında (CONFIRM_ACTION) niyetini buna göre belirle.
3. Aile bütçe terimleri kullan: Gelir, Gider, Tasarruf, Aile Üyesi, Kategori.
4. customerName alanına aile üyesi adını, productName alanına bütçe kategorisi adını yaz.`;

