import { 
  users, type User, type InsertUser, 
  customers, type Customer, type InsertCustomer,
  rates, type Rate, type InsertRate,
  invoices, type Invoice, type InsertInvoice, InvoiceStatus,
  invoiceItems, type InvoiceItem, type InsertInvoiceItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount > 0;
  }
  
  async getRates(): Promise<Rate[]> {
    return await db.select().from(rates);
  }
  
  async getRate(id: number): Promise<Rate | undefined> {
    const [rate] = await db.select().from(rates).where(eq(rates.id, id));
    return rate;
  }
  
  async getRateByCode(code: string): Promise<Rate | undefined> {
    const [rate] = await db.select().from(rates).where(eq(rates.code, code));
    return rate;
  }
  
  async createRate(insertRate: InsertRate): Promise<Rate> {
    const [rate] = await db.insert(rates).values({
      ...insertRate,
      createdAt: new Date()
    }).returning();
    return rate;
  }
  
  async updateRate(id: number, rate: Partial<InsertRate>): Promise<Rate | undefined> {
    const [updated] = await db
      .update(rates)
      .set(rate)
      .where(eq(rates.id, id))
      .returning();
    return updated;
  }
  
  async deleteRate(id: number): Promise<boolean> {
    const result = await db.delete(rates).where(eq(rates.id, id));
    return result.rowCount > 0;
  }
  
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  
  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.customerId, customerId));
  }
  
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoiceNumber = insertInvoice.invoiceNumber || this.generateInvoiceNumber();
    
    const [invoice] = await db.insert(invoices).values({
      ...insertInvoice,
      invoiceNumber,
      createdAt: new Date(),
      status: insertInvoice.status || 'draft',
      notes: insertInvoice.notes || null
    }).returning();
    
    return invoice;
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }
  
  async updateInvoiceStatus(id: number, status: InvoiceStatus): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({ status })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return result.rowCount > 0;
  }
  
  async getInvoiceItems(): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems);
  }
  
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    const [item] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    return item;
  }
  
  async getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }
  
  async getInvoiceItemsByCustomer(customerId: number): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.customerId, customerId));
  }
  
  async getUnassignedInvoiceItems(): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(isNull(invoiceItems.invoiceId));
  }
  
  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    // Calculate the financial values
    const subtotal = insertItem.quantity * insertItem.unitPrice;
    const vatAmount = subtotal * (insertItem.vatRate / 100);
    const total = subtotal + vatAmount;
    
    const [item] = await db.insert(invoiceItems).values({
      ...insertItem,
      createdAt: new Date(),
      subtotal,
      vatAmount,
      total
    }).returning();
    
    return item;
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    // First get the current item to calculate new values
    const [existing] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    if (!existing) {
      return undefined;
    }
    
    // Recalculate financial values if necessary
    const quantity = item.quantity !== undefined ? item.quantity : existing.quantity;
    const unitPrice = item.unitPrice !== undefined ? item.unitPrice : existing.unitPrice;
    const vatRate = item.vatRate !== undefined ? item.vatRate : existing.vatRate;
    
    const subtotal = quantity * unitPrice;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    
    const [updated] = await db
      .update(invoiceItems)
      .set({
        ...item,
        subtotal,
        vatAmount,
        total
      })
      .where(eq(invoiceItems.id, id))
      .returning();
    
    return updated;
  }
  
  async assignInvoiceItemsToInvoice(itemIds: number[], invoiceId: number): Promise<boolean> {
    try {
      for (const itemId of itemIds) {
        await db
          .update(invoiceItems)
          .set({ invoiceId })
          .where(eq(invoiceItems.id, itemId));
      }
      return true;
    } catch (error) {
      console.error('Error assigning items to invoice:', error);
      return false;
    }
  }
  
  async deleteInvoiceItem(id: number): Promise<boolean> {
    const result = await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
    return result.rowCount > 0;
  }
  
  generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `F${year}${month}-${randomNum}`;
  }
}

// Initialize example data
export async function initializeData() {
  const storage = new DatabaseStorage();
  
  // Check if we already have customers
  const customers = await storage.getCustomers();
  
  if (customers.length === 0) {
    console.log('Initializing database with sample data...');
    
    // Add sample customers
    await storage.createCustomer({
      name: "Cliënt A",
      email: "client-a@example.com",
      address: "Hoofdstraat 1, 1234 AB Amsterdam",
      phoneNumber: "020-1234567"
    });
    
    await storage.createCustomer({
      name: "Bedrijf B",
      email: "info@bedrijfb.nl",
      address: "Zakenweg 10, 5678 CD Utrecht",
      phoneNumber: "030-7654321"
    });
    
    // Add sample rates
    await storage.createRate({
      code: "CONSULT",
      description: "Consult 60 minuten",
      amount: 85,
      period: "per sessie",
      vatRate: 21,
      defaultQuantity: 1
    });
    
    await storage.createRate({
      code: "MASSAGE",
      description: "Massage behandeling",
      amount: 65,
      period: "per behandeling",
      vatRate: 21,
      defaultQuantity: 1
    });
    
    await storage.createRate({
      code: "COACHING",
      description: "Coaching sessie",
      amount: 110,
      period: "per uur",
      vatRate: 21,
      defaultQuantity: 1
    });
    
    await storage.createRate({
      code: "TRAJECT",
      description: "Compleet begeleidingstraject",
      amount: 750,
      period: "per traject",
      vatRate: 21,
      defaultQuantity: 1
    });
    
    console.log('Sample data initialized');
  }
  
  return storage;
}