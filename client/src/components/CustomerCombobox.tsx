import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface CustomerComboboxProps {
  customers: Customer[];
  value: string;
  onChange: (value: string) => void;
}

export function CustomerCombobox({ customers, value, onChange }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const selectedCustomer = customers.find(customer => customer.id.toString() === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && selectedCustomer
            ? selectedCustomer.name
            : "Selecteer een klant"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="flex items-center space-x-2 p-2 border-b">
          <Input 
            className="w-full"
            placeholder="Zoek een klant..." 
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent",
                  value === customer.id.toString() && "bg-accent"
                )}
                onClick={() => {
                  onChange(customer.id.toString());
                  setOpen(false);
                  setSearchQuery("");
                }}
              >
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                </div>
                {value === customer.id.toString() && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-center text-sm text-muted-foreground">
              Geen klanten gevonden
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}