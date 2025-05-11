import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InvoiceItemsTable from "@/components/InvoiceItemsTable";
import InvoicePreview from "@/components/InvoicePreview";
import PrintableInvoice from "@/components/PrintableInvoice";
import { apiRequest } from "@/lib/queryClient";
import { 
  calculateSubtotal, 
  calculateVatAmount, 
  calculateTotal 
} from "@/lib/invoiceUtils";
import { Printer, Download, Mail } from "lucide-react";

const InvoicePrinting = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: invoiceItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['/api/invoice-items/unassigned'],
  });

  // Query for getting a specific customer
  const { data: selectedCustomerData } = useQuery({
    queryKey: ['/api/customers', parseInt(selectedCustomer)],
    enabled: !!selectedCustomer,
  });

  // Query for getting items for a specific invoice
  const { data: invoiceItemsData } = useQuery({
    queryKey: ['/api/invoices', previewInvoiceId, 'items'],
    enabled: !!previewInvoiceId,
  });

  const handleItemSelect = (id: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-items'] });
      refetchItems();
      setSelectedItems([]);
      setPreviewInvoiceId(data.id);
      setCreatedInvoice(data);
      setIsPreviewOpen(true);
      toast({
        title: "Factuur aangemaakt",
        description: `Factuur ${data.invoiceNumber} is succesvol aangemaakt.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateInvoice = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Geen items geselecteerd",
        description: "Selecteer minimaal één factuuritem om een factuur aan te maken.",
        variant: "destructive",
      });
      return;
    }

    // Get selected items data
    const items = invoiceItems.filter((item: any) => selectedItems.includes(item.id));
    
    // Calculate totals
    const subtotal = calculateSubtotal(items);
    const vatAmount = calculateVatAmount(items);
    const total = calculateTotal(items);
    
    // Get customer ID from the first item (assuming all items have the same customer)
    const customerId = items[0].customerId;

    // Create invoice
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14); // Due in 14 days
    
    createInvoiceMutation.mutate({
      customerId,
      issueDate: today.toISOString(),
      dueDate: dueDate.toISOString(),
      subtotal,
      vatAmount,
      total,
      status: "pending",
      itemIds: selectedItems
    });
  };

  const handlePreviewConfirm = () => {
    setIsPreviewOpen(false);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="printen-section" className="my-12 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Facturen Printen</CardTitle>
              <CardDescription>
                Combineer factuuritems en exporteer als PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter options */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6">
                <div className="sm:col-span-2">
                  <Label htmlFor="filter-customer">Klant</Label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                  >
                    <SelectTrigger id="filter-customer" className="w-full mt-1">
                      <SelectValue placeholder="Alle klanten" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle klanten</SelectItem>
                      {customers.map((customer: any) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="filter-start-date">Startdatum</Label>
                  <Input
                    id="filter-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="filter-end-date">Einddatum</Label>
                  <Input
                    id="filter-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Invoice Items Table */}
              <InvoiceItemsTable
                customerId={selectedCustomer ? parseInt(selectedCustomer) : undefined}
                startDate={startDate}
                endDate={endDate}
                selectedItems={selectedItems}
                onItemSelect={handleItemSelect}
              />

              {/* Action buttons */}
              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={handleCreateInvoice}
                  disabled={selectedItems.length === 0 || createInvoiceMutation.isPending}
                  className="inline-flex items-center"
                >
                  <Printer className="-ml-1 mr-2 h-5 w-5" />
                  Geselecteerde items factureren
                </Button>
                
                <Button
                  variant="outline"
                  disabled={!createdInvoice}
                  className="inline-flex items-center"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Download className="-ml-1 mr-2 h-5 w-5 text-dark-medium" />
                  Downloaden als PDF
                </Button>
                
                <Button
                  variant="outline"
                  disabled={!createdInvoice}
                  className="inline-flex items-center"
                >
                  <Mail className="-ml-1 mr-2 h-5 w-5 text-dark-medium" />
                  Verzenden per e-mail
                </Button>
              </div>

              {/* Preview invoice dialog */}
              {previewInvoiceId && (
                <InvoicePreview
                  open={isPreviewOpen}
                  onOpenChange={setIsPreviewOpen}
                  invoiceId={previewInvoiceId}
                  onConfirm={handlePreviewConfirm}
                />
              )}

              {/* Show printable invoice if one was created */}
              {createdInvoice && invoiceItemsData && selectedCustomerData && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Gecreëerde Factuur</h3>
                  <PrintableInvoice
                    invoice={createdInvoice}
                    customer={selectedCustomerData}
                    items={invoiceItemsData}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrinting;
