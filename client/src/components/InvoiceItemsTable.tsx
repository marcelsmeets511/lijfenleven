import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface InvoiceItemsTableProps {
  customerId?: number;
  startDate?: string;
  endDate?: string;
  selectedItems: number[];
  onItemSelect: (id: number, isChecked: boolean) => void;
}

const InvoiceItemsTable = ({ 
  customerId, 
  startDate, 
  endDate, 
  selectedItems, 
  onItemSelect 
}: InvoiceItemsTableProps) => {
  const [selectAll, setSelectAll] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['/api/invoice-items/unassigned'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd-MM-yyyy', { locale: nl });
    } catch (error) {
      return dateString;
    }
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : 'Onbekend';
  };

  const filteredItems = items.filter((item: any) => {
    // Filter by customer if customerId is provided
    if (customerId && item.customerId !== customerId) {
      return false;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      const itemDate = new Date(item.createdAt);
      if (startDate && new Date(startDate) > itemDate) {
        return false;
      }
      if (endDate && new Date(endDate) < itemDate) {
        return false;
      }
    }
    
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    
    // Select or deselect all visible items
    filteredItems.forEach((item: any) => {
      onItemSelect(item.id, checked);
    });
  };

  if (isLoading) {
    return <div className="text-center py-4">Bezig met laden van factuuritems...</div>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-base font-medium text-dark mb-3">Beschikbare factuuritems</h4>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectAll} 
                  onCheckedChange={handleSelectAll} 
                />
              </TableHead>
              <TableHead>Klant</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Bedrag</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => {
                        onItemSelect(item.id, !!checked);
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{getCustomerName(item.customerId)}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(item.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      Wacht op facturatie
                    </Badge>
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
  );
};

export default InvoiceItemsTable;
