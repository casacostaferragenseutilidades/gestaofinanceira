import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Loader2, StickyNote } from "lucide-react";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contas-pagar" component={AccountsPayable} />
      <Route path="/contas-receber" component={AccountsReceivable} />
      <Route path="/vendas-varejo" component={RetailSales} />
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
        <Button variant="ghost" size="icon" data-testid="button-user-menu">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="flex flex-col items-start gap-0">
          <span className="font-medium">{user.fullName || "Usuário"}</span>
          <span className="text-xs text-muted-foreground">{user.team || user.role}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} data-testid="button-logout">
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <EmpresaSelector />
              <Link href="/anotacoes">
                <Button variant="ghost" size="icon" title="Anotações">
                  <StickyNote className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </Link>
              <Notifications />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">
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
        <TooltipProvider>
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
