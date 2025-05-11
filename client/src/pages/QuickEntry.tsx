import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InvoiceItemForm from "@/components/InvoiceItemForm";
import { CustomerCombobox } from "@/components/CustomerCombobox";
import { apiRequest } from "@/lib/queryClient";

const QuickEntry = () => {
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Fout",
        description: "Selecteer een klant om door te gaan.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Opgeslagen",
      description: "De factuuritems zijn succesvol opgeslagen.",
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="invoeren-section" className="my-12 pt-4">
          <Card>
            <CardHeader className="px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Snel Invoeren</CardTitle>
                <CardDescription>
                  Voer nieuwe factuuritems in
                </CardDescription>
              </div>
              <Button onClick={handleSave}>
                Opslaan
              </Button>
            </CardHeader>
            <CardContent className="px-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <Label htmlFor="customer">Klant</Label>
                  <div className="mt-1">
                    <CustomerCombobox
                      customers={customers as any[]}
                      value={selectedCustomer}
                      onChange={setSelectedCustomer}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="invoice-date">Factuurdatum</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="invoice-nr">Factuurnummer</Label>
                  <Input
                    id="invoice-nr"
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="mt-1 bg-gray-50"
                    disabled
                    placeholder="Automatisch gegenereerd"
                  />
                </div>

                <div className="sm:col-span-6">
                  <InvoiceItemForm 
                    customerId={selectedCustomer ? parseInt(selectedCustomer) : undefined}
                    onItemAdded={() => {
                      toast({
                        title: "Item toegevoegd",
                        description: "Het factuuritem is succesvol toegevoegd.",
                      })
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuickEntry;
