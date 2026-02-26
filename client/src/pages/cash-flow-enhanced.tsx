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
  Target,
  Activity,
  DollarSign,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CashFlowData, CashFlowKPIs, CashFlowAlert, DailyMovement } from "@shared/schema";

export default function CashFlow() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [period, setPeriod] = React.useState("daily");
  const queryClient = useQueryClient();

  const { data: cashFlowData, isLoading } = useQuery<CashFlowData[]>({
    queryKey: ["/api/cash-flow", period],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<CashFlowSummary>({
    queryKey: ["/api/cash-flow/summary", period],
  });

  const { data: kpis, isLoading: kpisLoading } = useQuery<CashFlowKPIs>({
    queryKey: ["/api/cash-flow/kpis", period],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<CashFlowAlert[]>({
    queryKey: ["/api/cash-flow/alerts"],
  });

  const { data: movements, isLoading: movementsLoading } = useQuery<DailyMovement[]>({
    queryKey: ["/api/cash-flow/movements", new Date().toISOString().split("T")[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/cash-flow/movements/${today}`);
      if (!response.ok) throw new Error("Erro ao buscar movimentações");
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entry: {
      date: string;
      competenceDate?: string;
      type: 'income' | 'expense';
      description: string;
      categoryId: string;
      subcategoryId?: string;
      amount: number;
      grossAmount?: number;
      fees?: number;
      paymentMethod: string;
      account: string;
      status: 'confirmed' | 'pending' | 'overdue';
      document?: string;
      costCenter?: string;
      recurrence?: string;
      dueDate?: string;
      actualDate?: string;
    }) => {
      const response = await fetch("/api/cash-flow/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error("Erro ao criar movimentação");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      setIsDialogOpen(false);
    },
  });

  const createBalanceAdjustmentMutation = useMutation({
    mutationFn: async (entry: {
      date: string;
      balanceType: 'initial' | 'final';
      description: string;
      amount: number;
      account: string;
    }) => {
      const response = await fetch("/api/balance-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error("Erro ao criar ajuste de saldo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      setIsDialogOpen(false);
    },
  });

  const getChartData = () => {
    if (!cashFlowData) return [];
    return cashFlowData;
  };

  const chartData = getChartData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Realizado";
      case "pending":
        return "Previsto";
      case "overdue":
        return "Atrasado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Gestão financeira completa com sistema brasileiro
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="daily">Diário</TabsTrigger>
              <TabsTrigger value="weekly">Semanal</TabsTrigger>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Saldo Inicial</p>
                <p className="text-2xl font-bold text-blue-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.initialBalance || 0)
                  )}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Entradas</p>
                <p className="text-2xl font-bold text-green-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.totalIncome || 0)
                  )}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Saídas</p>
                <p className="text-2xl font-bold text-red-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.totalExpense || 0)
                  )}
                </p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Saldo Final</p>
                <p className="text-2xl font-bold text-purple-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.finalBalance || 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Saldo Projetado</p>
                <p className="text-2xl font-bold text-orange-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.projectedBalance || 0)
                  )}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPIs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Indicadores Chave (KPIs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : kpis ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Saldo Médio</p>
                  <p className="text-xl font-bold">{formatCurrency(kpis.averageBalance)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Índice Entradas/Saídas</p>
                  <p className="text-xl font-bold">{kpis.incomeVsExpense.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Inadimplência</p>
                  <p className="text-xl font-bold">{kpis.delinquencyRate.toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Liquidez Imediata</p>
                  <p className="text-xl font-bold">{kpis.immediateLiquidity.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Burn Rate</p>
                  <p className="text-xl font-bold">{formatCurrency(kpis.burnRate)}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Sem dados disponíveis</p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <AlertCircle className={`h-5 w-5 mt-0.5 ${alert.severity === 'high' ? 'text-red-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {alert.severity === 'high' ? 'Alto' :
                          alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum alerta no momento</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa - Tendência</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px]" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value)}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2" />
                <p>Sem dados para exibir</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px]" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value)}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Entradas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Saídas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2" />
                <p>Sem dados para exibir</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Movements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Movimentações Diárias</span>
            <div className="flex items-center gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ajuste de Caixa - Sistema Brasileiro</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const movementType = formData.get("movementType") as string;

                      if (movementType === "balance") {
                        // Handle balance adjustment
                        const balanceEntry = {
                          date: formData.get("date") as string,
                          balanceType: formData.get("balanceType") as 'initial' | 'final',
                          description: formData.get("description") as string,
                          amount: parseFloat(formData.get("amount") as string),
                          account: formData.get("account") as string,
                        };
                        createBalanceAdjustmentMutation.mutate(balanceEntry);
                      } else {
                        // Handle cash flow entry
                        const entry = {
                          date: formData.get("date") as string,
                          competenceDate: formData.get("competenceDate") as string || undefined,
                          type: formData.get("type") as 'income' | 'expense',
                          description: formData.get("description") as string,
                          categoryId: formData.get("categoryId") as string,
                          subcategoryId: formData.get("subcategoryId") as string || undefined,
                          amount: parseFloat(formData.get("amount") as string),
                          grossAmount: formData.get("grossAmount") ? parseFloat(formData.get("grossAmount") as string) : undefined,
                          fees: formData.get("fees") ? parseFloat(formData.get("fees") as string) : undefined,
                          paymentMethod: formData.get("paymentMethod") as string,
                          account: formData.get("account") as string,
                          status: formData.get("status") as 'confirmed' | 'pending' | 'overdue',
                          document: formData.get("document") as string || undefined,
                          costCenter: formData.get("costCenter") as string || undefined,
                          recurrence: formData.get("recurrence") as string || undefined,
                          dueDate: formData.get("dueDate") as string || undefined,
                          actualDate: formData.get("actualDate") as string || undefined,
                        };
                        createEntryMutation.mutate(entry);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="movementType">Tipo de Movimentação</Label>
                      <Select name="movementType" defaultValue="cashflow">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cashflow">Movimentação Normal</SelectItem>
                          <SelectItem value="balance">Ajuste de Saldo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Data do Lançamento*</Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          defaultValue={new Date().toISOString().split("T")[0]}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="competenceDate">Data de Competência</Label>
                        <Input
                          id="competenceDate"
                          name="competenceDate"
                          type="date"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Tipo*</Label>
                        <Select name="type" defaultValue="expense" required>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Entrada</SelectItem>
                            <SelectItem value="expense">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="paymentMethod">Forma de Pagamento*</Label>
                        <Select name="paymentMethod" defaultValue="money" required>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="money">Dinheiro</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            <SelectItem value="transfer">Transferência Bancária</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição*</Label>
                      <Input
                        id="description"
                        name="description"
                        placeholder="Ex: Venda de produtos, pagamento de fornecedor"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Categoria*</Label>
                        <Select name="categoryId" required>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subcategory">Subcategoria</Label>
                        <Select name="subcategoryId">
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="grossAmount">Valor Bruto</Label>
                        <Input
                          id="grossAmount"
                          name="grossAmount"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fees">Taxas</Label>
                        <Input
                          id="fees"
                          name="fees"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">Valor Líquido*</Label>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="account">Conta/Caixa*</Label>
                        <Input
                          id="account"
                          name="account"
                          placeholder="Ex: Caixa Principal, Banco Itaú"
                          className="mt-1"
                          defaultValue="Caixa Principal"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="costCenter">Centro de Custo</Label>
                        <Input
                          id="costCenter"
                          name="costCenter"
                          placeholder="Ex: Loja Matriz, Obra A, Projeto X"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status*</Label>
                        <Select name="status" defaultValue="confirmed" required>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirmed">Realizado</SelectItem>
                            <SelectItem value="pending">Previsto</SelectItem>
                            <SelectItem value="overdue">Atrasado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="recurrence">Recorrência</Label>
                        <Select name="recurrence">
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não recorrente</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dueDate">Data de Vencimento</Label>
                        <Input
                          id="dueDate"
                          name="dueDate"
                          type="date"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="actualDate">Data Real Pag/Receb</Label>
                        <Input
                          id="actualDate"
                          name="actualDate"
                          type="date"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="document">Documento (NF, Recibo, Contrato)</Label>
                      <Input
                        id="document"
                        name="document"
                        placeholder="Ex: NF-001, REC-123, CONTRATO-456"
                        className="mt-1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="balanceType">Tipo de Saldo</Label>
                      <Select name="balanceType" defaultValue="initial">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de saldo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="initial">Saldo Inicial do Dia</SelectItem>
                          <SelectItem value="final">Saldo Final do Dia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createEntryMutation.isPending || createBalanceAdjustmentMutation.isPending}
                      >
                        {createEntryMutation.isPending || createBalanceAdjustmentMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : movements && movements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Forma Pag</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(movement.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {movement.categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.account}</TableCell>
                      <TableCell>{movement.paymentMethod}</TableCell>
                      <TableCell className={`text-right font-semibold ${movement.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                        {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(movement.status)}>
                          {getStatusLabel(movement.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando sua primeira movimentação de caixa.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Movimentação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
