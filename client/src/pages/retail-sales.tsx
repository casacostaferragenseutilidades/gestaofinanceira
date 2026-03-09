import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ShoppingCart,
  Trash2,
  Edit,
  X,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  Store,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  Download,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Wallet,
  Tag,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import type { RetailSale, Category } from "@shared/schema";

const paymentMethodOptions = [
  { value: "money", label: "Dinheiro", icon: Banknote },
  { value: "pix", label: "PIX", icon: QrCode },
  { value: "credit_card", label: "Cartão de Crédito", icon: CreditCard },
  { value: "debit_card", label: "Cartão de Débito", icon: CreditCard },
  { value: "transfer", label: "Transferência", icon: Receipt },
  { value: "other", label: "Outro", icon: Wallet },
];

const accountOptions = [
  { value: "caixa", label: "Caixa" },
  { value: "banco_principal", label: "Banco Principal" },
  { value: "banco_secundario", label: "Banco Secundário" },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function RetailSales() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [editingSale, setEditingSale] = React.useState<RetailSale | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [startDateFilter, setStartDateFilter] = React.useState("");
  const [endDateFilter, setEndDateFilter] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "income" | "expense">("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  // Form state
  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split("T")[0],
    type: "income" as "income" | "expense",
    description: "",
    amount: "",
    paymentMethod: "money",
    account: "",
    categoryId: "",
    clientName: "",
    document: "",
    costCenter: "",
    notes: "",
  });

  // Category form state
  const [categoryForm, setCategoryForm] = React.useState({
    name: "",
    type: "income" as "income" | "expense",
  });

  // Fetch sales
  const { data: sales, isLoading } = useQuery<RetailSale[]>({
    queryKey: ["/api/retail-sales"],
  });

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch bank accounts
  const { data: bankAccounts } = useQuery<Array<{ id: string; name: string; bank?: string }>>({
    queryKey: ["/api/bank-accounts"],
  });

  // Create sale mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const saleData = {
        ...data,
        amount: parseFloat(data.amount),
      };
      console.log("[DEBUG] Enviando dados para retail-sales:", saleData);
      const response = await apiRequest("POST", "/api/retail-sales", saleData);
      console.log("[DEBUG] Resposta do servidor:", response);
      return response.json();
    },
    onSuccess: () => {
      console.log("[DEBUG] Venda criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["/api/retail-sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      toast({
        title: "Venda registrada",
        description: "A venda foi registrada com sucesso e aparecerá no fluxo de caixa.",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("[DEBUG] Erro ao criar venda:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a venda.",
        variant: "destructive",
      });
    },
  });

  // Delete sale mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/retail-sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retail-sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      toast({
        title: "Venda excluída",
        description: "A venda foi excluída com sucesso.",
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria criada", description: "A categoria foi criada com sucesso." });
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria excluída", description: "A categoria foi excluída com sucesso." });
    },
  });

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", type: "income" });
    setEditingCategory(null);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "income",
      description: "",
      amount: "",
      paymentMethod: "money",
      account: bankAccounts?.[0]?.id || "",
      categoryId: "",
      clientName: "",
      document: "",
      costCenter: "",
      notes: "",
    });
    setEditingSale(null);
  };

  const handleOpenDialog = (sale?: RetailSale) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        date: sale.date,
        type: (sale as any).type || "income",
        description: sale.description,
        amount: sale.amount.toString(),
        paymentMethod: sale.paymentMethod,
        account: sale.account,
        categoryId: sale.categoryId || "",
        clientName: sale.clientName || "",
        document: sale.document || "",
        costCenter: sale.costCenter || "",
        notes: sale.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a descrição e o valor maior que zero.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast({ title: "Nome obrigatório", description: "Informe o nome da categoria.", variant: "destructive" });
      return;
    }
    createCategoryMutation.mutate(categoryForm);
  };

  // Filter sales
  const filteredSales = React.useMemo(() => {
    if (!sales) return [];
    return sales.filter((sale) => {
      const matchesSearch = sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.clientName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (sale.document?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesStartDate = !startDateFilter || sale.date >= startDateFilter;
      const matchesEndDate = !endDateFilter || sale.date <= endDateFilter;
      const matchesType = typeFilter === "all" || (sale as any).type === typeFilter || (!(sale as any).type && typeFilter === "income");
      const matchesPayment = paymentMethodFilter === "all" || sale.paymentMethod === paymentMethodFilter;
      const matchesCategory = categoryFilter === "all" || sale.categoryId === categoryFilter;
      return matchesSearch && matchesStartDate && matchesEndDate && matchesType && matchesPayment && matchesCategory;
    });
  }, [sales, searchTerm, startDateFilter, endDateFilter, typeFilter, paymentMethodFilter, categoryFilter]);

  // Calculate totals for dashboard
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const todayIncome = filteredSales
    ?.filter((s) => s.date === today && ((s as any).type === "income" || !(s as any).type))
    .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

  const todayExpense = filteredSales
    ?.filter((s) => s.date === today && (s as any).type === "expense")
    .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

  const monthIncome = filteredSales
    ?.filter((s) => s.date.startsWith(currentMonth) && ((s as any).type === "income" || !(s as any).type))
    .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

  const monthExpense = filteredSales
    ?.filter((s) => s.date.startsWith(currentMonth) && (s as any).type === "expense")
    .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

  const currentBalance = monthIncome - monthExpense;

  // Last 5 movements
  const lastMovements = React.useMemo(() => {
    return [...(filteredSales || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [filteredSales]);

  // Chart data - daily movements for current month
  const dailyChartData = React.useMemo(() => {
    if (!filteredSales) return [];
    const daysInMonth = new Date(parseInt(currentMonth.split("-")[0]), parseInt(currentMonth.split("-")[1]), 0).getDate();
    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
      const dayIncome = filteredSales
        .filter((s) => s.date === dateStr && ((s as any).type === "income" || !(s as any).type))
        .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      const dayExpense = filteredSales
        .filter((s) => s.date === dateStr && (s as any).type === "expense")
        .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      data.push({
        dia: day,
        entradas: dayIncome,
        saídas: dayExpense,
        saldo: dayIncome - dayExpense,
      });
    }
    return data;
  }, [filteredSales, currentMonth]);

  // Category chart data
  const categoryChartData = React.useMemo(() => {
    if (!filteredSales || !categories) return [];
    const data: { name: string; value: number; type: string }[] = [];
    const categoryMap = new Map<string, number>();

    filteredSales.forEach((s) => {
      const cat = categories.find((c) => c.id === s.categoryId);
      const catName = cat?.name || "Sem categoria";
      const current = categoryMap.get(catName) || 0;
      categoryMap.set(catName, current + parseFloat(s.amount.toString()));
    });

    categoryMap.forEach((value, name) => {
      const cat = categories.find((c) => c.name === name);
      data.push({ name, value, type: cat?.type || "income" });
    });

    return data.sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filteredSales, categories]);

  // Payment method chart data
  const paymentMethodChartData = React.useMemo(() => {
    if (!filteredSales) return [];
    const data: { name: string; value: number }[] = [];
    const methodMap = new Map<string, number>();

    filteredSales.forEach((s) => {
      const method = paymentMethodOptions.find((m) => m.value === s.paymentMethod)?.label || s.paymentMethod;
      const current = methodMap.get(method) || 0;
      methodMap.set(method, current + parseFloat(s.amount.toString()));
    });

    methodMap.forEach((value, name) => data.push({ name, value }));
    return data;
  }, [filteredSales]);

  const getPaymentMethodLabel = (value: string) => {
    return paymentMethodOptions.find((opt) => opt.value === value)?.label || value;
  };

  const getPaymentMethodIcon = (value: string) => {
    const Icon = paymentMethodOptions.find((opt) => opt.value === value)?.icon || DollarSign;
    return Icon;
  };

  const exportToCSV = () => {
    if (!filteredSales.length) {
      toast({ title: "Sem dados", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }

    const headers = ["Data", "Tipo", "Categoria", "Descrição", "Forma de Pagamento", "Valor", "Observações"];
    const rows = filteredSales.map((s) => [
      s.date,
      (s as any).type === "expense" ? "Saída" : "Entrada",
      categories?.find((c) => c.id === s.categoryId)?.name || "-",
      s.description,
      getPaymentMethodLabel(s.paymentMethod),
      s.amount,
      s.notes || "",
    ]);

    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `movimentacoes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({ title: "Exportação concluída", description: "Arquivo CSV baixado com sucesso." });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-gradient-to-b from-primary to-violet-600 rounded-full" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-primary via-violet-600 to-indigo-700 bg-clip-text text-transparent">
              Controle de Caixa
            </h1>
          </div>
          <p className="text-muted-foreground font-medium max-w-2xl px-4 italic">
            Registre entradas e saídas avulsas. Elas aparecerão automaticamente no fluxo de caixa.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <Button
            onClick={() => setIsCategoryDialogOpen(true)}
            variant="outline"
            className="h-14 px-8 rounded-2xl border-2 hover:bg-slate-50 transition-all font-bold group"
          >
            <Tag className="h-5 w-5 mr-2 text-slate-400 group-hover:text-primary transition-colors" />
            Categorias
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-violet-700 hover:scale-105 transition-all shadow-xl shadow-primary/20 font-black tracking-tighter text-lg"
          >
            <Plus className="h-6 w-6 mr-2" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:max-w-md">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent z-0 pointer-events-none" />
              <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-80">Saldo Caixa</p>
                    <p className={cn("text-3xl font-black tracking-tighter", currentBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400")}>
                      {formatCurrency(currentBalance)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100/50 dark:bg-blue-900/20 backdrop-blur-md rounded-2xl shadow-inner group-hover:rotate-12 transition-transform duration-500">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent z-0 pointer-events-none" />
              <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-80">Entradas Mês</p>
                    <p className="text-3xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(monthIncome)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/20 backdrop-blur-md rounded-2xl shadow-inner group-hover:rotate-12 transition-transform duration-500">
                    <ArrowUpCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent z-0 pointer-events-none" />
              <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-80">Saídas Mês</p>
                    <p className="text-3xl font-black tracking-tighter text-rose-600 dark:text-rose-400">
                      -{formatCurrency(monthExpense)}
                    </p>
                  </div>
                  <div className="p-3 bg-rose-100/50 dark:bg-rose-900/20 backdrop-blur-md rounded-2xl shadow-inner group-hover:rotate-12 transition-transform duration-500">
                    <ArrowDownCircle className="h-6 w-6 text-rose-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent z-0 pointer-events-none" />
              <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-80">Hoje</p>
                    <p className="text-3xl font-black tracking-tighter text-purple-600 dark:text-purple-400">
                      {filteredSales?.filter((s) => s.date === today).length || 0} qtd
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100/50 dark:bg-purple-900/20 backdrop-blur-md rounded-2xl shadow-inner group-hover:rotate-12 transition-transform duration-500">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Fluxo de Caixa - Mês Atual
                </CardTitle>
                <CardDescription>Entradas e saídas por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" tickFormatter={(v) => `${v}`} />
                      <YAxis tickFormatter={(v) => `R$${v}`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Dia ${label}`} />
                      <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                      <Bar dataKey="saídas" fill="#ef4444" name="Saídas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Por Categoria
                </CardTitle>
                <CardDescription>Distribuição por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={categoryChartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Last 5 Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Últimas 5 Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastMovements.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Forma de Pagamento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastMovements.map((sale) => {
                        const isExpense = (sale as any).type === "expense";
                        const PaymentIcon = getPaymentMethodIcon(sale.paymentMethod);
                        return (
                          <TableRow key={sale.id}>
                            <TableCell>{formatDate(sale.date)}</TableCell>
                            <TableCell>
                              <Badge className={isExpense ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                {isExpense ? "Saída" : "Entrada"}
                              </Badge>
                            </TableCell>
                            <TableCell>{sale.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <PaymentIcon className="h-4 w-4" />
                                {getPaymentMethodLabel(sale.paymentMethod)}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-bold ${isExpense ? "text-red-600" : "text-green-600"}`}>
                              {isExpense ? "-" : "+"}{formatCurrency(sale.amount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Nenhuma movimentação registrada.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden mt-8">
            <CardHeader className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 p-8">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">
                    Histórico
                  </h2>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    Todas as suas Movimentações
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                  <Button variant="outline" onClick={exportToCSV} className="rounded-2xl h-12 shadow-sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>

              {/* Filtros Premium Lineares */}
              <div className="mt-8 flex flex-row flex-nowrap gap-4 items-center w-full overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
                <div className="relative group min-w-[300px] shrink-0">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Buscar por descrição, cliente ou documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 bg-white/50 border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium shadow-sm w-full"
                  />
                </div>

                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                  <SelectTrigger className="h-14 min-w-[150px] bg-white/50 border-slate-200 rounded-2xl shadow-sm font-bold">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-xl">
                    <SelectItem value="all" className="font-bold">Todos</SelectItem>
                    <SelectItem value="income" className="font-bold text-emerald-600">Entradas</SelectItem>
                    <SelectItem value="expense" className="font-bold text-rose-600">Saídas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="h-14 min-w-[200px] bg-white/50 border-slate-200 rounded-2xl shadow-sm font-bold">
                    <SelectValue placeholder="Forma Pagto" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-xl">
                    <SelectItem value="all" className="font-bold">Todas as formas</SelectItem>
                    {paymentMethodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="font-medium">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-14 min-w-[200px] bg-white/50 border-slate-200 rounded-2xl shadow-sm font-bold">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-xl">
                    <SelectItem value="all" className="font-bold">Todas categorias</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="font-medium">{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 bg-white/50 border border-slate-200 rounded-2xl px-4 shadow-sm shrink-0">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="border-0 bg-transparent h-12 w-32 focus-visible:ring-0 p-0 font-bold text-xs"
                  />
                  <span className="text-slate-300 font-black">→</span>
                  <Input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="border-0 bg-transparent h-12 w-32 focus-visible:ring-0 p-0 font-bold text-xs"
                  />
                </div>

                {(searchTerm || typeFilter !== "all" || paymentMethodFilter !== "all" || categoryFilter !== "all" || startDateFilter || endDateFilter) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchTerm("");
                      setTypeFilter("all");
                      setPaymentMethodFilter("all");
                      setCategoryFilter("all");
                      setStartDateFilter("");
                      setEndDateFilter("");
                    }}
                    className="h-14 w-14 shrink-0 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : filteredSales && filteredSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                        <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Data</TableHead>
                        <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Tipo</TableHead>
                        <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Categoria</TableHead>
                        <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Descrição</TableHead>
                        <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Forma Pagto</TableHead>
                        <TableHead className="text-right font-bold text-slate-500 uppercase text-xs tracking-wider">Valor</TableHead>
                        <TableHead className="text-right text-slate-500 uppercase text-xs tracking-wider"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => {
                        const isExpense = (sale as any).type === "expense";
                        const PaymentIcon = getPaymentMethodIcon(sale.paymentMethod);
                        const categoryName = categories?.find((c) => c.id === sale.categoryId)?.name || "-";
                        return (
                          <TableRow key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(sale.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                isExpense ? "bg-rose-500/20 text-rose-700 dark:text-rose-400" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                              )}>
                                {isExpense ? "Saída" : "Entrada"}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-slate-700 dark:text-slate-300">{categoryName}</TableCell>
                            <TableCell>
                              <div className="font-bold text-slate-900 dark:text-slate-100">{sale.description}</div>
                              {sale.document && <div className="text-[10px] font-black opacity-50 tracking-wider">DOC: {sale.document}</div>}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 font-medium">
                                <PaymentIcon className="h-4 w-4 opacity-70" />
                                {getPaymentMethodLabel(sale.paymentMethod)}
                              </div>
                            </TableCell>
                            <TableCell className={cn("text-right font-black tracking-tighter text-lg", isExpense ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                              {isExpense ? "-" : "+"}{formatCurrency(sale.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full" onClick={() => handleOpenDialog(sale)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-full" onClick={() => deleteMutation.mutate(sale.id)} disabled={deleteMutation.isPending}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma movimentação encontrada</h3>
                  <p className="text-muted-foreground">Clique em "Nova Movimentação" para registrar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden p-2">
              <CardHeader>
                <CardTitle className="text-2xl font-black tracking-tighter">Relatório Mensal</CardTitle>
                <CardDescription>Resumo de entradas e saídas do mês atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-6 rounded-3xl relative overflow-hidden">
                    <p className="text-xs font-bold text-emerald-800/60 dark:text-emerald-400/60 uppercase tracking-widest relative z-10">Total Entradas</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter mt-1 relative z-10">{formatCurrency(monthIncome)}</p>
                    <ArrowUpCircle className="absolute -right-4 -bottom-4 h-20 w-20 text-emerald-500/10 rotate-[-15deg]" />
                  </div>
                  <div className="bg-gradient-to-br from-rose-500/10 to-transparent p-6 rounded-3xl relative overflow-hidden">
                    <p className="text-xs font-bold text-rose-800/60 dark:text-rose-400/60 uppercase tracking-widest relative z-10">Total Saídas</p>
                    <p className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tighter mt-1 relative z-10">{formatCurrency(monthExpense)}</p>
                    <ArrowDownCircle className="absolute -right-4 -bottom-4 h-20 w-20 text-rose-500/10 rotate-[15deg]" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-6 rounded-3xl relative overflow-hidden">
                  <p className="text-xs font-bold text-blue-800/60 dark:text-blue-400/60 uppercase tracking-widest relative z-10">Saldo do Mês</p>
                  <p className={cn("text-5xl font-black tracking-tighter mt-1 relative z-10", currentBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400")}>
                    {formatCurrency(currentBalance)}
                  </p>
                  <Wallet className="absolute -right-4 -bottom-4 h-24 w-24 text-blue-500/10 -rotate-12" />
                </div>
                <Button onClick={exportToCSV} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-xl shadow-slate-900/20">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatório CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Forma de Pagamento</CardTitle>
                <CardDescription>Distribuição por método de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={paymentMethodChartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {paymentMethodChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New/Edit Movement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-100 dark:border-slate-800 shadow-2xl rounded-[2rem] flex flex-col overflow-hidden max-h-[95vh] p-0">
          <DialogHeader className="px-8 pt-8 pb-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tighter">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              {editingSale ? "Editar Movimentação" : "Nova Movimentação"}
            </DialogTitle>
            <DialogDescription className="font-medium opacity-80 pl-14">
              Preencha os dados da movimentação manual.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 p-8 space-y-6 min-h-0 bg-slate-50/50 dark:bg-slate-900/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={cn(
                    "p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group",
                    formData.type === "income"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 bg-white dark:bg-slate-900"
                  )}
                  onClick={() => setFormData({ ...formData, type: "income" })}
                >
                  {formData.type === "income" && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />}
                  <div className="flex items-center gap-3 relative z-10">
                    <ArrowUpCircle className={cn("h-6 w-6 transition-transform group-hover:scale-110", formData.type === "income" ? "text-emerald-600" : "text-slate-400")} />
                    <span className={cn("font-bold text-lg tracking-tighter", formData.type === "income" ? "text-emerald-800 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400")}>
                      Entrada (Receita)
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group",
                    formData.type === "expense"
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20 shadow-md shadow-rose-500/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-rose-300 bg-white dark:bg-slate-900"
                  )}
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                >
                  {formData.type === "expense" && <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent pointer-events-none" />}
                  <div className="flex items-center gap-3 relative z-10">
                    <ArrowDownCircle className={cn("h-6 w-6 transition-transform group-hover:scale-110", formData.type === "expense" ? "text-rose-600" : "text-slate-400")} />
                    <span className={cn("font-bold text-lg tracking-tighter", formData.type === "expense" ? "text-rose-800 dark:text-rose-400" : "text-slate-600 dark:text-slate-400")}>
                      Saída (Despesa)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Data *</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="h-12 border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Documento (NF/Cupom)</Label>
                  <Input id="document" placeholder="Número do documento" value={formData.document} onChange={(e) => setFormData({ ...formData, document: e.target.value })} className="h-12 border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Descrição *</Label>
                <Input id="description" placeholder={formData.type === "income" ? "Ex: Venda de mercadorias" : "Ex: Pagamento de fornecedor"} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="h-12 border-slate-200 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Valor Total (R$) *</Label>
                <Input id="amount" type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required min="0.01" className="h-12 border-slate-200 rounded-xl text-lg font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Forma de Pagamento *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger className="h-12 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {paymentMethodOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="font-medium">
                          <div className="flex items-center gap-2"><opt.icon className="h-4 w-4" />{opt.label}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Conta/Caixa *</Label>
                  <Select value={formData.account} onValueChange={(value) => setFormData({ ...formData, account: value })}>
                    <SelectTrigger className="h-12 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {bankAccounts?.map((acc) => (<SelectItem className="font-medium" key={acc.id} value={acc.id}>{acc.name} {acc.bank ? `(${acc.bank})` : ""}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Categoria</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger className="h-12 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {categories?.filter((c) => c.type === formData.type).map((cat) => (<SelectItem className="font-medium" key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Nome do Cliente/Fornecedor</Label>
                  <Input id="clientName" placeholder="Nome (opcional)" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="h-12 border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costCenter" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Loja/PDV</Label>
                <Input id="costCenter" placeholder="Ex: Loja Principal, PDV 1, etc." value={formData.costCenter} onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })} className="h-12 border-slate-200 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Observações</Label>
                <Input id="notes" placeholder="Observações adicionais (opcional)" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="h-12 border-slate-200 rounded-xl" />
              </div>

              <div className={cn("p-4 rounded-xl border flex gap-3", formData.type === "income" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")}>
                {formData.type === "income" ? <ArrowUpCircle className="h-5 w-5 shrink-0 mt-0.5" /> : <ArrowDownCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                <p className="text-sm font-medium">
                  Esta movimentação aparecerá no fluxo de caixa atual de <strong>{formData.type === "income" ? "entrada" : "saída"}</strong> de dinheiro da sua empresa.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 -mx-8 -mb-8 px-8 py-5">
                <Button type="button" variant="ghost" className="h-12 px-6 rounded-xl font-bold" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" className={cn("h-12 px-10 rounded-xl font-black tracking-tighter text-white", formData.type === "income" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 shadow-lg" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 shadow-lg")} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : editingSale ? "Atualizar Movimentação" : "Registrar Fluxo"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Gerenciar Categorias</DialogTitle>
            <DialogDescription>Crie, edite e gerencie as categorias de movimentação.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* New Category Form */}
            <form onSubmit={handleCategorySubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Nova Categoria</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Nome da categoria" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                <Select value={categoryForm.type} onValueChange={(v) => setCategoryForm({ ...categoryForm, type: v as "income" | "expense" })}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income"><div className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-green-600" />Entrada</div></SelectItem>
                    <SelectItem value="expense"><div className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-red-600" />Saída</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createCategoryMutation.isPending} className="w-full"><PlusCircle className="h-4 w-4 mr-2" />Criar Categoria</Button>
            </form>

            {/* Categories List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <h4 className="font-medium px-1">Categorias de Entrada</h4>
              {categories?.filter((c) => c.type === "income").map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-green-600" /><span>{cat.name}</span></div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteCategoryMutation.mutate(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}

              <h4 className="font-medium px-1 mt-4">Categorias de Saída</h4>
              {categories?.filter((c) => c.type === "expense").map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-red-600" /><span>{cat.name}</span></div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteCategoryMutation.mutate(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
