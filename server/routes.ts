import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertCustomerSchema, 
  insertRateSchema,
  insertInvoiceItemSchema, 
  insertInvoiceSchema,
  InvoiceStatus
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Helper function to validate request body with zod
function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      throw new Error(validationError.message);
    }
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Customers API routes
  app.get("/api/customers", async (_req: Request, res: Response) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get("/api/customers/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const customer = await storage.getCustomer(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.json(customer);
  });

  app.post("/api/customers", async (req: Request, res: Response) => {
    try {
      const customerData = validateRequest(insertCustomerSchema, req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put("/api/customers/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    try {
      const customerData = validateRequest(insertCustomerSchema.partial(), req.body);
      const customer = await storage.updateCustomer(id, customerData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/customers/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const success = await storage.deleteCustomer(id);
    if (!success) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.status(204).end();
  });

  // Rates (Tarieven) API routes
  app.get("/api/rates", async (_req: Request, res: Response) => {
    const rates = await storage.getRates();
    res.json(rates);
  });

  app.get("/api/rates/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid rate ID" });
    }
    
    const rate = await storage.getRate(id);
    if (!rate) {
      return res.status(404).json({ message: "Rate not found" });
    }
    
    res.json(rate);
  });

  app.post("/api/rates", async (req: Request, res: Response) => {
    try {
      const rateData = validateRequest(insertRateSchema, req.body);
      const rate = await storage.createRate(rateData);
      res.status(201).json(rate);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put("/api/rates/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid rate ID" });
    }
    
    try {
      const rateData = validateRequest(insertRateSchema.partial(), req.body);
      const rate = await storage.updateRate(id, rateData);
      if (!rate) {
        return res.status(404).json({ message: "Rate not found" });
      }
      
      res.json(rate);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/rates/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid rate ID" });
    }
    
    const success = await storage.deleteRate(id);
    if (!success) {
      return res.status(404).json({ message: "Rate not found" });
    }
    
    res.status(204).end();
  });

  // Invoice Items API routes
  app.get("/api/invoice-items", async (_req: Request, res: Response) => {
    const items = await storage.getInvoiceItems();
    res.json(items);
  });

  app.get("/api/invoice-items/unassigned", async (_req: Request, res: Response) => {
    const items = await storage.getUnassignedInvoiceItems();
    res.json(items);
  });
  
  app.get("/api/invoice-items/customer/:customerId", async (req: Request, res: Response) => {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    const items = await storage.getInvoiceItemsByCustomer(customerId);
    res.json(items);
  });

  app.get("/api/invoice-items/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice item ID" });
    }
    
    const item = await storage.getInvoiceItem(id);
    if (!item) {
      return res.status(404).json({ message: "Invoice item not found" });
    }
    
    res.json(item);
  });

  app.post("/api/invoice-items", async (req: Request, res: Response) => {
    try {
      // Calculate totals before creating
      const itemData = {
        ...req.body,
        subtotal: req.body.quantity * req.body.unitPrice,
        vatAmount: (req.body.quantity * req.body.unitPrice) * (req.body.vatRate / 100),
      };
      
      itemData.total = itemData.subtotal + itemData.vatAmount;
      
      const validatedItem = validateRequest(insertInvoiceItemSchema, itemData);
      const item = await storage.createInvoiceItem(validatedItem);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put("/api/invoice-items/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice item ID" });
    }
    
    try {
      // For updates we want to recalculate totals if necessary values changed
      const existingItem = await storage.getInvoiceItem(id);
      if (!existingItem) {
        return res.status(404).json({ message: "Invoice item not found" });
      }
      
      let itemData = { ...req.body };
      
      // If any of the values that affect the calculation changed, recalculate
      if (
        'quantity' in itemData || 
        'unitPrice' in itemData || 
        'vatRate' in itemData
      ) {
        const quantity = itemData.quantity ?? existingItem.quantity;
        const unitPrice = itemData.unitPrice ?? existingItem.unitPrice;
        const vatRate = itemData.vatRate ?? existingItem.vatRate;
        
        const subtotal = quantity * unitPrice;
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;
        
        itemData = {
          ...itemData,
          subtotal,
          vatAmount,
          total
        };
      }
      
      const validatedItem = validateRequest(insertInvoiceItemSchema.partial(), itemData);
      const updatedItem = await storage.updateInvoiceItem(id, validatedItem);
      
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/invoice-items/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice item ID" });
    }
    
    const success = await storage.deleteInvoiceItem(id);
    if (!success) {
      return res.status(404).json({ message: "Invoice item not found" });
    }
    
    res.status(204).end();
  });

  // Invoices API routes
  app.get("/api/invoices", async (_req: Request, res: Response) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.json(invoice);
  });

  app.get("/api/invoices/:id/items", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    const items = await storage.getInvoiceItemsByInvoice(id);
    res.json(items);
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      // Generate invoice number if not provided
      if (!req.body.invoiceNumber) {
        req.body.invoiceNumber = (storage as any).generateInvoiceNumber();
      }
      
      const validatedInvoice = validateRequest(insertInvoiceSchema, req.body);
      const invoice = await storage.createInvoice(validatedInvoice);
      
      // If itemIds were provided, assign them to this invoice
      if (req.body.itemIds && Array.isArray(req.body.itemIds)) {
        await storage.assignInvoiceItemsToInvoice(req.body.itemIds, invoice.id);
      }
      
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put("/api/invoices/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    try {
      const invoiceData = validateRequest(insertInvoiceSchema.partial(), req.body);
      const invoice = await storage.updateInvoice(id, invoiceData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put("/api/invoices/:id/status", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    try {
      const status = req.body.status;
      if (!Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
        return res.status(400).json({ message: "Invalid invoice status" });
      }
      
      const invoice = await storage.updateInvoiceStatus(id, status as InvoiceStatus);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/invoices/:id/items", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    try {
      const itemIds = req.body.itemIds;
      if (!itemIds || !Array.isArray(itemIds)) {
        return res.status(400).json({ message: "Item IDs must be provided as an array" });
      }
      
      const success = await storage.assignInvoiceItemsToInvoice(itemIds, id);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.status(200).json({ message: "Items assigned to invoice successfully" });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    const success = await storage.deleteInvoice(id);
    if (!success) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.status(204).end();
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
