import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Loader2, StickyNote } from "lucide-react";
import { Notifications } from "@/components/notifications";
import { EmpresaSelector } from "@/components/EmpresaSelector";
import Dashboard from "@/pages/dashboard";
import AccountsPayable from "@/pages/accounts-payable";
import AccountsReceivable from "@/pages/accounts-receivable";
import CashFlow from "@/pages/cash-flow";
import DRE from "@/pages/dre";
import FinancialGoals from "@/pages/financial-goals";
import Reports from "@/pages/reports";
import Suppliers from "@/pages/suppliers";
import SupplierDetails from "@/pages/supplier-details";
import Clients from "@/pages/clients";
import ClientDetails from "@/pages/client-details";
import Categories from "@/pages/categories";
import CostCenters from "@/pages/cost-centers";
import UsersPage from "@/pages/users";
import Login from "@/pages/login";
import NotesPage from "@/pages/notes";
import EmpresasPage from "@/pages/EmpresasPage";
import ReceiptsControl from "@/pages/receipts-control";
import PaymentSettings from "@/pages/payment-settings";
import RetailSales from "@/pages/retail-sales";
import OrcamentosPage from "@/pages/orcamentos";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contas-pagar" component={AccountsPayable} />
      <Route path="/contas-receber" component={AccountsReceivable} />
      <Route path="/vendas-varejo" component={RetailSales} />
      <Route path="/orcamentos" component={OrcamentosPage} />
      <Route path="/fluxo-caixa" component={CashFlow} />
      <Route path="/dre" component={DRE} />
      <Route path="/metas-financeiras" component={FinancialGoals} />
      <Route path="/controle-recebimentos" component={ReceiptsControl} />
      <Route path="/configuracoes-pagamento" component={PaymentSettings} />
      <Route path="/relatorios" component={Reports} />
      <Route path="/fornecedores" component={Suppliers} />
      <Route path="/fornecedores/:id" component={SupplierDetails} />
      <Route path="/clientes" component={Clients} />
      <Route path="/clientes/:id" component={ClientDetails} />
      <Route path="/categorias" component={Categories} />
      <Route path="/centros-custo" component={CostCenters} />
      <Route path="/usuarios" component={UsersPage} />
      <Route path="/anotacoes" component={NotesPage} />
      <Route path="/empresas" component={EmpresasPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = (user.fullName || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-user-menu" className="rounded-full">
          <Avatar className="h-8 w-8 ring-2 ring-blue-100 ring-offset-1">
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem disabled className="flex flex-col items-start gap-0 opacity-100">
          <span className="font-semibold text-slate-800">{user.fullName || "Usuário"}</span>
          <span className="text-xs text-slate-400">{user.team || user.role}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} data-testid="button-logout" className="text-red-600 focus:text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-[#F8FAFC]">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100" />
            <div className="flex items-center gap-1.5">
              <EmpresaSelector />
              <Link href="/anotacoes">
                <Button variant="ghost" size="icon" title="Anotações" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                  <StickyNote className="h-[1.1rem] w-[1.1rem]" />
                </Button>
              </Link>
              <Notifications />
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="fincontrol-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <AuthProvider>
            <AuthenticatedApp />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
