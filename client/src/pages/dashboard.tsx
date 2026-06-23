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
  Target,
  BarChart3,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Flame,
  Zap,
  PiggyBank,
  CreditCard,
  Building2,
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
  AreaChart,
  Area,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatCurrency, formatDate, getDaysUntilDue } from "@/lib/utils";
import type { DashboardStats, CashFlowData, CategoryExpense, AccountPayable, AccountReceivable } from "@shared/schema";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// ─── Health Score Component ────────────────────────────────────────────────────
function HealthScore({ stats }: { stats?: DashboardStats }) {
  const score = React.useMemo(() => {
    if (!stats) return 0;
    let s = 100;
    if ((stats.overduePayables || 0) > 0) s -= Math.min(30, (stats.overduePayables || 0) * 5);
    if ((stats.overdueReceivables || 0) > 0) s -= Math.min(20, (stats.overdueReceivables || 0) * 3);
    if (stats.balance < 0) s -= 30;
    else if (stats.balance < stats.totalRevenue * 0.1) s -= 10;
    if (stats.totalExpenses > stats.totalRevenue) s -= 20;
    return Math.max(0, Math.min(100, s));
  }, [stats]);

  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Atenção" : "Crítico";
  const Icon = score >= 80 ? ShieldCheck : score >= 60 ? ShieldAlert : AlertTriangle;

  const circumference = 2 * Math.PI * 52;
  const progress = (score / 100) * circumference;

  return (
    <Card className="border-0 shadow-2xl shadow-primary/10 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl overflow-hidden">
      <CardContent className="p-8 text-white relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Wallet className="h-40 w-40" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Circle score */}
          <div className="relative flex-shrink-0">
            <svg width="140" height="140" className="-rotate-90">
              <circle cx="70" cy="70" r="52" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
              <circle
                cx="70" cy="70" r="52"
                stroke={color}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${progress} ${circumference}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black" style={{ color }}>{score}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Score</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <Icon className="h-5 w-5" style={{ color }} />
                <span className="text-2xl font-black tracking-tighter" style={{ color }}>{label}</span>
              </div>
              <p className="text-white/50 text-sm font-medium">Saúde Financeira da Empresa</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mb-1">Receitas</p>
                <p className="text-lg font-black text-emerald-400">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mb-1">Despesas</p>
                <p className="text-lg font-black text-rose-400">{formatCurrency(stats?.totalExpenses || 0)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mb-1">Saldo Atual</p>
                <p className={cn("text-lg font-black", (stats?.balance || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {formatCurrency(stats?.balance || 0)}
                </p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mb-1">Projeção</p>
                <p className="text-lg font-black text-indigo-300">{formatCurrency(stats?.projectedBalance || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({
  title, value, icon: Icon, subtitle, variant = "default", badge,
}: {
  title: string;
  value: string;
  icon: typeof TrendingUp;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  badge?: string;
}) {
  const styles = {
    default: { card: "bg-card border shadow-xl shadow-primary/5 ring-1 ring-primary/5", icon: "from-primary/10 to-indigo-500/10 text-primary" },
    success: { card: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 border-0 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/10", icon: "from-emerald-500/10 to-green-500/10 text-emerald-600" },
    warning: { card: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-0 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/10", icon: "from-amber-500/10 to-orange-500/10 text-amber-600" },
    danger: { card: "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/10 dark:to-red-900/10 border-0 shadow-xl shadow-rose-500/10 ring-1 ring-rose-500/10", icon: "from-rose-500/10 to-red-500/10 text-rose-600" },
    info: { card: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-0 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/10", icon: "from-blue-500/10 to-indigo-500/10 text-blue-600" },
  };

  return (
    <Card className={cn(styles[variant].card, "overflow-hidden group rounded-2xl hover:scale-[1.02] transition-all duration-300")}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">{title}</CardTitle>
        <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform duration-300", styles[variant].icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-foreground tracking-tight">{value}</div>
        {(subtitle || badge) && (
          <div className="flex items-center gap-2 mt-2">
            {badge && (
              <Badge className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border-0">{badge}</Badge>
            )}
            {subtitle && <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ count, label, sublabel, color }: { count: number; label: string; sublabel: string; color: "red" | "amber" | "blue" }) {
  const colors = {
    red: "from-red-500 to-rose-600 shadow-red-500/20",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
  };
  const Icons = { red: AlertCircle, amber: AlertTriangle, blue: Clock };
  const Icon = Icons[color];

  return (
    <div className={cn("bg-gradient-to-br rounded-2xl p-4 text-white shadow-lg flex items-center gap-4", colors[color])}>
      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-black">{count} {label}</p>
        <p className="text-white/60 text-xs font-medium mt-0.5">{sublabel}</p>
      </div>
      <div className="text-3xl font-black text-white/20">{count}</div>
    </div>
  );
}

// ─── Upcoming Payments ────────────────────────────────────────────────────────
function UpcomingList({ items, type }: { items: (AccountPayable | AccountReceivable)[]; type: "payable" | "receivable" }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <CheckCircle className="h-10 w-10 text-emerald-400/50 mb-2" />
        <p className="text-sm font-bold">Tudo em dia!</p>
        <p className="text-xs text-muted-foreground mt-1">Nenhuma conta próxima do vencimento</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 5).map((item) => {
        const daysUntil = getDaysUntilDue(item.dueDate);
        const isOverdue = daysUntil < 0;
        const isUrgent = daysUntil === 0;
        const isWarning = daysUntil > 0 && daysUntil <= 3;

        return (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/50 group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                type === "payable" ? "bg-rose-500/10" : "bg-emerald-500/10"
              )}>
                {type === "payable"
                  ? <ArrowDownRight className="h-4 w-4 text-rose-500" />
                  : <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.dueDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-black">{formatCurrency(item.amount)}</span>
              {isOverdue && <Badge variant="destructive" className="text-[9px] font-black h-4">VENC.</Badge>}
              {isUrgent && <Badge className="bg-orange-100 text-orange-800 text-[9px] font-black h-4 border-0">HOJE</Badge>}
              {isWarning && <Badge className="bg-amber-100 text-amber-800 text-[9px] font-black h-4 border-0">{daysUntil}d</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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

  const { data: categoryExpenses } = useQuery<CategoryExpense[]>({
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

  // Margin ratio
  const marginRate = stats && stats.totalRevenue > 0
    ? ((stats.totalRevenue - stats.totalExpenses) / stats.totalRevenue * 100).toFixed(1)
    : "0";

  // Expense ratio
  const expenseRate = stats && stats.totalRevenue > 0
    ? (stats.totalExpenses / stats.totalRevenue * 100).toFixed(1)
    : "0";

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

  const now = new Date();
  const monthName = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-background min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-violet-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter" data-testid="text-page-title">
                Dashboard
              </h1>
              <p className="text-muted-foreground text-sm font-medium capitalize">{monthName}</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2 ml-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Monitoramento em tempo real da saúde financeira
          </p>
        </div>

        {/* Filter Card */}
        <Card className="bg-card dark:bg-slate-900/50 border shadow-xl shadow-primary/5 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4 text-primary" />
                <Label className="text-xs font-black uppercase tracking-widest">Período</Label>
              </div>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-36 h-9 rounded-xl bg-background border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="current">Mês Atual</SelectItem>
                  <SelectItem value="last">Mês Anterior</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-38 h-9 rounded-xl bg-background border-primary/20 text-xs" />
                <span className="text-muted-foreground text-xs font-bold">até</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-38 h-9 rounded-xl bg-background border-primary/20 text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Health Score + Alerts ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {statsLoading ? (
            <Skeleton className="h-[220px] rounded-3xl" />
          ) : (
            <HealthScore stats={stats} />
          )}
        </div>

        <div className="flex flex-col gap-3">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[62px] rounded-2xl" />)
          ) : (
            <>
              {(stats?.overduePayables || 0) > 0 && (
                <AlertCard count={stats!.overduePayables} label="contas a pagar vencidas" sublabel="Regularize para evitar juros" color="red" />
              )}
              {(stats?.overdueReceivables || 0) > 0 && (
                <AlertCard count={stats!.overdueReceivables} label="contas a receber vencidas" sublabel="Entre em contato com clientes" color="amber" />
              )}
              {(stats?.dueTodayCount || 0) > 0 && (
                <AlertCard count={stats!.dueTodayCount} label="contas vencem hoje" sublabel="Verifique os pagamentos do dia" color="blue" />
              )}
              {(stats?.overduePayables || 0) === 0 && (stats?.overdueReceivables || 0) === 0 && (stats?.dueTodayCount || 0) === 0 && (
                <div className="flex-1 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/30 flex flex-col items-center justify-center p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
                  <p className="text-sm font-black text-emerald-600">Sem alertas!</p>
                  <p className="text-xs text-muted-foreground mt-1">Sua empresa está em dia com os compromissos</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-7 w-28" /></CardContent>
            </Card>
          ))
        ) : (
          <>
            <KPICard
              title="Total Receitas"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={TrendingUp}
              variant="success"
              subtitle="No período"
            />
            <KPICard
              title="Total Despesas"
              value={formatCurrency(stats?.totalExpenses || 0)}
              icon={TrendingDown}
              variant="danger"
              subtitle="No período"
            />
            <KPICard
              title="Saldo Líquido"
              value={formatCurrency(stats?.balance || 0)}
              icon={(stats?.balance || 0) >= 0 ? Wallet : AlertCircle}
              variant={(stats?.balance || 0) >= 0 ? "success" : "danger"}
              badge={(stats?.balance || 0) >= 0 ? "LUCRO" : "DÉFICIT"}
            />
            <KPICard
              title="Saldo Projetado"
              value={formatCurrency(stats?.projectedBalance || 0)}
              icon={Target}
              variant="info"
              subtitle="Pendentes incluídos"
            />
            <KPICard
              title="Margem Líquida"
              value={`${marginRate}%`}
              icon={Zap}
              variant={parseFloat(marginRate) > 15 ? "success" : parseFloat(marginRate) > 0 ? "warning" : "danger"}
              subtitle="Receita - Despesas"
            />
            <KPICard
              title="Taxa de Gastos"
              value={`${expenseRate}%`}
              icon={Flame}
              variant={parseFloat(expenseRate) < 70 ? "success" : parseFloat(expenseRate) < 90 ? "warning" : "danger"}
              subtitle="Despesas / Receita"
            />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Line Chart */}
        <Card className="lg:col-span-3 bg-card border shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black tracking-tight">Evolução do Fluxo de Caixa</CardTitle>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Receitas vs Despesas no período</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-primary"><span className="w-3 h-1 rounded bg-primary block" />Receitas</span>
                <span className="flex items-center gap-1.5 text-rose-500"><span className="w-3 h-1 rounded bg-rose-500 block" />Despesas</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {cashFlowLoading ? (
              <Skeleton className="h-[260px] w-full rounded-2xl" />
            ) : cashFlow && cashFlow.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={cashFlow}>
                  <defs>
                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} className="stroke-muted/30" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    className="text-[10px] font-bold text-muted-foreground"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    className="text-[10px] font-bold text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", border: "1px solid hsl(var(--border))", borderRadius: "1rem" }}
                    formatter={(v: number) => [formatCurrency(v), ""]}
                    labelFormatter={(l) => formatDate(l)}
                  />
                  <Area type="monotone" dataKey="income" name="Receitas" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#gradIncome)" dot={false} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="expense" name="Despesas" stroke="#f43f5e" strokeWidth={3} fill="url(#gradExpense)" dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                <TrendingUp className="h-12 w-12 text-primary/20 mb-3" />
                <p className="font-bold">Sem dados de fluxo</p>
                <p className="text-xs mt-1 opacity-60">Registre movimentações para análise</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-2 bg-card border shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-lg font-black tracking-tight">Distribuição de Gastos</CardTitle>
            <p className="text-xs text-muted-foreground font-medium">Por categoria</p>
          </CardHeader>
          <CardContent className="pt-5">
            {categoryExpenses && categoryExpenses.length > 0 ? (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={categoryExpenses} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} stroke="none">
                      {categoryExpenses.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="hover:opacity-80 transition-opacity" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} formatter={(v: number) => [formatCurrency(v), ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {categoryExpenses.slice(0, 4).map((cat, index) => (
                    <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="font-bold text-muted-foreground truncate max-w-[110px]">{cat.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-foreground">{cat.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                <BarChart3 className="h-12 w-12 text-primary/20 mb-3" />
                <p className="font-bold text-sm">Sem despesas</p>
                <p className="text-xs mt-1 opacity-60">A distribuição aparecerá aqui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Upcoming Payments ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <ArrowDownRight className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-black tracking-tight">Contas a Pagar</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Próximos vencimentos</p>
                </div>
              </div>
              {(upcomingPayables?.length || 0) > 0 && (
                <Badge className="bg-rose-500/10 text-rose-600 border-0 font-black text-xs">
                  {upcomingPayables!.length} contas
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {payablesLoading
              ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              : <UpcomingList items={upcomingPayables || []} type="payable" />
            }
          </CardContent>
        </Card>

        <Card className="bg-card border shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-black tracking-tight">Contas a Receber</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Próximos vencimentos</p>
                </div>
              </div>
              {(upcomingReceivables?.length || 0) > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-black text-xs">
                  {upcomingReceivables!.length} contas
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {receivablesLoading
              ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              : <UpcomingList items={upcomingReceivables || []} type="receivable" />
            }
          </CardContent>
        </Card>
      </div>

      {/* ── Financial Insights Bar ── */}
      {!statsLoading && stats && (
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-r from-primary/5 via-violet-500/5 to-indigo-500/5 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-6 items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Indicadores de Saúde</span>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descontos</p>
                  <p className="text-lg font-black text-primary">{formatCurrency(stats.totalDiscounts || 0)}</p>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vencem esta semana</p>
                  <p className="text-lg font-black text-amber-600">{stats.dueThisWeekCount || 0} contas</p>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pendências hoje</p>
                  <p className="text-lg font-black text-rose-600">{stats.dueTodayCount || 0} contas</p>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Período</p>
                  <p className="text-sm font-black text-foreground">{formatDate(startDate)} — {formatDate(endDate)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pending Dialog ── */}
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
                <h3 className="text-sm font-semibold text-rose-600 flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4" />Contas a Pagar
                </h3>
                <div className="space-y-2">
                  {pendingTodayPayables.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 rounded-lg bg-rose-50 border border-rose-100">
                      <div>
                        <p className="text-sm font-medium">{p.description}</p>
                        <p className="text-xs text-rose-600">Venceu em {formatDate(p.dueDate)}</p>
                      </div>
                      <span className="font-bold">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pendingTodayReceivables.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />Contas a Receber
                </h3>
                <div className="space-y-2">
                  {pendingTodayReceivables.map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div>
                        <p className="text-sm font-medium">{r.description}</p>
                        <p className="text-xs text-emerald-600">Venceu em {formatDate(r.dueDate)}</p>
                      </div>
                      <span className="font-bold">{formatCurrency(r.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPopupOpen(false)} className="w-full sm:w-auto">Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
