import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Building2,
  Filter,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getQueryFn } from "@/lib/queryClient";

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  razao_social: string;
  status: 'ativa' | 'inativa';
}

interface AccountPayable {
  id: string;
  description: string;
  amount: string;
  lateFees?: string | number | null;
  discount?: string | number | null;
  dueDate: string;
  paymentDate: string | null;
  status: 'pending' | 'paid' | 'overdue';
  supplierId: string;
  categoryId: string;
  companyId: string;
  supplierName?: string;
  categoryName?: string;
}

interface AccountReceivable {
  id: string;
  description: string;
  amount: string;
  discount?: string | number | null;
  dueDate: string;
  receivedDate: string | null;
  status: 'pending' | 'received' | 'overdue';
  clientId: string;
  categoryId: string;
  companyId: string;
  clientName?: string;
  categoryName?: string;
}

interface CashFlowEntry {
  id: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  date: string;
  status: 'confirmed' | 'pending'; // Assuming manual entries can also have a status
  companyId: string;
  categoryId?: string;
}

export default function CashFlow() {
  console.log("[DEBUG] CashFlow component montado!");
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(() => {
    const stored = localStorage.getItem('empresaAtiva');
    if (stored) {
      try {
        const empresa = JSON.parse(stored);
        return empresa.id || "all";
      } catch (e) {
        return "all";
      }
    }
    return "all";
  });
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());

  // Calcular datas baseadas no mês e ano selecionados
  const startDate = new Date(Date.UTC(selectedYear, selectedMonth, 1)).toISOString().split("T")[0];
  const endDate = new Date(Date.UTC(selectedYear, selectedMonth + 1, 0)).toISOString().split("T")[0];

  // Carregar empresa ativa do localStorage
  React.useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('empresaAtiva');
      if (stored) {
        try {
          const empresa = JSON.parse(stored);
          setSelectedCompanyId(empresa.id || "all");
        } catch (e) { }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Buscar empresas
  const { data: empresas, isLoading: empresasLoading } = useQuery<Empresa[]>({
    queryKey: ["/api/companies"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar contas a pagar
  const { data: accountsPayable, isLoading: payableLoading } = useQuery<AccountPayable[]>({
    queryKey: ["/api/accounts-payable", { companyId: selectedCompanyId, startDate, endDate, status: 'active' }],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar contas a receber
  const { data: accountsReceivable, isLoading: receivableLoading } = useQuery<AccountReceivable[]>({
    queryKey: ["/api/accounts-receivable", { companyId: selectedCompanyId, startDate, endDate, status: 'active' }],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar movimentações manuais do fluxo de caixa
  const { data: cashFlowEntries, isLoading: cashFlowLoading } = useQuery<CashFlowEntry[]>({
    queryKey: ["/api/cash-flow/entries", { companyId: selectedCompanyId }],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar categorias para nomes
  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Filtrar movimentações manuais pelo período selecionado
  const filteredCashFlowEntries = React.useMemo(() => {
    if (!cashFlowEntries) return [];
    return cashFlowEntries.filter(e => e.date >= startDate && e.date <= endDate);
  }, [cashFlowEntries, startDate, endDate]);

  // Calcular totais
  const totalPayable = accountsPayable?.reduce((sum, acc) => {
    const amt = parseFloat(acc.amount) || 0;
    const fees = parseFloat(acc.lateFees as string) || 0;
    const disc = parseFloat(acc.discount as string) || 0;
    return sum + (amt + fees - disc);
  }, 0) || 0;

  const totalReceivable = accountsReceivable?.reduce((sum, acc) => {
    const amt = parseFloat(acc.amount) || 0;
    const disc = parseFloat(acc.discount as string) || 0;
    return sum + (amt - disc);
  }, 0) || 0;

  // Incluir movimentações manuais nos totais
  const totalManualIncome = filteredCashFlowEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0) || 0;
  const totalManualExpense = filteredCashFlowEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0) || 0;

  const totalPayablePending = accountsPayable?.filter(a => a.status === 'pending').reduce((sum, acc) => {
    const amt = parseFloat(acc.amount) || 0;
    const fees = parseFloat(acc.lateFees as string) || 0;
    const disc = parseFloat(acc.discount as string) || 0;
    return sum + (amt + fees - disc);
  }, 0) || 0;

  const totalReceivablePending = accountsReceivable?.filter(a => a.status === 'pending').reduce((sum, acc) => {
    const amt = parseFloat(acc.amount) || 0;
    const disc = parseFloat(acc.discount as string) || 0;
    return sum + (amt - disc);
  }, 0) || 0;

  const totalPayablePaid = accountsPayable?.filter(a => a.status === 'paid').reduce((sum, acc) => {
    const amt = parseFloat(acc.amount) || 0;
    const fees = parseFloat(acc.lateFees as string) || 0;
    const disc = parseFloat(acc.discount as string) || 0;
    return sum + (amt + fees - disc);
  }, 0) || 0;

  const totalReceivableReceived = accountsReceivable?.filter(a => a.status === 'received').reduce((sum, acc) => {
    const amt = parseFloat(acc.amount) || 0;
    const disc = parseFloat(acc.discount as string) || 0;
    return sum + (amt - disc);
  }, 0) || 0;

  const totalPayableOverdue = accountsPayable?.filter(a => a.status === 'overdue').reduce((sum, acc) => {
    const amt = parseFloat(acc.amount) || 0;
    const fees = parseFloat(acc.lateFees as string) || 0;
    const disc = parseFloat(acc.discount as string) || 0;
    return sum + (amt + fees - disc);
  }, 0) || 0;

  const totalReceivableOverdue = accountsReceivable?.filter(a => a.status === 'overdue').reduce((sum, acc) => {
    const amt = parseFloat(acc.amount) || 0;
    const disc = parseFloat(acc.discount as string) || 0;
    return sum + (amt - disc);
  }, 0) || 0;

  const totalManualPendingIncome = filteredCashFlowEntries.filter(e => e.type === 'income' && e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0) || 0;
  const totalManualPendingExpense = filteredCashFlowEntries.filter(e => e.type === 'expense' && e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0) || 0;

  const balance = (totalReceivable + totalManualIncome) - (totalPayable + totalManualExpense);
  const balancePending = totalReceivablePending - totalPayablePending + totalManualPendingIncome - totalManualPendingExpense;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "received":
      case "confirmed": // For manual entries
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "received":
        return "Recebido";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Vencido";
      case "confirmed": // For manual entries
        return "Confirmado";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "received":
      case "confirmed": // For manual entries
        return <CheckCircle className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "overdue":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="flex-1 bg-background p-6 md:p-10 overflow-x-hidden">
      <div className="w-full space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-violet-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter mb-3">
              Fluxo de Caixa
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Gestão inteligente de entradas e saídas
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-3xl border border-border/50 backdrop-blur-sm">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-full sm:w-48 h-12 rounded-2xl bg-background border-primary/20 focus:ring-primary whitespace-nowrap">
                <Building2 className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-primary/20">
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {empresas?.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-full sm:w-40 h-12 rounded-2xl bg-background border-primary/20 focus:ring-primary">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-primary/20">
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-full sm:w-32 h-12 rounded-2xl bg-background border-primary/20 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-primary/20">
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {/* Total Entradas */}
          <Card className="border-0 shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-3xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <CardContent className="p-6 text-white h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Entradas</p>
                  <div className="text-2xl font-black tracking-tight mb-2">
                    {receivableLoading || cashFlowLoading ? (
                      <Skeleton className="h-8 w-24 bg-white/20" />
                    ) : (
                      formatCurrency(totalReceivable + totalManualIncome)
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                <Activity className="h-3 w-3" />
                <span>{(accountsReceivable?.length || 0) + filteredCashFlowEntries.filter(e => e.type === 'income').length} Movimentos</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Saídas */}
          <Card className="border-0 shadow-2xl shadow-rose-500/10 bg-gradient-to-br from-rose-500 to-red-700 rounded-3xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <CardContent className="p-6 text-white h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Saídas</p>
                  <div className="text-2xl font-black tracking-tight mb-2">
                    {payableLoading || cashFlowLoading ? (
                      <Skeleton className="h-8 w-24 bg-white/20" />
                    ) : (
                      formatCurrency(totalPayable + totalManualExpense)
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                <Activity className="h-3 w-3" />
                <span>{(accountsPayable?.length || 0) + filteredCashFlowEntries.filter(e => e.type === 'expense').length} Movimentos</span>
              </div>
            </CardContent>
          </Card>

          {/* Entradas Pendentes */}
          <Card className="border-0 shadow-2xl shadow-cyan-500/10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl overflow-hidden group hover:scale-[1.03] transition-all duration-500 outline-none ring-1 ring-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <CardContent className="p-6 text-white h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pendente (In)</p>
                  <div className="text-2xl font-black tracking-tight mb-2">
                    {receivableLoading || cashFlowLoading ? (
                      <Skeleton className="h-8 w-24 bg-white/20" />
                    ) : (
                      formatCurrency(totalReceivablePending + filteredCashFlowEntries.filter(e => e.type === 'income' && e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0))
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="text-white/50 text-[10px] font-bold uppercase">Previsão</div>
            </CardContent>
          </Card>

          {/* Saídas Pendentes */}
          <Card className="border-0 shadow-2xl shadow-amber-500/10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl overflow-hidden group hover:scale-[1.03] transition-all duration-500 outline-none ring-1 ring-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <CardContent className="p-6 text-white h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pendente (Out)</p>
                  <div className="text-2xl font-black tracking-tight mb-2">
                    {payableLoading || cashFlowLoading ? (
                      <Skeleton className="h-8 w-24 bg-white/20" />
                    ) : (
                      formatCurrency(totalPayablePending + filteredCashFlowEntries.filter(e => e.type === 'expense' && e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0))
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="text-white/50 text-[10px] font-bold uppercase">Previsão</div>
            </CardContent>
          </Card>

          {/* Saldo Total */}
          <Card className={cn(
            "border-0 shadow-2xl rounded-3xl overflow-hidden group hover:scale-[1.03] transition-all duration-500 outline-none ring-1 ring-white/5",
            balance >= 0 ? 'shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-green-700' : 'shadow-red-500/10 bg-gradient-to-br from-red-500 to-rose-700'
          )}>
            <CardContent className="p-6 text-white h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Líquido</p>
                  <div className="text-2xl font-black tracking-tight mb-2">
                    {receivableLoading || payableLoading || cashFlowLoading ? (
                      <Skeleton className="h-8 w-24 bg-white/20" />
                    ) : (
                      formatCurrency(balance)
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                  {balance >= 0 ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                <Activity className="h-3 w-3" />
                <span>Performance {balance >= 0 ? 'Positiva' : 'Crítica'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Saldo Pendente */}
          <Card className="border-0 shadow-2xl shadow-primary/10 bg-gradient-to-br from-primary via-violet-600 to-indigo-700 rounded-3xl overflow-hidden group hover:scale-[1.03] transition-all duration-500 outline-none ring-1 ring-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <CardContent className="p-6 text-white h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Projeção</p>
                  <div className="text-2xl font-black tracking-tight mb-2">
                    {receivableLoading || payableLoading || cashFlowLoading ? (
                      <Skeleton className="h-8 w-24 bg-white/20" />
                    ) : (
                      formatCurrency(balancePending + filteredCashFlowEntries.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.type === 'income' ? parseFloat(e.amount?.toString() || "0") : -parseFloat(e.amount?.toString() || "0")), 0))
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Futuro</div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas - Layout Melhorado */}
        {(totalPayableOverdue > 0 || totalReceivableOverdue > 0) && (
          <Card className="shadow-2xl shadow-rose-500/5 border-0 bg-gradient-to-br from-rose-50/50 to-amber-50/50 dark:from-rose-950/20 dark:to-amber-950/20 rounded-3xl overflow-hidden ring-1 ring-rose-500/10">
            <CardHeader className="bg-rose-500/5 dark:bg-rose-500/10 border-b border-rose-500/10">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 bg-rose-500/10 rounded-xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <span className="tracking-tight">Alertas Críticos</span>
                  <p className="text-[10px] text-rose-500/70 uppercase font-black tracking-widest mt-0.5">Ações Requeridas</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-5">
              {totalPayableOverdue > 0 && (
                <div className="flex items-center gap-5 p-5 bg-white/50 dark:bg-rose-900/10 rounded-2xl border border-rose-500/10 shadow-sm group hover:scale-[1.01] transition-transform">
                  <div className="p-3.5 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl">
                    <AlertCircle className="h-7 w-7 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-rose-500/60 uppercase tracking-widest">Contas a Pagar</p>
                    <p className="text-2xl font-black text-foreground tracking-tight">{formatCurrency(totalPayableOverdue)} em atraso</p>
                  </div>
                  <Badge className="bg-rose-500 text-white font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">URGENTE</Badge>
                </div>
              )}
              {totalReceivableOverdue > 0 && (
                <div className="flex items-center gap-5 p-5 bg-white/50 dark:bg-amber-900/10 rounded-2xl border border-amber-500/10 shadow-sm group hover:scale-[1.01] transition-transform">
                  <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl">
                    <AlertCircle className="h-7 w-7 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-amber-500/60 uppercase tracking-widest">Contas a Receber</p>
                    <p className="text-2xl font-black text-foreground tracking-tight">{formatCurrency(totalReceivableOverdue)} em atraso</p>
                  </div>
                  <Badge className="bg-amber-500 text-white font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">ATENÇÃO</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabela Detalhada Combinada - Melhorada */}
        <Card className="shadow-2xl shadow-primary/5 border-0 rounded-3xl overflow-hidden bg-card">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="tracking-tighter">Movimentações Detalhadas</span>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Visão Analítica de Transações</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(() => {
              const allTransactions = [
                ...(accountsReceivable?.map(acc => ({
                  id: acc.id,
                  type: 'receivable' as const,
                  date: acc.dueDate,
                  description: acc.description,
                  amount: parseFloat(acc.amount),
                  status: acc.status,
                  companyId: acc.companyId,
                  categoryName: acc.categoryName,
                  isManual: false,
                })) || []),
                ...(accountsPayable?.map(acc => ({
                  id: acc.id,
                  type: 'payable' as const,
                  date: acc.dueDate,
                  description: acc.description,
                  amount: parseFloat(acc.amount) + (parseFloat(acc.lateFees?.toString() || "0") - parseFloat(acc.discount?.toString() || "0")),
                  status: acc.status,
                  companyId: acc.companyId,
                  categoryName: acc.categoryName,
                  isManual: false,
                })) || []),
                ...(filteredCashFlowEntries?.map(entry => ({
                  id: entry.id,
                  type: entry.type === 'income' ? 'receivable' as const : 'payable' as const,
                  date: entry.date,
                  description: entry.description,
                  amount: parseFloat(entry.amount || '0'),
                  status: 'paid',
                  companyId: '', // Varejo
                  categoryName: categories?.find(c => c.id === entry.categoryId)?.name || 'Varejo',
                  isManual: true,
                })) || [])
              ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              if (receivableLoading || payableLoading || cashFlowLoading) {
                return (
                  <div className="p-10 space-y-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-1/3 rounded-lg" />
                          <Skeleton className="h-4 w-full rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (allTransactions.length > 0) {
                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border/50 bg-muted/20">
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-4">Fluxo</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-4">Data</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-4">Descrição</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-4">Categoria</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-4 text-right">Montante</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-4">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransactions.map((transaction, index) => {
                          const empresa = empresas?.find(e => e.id === transaction.companyId);
                          return (
                            <TableRow
                              key={`${transaction.type}-${transaction.id}`}
                              className="group border-b border-border/30 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="px-6 py-4">
                                <div className={cn(
                                  "flex items-center gap-2 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg w-fit",
                                  transaction.type === 'receivable' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                )}>
                                  {transaction.type === 'receivable' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                  {transaction.type === 'receivable' ? 'Entrada' : 'Saída'}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 opacity-50" />
                                  {formatDate(transaction.date)}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="text-sm font-black text-foreground tracking-tight line-clamp-1">{transaction.description}</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{empresa?.nome || 'Geral'}</span>
                                    {('isManual' in transaction && transaction.isManual) && (
                                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[9px] font-black h-4 px-1">VAREJO</Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md">
                                  {transaction.categoryName || 'S/ CAT'}
                                </Badge>
                              </TableCell>
                              <TableCell className={cn(
                                "px-6 py-4 text-right font-black text-lg tracking-tighter",
                                transaction.type === 'receivable' ? 'text-emerald-600' : 'text-rose-600'
                              )}>
                                {transaction.type === 'receivable' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className={cn(
                                  "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full w-fit border shadow-sm",
                                  transaction.status === 'paid' || transaction.status === 'received' || transaction.status === 'confirmed'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30'
                                    : transaction.status === 'overdue'
                                      ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30'
                                      : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30'
                                )}>
                                  {getStatusIcon(transaction.status)}
                                  {getStatusLabel(transaction.status)}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              } else {
                return (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-6 bg-muted/50 rounded-3xl mb-4 group-hover:scale-110 transition-transform duration-500">
                      <Calendar className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Nenhuma movimentação</h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-[250px] mx-auto mt-2">
                      Adicione transações no varejo ou contas para ver o fluxo.
                    </p>
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>

        {/* Movimentações Manuais (Vendas Varejo) - Design Melhorado */}
        <Card className="shadow-2xl shadow-primary/5 border-0 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 group">
          <CardHeader className="border-b border-emerald-500/10 py-8 px-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tighter">Movimentações Manuais</CardTitle>
                  <p className="text-[10px] text-emerald-600 uppercase font-black tracking-[0.2em] mt-1">Sincronização Varejo</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/entries"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/retail-sales"] });
                  }}
                  variant="outline"
                  className="h-12 px-6 rounded-2xl bg-white border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary font-bold shadow-sm active:scale-95 transition-all"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Atualizar Dados de Vendas
                </Button>
                <div className="text-right border-l pl-6 border-emerald-500/10">
                  <p className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">
                    {cashFlowEntries?.length || 0}
                  </p>
                  <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest mt-1">Registros</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            {cashFlowLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
              </div>
            ) : filteredCashFlowEntries && filteredCashFlowEntries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCashFlowEntries.map((entry) => {
                  const categoryName = entry.categoryId ? categories?.find(c => c.id === entry.categoryId)?.name : null;
                  return (
                    <div key={entry.id} className="relative bg-white dark:bg-muted/10 p-6 rounded-3xl border border-primary/5 shadow-xl shadow-primary/5 hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase",
                          entry.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        )}>
                          {entry.type === 'income' ? 'Entrada' : 'Saída'}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-foreground mb-1 line-clamp-1">{entry.description}</h4>
                      {categoryName && (
                        <div className="flex items-center gap-1.5 mt-2 mb-4">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{categoryName}</span>
                        </div>
                      )}
                      <div className={cn(
                        "text-2xl font-black tracking-tighter mt-auto",
                        entry.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {entry.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat((entry.amount || "0").toString()))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-5 bg-emerald-500/5 rounded-3xl mb-4">
                  <TrendingUp className="h-10 w-10 text-emerald-500/40" />
                </div>
                <h4 className="text-lg font-black tracking-tight">Sem movimentações</h4>
                <p className="text-xs text-muted-foreground font-medium max-w-[200px] mx-auto mt-2">Vendas manuais e lançamentos diretos aparecerão aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabelas de Contas a Receber e Pagar Lado a Lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contas a Receber - Melhorada */}
          <Card className="shadow-2xl shadow-emerald-500/5 border-0 rounded-3xl overflow-hidden bg-card">
            <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-emerald-600">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <span className="tracking-tighter">Contas a Receber</span>
                  <p className="text-[10px] text-emerald-500/70 uppercase font-black tracking-widest mt-0.5">Entradas Previstas</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {receivableLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : accountsReceivable && accountsReceivable.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/50 bg-emerald-500/5">
                        <TableHead className="font-black text-[9px] uppercase tracking-widest px-6 py-3">Venc.</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest px-6 py-3">Descrição</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest px-6 py-3 text-right">Valor</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest px-6 py-3">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountsReceivable.map((account) => (
                        <TableRow key={account.id} className="border-b border-border/30 hover:bg-emerald-500/5 transition-colors">
                          <TableCell className="px-6 py-4 text-xs font-bold text-muted-foreground">{formatDate(account.dueDate)}</TableCell>
                          <TableCell className="px-6 py-4 text-sm font-black tracking-tight">{account.description}</TableCell>
                          <TableCell className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(parseFloat(account.amount))}</TableCell>
                          <TableCell className="px-6 py-4">
                            <div className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border w-fit shadow-xs",
                              account.status === 'received' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'
                            )}>
                              {getStatusLabel(account.status)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <ArrowUpRight className="h-10 w-10 text-emerald-500/20 mx-auto mb-3" />
                  <p className="text-xs font-black text-muted-foreground uppercase opacity-50 tracking-widest">Sem Receitas</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contas a Pagar - Melhorada */}
          <Card className="shadow-2xl shadow-rose-500/5 border-0 rounded-3xl overflow-hidden bg-card">
            <CardHeader className="bg-rose-500/5 border-b border-rose-500/10">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-rose-600">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
                <div>
                  <span className="tracking-tighter">Contas a Pagar</span>
                  <p className="text-[10px] text-rose-500/70 uppercase font-black tracking-widest mt-0.5">Saídas Previstas</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payableLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : accountsPayable && accountsPayable.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/50 bg-rose-500/5">
                        <TableHead className="font-black text-[9px] uppercase tracking-widest px-6 py-3">Venc.</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest px-6 py-3">Descrição</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest px-6 py-3 text-right">Valor</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest px-6 py-3">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountsPayable.map((account) => (
                        <TableRow key={account.id} className="border-b border-border/30 hover:bg-rose-500/5 transition-colors">
                          <TableCell className="px-6 py-4 text-xs font-bold text-muted-foreground">{formatDate(account.dueDate)}</TableCell>
                          <TableCell className="px-6 py-4 text-sm font-black tracking-tight">{account.description}</TableCell>
                          <TableCell className="px-6 py-4 text-right font-black text-rose-600">-{formatCurrency(parseFloat(account.amount) + (parseFloat(account.lateFees as string) || 0) - (parseFloat(account.discount as string) || 0))}</TableCell>
                          <TableCell className="px-6 py-4">
                            <div className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border w-fit shadow-xs",
                              account.status === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'
                            )}>
                              {getStatusLabel(account.status)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <ArrowDownRight className="h-10 w-10 text-rose-500/20 mx-auto mb-3" />
                  <p className="text-xs font-black text-muted-foreground uppercase opacity-50 tracking-widest">Sem Despesas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Resumo Visual Final */}
        <Card className="shadow-2xl shadow-primary/10 border-0 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-12 text-white relative">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Wallet className="h-32 w-32" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-10">
              <div className="space-y-2">
                <Badge className="bg-primary/20 text-primary-foreground border-primary/30 font-black tracking-widest px-4 py-1.5 rounded-full">RELATÓRIO SEMANAL</Badge>
                <h2 className="text-4xl font-black tracking-tighter">Performance do Período</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 flex flex-col items-center">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Total Receitas</p>
                  <div className="text-3xl font-black text-emerald-400 tracking-tighter">
                    {formatCurrency(totalReceivable + totalManualIncome)}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-white/20 text-[10px] font-bold">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{accountsReceivable?.length || 0} Contas Ativas</span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 flex flex-col items-center">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Total Despesas</p>
                  <div className="text-3xl font-black text-rose-400 tracking-tighter">
                    {formatCurrency(totalPayable + totalManualExpense)}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-white/20 text-[10px] font-bold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{accountsPayable?.length || 0} Contas Ativas</span>
                  </div>
                </div>

                <div className={cn(
                  "p-8 rounded-3xl border flex flex-col items-center shadow-lg",
                  balance >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                )}>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Saldo Consolidado</p>
                  <div className={cn(
                    "text-4xl font-black tracking-tighter",
                    balance >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {formatCurrency(balance)}
                  </div>
                  <Badge className={cn(
                    "mt-4 font-black text-[9px] tracking-widest px-3 py-1 rounded-lg",
                    balance >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  )}>
                    {balance >= 0 ? 'LUCRO' : 'DÉFICIT'}
                  </Badge>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 w-full max-w-2xl flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-widest">
                <span>{monthNames[selectedMonth]} {selectedYear}</span>
                <span className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" />
                  {empresas?.find(e => e.id === selectedCompanyId)?.nome || 'Consolidado Global'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
