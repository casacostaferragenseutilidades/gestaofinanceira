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
import { formatCurrency, formatDate } from "@/lib/utils";
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
  dueDate: string;
  receivedDate: string | null;
  status: 'pending' | 'received' | 'overdue';
  clientId: string;
  categoryId: string;
  companyId: string;
  clientName?: string;
  categoryName?: string;
}

export default function CashFlow() {
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
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth()); // Janeiro = 0, Fevereiro = 1, etc.
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());

  // Calcular datas baseadas no mês e ano selecionados (corrigido para evitar problemas de fuso horário)
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

  // Buscar contas a pagar (todas ou filtradas) - apenas com status ativo
  const { data: accountsPayable, isLoading: payableLoading } = useQuery<AccountPayable[]>({
    queryKey: ["/api/accounts-payable", { companyId: selectedCompanyId, startDate, endDate, status: 'active' }],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar contas a receber (todas ou filtradas) - apenas com status ativo
  const { data: accountsReceivable, isLoading: receivableLoading } = useQuery<AccountReceivable[]>({
    queryKey: ["/api/accounts-receivable", { companyId: selectedCompanyId, startDate, endDate, status: 'active' }],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Calcular totais
  const totalPayable = accountsPayable?.reduce((sum, acc) => sum + parseFloat(acc.amount), 0) || 0;
  const totalReceivable = accountsReceivable?.reduce((sum, acc) => sum + parseFloat(acc.amount), 0) || 0;
  const totalPayablePending = accountsPayable?.filter(a => a.status === 'pending').reduce((sum, acc) => sum + parseFloat(acc.amount), 0) || 0;
  const totalReceivablePending = accountsReceivable?.filter(a => a.status === 'pending').reduce((sum, acc) => sum + parseFloat(acc.amount), 0) || 0;
  const totalPayablePaid = accountsPayable?.filter(a => a.status === 'paid').reduce((sum, acc) => sum + parseFloat(acc.amount), 0) || 0;
  const totalReceivableReceived = accountsReceivable?.filter(a => a.status === 'received').reduce((sum, acc) => sum + parseFloat(acc.amount), 0) || 0;
  const totalPayableOverdue = accountsPayable?.filter(a => a.status === 'overdue').reduce((sum, acc) => sum + parseFloat(acc.amount), 0) || 0;
  const totalReceivableOverdue = accountsReceivable?.filter(a => a.status === 'overdue').reduce((sum, acc) => sum + parseFloat(acc.amount), 0) || 0;

  const balance = totalReceivable - totalPayable;
  const balancePending = totalReceivablePending - totalPayablePending;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "received":
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
        return "Atrasado";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "received":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const empresaAtual = empresas?.find(e => e.id === selectedCompanyId);

  return (
    <div className="space-y-8">
      {/* Header - Melhorado */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Fluxo de Caixa</h1>
          <p className="text-lg text-muted-foreground">
            Gestão completa de Contas a Pagar e Receber
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sistema Financeiro</span>
          </div>
        </div>
      </div>

      {/* Filtro de Empresa - Ultra Compacto */}
      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950 dark:to-gray-950 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span>Filtros Rápidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Empresa */}
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empresa</Label>
              <Select value={selectedCompanyId} onValueChange={(value) => setSelectedCompanyId(value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="text-sm">Todas</span>
                    </div>
                  </SelectItem>
                  {empresasLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        <span className="text-sm">Carregando...</span>
                      </div>
                    </SelectItem>
                  ) : empresas && empresas.length > 0 ? (
                    empresas.filter(e => e.status === 'ativa').map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="text-sm truncate max-w-[180px]">{empresa.nome}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      <span className="text-sm">Nenhuma empresa</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Ano */}
            <div className="lg:w-32 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ano</Label>
              <div className="grid grid-cols-2 gap-1">
                {[2025, 2026].map((year) => (
                  <Button
                    key={year}
                    variant={selectedYear === year ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedYear(year)}
                    className={`h-9 text-xs font-medium ${selectedYear === year ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mês */}
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mês</Label>
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 12 }).map((_, i) => {
                  const date = new Date(2024, i, 1);
                  const monthCode = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                  const isSelected = selectedMonth === i;

                  return (
                    <Button
                      key={i}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedMonth(i)}
                      title={date.toLocaleString('pt-BR', { month: 'long' })}
                      className={`h-7 text-xs font-medium ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                    >
                      {monthCode}
                    </Button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Status Compacto */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedCompanyId === "all" ? (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                    <Building2 className="h-3 w-3" />
                    <span className="font-medium">{empresas?.filter(e => e.status === 'ativa').length || 0} empresas</span>
                  </div>
                ) : empresaAtual && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <Building2 className="h-3 w-3" />
                    <span className="font-medium truncate max-w-[150px]">{empresaAtual.nome}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(selectedYear, selectedMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo - Layout Dinâmico */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">Total a Receber</p>
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {receivableLoading ? (
                    <Skeleton className="h-10 w-28" />
                  ) : (
                    formatCurrency(totalReceivable)
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Clock className="h-3 w-3" />
                  <span>Pendente: {formatCurrency(totalReceivablePending)}</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full group-hover:scale-110 transition-transform">
                <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Total a Pagar</p>
                </div>
                <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {payableLoading ? (
                    <Skeleton className="h-10 w-28" />
                  ) : (
                    formatCurrency(totalPayable)
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <Clock className="h-3 w-3" />
                  <span>Pendente: {formatCurrency(totalPayablePending)}</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full group-hover:scale-110 transition-transform">
                <ArrowDownRight className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${balance >= 0 ? 'from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800' : 'from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 ${balance >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-orange-100 dark:bg-orange-900'} rounded-lg`}>
                    <Wallet className={`h-4 w-4 ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
                  </div>
                  <p className={`text-sm font-semibold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Saldo Total</p>
                </div>
                <div className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-orange-900 dark:text-orange-100'}`}>
                  {receivableLoading || payableLoading ? (
                    <Skeleton className="h-10 w-28" />
                  ) : (
                    formatCurrency(balance)
                  )}
                </div>
                <div className={`flex items-center gap-2 text-sm ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{balance >= 0 ? 'Positivo' : 'Negativo'}</span>
                </div>
              </div>
              <div className={`p-3 ${balance >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-orange-100 dark:bg-orange-900'} rounded-full group-hover:scale-110 transition-transform`}>
                <Wallet className={`h-6 w-6 ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${balancePending >= 0 ? 'from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800' : 'from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 ${balancePending >= 0 ? 'bg-purple-100 dark:bg-purple-900' : 'bg-yellow-100 dark:bg-yellow-900'} rounded-lg`}>
                    <TrendingUp className={`h-4 w-4 ${balancePending >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                  </div>
                  <p className={`text-sm font-semibold ${balancePending >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600 dark:text-yellow-400'}`}>Saldo Pendente</p>
                </div>
                <div className={`text-3xl font-bold ${balancePending >= 0 ? 'text-purple-900 dark:text-purple-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
                  {receivableLoading || payableLoading ? (
                    <Skeleton className="h-10 w-28" />
                  ) : (
                    formatCurrency(balancePending)
                  )}
                </div>
                <div className={`flex items-center gap-2 text-sm ${balancePending >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  <Activity className="h-3 w-3" />
                  <span>A receber - A pagar</span>
                </div>
              </div>
              <div className={`p-3 ${balancePending >= 0 ? 'bg-purple-100 dark:bg-purple-900' : 'bg-yellow-100 dark:bg-yellow-900'} rounded-full group-hover:scale-110 transition-transform`}>
                <TrendingUp className={`h-6 w-6 ${balancePending >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas - Layout Melhorado */}
      {(totalPayableOverdue > 0 || totalReceivableOverdue > 0) && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
          <CardHeader className="bg-orange-100/30 dark:bg-orange-900/30">
            <CardTitle className="text-xl flex items-center gap-3 text-orange-700 dark:text-orange-300">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <span>Alertas Financeiros</span>
                <p className="text-sm text-muted-foreground font-normal">Atenção às movimentações críticas</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {totalPayableOverdue > 0 && (
              <div className="flex items-center gap-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-100">Contas a Pagar Atrasadas</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{formatCurrency(totalPayableOverdue)} em atraso</p>
                </div>
                <div className="px-3 py-1 bg-red-200 dark:bg-red-800 rounded-full">
                  <span className="text-xs font-bold text-red-800 dark:text-red-200">URGENTE</span>
                </div>
              </div>
            )}
            {totalReceivableOverdue > 0 && (
              <div className="flex items-center gap-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">Contas a Receber Atrasadas</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{formatCurrency(totalReceivableOverdue)} em atraso</p>
                </div>
                <div className="px-3 py-1 bg-yellow-200 dark:bg-yellow-800 rounded-full">
                  <span className="text-xs font-bold text-yellow-800 dark:text-yellow-200">ATENÇÃO</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabela Detalhada Combinada - Melhorada */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span>Movimentações Detalhadas</span>
              <p className="text-sm text-muted-foreground font-normal">Visão completa de todas as transações</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {receivableLoading || payableLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (() => {
            // Combinar contas a pagar e receber
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
                clientName: acc.clientName,
              })) || []),
              ...(accountsPayable?.map(acc => ({
                id: acc.id,
                type: 'payable' as const,
                date: acc.dueDate,
                description: acc.description,
                amount: parseFloat(acc.amount),
                status: acc.status,
                companyId: acc.companyId,
                categoryName: acc.categoryName,
                supplierName: acc.supplierName,
              })) || []),
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return allTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 bg-muted/30">
                      <TableHead className="font-semibold text-sm">Tipo</TableHead>
                      <TableHead className="font-semibold text-sm">Vencimento</TableHead>
                      <TableHead className="font-semibold text-sm">Descrição</TableHead>
                      <TableHead className="font-semibold text-sm">Empresa</TableHead>
                      <TableHead className="font-semibold text-sm">Categoria</TableHead>
                      <TableHead className="font-semibold text-sm text-right">Valor</TableHead>
                      <TableHead className="font-semibold text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTransactions.map((transaction, index) => {
                      const empresa = empresas?.find(e => e.id === transaction.companyId);
                      return (
                        <TableRow
                          key={`${transaction.type}-${transaction.id}`}
                          className={`hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                        >
                          <TableCell>
                            <Badge className={`${transaction.type === 'receivable' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300'} px-3 py-1`}>
                              <div className="flex items-center gap-2">
                                {transaction.type === 'receivable' ? (
                                  <>
                                    <ArrowUpRight className="h-4 w-4" />
                                    <span className="font-medium">Receber</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownRight className="h-4 w-4" />
                                    <span className="font-medium">Pagar</span>
                                  </>
                                )}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{formatDate(transaction.date)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-[300px]">
                            <div className="truncate" title={transaction.description}>
                              {transaction.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{empresa?.nome || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal text-xs px-2 py-1">
                              {transaction.categoryName || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-bold text-lg ${transaction.type === 'receivable' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {transaction.type === 'receivable' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(transaction.status)} px-3 py-1`}>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(transaction.status)}
                                <span className="font-medium">{getStatusLabel(transaction.status)}</span>
                              </div>
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma movimentação encontrada</h3>
                <p className="text-muted-foreground max-w-md">
                  Não há contas a pagar ou receber no período selecionado. Tente ajustar os filtros ou cadastrar novas movimentações.
                </p>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Tabelas Separadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas a Receber - Melhorada */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardTitle className="flex items-center gap-3 text-xl text-green-700 dark:text-green-300">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <span>Contas a Receber</span>
                <p className="text-sm text-muted-foreground font-normal">Entradas previstas e realizadas</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {receivableLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : accountsReceivable && accountsReceivable.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 bg-green-50/30 dark:bg-green-950/30">
                      <TableHead className="font-semibold text-sm">Vencimento</TableHead>
                      <TableHead className="font-semibold text-sm">Data Real</TableHead>
                      <TableHead className="font-semibold text-sm">Descrição</TableHead>
                      <TableHead className="font-semibold text-sm text-right">Valor</TableHead>
                      <TableHead className="font-semibold text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsReceivable.map((account, index) => (
                      <TableRow
                        key={account.id}
                        className={`hover:bg-green-50/20 dark:hover:bg-green-950/20 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium">{formatDate(account.dueDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {account.receivedDate ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {formatDate(account.receivedDate)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-[250px]">
                          <div className="truncate" title={account.description}>
                            {account.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg text-green-600 dark:text-green-400">
                          +{formatCurrency(parseFloat(account.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(account.status)} px-3 py-1`}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(account.status)}
                              <span className="font-medium">{getStatusLabel(account.status)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-full mb-4">
                  <ArrowUpRight className="h-12 w-12 text-green-500 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma conta a receber</h3>
                <p className="text-muted-foreground max-w-md">
                  Não há contas a receber no período selecionado. Tente ajustar os filtros ou cadastrar novas receitas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contas a Pagar - Melhorada */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950">
            <CardTitle className="flex items-center gap-3 text-xl text-red-700 dark:text-red-300">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <span>Contas a Pagar</span>
                <p className="text-sm text-muted-foreground font-normal">Saídas previstas e realizadas</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {payableLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : accountsPayable && accountsPayable.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 bg-red-50/30 dark:bg-red-950/30">
                      <TableHead className="font-semibold text-sm">Vencimento</TableHead>
                      <TableHead className="font-semibold text-sm">Data Real</TableHead>
                      <TableHead className="font-semibold text-sm">Descrição</TableHead>
                      <TableHead className="font-semibold text-sm text-right">Valor</TableHead>
                      <TableHead className="font-semibold text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsPayable.map((account, index) => (
                      <TableRow
                        key={account.id}
                        className={`hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium">{formatDate(account.dueDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {account.paymentDate ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-red-500" />
                                {formatDate(account.paymentDate)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-[250px]">
                          <div className="truncate" title={account.description}>
                            {account.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg text-red-600 dark:text-red-400">
                          -{formatCurrency(parseFloat(account.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(account.status)} px-3 py-1`}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(account.status)}
                              <span className="font-medium">{getStatusLabel(account.status)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-full mb-4">
                  <ArrowDownRight className="h-12 w-12 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma conta a pagar</h3>
                <p className="text-muted-foreground max-w-md">
                  Não há contas a pagar no período selecionado. Tente ajustar os filtros ou cadastrar novas despesas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
