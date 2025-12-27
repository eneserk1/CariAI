
export interface BusinessProfile {
  name: string;
  sector: string;
  ownerName: string;
  address: string;
  phone: string;
  currency: string;
  taxNumber?: string;
  taxOffice?: string;
}

export interface Customer {
  id: string;
  name: string;
  taxNumber?: string;
  taxOffice?: string;
  phone?: string;
  address?: string;
  email?: string;
  balance: number; 
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stockCount: number;
  unitPrice: number;
  purchasePrice: number;
  vatRate: number; 
  category: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  productId?: string;
  productName?: string;
  customerName: string;
  quantity?: number;
  totalAmount: number;
  vatAmount?: number;
  date: string;
  type: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'EXPENSE';
  paymentStatus: 'PAID' | 'PENDING';
  note?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  draft?: any;
  confirmed?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdate: number;
}

export interface DashboardInsight {
  id: string;
  title: string;
  value: string | number;
  description: string;
  type: 'neutral' | 'positive' | 'negative' | 'info';
  icon?: string;
}

export interface BusinessState {
  profile: BusinessProfile;
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  chatSessions: ChatSession[];
  currentChatId: string | null;
  dashboardInsights: DashboardInsight[];
}
