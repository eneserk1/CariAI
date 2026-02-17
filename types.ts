
// Family Budget Profile
export interface BusinessProfile {
  name: string;
  city?: string;
  memberCount?: number;
  monthlyBudget?: number;
  currency: string;
  // Legacy fields for compatibility
  sector?: string;
  ownerName?: string;
  address?: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
}

// Family Member (mapped to Customer for compatibility)
export interface Customer {
  id: string;
  name: string;
  role?: string; // Anne, Baba, Çocuk, vb. (family context)
  phone?: string;
  birthDate?: string;
  email?: string;
  balance: number; // Kişinin mevcut harcama bakiyesi
  notes?: string;
  // Legacy fields for compatibility
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
}

// Budget Category (mapped to Product for compatibility)
export interface Product {
  id: string;
  name: string;
  categoryCode?: string; // Budget category code
  monthlyLimit?: number; // Monthly limit for this category
  currentSpent?: number; // Current spent in this category
  icon?: string;
  color?: string;
  // Legacy fields for compatibility
  sku?: string;
  stockCount?: number;
  unitPrice?: number;
  purchasePrice?: number;
  vatRate?: number;
  category?: string;
}

export interface Transaction {
  id: string;
  customerId: string; // memberId in family context
  productId?: string; // categoryId in family context
  productName?: string; // categoryName in family context
  customerName: string; // memberName in family context
  quantity?: number;
  totalAmount: number;
  vatAmount?: number; // Not used in family budget
  date: string;
  type: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'EXPENSE' | 'INCOME' | 'SAVING' | 'TRANSFER';
  paymentStatus?: 'PAID' | 'PENDING'; // paymentMethod in family context
  paymentMethod?: 'CASH' | 'CARD' | 'BANK';
  note?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  draft?: any;
  confirmed?: boolean;
  attachment?: {
    name: string;
    type: string;
  };
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
  customers: Customer[]; // Family members
  products: Product[]; // Budget categories
  transactions: Transaction[];
  chatSessions: ChatSession[];
  currentChatId: string | null;
  dashboardInsights: DashboardInsight[];
}
