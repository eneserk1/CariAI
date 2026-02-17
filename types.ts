
export interface FamilyProfile {
  name: string;
  city: string;
  memberCount: number;
  monthlyBudget: number;
  currency: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string; // Anne, Baba, Çocuk, vb.
  phone?: string;
  birthDate?: string;
  email?: string;
  balance: number; // Kişinin mevcut harcama bakiyesi
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  categoryCode: string;
  monthlyLimit: number;
  currentSpent: number;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  categoryId?: string;
  categoryName?: string;
  memberName: string;
  quantity?: number;
  totalAmount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'SAVING' | 'TRANSFER';
  paymentMethod: 'CASH' | 'CARD' | 'BANK';
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

export interface FamilyBudgetState {
  profile: FamilyProfile;
  members: FamilyMember[];
  categories: BudgetCategory[];
  transactions: Transaction[];
  chatSessions: ChatSession[];
  currentChatId: string | null;
  dashboardInsights: DashboardInsight[];
}

// Legacy types for backward compatibility
export type BusinessProfile = FamilyProfile;
export type Customer = FamilyMember;
export type Product = BudgetCategory;
export type BusinessState = FamilyBudgetState;
