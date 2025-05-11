/**
 * Calculate subtotal from an array of invoice items
 */
export const calculateSubtotal = (items: any[]): number => {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
};

/**
 * Calculate VAT amount from an array of invoice items
 */
export const calculateVatAmount = (items: any[]): number => {
  return items.reduce((sum, item) => sum + item.vatAmount, 0);
};

/**
 * Calculate total from an array of invoice items
 */
export const calculateTotal = (items: any[]): number => {
  return items.reduce((sum, item) => sum + item.total, 0);
};

/**
 * Generate a new invoice number based on the current date and a sequential number
 */
export const generateInvoiceNumber = (prefix = "F", sequentialNumber = 1): string => {
  const now = new Date();
  const year = now.getFullYear();
  return `${prefix}-${year}-${String(sequentialNumber).padStart(4, "0")}`;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

/**
 * Calculate due date based on issue date and days until due
 */
export const calculateDueDate = (issueDate: Date, daysUntilDue = 14): Date => {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + daysUntilDue);
  return dueDate;
};

/**
 * Sort invoice items by date (newest first)
 */
export const sortItemsByDate = (items: any[]): any[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date);
    const dateB = new Date(b.createdAt || b.date);
    return dateB.getTime() - dateA.getTime();
  });
};
