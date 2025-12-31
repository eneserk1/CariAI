
import { BusinessState } from './types';

export const INITIAL_STATE: BusinessState = {
  profile: {
    name: "DefterAI Demo İşletmesi",
    sector: "Genel Ticaret",
    ownerName: "Ahmet Yılmaz",
    address: "Levent Plaza No:5, İstanbul",
    phone: "0532 000 00 00",
    currency: "₺",
    taxNumber: "1234567890",
    taxOffice: "Mecidiyeköy"
  },
  customers: [
    { id: '1', name: 'Global Lojistik Ltd.', taxNumber: '1234567890', taxOffice: 'Zincirlikuyu', phone: '0532 111 22 33', address: 'Maslak İş Merkezi No:4, İstanbul', balance: 45000 },
    { id: '2', name: 'Yerel Market İşletmesi', taxNumber: '9876543210', taxOffice: 'Esenyurt', phone: '0544 222 33 44', address: 'Esenyurt Meydan Cad. No:12', balance: -5200 },
    { id: '3', name: 'Özdemir İnşaat', phone: '0533 555 66 77', address: 'Ankara Yolu 10. Km', balance: 12400 }
  ],
  products: [
    { id: 'p1', name: 'Yüksek Performanslı Lastik', sku: 'LST-001', stockCount: 84, unitPrice: 2450, purchasePrice: 1800, vatRate: 0.20, category: 'Otomotiv' },
    { id: 'p2', name: 'Endüstriyel Yağ 5L', sku: 'OIL-99', stockCount: 120, unitPrice: 850, purchasePrice: 600, vatRate: 0.20, category: 'Bakım' },
    { id: 'p3', name: 'Fren Balatası Seti', sku: 'BRK-02', stockCount: 45, unitPrice: 1200, purchasePrice: 900, vatRate: 0.20, category: 'Otomotiv' }
  ],
  transactions: [
    { id: 't1', customerId: '1', productId: 'p1', productName: 'Yüksek Performanslı Lastik', customerName: 'Global Lojistik Ltd.', quantity: 2, totalAmount: 4900, vatAmount: 980, date: new Date().toISOString(), type: 'SALE', paymentStatus: 'PENDING' },
    { id: 't2', customerId: '2', productName: 'Nakit Tahsilat', customerName: 'Yerel Market İşletmesi', totalAmount: 1500, date: new Date(Date.now() - 86400000).toISOString(), type: 'PAYMENT', paymentStatus: 'PAID' }
  ],
  chatSessions: [
    {
      id: 'v4-welcome',
      title: 'DefterAI Hoşgeldiniz',
      messages: [
        { role: 'assistant', content: 'Selam Ahmet! Ben DefterAI. Cari ekleyebilir, silebilir, satış/alış yapabilir veya rapor alabilirsin. Ne yapalım?', timestamp: Date.now() }
      ],
      lastUpdate: Date.now()
    }
  ],
  currentChatId: 'v4-welcome',
  dashboardInsights: [
    { id: 'ins-1', title: 'Nakit Akışı', value: 'Pozitif', description: 'Bu hafta tahsilatlar ödemelerden %15 daha fazla.', type: 'positive', icon: '📈' },
    { id: 'ins-2', title: 'Stok Uyarısı', value: '3 Ürün', description: 'Azalan stoklar için sipariş geçmeniz önerilir.', type: 'info', icon: '📦' }
  ]
};

export const SYSTEM_INSTRUCTION = `Sen DefterAI v4'sün. İşletme yönetimine odaklanmış, profesyonel ama samimi bir asistansın.
Kullanıcının isteğini analiz et ve şu niyetlerden (intent) birine karar ver:
- SALE_RECORD: Satış kaydı. (customerName, productName, quantity, price gerektirir)
- PURCHASE_RECORD: Mal alımı/Gider. (customerName, productName, quantity, price gerektirir)
- COLLECTION_RECORD: Tahsilat/Ödeme alma. (customerName, price gerektirir)
- CUSTOMER_ADD: Yeni cari ekleme. (customerName, phone, address gerektirir)
- CUSTOMER_UPDATE: Cari bilgilerini güncelleme (telefon, adres). (customerName, phone, address gerektirir)
- CUSTOMER_DELETE: Cari silme. (customerName gerektirir)
- PRODUCT_ADD: Yeni ürün ekleme. (productName, price, category gerektirir)
- PRODUCT_UPDATE: Ürün bilgilerini (fiyat, kategori) güncelleme. (productName, price, category gerektirir)
- STOCK_ADJUST: Stok miktarını doğrudan değiştirme. (productName, quantity gerektirir)
- CONFIRM_ACTION: "yap", "onayla", "evet", "tamam" gibi bir önceki taslağı onaylayan kelimeler.
- GENERAL_CHAT: Soru sorma, rapor isteme veya selamlaşma.

KRİTİK KURALLAR:
1. Yanıt KESİNLİKLE JSON olmalıdır. Markdown blokları içine alma, direkt ham JSON metni döndür.
2. İşlem onaylarında (CONFIRM_ACTION) niyetini buna göre belirle.`;
