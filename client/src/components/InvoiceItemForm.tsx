import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X } from "lucide-react";
import { RateCombobox } from "./RateCombobox";

const itemSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  quantity: z.coerce.number().min(0.01, "Aantal moet groter zijn dan 0"),
  unitPrice: z.coerce.number().min(0, "Prijs moet 0 of hoger zijn"),
  vatRate: z.coerce.number().min(0, "BTW tarief moet 0 of hoger zijn"),
  customerId: z.coerce.number(),
  invoiceId: z.coerce.number().optional(),
  rateId: z.coerce.number().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface InvoiceItemFormProps {
  customerId?: number;
  invoiceId?: number;
  onItemAdded?: () => void;
}

const InvoiceItemForm = ({ customerId, invoiceId, onItemAdded }: InvoiceItemFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);

  const { data: customersData = [] } = useQuery({
    queryKey: ['/api/customers'],
    enabled: !customerId
  });

  const { data: ratesData = [] } = useQuery({
    queryKey: ['/api/rates']
  });

  const { data: invoiceItems = [] } = useQuery({
    queryKey: ['/api/invoice-items'],
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (invoiceItems && Array.isArray(invoiceItems)) {
      // Filter items that belong to this invoice or are unassigned
      const relevantItems = invoiceItems.filter((item: any) => 
        !item.invoiceId || (invoiceId && item.invoiceId === invoiceId)
      );
      setItems(relevantItems);
    }
  }, [invoiceItems, invoiceId]);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      description: "",
      quantity: 1,
      unitPrice: 0,
      vatRate: 21,
      customerId: customerId || 0,
      invoiceId: invoiceId,
      rateId: undefined,
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: ItemFormValues) => {
      const response = await apiRequest("POST", "/api/invoice-items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-items'] });
      form.reset({
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatRate: 21,
        customerId: customerId || 0,
        invoiceId: invoiceId,
        rateId: undefined,
      });
      toast({
        title: "Item toegevoegd",
        description: "Het factuuritem is succesvol toegevoegd.",
      });
      if (onItemAdded) onItemAdded();
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoice-items/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-items'] });
      setItems(items.filter(item => item.id !== id));
      toast({
        title: "Item verwijderd",
        description: "Het factuuritem is succesvol verwijderd.",
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

  const onSubmit = (data: ItemFormValues) => {
    addItemMutation.mutate(data);
  };

  const calculateTotal = (quantity: number, price: number) => {
    return (quantity * price).toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div>
      <div className="bg-gray-50 p-4 rounded-md mb-4">
        <h4 className="text-base font-medium text-dark mb-3">Factuuritems</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Aantal</TableHead>
                <TableHead>Prijs</TableHead>
                <TableHead>BTW</TableHead>
                <TableHead>Totaal</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items && items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{item.vatRate}%</TableCell>
                    <TableCell>{formatCurrency(item.total)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Verwijderen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    Geen factuuritems gevonden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {!customerId && (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Klant</FormLabel>
                    <CustomerCombobox
                      customers={customers as any[]}
                      value={field.value?.toString()}
                      onChange={(value) => field.onChange(parseInt(value))}
                     >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een klant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customersData?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </CustomerCombobox>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="rateId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Tarief</FormLabel>
                    <FormControl>
                      <RateCombobox
                        rates={ratesData as any[] || []}
                        value={field.value?.toString() || "0"}
                        onChange={(value, rate) => {
                          if (value && value !== "0") {
                            // Als een tarief is geselecteerd, update ook de andere velden
                            if (rate) {
                              form.setValue("rateId", parseInt(value));
                              form.setValue("description", rate.description);
                              form.setValue("unitPrice", rate.amount);
                              form.setValue("vatRate", rate.vatRate);
                              form.setValue("quantity", rate.defaultQuantity);
                            }
                          } else {
                            // Als "eigen omschrijving" is geselecteerd
                            form.setValue("rateId", undefined);
                          }
                        }}
                        formatCurrency={formatCurrency}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Omschrijving</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel>Aantal</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0.01" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel>Prijs (€)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel>BTW %</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="BTW %" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="9">9%</SelectItem>
                        <SelectItem value="21">21%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="sm:col-span-6">
                <Button 
                  type="submit" 
                  disabled={addItemMutation.isPending}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {addItemMutation.isPending ? "Bezig met toevoegen..." : "Item toevoegen"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceItemForm;
