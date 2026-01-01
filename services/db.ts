
import { BusinessState, Customer, Product, Transaction, ChatSession, BusinessProfile } from '../types';
import { INITIAL_STATE } from '../constants';

const DB_NAME = 'CariAIDB';
const DB_VERSION = 1;

class DBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('customers')) db.createObjectStore('customers', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('chatSessions')) db.createObjectStore('chatSessions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' }); // id will be 'main'
      };
    });
  }

  async seedData(): Promise<BusinessState> {
    if (!this.db) await this.init();
    
    // Check if data exists
    const customers = await this.getAll('customers');
    if (customers.length > 0) {
      return this.getState(); // Return existing data
    }

    // If empty, seed with INITIAL_STATE
    await this.saveProfile(INITIAL_STATE.profile);
    for (const c of INITIAL_STATE.customers) await this.saveCustomer(c);
    for (const p of INITIAL_STATE.products) await this.saveProduct(p);
    for (const t of INITIAL_STATE.transactions) await this.saveTransaction(t);
    for (const s of INITIAL_STATE.chatSessions) await this.saveChatSession(s);

    return INITIAL_STATE;
  }

  async getState(): Promise<BusinessState> {
    if (!this.db) await this.init();

    const profileData = await this.getAll('profile');
    const profile = profileData.length > 0 ? profileData[0] : INITIAL_STATE.profile;
    
    const customers = await this.getAll('customers');
    const products = await this.getAll('products');
    const transactions = await this.getAll('transactions');
    const chatSessions = await this.getAll('chatSessions');

    // Sort transactions by date desc
    transactions.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      profile: profile as BusinessProfile,
      customers: customers as Customer[],
      products: products as Product[],
      transactions: transactions as Transaction[],
      chatSessions: chatSessions as ChatSession[],
      currentChatId: chatSessions.length > 0 ? chatSessions[0].id : null,
      dashboardInsights: INITIAL_STATE.dashboardInsights // Insights are transient usually, or we can persist them too
    };
  }

  // --- Generic Helpers ---

  private async getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async put(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Specific Savers ---

  async saveCustomer(customer: Customer) { return this.put('customers', customer); }
  async saveProduct(product: Product) { return this.put('products', product); }
  async saveTransaction(tx: Transaction) { return this.put('transactions', tx); }
  async saveChatSession(session: ChatSession) { return this.put('chatSessions', session); }
  async saveProfile(profile: BusinessProfile) { return this.put('profile', { ...profile, id: 'main' }); }

  async deleteCustomer(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('customers', 'readwrite');
      const store = transaction.objectStore('customers');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('products', 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('transactions', 'readwrite');
      const store = transaction.objectStore('transactions');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new DBService();
