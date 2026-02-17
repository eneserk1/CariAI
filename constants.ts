
import { FamilyBudgetState } from './types';

export const INITIAL_STATE: FamilyBudgetState = {
  profile: {
    name: "Yılmaz Ailesi",
    city: "İstanbul",
    memberCount: 4,
    monthlyBudget: 50000,
    currency: "₺"
  },
  members: [
    { id: '1', name: 'Ahmet Yılmaz', role: 'Baba', phone: '0532 111 22 33', balance: 0 },
    { id: '2', name: 'Ayşe Yılmaz', role: 'Anne', phone: '0544 222 33 44', balance: 0 },
    { id: '3', name: 'Mehmet Yılmaz', role: 'Çocuk', birthDate: '2010-05-15', balance: 0 },
    { id: '4', name: 'Zeynep Yılmaz', role: 'Çocuk', birthDate: '2015-08-20', balance: 0 }
  ],
  categories: [
    { id: 'c1', name: 'Market & Gıda', categoryCode: 'FOOD', monthlyLimit: 8000, currentSpent: 2450, icon: '🛒', color: '#4CAF50' },
    { id: 'c2', name: 'Faturalar', categoryCode: 'BILLS', monthlyLimit: 5000, currentSpent: 3200, icon: '💡', color: '#FF9800' },
    { id: 'c3', name: 'Ulaşım', categoryCode: 'TRANSPORT', monthlyLimit: 3000, currentSpent: 1500, icon: '🚗', color: '#2196F3' },
    { id: 'c4', name: 'Eğitim', categoryCode: 'EDUCATION', monthlyLimit: 6000, currentSpent: 5500, icon: '📚', color: '#9C27B0' },
    { id: 'c5', name: 'Sağlık', categoryCode: 'HEALTH', monthlyLimit: 2000, currentSpent: 500, icon: '🏥', color: '#F44336' },
    { id: 'c6', name: 'Eğlence', categoryCode: 'ENTERTAINMENT', monthlyLimit: 2000, currentSpent: 800, icon: '🎬', color: '#E91E63' }
  ],
  transactions: [
    { id: 't1', memberId: '2', categoryId: 'c1', categoryName: 'Market & Gıda', memberName: 'Ayşe Yılmaz', quantity: 1, totalAmount: 850, date: new Date().toISOString(), type: 'EXPENSE', paymentMethod: 'CARD', note: 'Haftalık market alışverişi' },
    { id: 't2', memberId: '1', categoryId: 'c2', categoryName: 'Faturalar', memberName: 'Ahmet Yılmaz', totalAmount: 1200, date: new Date(Date.now() - 86400000).toISOString(), type: 'EXPENSE', paymentMethod: 'BANK', note: 'Elektrik faturası' },
    { id: 't3', memberId: '1', memberName: 'Ahmet Yılmaz', totalAmount: 35000, date: new Date(Date.now() - 172800000).toISOString(), type: 'INCOME', paymentMethod: 'BANK', note: 'Maaş' }
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
    { id: 'ins-2', title: 'Tasarruf Fırsatı', value: '₺1,500', description: 'Eğlence kategorisinde limit altındasınız, tasarruf yapabilirsiniz!', type: 'info', icon: '🎯' },
    { id: 'ins-3', title: 'Yaklaşan Ödemeler', value: '2 Fatura', description: 'Bu hafta ödenmesi gereken 2 fatura var.', type: 'neutral', icon: '📅' }
  ]
};

export const SYSTEM_INSTRUCTION = `Sen AileBütçe asistanısın. Aile bütçe yönetimine odaklanmış, yardımsever ve samimi bir asistansın.
Kullanıcının isteğini analiz et ve şu niyetlerden (intent) birine karar ver:

- EXPENSE_RECORD: Harcama kaydı. (memberName, categoryName, quantity, amount gerektirir)
- INCOME_RECORD: Gelir kaydı. (memberName, amount gerektirir)
- SAVING_RECORD: Tasarruf/Para biriktirme. (memberName, amount gerektirir)
- MEMBER_ADD: Yeni aile üyesi ekleme. (memberName, role, phone gerektirir)
- MEMBER_UPDATE: Üye bilgilerini güncelleme. (memberName, phone gerektirir)
- MEMBER_DELETE: Üye silme. (memberName gerektirir)
- CATEGORY_ADD: Yeni bütçe kategorisi ekleme. (categoryName, monthlyLimit gerektirir)
- CATEGORY_UPDATE: Kategori limitini güncelleme. (categoryName, monthlyLimit gerektirir)
- BUDGET_ADJUST: Aylık bütçeyi değiştirme. (amount gerektirir)
- CONFIRM_ACTION: "yap", "onayla", "evet", "tamam" gibi bir önceki taslağı onaylayan kelimeler.
- GENERAL_CHAT: Soru sorma, rapor isteme veya selamlaşma.

KRİTİK KURALLAR:
1. Yanıt KESİNLİKLE JSON olmalıdır. Markdown blokları içine alma, direkt ham JSON metni döndür.
2. İşlem onaylarında (CONFIRM_ACTION) niyetini buna göre belirle.
3. Aile bütçe terimleri kullan: Gelir, Gider, Tasarruf, Aile Üyesi, Kategori.`;

