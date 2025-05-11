import { 
  users, type User, type InsertUser,
  customers, type Customer, type InsertCustomer,
  rates, type Rate, type InsertRate,
  invoices, type Invoice, type InsertInvoice, InvoiceStatus,
  invoiceItems, type InvoiceItem, type InsertInvoiceItem 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Rates (Tarieven)
  getRates(): Promise<Rate[]>;
  getRate(id: number): Promise<Rate | undefined>;
  getRateByCode(code: string): Promise<Rate | undefined>;
  createRate(rate: InsertRate): Promise<Rate>;
  updateRate(id: number, rate: Partial<InsertRate>): Promise<Rate | undefined>;
  deleteRate(id: number): Promise<boolean>;
  
  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByCustomer(customerId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: number, status: InvoiceStatus): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Invoice Items
  getInvoiceItems(): Promise<InvoiceItem[]>;
  getInvoiceItem(id: number): Promise<InvoiceItem | undefined>;
  getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]>;
  getInvoiceItemsByCustomer(customerId: number): Promise<InvoiceItem[]>;
  getUnassignedInvoiceItems(): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  assignInvoiceItemsToInvoice(itemIds: number[], invoiceId: number): Promise<boolean>;
  deleteInvoiceItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private customers: Map<number, Customer>;
  private rates: Map<number, Rate>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  
  private currentUserId: number;
  private currentCustomerId: number;
  private currentRateId: number;
  private currentInvoiceId: number;
  private currentInvoiceItemId: number;
  private currentInvoiceNumber: number;

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.rates = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    
    this.currentUserId = 1;
    this.currentCustomerId = 1;
    this.currentRateId = 1;
    this.currentInvoiceId = 1;
    this.currentInvoiceItemId = 1;
    this.currentInvoiceNumber = 1;
    
    // Add some sample customers
    this.createCustomer({ 
      name: "Cliënt A", 
      email: "client-a@example.com", 
      address: "Amstelplein 1, 1096 HA Amsterdam", 
      phoneNumber: "+31 20 123 4567" 
    });
    this.createCustomer({ 
      name: "Cliënt B", 
      email: "client-b@example.com", 
      address: "Zuidas 128, 1082 KH Amsterdam", 
      phoneNumber: "+31 20 987 6543" 
    });
    this.createCustomer({ 
      name: "Cliënt C", 
      email: "client-c@example.com", 
      address: "Stationsplein 2, 3511 ED Utrecht", 
      phoneNumber: "+31 30 456 7890" 
    });
    this.createCustomer({ 
      name: "Cliënt D", 
      email: "client-d@example.com", 
      address: "Centrumplein 45, 2512 CN Den Haag", 
      phoneNumber: "+31 70 567 8901" 
    });
    
    // Add some sample rates (tarieven)
    this.createRate({
      code: "CONSULT",
      description: "Consult",
      amount: 95.0,
      period: "per sessie",
      vatRate: 21.0,
      defaultQuantity: 1
    });
    this.createRate({
      code: "MASSAGE",
      description: "Massage behandeling",
      amount: 75.0,
      period: "per uur",
      vatRate: 21.0,
      defaultQuantity: 1
    });
    this.createRate({
      code: "COACH",
      description: "Coaching gesprek",
      amount: 120.0,
      period: "per sessie",
      vatRate: 21.0,
      defaultQuantity: 1
    });
    this.createRate({
      code: "TRAJECT",
      description: "Behandeltraject",
      amount: 450.0,
      period: "per traject",
      vatRate: 21.0,
      defaultQuantity: 1
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer = { ...existingCustomer, ...customer };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Rate methods
  async getRates(): Promise<Rate[]> {
    return Array.from(this.rates.values());
  }

  async getRate(id: number): Promise<Rate | undefined> {
    return this.rates.get(id);
  }

  async getRateByCode(code: string): Promise<Rate | undefined> {
    return Array.from(this.rates.values()).find(
      (rate) => rate.code === code,
    );
  }

  async createRate(insertRate: InsertRate): Promise<Rate> {
    const id = this.currentRateId++;
    const rate: Rate = { 
      ...insertRate, 
      id,
      createdAt: new Date()
    };
    this.rates.set(id, rate);
    return rate;
  }

  async updateRate(id: number, rate: Partial<InsertRate>): Promise<Rate | undefined> {
    const existingRate = this.rates.get(id);
    if (!existingRate) return undefined;
    
    const updatedRate = { ...existingRate, ...rate };
    this.rates.set(id, updatedRate);
    return updatedRate;
  }

  async deleteRate(id: number): Promise<boolean> {
    return this.rates.delete(id);
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.customerId === customerId);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const invoice: Invoice = { 
      ...insertInvoice, 
      id,
      createdAt: new Date()
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;
    
    const updatedInvoice = { ...existingInvoice, ...invoice };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async updateInvoiceStatus(id: number, status: InvoiceStatus): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;
    
    const updatedInvoice = { ...existingInvoice, status };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Invoice Item methods
  async getInvoiceItems(): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values());
  }

  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    return this.invoiceItems.get(id);
  }

  async getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values())
      .filter(item => item.invoiceId === invoiceId);
  }
  
  async getInvoiceItemsByCustomer(customerId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values())
      .filter(item => item.customerId === customerId);
  }

  async getUnassignedInvoiceItems(): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values())
      .filter(item => item.invoiceId === null || item.invoiceId === undefined);
  }

  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.currentInvoiceItemId++;
    const item: InvoiceItem = { 
      ...insertItem, 
      id,
      createdAt: new Date() 
    };
    this.invoiceItems.set(id, item);
    return item;
  }

  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const existingItem = this.invoiceItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.invoiceItems.set(id, updatedItem);
    return updatedItem;
  }

  async assignInvoiceItemsToInvoice(itemIds: number[], invoiceId: number): Promise<boolean> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return false;
    
    for (const itemId of itemIds) {
      const item = this.invoiceItems.get(itemId);
      if (item) {
        this.invoiceItems.set(itemId, { ...item, invoiceId });
      }
    }
    
    return true;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    return this.invoiceItems.delete(id);
  }

  // Helper method to generate new invoice number
  generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const invoiceNumber = `F-${year}-${String(this.currentInvoiceNumber++).padStart(4, '0')}`;
    return invoiceNumber;
  }
}

import { DatabaseStorage, initializeData } from "./DatabaseStorage";

// Export an initialized database storage instance
export const storage = new DatabaseStorage();

// Initialize data but don't block the export
initializeData().catch(err => console.error('Error initializing data:', err));
