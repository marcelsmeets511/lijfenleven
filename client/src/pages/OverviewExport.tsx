import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/invoiceUtils";
import { exportInvoicesToExcel } from "@/lib/excelExport";
import { generateReportPDF, savePDF } from "@/lib/pdfGenerator";
import { Download, FileText, Mail } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type ReportType = "invoices" | "customers" | "vat" | "revenue";

const OverviewExport = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("invoices");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: invoices = [] } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: invoiceItems = [] } = useQuery({
    queryKey: ['/api/invoice-items'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd-MM-yyyy', { locale: nl });
    } catch (error) {
      return dateString;
    }
  };

  // Filter data based on selected date range
  const filteredInvoices = invoices.filter((invoice: any) => {
    if (!startDate && !endDate) return true;
    
    const invoiceDate = new Date(invoice.issueDate);
    
    if (startDate && new Date(startDate) > invoiceDate) {
      return false;
    }
    
    if (endDate && new Date(endDate) < invoiceDate) {
      return false;
    }
    
    return true;
  });

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : 'Onbekend';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'pending':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Betaald';
      case 'sent':
        return 'Verzonden';
      case 'pending':
        return 'Open';
      case 'draft':
        return 'Concept';
      default:
        return status;
    }
  };

  // Calculate totals for the filtered invoices
  const totalSubtotal = filteredInvoices.reduce((sum: number, invoice: any) => sum + invoice.subtotal, 0);
  const totalVAT = filteredInvoices.reduce((sum: number, invoice: any) => sum + invoice.vatAmount, 0);
  const totalAmount = filteredInvoices.reduce((sum: number, invoice: any) => sum + invoice.total, 0);
  const paidAmount = filteredInvoices
    .filter((invoice: any) => invoice.status === 'paid')
    .reduce((sum: number, invoice: any) => sum + invoice.total, 0);
  const unpaidAmount = totalAmount - paidAmount;

  const handleExportToExcel = async () => {
    try {
      await exportInvoicesToExcel(filteredInvoices, invoiceItems, customers);
      toast({
        title: "Export geslaagd",
        description: "De gegevens zijn succesvol geëxporteerd naar Excel.",
      });
    } catch (error) {
      toast({
        title: "Export mislukt",
        description: `Er is een fout opgetreden: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDFReport = () => {
    try {
      // Prepare headers and rows
      const headers = ['Factuurnummer', 'Klant', 'Datum', 'Subtotaal', 'BTW', 'Totaal', 'Status'];
      
      const rows = filteredInvoices.map((invoice: any) => [
        invoice.invoiceNumber,
        getCustomerName(invoice.customerId),
        formatDate(invoice.issueDate),
        formatCurrency(invoice.subtotal),
        formatCurrency(invoice.vatAmount),
        formatCurrency(invoice.total),
        getStatusText(invoice.status)
      ]);
      
      // Summary data
      const summary = [
        { label: "Subtotaal:", value: formatCurrency(totalSubtotal) },
        { label: "BTW:", value: formatCurrency(totalVAT) },
        { label: "Totaal:", value: formatCurrency(totalAmount) },
        { label: "Betaald:", value: formatCurrency(paidAmount) },
        { label: "Openstaand:", value: formatCurrency(unpaidAmount) }
      ];
      
      // Generate title based on date range
      let title = "Factuuroverzicht";
      let subtitle = "Alle facturen";
      
      if (startDate && endDate) {
        subtitle = `Periode: ${formatDate(startDate)} t/m ${formatDate(endDate)}`;
      } else if (startDate) {
        subtitle = `Vanaf ${formatDate(startDate)}`;
      } else if (endDate) {
        subtitle = `Tot ${formatDate(endDate)}`;
      }
      
      const pdfBlob = generateReportPDF(title, subtitle, headers, rows, summary);
      savePDF(pdfBlob, `Factuuroverzicht_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF gegenereerd",
        description: "Het PDF rapport is succesvol gegenereerd.",
      });
    } catch (error) {
      toast({
        title: "PDF genereren mislukt",
        description: `Er is een fout opgetreden: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleEmailReport = () => {
    toast({
      title: "Email verzenden",
      description: "Deze functie is nog niet geïmplementeerd.",
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="overzicht-section" className="my-12 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Overzicht & Export</CardTitle>
              <CardDescription>
                Exporteer uw factuurgegevens naar Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Report filters */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6">
                <div className="sm:col-span-2">
                  <Label htmlFor="report-type">Rapporttype</Label>
                  <Select
                    value={reportType}
                    onValueChange={(value) => setReportType(value as ReportType)}
                  >
                    <SelectTrigger id="report-type" className="w-full mt-1">
                      <SelectValue placeholder="Selecteer rapporttype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoices">Factuuroverzicht</SelectItem>
                      <SelectItem value="customers">Klantoverzicht</SelectItem>
                      <SelectItem value="vat">BTW-overzicht</SelectItem>
                      <SelectItem value="revenue">Omzetoverzicht</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="report-start-date">Startdatum</Label>
                  <Input
                    id="report-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="report-end-date">Einddatum</Label>
                  <Input
                    id="report-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Financial dashboard visual */}
              <div className="mt-6">
                <h4 className="text-base font-medium text-dark mb-3">Voorbeeld rapport</h4>
                
                {/* Financial metrics summary */}
                <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                      <div className="text-sm text-gray-500">Totaal gefactureerd</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
                      <div className="text-sm text-gray-500">Betaald</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{formatCurrency(unpaidAmount)}</div>
                      <div className="text-sm text-gray-500">Openstaand</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{formatCurrency(totalVAT)}</div>
                      <div className="text-sm text-gray-500">BTW</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Factuurnummer</TableHead>
                        <TableHead>Klant</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Subtotaal</TableHead>
                        <TableHead>BTW</TableHead>
                        <TableHead>Totaal</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice: any) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="text-sm">{invoice.invoiceNumber}</TableCell>
                            <TableCell className="text-sm">{getCustomerName(invoice.customerId)}</TableCell>
                            <TableCell className="text-sm text-gray-600">{formatDate(invoice.issueDate)}</TableCell>
                            <TableCell className="text-sm text-gray-600">{formatCurrency(invoice.subtotal)}</TableCell>
                            <TableCell className="text-sm text-gray-600">{formatCurrency(invoice.vatAmount)}</TableCell>
                            <TableCell className="text-sm font-medium">{formatCurrency(invoice.total)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusBadgeVariant(invoice.status)}>
                                {getStatusText(invoice.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                            Geen facturen gevonden voor de geselecteerde periode
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Export buttons */}
              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={handleExportToExcel}
                  className="inline-flex items-center"
                >
                  <Download className="-ml-1 mr-2 h-5 w-5" />
                  Exporteren naar Excel
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleGeneratePDFReport}
                  className="inline-flex items-center"
                >
                  <FileText className="-ml-1 mr-2 h-5 w-5 text-gray-600" />
                  PDF Rapportage
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleEmailReport}
                  className="inline-flex items-center"
                >
                  <Mail className="-ml-1 mr-2 h-5 w-5 text-gray-600" />
                  Rapportage e-mailen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OverviewExport;
