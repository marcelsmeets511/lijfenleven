import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Customers table (cliënten)
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  phoneNumber: text("phone_number"),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  email: true,
  address: true,
  phoneNumber: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Rates table (tarieven)
export const rates = pgTable("rates", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  period: text("period").notNull(), // per uur, per sessie, etc.
  vatRate: doublePrecision("vat_rate").notNull(),
  defaultQuantity: doublePrecision("default_quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRateSchema = createInsertSchema(rates).pick({
  code: true,
  description: true,
  amount: true,
  period: true,
  vatRate: true,
  defaultQuantity: true,
});

export type InsertRate = z.infer<typeof insertRateSchema>;
export type Rate = typeof rates.$inferSelect;

// Invoice statuses
export enum InvoiceStatus {
  DRAFT = "draft",
  PENDING = "pending",
  SENT = "sent",
  PAID = "paid",
}

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  vatAmount: doublePrecision("vat_amount").notNull(),
  total: doublePrecision("total").notNull(),
  status: text("status").notNull().default(InvoiceStatus.DRAFT),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  invoiceNumber: true,
  customerId: true,
  issueDate: true,
  dueDate: true,
  subtotal: true,
  vatAmount: true,
  total: true,
  status: true,
  notes: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice items table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id"),
  customerId: integer("customer_id").notNull(),
  rateId: integer("rate_id"),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  vatRate: doublePrecision("vat_rate").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  vatAmount: doublePrecision("vat_amount").notNull(),
  total: doublePrecision("total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // If invoiceId is null, the item has not been assigned to an invoice
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).pick({
  invoiceId: true,
  customerId: true,
  rateId: true,
  description: true,
  quantity: true,
  unitPrice: true,
  vatRate: true,
  subtotal: true,
  vatAmount: true,
  total: true,
});

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
