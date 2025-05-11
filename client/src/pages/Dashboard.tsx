import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/StatCard";
import QuickLink from "@/components/QuickLink";
import { formatCurrency } from "@/lib/invoiceUtils";
import {
  FileText,
  DollarSign,
  CheckCircle,
  Users,
  Plus,
  Printer,
  BarChart
} from "lucide-react";

const Dashboard = () => {
  const { data: invoices = [] } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: invoiceItems = [] } = useQuery({
    queryKey: ['/api/invoice-items'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Calculate dashboard statistics
  const totalInvoices = invoices.length;
  
  const toBePaid = invoices
    .filter((invoice: any) => invoice.status === 'pending' || invoice.status === 'sent')
    .reduce((sum: number, invoice: any) => sum + invoice.total, 0);
  
  const paid = invoices
    .filter((invoice: any) => invoice.status === 'paid')
    .reduce((sum: number, invoice: any) => sum + invoice.total, 0);
  
  const totalCustomers = customers.length;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-dark">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<FileText className="h-6 w-6 text-white" />}
            title="Totaal facturen"
            value={totalInvoices}
            bgColor="bg-primary"
            link="/invoice-printing"
            linkText="Bekijk alle facturen"
          />

          <StatCard
            icon={<DollarSign className="h-6 w-6 text-white" />}
            title="Te betalen"
            value={formatCurrency(toBePaid)}
            bgColor="bg-accent"
            link="/invoice-printing"
            linkText="Bekijk openstaande betalingen"
          />

          <StatCard
            icon={<CheckCircle className="h-6 w-6 text-white" />}
            title="Betaald"
            value={formatCurrency(paid)}
            bgColor="bg-secondary"
            link="/invoice-printing"
            linkText="Bekijk betaalde facturen"
          />

          <StatCard
            icon={<Users className="h-6 w-6 text-white" />}
            title="Totaal klanten"
            value={totalCustomers}
            bgColor="bg-info"
            link="/customers"
            linkText="Bekijk alle klanten"
          />
        </div>

        {/* Quick Links Section */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-dark">Snelle acties</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              icon={<Plus className="h-6 w-6" />}
              title="Snel Invoeren"
              description="Voer factuuritems snel in"
              link="/quick-entry"
              linkText="Nu invoeren"
              bgColor="bg-primary bg-opacity-10"
              iconColor="text-primary"
            />

            <QuickLink
              icon={<Printer className="h-6 w-6" />}
              title="Facturen Printen"
              description="Combineer items en maak PDF's"
              link="/invoice-printing"
              linkText="Nu printen"
              bgColor="bg-secondary bg-opacity-10"
              iconColor="text-secondary"
            />

            <QuickLink
              icon={<BarChart className="h-6 w-6" />}
              title="Overzicht"
              description="Exporteer gegevens naar Excel"
              link="/overview-export"
              linkText="Exporteren"
              bgColor="bg-accent bg-opacity-10"
              iconColor="text-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
