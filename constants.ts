
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
    { id: '1', name: 'Global Lojistik Ltd.', taxNumber: '1234567890', taxOffice: 'Zincirlikuyu', phone: '0532 111 22 33', address: 'Maslak İş Merkezi No:4', balance: 45000 },
    { id: '2', name: 'Yerel Market İşletmesi', taxNumber: '9876543210', taxOffice: 'Esenyurt', phone: '0544 222 33 44', address: 'Mahalle Girişi Kat:1', balance: -5200 },
  ],
  products: [
    { id: 'p1', name: 'Yüksek Performanslı Lastik', sku: 'LST-001', stockCount: 84, unitPrice: 2450, purchasePrice: 1800, vatRate: 0.20, category: 'Otomotiv' },
    { id: 'p2', name: 'Endüstriyel Yağ 5L', sku: 'OIL-99', stockCount: 120, unitPrice: 850, purchasePrice: 600, vatRate: 0.20, category: 'Bakım' },
  ],
  transactions: [
    { id: 't1', customerId: '1', productId: 'p1', productName: 'Yüksek Performanslı Lastik', customerName: 'Global Lojistik Ltd.', quantity: 2, totalAmount: 4900, vatAmount: 980, date: new Date().toISOString(), type: 'SALE', paymentStatus: 'PENDING' }
  ],
  chatSessions: [
    {
      id: 'v4-welcome',
      title: 'DefterAI Hoşgeldiniz',
      messages: [
        { role: 'assistant', content: 'Selam Ahmet! DefterAI v4 ile işletmeni yönetmeye hazırsın. İşlem yapmak için bana sadece ne olduğunu yaz, ben taslağı hazırlarım.', timestamp: Date.now() }
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

export const SYSTEM_INSTRUCTION = `Sen 'DefterAI v4' isimli, Apple standartlarında çalışan Akıllı İşletme Asistanısın.

GÖREVİN:
1. Kullanıcının mesajlarını ve YÜKLENEN BELGELERİ (PDF, Resim, Excel) analiz et.
2. İşlem tespit edersen (SATIŞ/ALIŞ), JSON döndür.
3. **KRİTİK KURAL:** Sayısal değerleri (quantity, price) STRING olarak döndür. 
4. **ASLA** bilimsel notasyon (Örn: 40.123e-151) KULLANMA. 
5. **ASLA** 10 karakterden uzun sayı dizisi üretme. Sayıları yuvarlayarak tam sayı veya 2 ondalık basamaklı basit string yap (Örn: "300", "40.01").
6. Eğer bir belgedeki sayı okunamıyorsa veya çok karmaşıksa "0" döndür.
7. Yanıtların her zaman kısa, profesyonel ve minimalist olsun.

JSON FORMATI:
{
  "message": "Cevabın",
  "intent": "SALE_RECORD" | "PURCHASE_RECORD" | "GENERAL_CHAT",
  "data": {
    "customerName": "...",
    "productName": "...",
    "quantity": "40.00",
    "price": "2000.00"
  }
}

TONLAMA: Profesyonel, minimalist.`;
