import { useQuery } from "@tanstack/react-query";
import * as React from "react";
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
import { cn, formatCurrency, formatDate, getDaysUntilDue, getStatusColor, getStatusLabel } from "@/lib/utils";
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
    default: "bg-white dark:bg-slate-900 border-0 shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300 ring-1 ring-primary/5",
    success: "bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border-0 shadow-xl shadow-violet-500/5 hover:shadow-violet-500/10 transition-all duration-300 ring-1 ring-violet-500/10",
    warning: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-0 shadow-xl shadow-amber-500/5 hover:shadow-amber-500/10 transition-all duration-300 ring-1 ring-amber-500/10",
    danger: "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/10 dark:to-red-900/10 border-0 shadow-xl shadow-rose-500/5 hover:shadow-rose-500/10 transition-all duration-300 ring-1 ring-rose-500/10",
  };

  return (
    <Card className={cn(variantStyles[variant], "overflow-hidden group rounded-2xl")}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-foreground tracking-tight" data-testid={`text-kpi-${title.toLowerCase().replace(/\s/g, "-")}`}>{value}</div>
        {trend && trendValue && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-3">
            <span className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold",
              trend === "up" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30"
            )}>
              {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </span>
            <span className="text-[10px] font-medium opacity-70">vs. período anterior</span>
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
  const [startDate, setStartDate] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [period, setPeriod] = React.useState('current');
  const [isPopupOpen, setIsPopupOpen] = React.useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", { startDate, endDate }],
  });

  const { data: cashFlow, isLoading: cashFlowLoading } = useQuery<CashFlowData[]>({
    queryKey: ["/api/dashboard/cash-flow", { startDate, endDate }],
  });

  const { data: categoryExpenses, isLoading: expensesLoading } = useQuery<CategoryExpense[]>({
    queryKey: ["/api/dashboard/category-expenses", { startDate, endDate }],
  });

  const { data: upcomingPayables, isLoading: payablesLoading } = useQuery<AccountPayable[]>({
    queryKey: ["/api/accounts-payable/upcoming", { startDate, endDate }],
  });

  const { data: upcomingReceivables, isLoading: receivablesLoading } = useQuery<AccountReceivable[]>({
    queryKey: ["/api/accounts-receivable/upcoming", { startDate, endDate }],
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const pendingTodayPayables = upcomingPayables?.filter(p => p.dueDate <= todayStr) || [];
  const pendingTodayReceivables = upcomingReceivables?.filter(r => r.dueDate <= todayStr) || [];
  const totalPendencies = pendingTodayPayables.length + pendingTodayReceivables.length;

  React.useEffect(() => {
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
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-violet-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-3 font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Insights financeiros em tempo real
          </p>
          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full w-fit">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground">
              {formatDate(startDate)} — {formatDate(endDate)}
            </span>
          </div>
        </div>

        <Card className="bg-card dark:bg-slate-900/50 border shadow-2xl shadow-primary/5 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Período</Label>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Select value={period} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-40 h-10 rounded-xl bg-background border-primary/20 focus:ring-primary whitespace-nowrap">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/20">
                    <SelectItem value="current">Mês Atual</SelectItem>
                    <SelectItem value="last">Mês Anterior</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                    <SelectItem value="year">Ano</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Label className="absolute -top-6 left-1 text-[10px] font-bold text-muted-foreground uppercase opacity-0 transition-opacity">De</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-44 h-10 rounded-xl bg-background pl-4 pr-1 border-primary/20 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="h-4 w-[2px] bg-border rounded-full mx-1" />
                  <div className="relative">
                    <Label className="absolute -top-6 left-1 text-[10px] font-bold text-muted-foreground uppercase opacity-0 transition-opacity">Até</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-44 h-10 rounded-xl bg-background pl-4 pr-1 border-primary/20 focus-visible:ring-primary"
                    />
                  </div>
                </div>
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
        <Card className="bg-card dark:bg-slate-900/50 border shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden group">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xl font-bold text-foreground">Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {cashFlowLoading ? (
              <Skeleton className="h-[300px] w-full rounded-2xl" />
            ) : cashFlow && cashFlow.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlow}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} className="stroke-muted/30" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value + "T00:00:00");
                      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                    }}
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                  />
                  <Tooltip
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "1rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Receitas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Despesas"
                    stroke="#f43f5e"
                    strokeWidth={4}
                    dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Saldo"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={4}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <div className="h-16 w-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="h-8 w-8 text-primary/40" />
                </div>
                <p className="font-bold text-foreground">Sem dados de fluxo</p>
                <p className="text-xs font-medium opacity-60 mt-1">Registre movimentações para análise</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-slate-900/50 border shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden group">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xl font-bold text-foreground">Distribuição de Gastos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {expensesLoading ? (
              <Skeleton className="h-[300px] w-full rounded-2xl" />
            ) : categoryExpenses && categoryExpenses.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height={300} className="md:w-1/2">
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {categoryExpenses.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "1rem",
                      }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3 w-full">
                  {categoryExpenses.map((category, index) => (
                    <div key={category.categoryId} className="group/item flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-sm font-bold text-muted-foreground group-hover/item:text-foreground transition-colors truncate max-w-[150px]">
                          {category.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-foreground">
                          {formatCurrency(category.amount)}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-black border-primary/20 bg-primary/5 text-primary rounded-lg h-5">
                          {category.percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <div className="h-16 w-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <BarChart3 className="h-8 w-8 text-primary/40" />
                </div>
                <p className="font-bold text-foreground">Sem despesas registradas</p>
                <p className="text-xs font-medium opacity-60 mt-1">Sua distribuição aparecerá aqui</p>
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
