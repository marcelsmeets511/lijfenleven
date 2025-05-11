import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface PrintableInvoiceProps {
  invoice: any;
  customer: any;
  items: any[];
}

const PrintableInvoice = ({ invoice, customer, items }: PrintableInvoiceProps) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Factuur-${invoice.invoiceNumber}`,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: nl });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Button onClick={handlePrint} className="bg-primary text-white">
          Afdrukken naar PDF
        </Button>
      </div>

      {/* Printable invoice content */}
      <div ref={componentRef} className="p-8 max-w-4xl mx-auto bg-white shadow-none print:shadow-none">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">FACTUUR</h2>
            <p className="text-gray-600">Factuurnummer: {invoice.invoiceNumber}</p>
            <p className="text-gray-600">Datum: {formatDate(invoice.issueDate)}</p>
            <p className="text-gray-600">Vervaldatum: {formatDate(invoice.dueDate)}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold text-primary">FactuurPro</h3>
            <p className="text-gray-600">Voorbeeldstraat 123</p>
            <p className="text-gray-600">1234 AB Amsterdam</p>
            <p className="text-gray-600">info@factuurpro.nl</p>
            <p className="text-gray-600">BTW: NL123456789B01</p>
            <p className="text-gray-600">KVK: 12345678</p>
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        <div className="mb-6">
          <h4 className="text-gray-700 font-semibold mb-2">Factuuradres</h4>
          <p className="text-gray-600">{customer?.name}</p>
          <p className="text-gray-600">{customer?.address}</p>
          <p className="text-gray-600">{customer?.email}</p>
          <p className="text-gray-600">{customer?.phoneNumber}</p>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Omschrijving</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aantal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BTW %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totaal</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items?.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.vatRate}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end">
          <div className="w-80">
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="text-gray-600">Subtotaal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="text-gray-600">BTW</span>
              <span className="font-medium">{formatCurrency(invoice.vatAmount)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-b border-gray-200 text-lg font-bold">
              <span>Totaal</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-gray-600 text-sm">
          <p>Betaling graag binnen 14 dagen na factuurdatum.</p>
          <p>Bankgegevens: NL02 ABNA 0123 4567 89 t.n.v. FactuurPro</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
