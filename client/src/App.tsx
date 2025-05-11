import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import QuickEntry from "@/pages/QuickEntry";
import InvoicePrinting from "@/pages/InvoicePrinting";
import OverviewExport from "@/pages/OverviewExport";
import Customers from "@/pages/Customers";
import Rates from "@/pages/Rates";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/quick-entry" component={QuickEntry} />
          <Route path="/invoice-printing" component={InvoicePrinting} />
          <Route path="/customers" component={Customers} />
          <Route path="/rates" component={Rates} />
          <Route path="/overview-export" component={OverviewExport} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
