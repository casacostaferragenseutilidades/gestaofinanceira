import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  PiggyBank,
  Target,
  BarChart3,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, getDaysUntilDue, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { DashboardStats, CashFlowData, CategoryExpense, AccountPayable, AccountReceivable } from "@shared/schema";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: {
  title: string;
  value: string;
  icon: typeof TrendingUp;
  trend?: "up" | "down";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300",
    success: "bg-gradient-to-br from-emerald-50 to-emerald-100 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300",
    warning: "bg-gradient-to-br from-yellow-50 to-yellow-100 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300",
    danger: "bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300",
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900" data-testid={`text-kpi-${title.toLowerCase().replace(/\s/g, "-")}`}>{value}</div>
        {trend && trendValue && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-600" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600" />
            )}
            <span className={trend === "up" ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
              {trendValue}
            </span>
            <span className="text-muted-foreground">vs. período anterior</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingPaymentsList({ items, type }: { items: (AccountPayable | AccountReceivable)[]; type: "payable" | "receivable" }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Calendar className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium">Nenhuma conta próxima do vencimento</p>
        <p className="text-xs text-muted-foreground mt-1">Todas as contas estão em dia</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => {
        const daysUntil = getDaysUntilDue(item.dueDate);
        const isUrgent = daysUntil <= 0;
        const isWarning = daysUntil > 0 && daysUntil <= 3;

        return (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 border border-slate-100 hover:border-slate-200"
            data-testid={`card-upcoming-${type}-${item.id}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{item.description}</p>
              <p className="text-xs text-slate-600 mt-1">
                Vence em {formatDate(item.dueDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">
                {formatCurrency(item.amount)}
              </span>
              {isUrgent && (
                <Badge variant="destructive" className="text-xs font-medium">
                  Vencido
                </Badge>
              )}
              {isWarning && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-medium">
                  {daysUntil}d
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [period, setPeriod] = useState('current');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return response.json();
    },
  });

  const { data: cashFlow, isLoading: cashFlowLoading } = useQuery<CashFlowData[]>({
    queryKey: ["/api/dashboard/cash-flow", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/cash-flow?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Erro ao buscar fluxo de caixa');
      return response.json();
    },
  });

  const { data: categoryExpenses, isLoading: expensesLoading } = useQuery<CategoryExpense[]>({
    queryKey: ["/api/dashboard/category-expenses", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/category-expenses?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Erro ao buscar despesas por categoria');
      return response.json();
    },
  });

  const { data: upcomingPayables, isLoading: payablesLoading } = useQuery<AccountPayable[]>({
    queryKey: ["/api/accounts-payable/upcoming", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(`/api/accounts-payable/upcoming?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Erro ao buscar contas a pagar');
      return response.json();
    },
  });

  const { data: upcomingReceivables, isLoading: receivablesLoading } = useQuery<AccountReceivable[]>({
    queryKey: ["/api/accounts-receivable/upcoming", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(`/api/accounts-receivable/upcoming?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Erro ao buscar contas a receber');
      return response.json();
    },
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const pendingTodayPayables = upcomingPayables?.filter(p => p.dueDate <= todayStr) || [];
  const pendingTodayReceivables = upcomingReceivables?.filter(r => r.dueDate <= todayStr) || [];
  const totalPendencies = pendingTodayPayables.length + pendingTodayReceivables.length;

  useEffect(() => {
    const popupShown = sessionStorage.getItem('dashboard_popup_shown');
    if (!popupShown && !payablesLoading && !receivablesLoading && totalPendencies > 0) {
      setIsPopupOpen(true);
      sessionStorage.setItem('dashboard_popup_shown', 'true');
    }
  }, [payablesLoading, receivablesLoading, totalPendencies]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (newPeriod) {
      case 'current':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStart, 1);
        end = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral das suas finanças e métricas de desempenho
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Período: {formatDate(startDate)} - {formatDate(endDate)}
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Período:</Label>
              </div>

              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mês Atual</SelectItem>
                  <SelectItem value="last">Mês Anterior</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">De:</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-36"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Até:</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KPICard
              title="Receitas"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={TrendingUp}
              trend="up"
              trendValue="+12%"
              variant="success"
            />
            <KPICard
              title="Despesas"
              value={formatCurrency(stats?.totalExpenses || 0)}
              icon={TrendingDown}
              trend="down"
              trendValue="-5%"
              variant="danger"
            />
            <KPICard
              title="Total de Descontos"
              value={formatCurrency(stats?.totalDiscounts || 0)}
              icon={TrendingDown}
              variant="success"
            />
            <KPICard
              title="Saldo Atual"
              value={formatCurrency(stats?.balance || 0)}
              icon={Wallet}
            />
            <KPICard
              title="Saldo Projetado"
              value={formatCurrency(stats?.projectedBalance || 0)}
              icon={Target}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(stats?.overduePayables || 0) > 0 && (
          <Card className="bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {stats?.overduePayables} contas a pagar vencidas
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Regularize para evitar juros e multas
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {(stats?.overdueReceivables || 0) > 0 && (
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {stats?.overdueReceivables} contas a receber vencidas
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Entre em contato com os clientes
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {(stats?.dueTodayCount || 0) > 0 && (
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  {stats?.dueTodayCount} contas vencem hoje
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Verifique os pagamentos do dia
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            {cashFlowLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : cashFlow && cashFlow.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value + "T00:00:00");
                      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                    }}
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
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Receitas"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Despesas"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Saldo"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-medium">Sem dados de fluxo de caixa</p>
                <p className="text-sm text-muted-foreground mt-1">Adicione transações para visualizar o gráfico</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryExpenses && categoryExpenses.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {categoryExpenses.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), ""]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryExpenses.map((category, index) => (
                    <div key={category.categoryId} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm flex-1 truncate">{category.categoryName}</span>
                      <span className="text-sm font-medium">{category.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-medium">Sem dados de despesas</p>
                <p className="text-sm text-muted-foreground mt-1">Registre despesas para ver a distribuição</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">Contas a Pagar Próximas</CardTitle>
          </CardHeader>
          <CardContent>
            {payablesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <UpcomingPaymentsList items={upcomingPayables || []} type="payable" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">Contas a Receber Próximas</CardTitle>
          </CardHeader>
          <CardContent>
            {receivablesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <UpcomingPaymentsList items={upcomingReceivables || []} type="receivable" />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Pendências de Hoje
            </DialogTitle>
            <DialogDescription>
              Você tem {totalPendencies} {totalPendencies === 1 ? 'pendência' : 'pendências'} que {totalPendencies === 1 ? 'vence' : 'vencem'} hoje ou já {totalPendencies === 1 ? 'venceu' : 'venceram'}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {pendingTodayPayables.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4" />
                  Contas a Pagar
                </h3>
                <div className="space-y-2">
                  {pendingTodayPayables.map(payable => (
                    <div key={payable.id} className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-100">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{payable.description}</p>
                        <p className="text-xs text-red-600">Venceu em {formatDate(payable.dueDate)}</p>
                      </div>
                      <span className="font-bold text-slate-900">{formatCurrency(payable.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingTodayReceivables.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Contas a Receber
                </h3>
                <div className="space-y-2">
                  {pendingTodayReceivables.map(receivable => (
                    <div key={receivable.id} className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{receivable.description}</p>
                        <p className="text-xs text-emerald-600">Venceu em {formatDate(receivable.dueDate)}</p>
                      </div>
                      <span className="font-bold text-slate-900">{formatCurrency(receivable.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsPopupOpen(false)} className="w-full sm:w-auto">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
