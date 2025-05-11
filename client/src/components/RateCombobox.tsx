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

interface Rate {
  id: number;
  code: string;
  description: string;
  amount: number;
  period: string;
  vatRate: number;
  defaultQuantity: number;
}

interface RateComboboxProps {
  rates: Rate[];
  value: string;
  onChange: (value: string, rate?: Rate) => void;
  formatCurrency: (amount: number) => string;
}

export function RateCombobox({ rates, value, onChange, formatCurrency }: RateComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRates, setFilteredRates] = useState<Rate[]>(rates);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = rates.filter(rate => 
        rate.code.toLowerCase().includes(query) || 
        rate.description.toLowerCase().includes(query)
      );
      setFilteredRates(filtered);
    } else {
      setFilteredRates(rates);
    }
  }, [searchQuery, rates]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const selectedRate = rates.find(rate => rate.id.toString() === value);

  const handleSelect = (value: string) => {
    const rate = rates.find(r => r.id.toString() === value);
    onChange(value, rate);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && value !== "0" && selectedRate
            ? `${selectedRate.code} - ${selectedRate.description}`
            : value === "0"
            ? "Eigen omschrijving"
            : "Selecteer een tarief (optioneel)"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="flex items-center space-x-2 p-2 border-b">
          <Input 
            className="w-full"
            placeholder="Zoek een tarief..." 
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <div
            className={cn(
              "flex items-center px-3 py-2 cursor-pointer hover:bg-accent",
              value === "0" && "bg-accent"
            )}
            onClick={() => handleSelect("0")}
          >
            <div className="font-medium">Eigen omschrijving</div>
            {value === "0" && (
              <Check className="ml-auto h-4 w-4 text-primary" />
            )}
          </div>
          {filteredRates.length > 0 ? (
            filteredRates.map(rate => (
              <div
                key={rate.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent",
                  value === rate.id.toString() && "bg-accent"
                )}
                onClick={() => handleSelect(rate.id.toString())}
              >
                <div>
                  <p className="font-medium">{rate.code} - {rate.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(rate.amount)} {rate.period} | BTW: {rate.vatRate}%
                  </p>
                </div>
                {value === rate.id.toString() && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-center text-sm text-muted-foreground">
              Geen tarieven gevonden
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}