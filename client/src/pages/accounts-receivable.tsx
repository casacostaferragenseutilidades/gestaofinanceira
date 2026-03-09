import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  Calendar,
  Users,
  UserPlus,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Clock,
  Percent,
  Copy,
  Mail,
  Phone,
  MapPin,
  Search as SearchIcon,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  BarChart3,
  FileText,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, isOverdue, cn } from "@/lib/utils";
import type { AccountReceivable, Client, Category } from "@shared/schema";

const accountReceivableFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  categoryId: z.string().optional(),
  discount: z.string().optional(),
  notes: z.string().optional(),
  markAsReceived: z.boolean().default(false).optional(),
  receivedDate: z.string().optional(),
  isRecurring: z.boolean().default(false).optional(),
  recurrence: z.string().optional(),
  recurrencePeriod: z.string().optional(),
  paymentMethod: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.markAsReceived && !data.receivedDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data de recebimento é obrigatória quando marcado como recebido",
      path: ["receivedDate"],
    });
  }
  if (data.isRecurring) {
    if (!data.recurrence) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Frequência é obrigatória para lançamentos recorrentes",
        path: ["recurrence"],
      });
    }
    if (!data.recurrencePeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data final é obrigatória para lançamentos recorrentes",
        path: ["recurrencePeriod"],
      });
    }
  }
});

type AccountReceivableFormData = z.infer<typeof accountReceivableFormSchema>;

const clientFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  document: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

const KPICard = ({
  title,
  value,
  subvalue,
  icon: Icon,
  variant = "default",
  trend,
  className
}: {
  title: string;
  value: string;
  subvalue?: string;
  icon: any;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "primary" | "secondary";
  trend?: { value: string; isPositive: boolean };
  className?: string;
}) => {
  const variants = {
    default: "from-slate-50 to-slate-100 text-slate-900 border-slate-200",
    primary: "from-primary via-violet-600 to-indigo-700 text-white shadow-primary/20",
    success: "from-emerald-500 to-teal-600 text-white shadow-emerald-500/20",
    warning: "from-amber-400 to-orange-500 text-white shadow-amber-500/20",
    danger: "from-rose-500 to-red-600 text-white shadow-rose-500/20",
    info: "from-blue-500 to-cyan-600 text-white shadow-blue-500/20",
    secondary: "from-indigo-500 to-blue-600 text-white shadow-indigo-500/20",
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group",
      "bg-gradient-to-br",
      variants[variant as keyof typeof variants],
      className
    )}>
      {/* Decorative pulse element */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />

      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{title}</p>
              <h3 className="text-3xl font-black tracking-tighter leading-none">{value}</h3>
            </div>

            {(subvalue || trend) && (
              <div className="flex items-center gap-3">
                {trend && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black",
                    trend.isPositive ? "bg-emerald-500/20 text-emerald-100" : "bg-rose-500/20 text-rose-100"
                  )}>
                    {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trend.value}
                  </div>
                )}
                {subvalue && <p className="text-[10px] font-bold opacity-60 uppercase">{subvalue}</p>}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner group-hover:rotate-12 transition-transform duration-500">
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default function AccountsReceivable() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<AccountReceivable | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [activeFilter, setActiveFilter] = React.useState<string>("active");
  const [receivedDate, setReceivedDate] = React.useState<string>(new Date().toISOString().split("T")[0]);
  const [showOnlyFilled, setShowOnlyFilled] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<string>("");
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [accountToReceive, setAccountToReceive] = React.useState<AccountReceivable | null>(null);
  const [viewAccountDialogOpen, setViewAccountDialogOpen] = React.useState(false);
  const [accountToView, setAccountToView] = React.useState<AccountReceivable | null>(null);

  const getDefaultDateRange = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const formatDateStr = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    return {
      start: formatDateStr(firstDay),
      end: formatDateStr(lastDay)
    };
  };

  const [dateFilter, setDateFilter] = React.useState<{ start: string; end: string }>(getDefaultDateRange);
  const [newClientDialogOpen, setNewClientDialogOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = React.useState<any>(null);
  const [clientFilter, setClientFilter] = React.useState<string>("all");
  const { toast } = useToast();

  React.useEffect(() => {
    const stored = localStorage.getItem('empresaAtiva');
    if (stored) {
      try {
        setEmpresaAtiva(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing empresaAtiva', e);
      }
    }
  }, []);


  const { data: accounts, isLoading } = useQuery<AccountReceivable[]>({
    queryKey: ["/api/accounts-receivable"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      document: "",
      email: "",
      phone: "",
      contact: "",
      address: "",
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return await res.json() as Client;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setNewClientDialogOpen(false);
      clientForm.reset();
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso.",
      });
      if (newClient && newClient.id) {
        form.setValue("clientId", newClient.id);
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o cliente.",
        variant: "destructive",
      });
    },
  });

  const searchCNPJ = async (cnpj: string) => {
    try {
      const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
      if (cleanCNPJ.length !== 14) return;

      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCNPJ}`);
      if (!response.ok) return;

      const data = await response.json();

      if (data.estabelecimento) {
        clientForm.setValue('name', data.estabelecimento.nome_fantasia || data.estabelecimento.nome_empresarial || '');
        clientForm.setValue('email', data.estabelecimento.email || '');
        clientForm.setValue('phone', data.estabelecimento.ddd1 + data.estabelecimento.telefone1 || '');
        clientForm.setValue('address', `${data.estabelecimento.tipo_logradouro || ''} ${data.estabelecimento.logradouro || ''}, ${data.estabelecimento.numero || ''}, ${data.estabelecimento.bairro || ''}, ${data.estabelecimento.municipio || ''} - ${data.estabelecimento.uf || ''}`.trim());

        toast({
          title: "Dados encontrados",
          description: "Informações do CNPJ foram preenchidas automaticamente.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar os dados do CNPJ.",
        variant: "destructive",
      });
    }
  };

  const form = useForm<AccountReceivableFormData>({
    resolver: zodResolver(accountReceivableFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      dueDate: "",
      clientId: "",
      categoryId: "",
      discount: "",
      notes: "",
      markAsReceived: false,
      receivedDate: new Date().toISOString().split("T")[0],
      isRecurring: false,
      recurrence: "",
      recurrencePeriod: "",
      paymentMethod: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AccountReceivableFormData) =>
      apiRequest("POST", "/api/accounts-receivable", {
        ...data,
        amount: data.amount,
        discount: data.discount || null,
        clientId: data.clientId || null,
        categoryId: data.categoryId || null,
        status: data.markAsReceived ? "received" : "pending",
        receivedDate: data.markAsReceived ? data.receivedDate : null,
        recurrence: data.isRecurring ? data.recurrence : null,
        recurrencePeriod: data.isRecurring ? data.recurrencePeriod : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Conta a receber criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AccountReceivableFormData & { id: string }) =>
      apiRequest("PATCH", `/api/accounts-receivable/${data.id}`, {
        ...data,
        amount: data.amount,
        discount: data.discount || null,
        clientId: data.clientId || null,
        categoryId: data.categoryId || null,
        receivedDate: data.markAsReceived ? (data.receivedDate || null) : null,
        status: data.markAsReceived ? "received" : "pending",
        recurrence: data.isRecurring ? data.recurrence : null,
        recurrencePeriod: data.isRecurring ? data.recurrencePeriod : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      setIsOpen(false);
      setEditingAccount(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/accounts-receivable/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      toast({
        title: "Sucesso",
        description: "Conta desativada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta.",
        variant: "destructive",
      });
    },
  });

  const markAsReceivedMutation = useMutation({
    mutationFn: (data: { id: string; discount?: string; receivedDate: string; paymentMethod?: string }) =>
      apiRequest("PATCH", `/api/accounts-receivable/${data.id}/receive`, {
        receivedDate: data.receivedDate,
        discount: data.discount || null,
        paymentMethod: data.paymentMethod || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      setPaymentDialogOpen(false);
      setAccountToReceive(null);
      setReceivedDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("");
      toast({
        title: "Sucesso",
        description: "Conta marcada como recebida.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a conta como recebida.",
        variant: "destructive",
      });
    },
  });

  const bulkMarkAsReceivedMutation = useMutation({
    mutationFn: (data: { ids: string[]; receivedDate: string; paymentMethod?: string }) =>
      apiRequest("POST", "/api/accounts-receivable/bulk-receive", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      setSelectedAccounts([]);
      toast({
        title: "Sucesso",
        description: "Contas marcadas como recebidas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível processar o recebimento em massa.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AccountReceivableFormData) => {
    if (editingAccount) {
      updateMutation.mutate({ ...data, id: editingAccount.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (account: AccountReceivable) => {
    // Bloquear edição se a conta já está recebida
    if (account.status === "received") {
      toast({
        title: "Ação não permitida",
        description: "Contas já recebidas não podem ser editadas.",
        variant: "destructive",
      });
      return;
    }
    setEditingAccount(account);
    form.reset({
      description: account.description,
      amount: account.amount,
      dueDate: account.dueDate,
      clientId: account.clientId || "",
      categoryId: account.categoryId || "",
      discount: account.discount || "",
      notes: account.notes || "",
      markAsReceived: account.status === 'received',
      receivedDate: account.receivedDate || "",
      isRecurring: !!account.recurrence && account.recurrence !== 'none',
      recurrence: account.recurrence || "",
      recurrencePeriod: account.recurrencePeriod || "",
      paymentMethod: account.paymentMethod || "",
    });
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingAccount(null);
      form.reset();
    }
  };

  const handleMarkAsReceived = (account: AccountReceivable) => {
    setAccountToReceive(account);
    setPaymentMethod(account.paymentMethod || "");
    setPaymentDialogOpen(true);
  };

  const handlePaymentDialogOpenChange = (open: boolean) => {
    setPaymentDialogOpen(open);
    if (!open) {
      setAccountToReceive(null);
    }
  };

  const handleClone = (account: AccountReceivable) => {
    const clonedAccount = {
      description: `${account.description} (Cópia)`,
      amount: account.amount,
      dueDate: account.dueDate,
      clientId: account.clientId || "",
      categoryId: account.categoryId || "",
      discount: account.discount || "",
      notes: account.notes || "",
      paymentMethod: account.paymentMethod || "",
    };

    form.reset(clonedAccount);
    setIsOpen(true);
  };

  const handleView = (account: AccountReceivable) => {
    setAccountToView(account);
    setViewAccountDialogOpen(true);
  };

  const handleViewDialogOpenChange = (open: boolean) => {
    setViewAccountDialogOpen(open);
    if (!open) {
      setAccountToView(null);
    }
  };

  const filteredAccounts = accounts?.filter((account) => {
    const term = searchTerm.toLowerCase();

    const clientName = clients?.find(c => c.id === account.clientId)?.name || "";
    const categoryName = categories?.find(c => c.id === account.categoryId)?.name || "";

    const matchesSearch =
      account.description.toLowerCase().includes(term) ||
      account.amount.toString().includes(term) ||
      formatCurrency(account.amount).toLowerCase().includes(term) ||
      (account.notes || "").toLowerCase().includes(term) ||
      clientName.toLowerCase().includes(term) ||
      categoryName.toLowerCase().includes(term);

    const overdueAccount = isOverdue(account.dueDate, account.status);
    const displayStatus = overdueAccount ? "overdue" : account.status;

    const matchesStatus = statusFilter === "all" || displayStatus === statusFilter;
    const matchesActive = activeFilter === "all" || (activeFilter === "active" && account.active !== false) || (activeFilter === "inactive" && account.active === false);

    // Date range filter - usa vencimento como referência
    const isOverdueFromPreviousMonth = overdueAccount && account.status !== "received";
    const matchesDateRange = isOverdueFromPreviousMonth ||
      ((!dateFilter.start || account.dueDate >= dateFilter.start) &&
        (!dateFilter.end || account.dueDate <= dateFilter.end));

    // Company filter
    const matchesCompany = !empresaAtiva || account.companyId === empresaAtiva.id;

    // Client filter
    const matchesClient = clientFilter === "all" || account.clientId === clientFilter;

    const isFilled = account.dueDate && account.amount && account.categoryId && account.clientId;
    const matchesFilled = !showOnlyFilled || isFilled;

    return matchesSearch && matchesStatus && matchesActive && matchesDateRange && matchesCompany && matchesClient && matchesFilled;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) || [];

  const incomeCategories = categories?.filter((c) => c.type === "income");

  // Calculate statistics based on filtered accounts
  const stats = {
    total: filteredAccounts.reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    pending: filteredAccounts.filter(acc => acc.status === "pending" && !isOverdue(acc.dueDate, acc.status)).reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    received: filteredAccounts.filter(acc => acc.status === "received").reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdue: filteredAccounts.filter(acc => isOverdue(acc.dueDate, acc.status)).reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdueCount: filteredAccounts.filter(acc => isOverdue(acc.dueDate, acc.status)).length,
    pendingCount: filteredAccounts.filter(acc => acc.status === "pending" && !isOverdue(acc.dueDate, acc.status)).length,
    receivedCount: filteredAccounts.filter(acc => acc.status === "received").length,
    totalDiscounts: filteredAccounts.reduce((sum, acc) => sum + (acc.discount && acc.discount !== null ? parseFloat(acc.discount) : 0), 0),
  };

  return (
    <div className="space-y-10 p-2 md:p-6">
      {/* Header - Modernizado Flux Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-gradient-to-b from-primary to-violet-600 rounded-full" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-primary via-violet-600 to-indigo-700 bg-clip-text text-transparent">
              Contas a Receber
            </h1>
          </div>
          <p className="text-muted-foreground font-medium max-w-2xl px-4 italic">
            Gestão estratégica de recebíveis e controle de liquidez ativa.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                data-testid="button-new-receivable"
                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-violet-700 hover:scale-105 transition-all shadow-xl shadow-primary/20 font-black tracking-tighter text-lg group"
              >
                <Plus className="h-6 w-6 mr-2 group-hover:rotate-90 transition-transform" />
                Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-violet-600 to-indigo-700 p-8 text-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tighter text-white">
                    {editingAccount ? "Editar Recebível" : "Novo Lançamento"}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 font-medium">
                    Preencha os dados necessários para o registro da receita.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-8 overflow-y-auto flex-1 min-h-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                    {/* Seção 1: Informações Básicas */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight">Informações do Lançamento</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="font-bold">Descrição do Recebível *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Consultoria Técnica Mensal..." {...field} className="h-12 rounded-xl border-slate-200 bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Valor Total (R$) *</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0,00" {...field} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-lg text-emerald-600" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Data de Vencimento *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="h-12 rounded-xl border-slate-200 bg-white font-bold" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Seção 2: Classificação e Cliente */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-violet-100 rounded-lg">
                          <Users className="h-5 w-5 text-violet-600" />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight">Origem e Classificação</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-violet-50/30 dark:bg-violet-900/10 rounded-3xl border border-violet-100 dark:border-violet-800">
                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Cliente *</FormLabel>
                              <div className="flex gap-2">
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 rounded-xl border-violet-200 bg-white">
                                      <SelectValue placeholder="Selecione o cliente" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    {clients?.sort((a, b) => a.name.localeCompare(b.name)).map((client) => (
                                      <SelectItem key={client.id} value={client.id} className="font-medium">
                                        {client.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-12 w-12 rounded-xl border-violet-200 hover:bg-violet-100 text-violet-600 transition-colors"
                                  onClick={() => setNewClientDialogOpen(true)}
                                >
                                  <UserPlus className="h-5 w-5" />
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Categoria</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl border-violet-200 bg-white">
                                    <SelectValue placeholder="Selecione a categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                  {incomeCategories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id} className="font-medium">
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Forma de Recebimento</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl border-violet-200 bg-white">
                                    <SelectValue placeholder="Como será pago?" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                  <SelectItem value="pix">PIX</SelectItem>
                                  <SelectItem value="money">Dinheiro</SelectItem>
                                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                  <SelectItem value="boleto">Boleto</SelectItem>
                                  <SelectItem value="transfer">Transferência</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <DialogFooter className="flex gap-3 pt-8 border-t border-slate-100 mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        className="h-14 px-8 rounded-2xl font-bold border-slate-200 hover:bg-slate-50 transition-all text-lg"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="h-14 px-12 rounded-2xl bg-gradient-to-r from-primary to-violet-700 shadow-xl shadow-primary/20 font-black tracking-tighter text-white text-lg hover:scale-105 transition-all"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? "Processando..."
                          : editingAccount ? "Salvar Alterações" : "Confirmar Receita"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Section - Flux Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard
          title="Expectativa Total"
          value={formatCurrency(stats.total)}
          subvalue={`${filteredAccounts.length} títulos ativos`}
          icon={BarChart3}
          variant="primary"
        />
        <KPICard
          title="Em Aberto"
          value={formatCurrency(stats.pending)}
          subvalue={`${stats.pendingCount} pendências`}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Consolidados"
          value={formatCurrency(stats.received)}
          subvalue={`${stats.receivedCount} recebidos`}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Inadimplência"
          value={formatCurrency(stats.overdue)}
          subvalue={`${stats.overdueCount} em atraso`}
          icon={AlertTriangle}
          variant="danger"
        />
        <KPICard
          title="Total Benefícios"
          value={formatCurrency(stats.totalDiscounts)}
          subvalue="Descontos aplicados"
          icon={Percent}
          variant="secondary"
        />
        <KPICard
          title="Performance"
          value={`${((stats.receivedCount / (filteredAccounts.length || 1)) * 100).toFixed(1)}%`}
          subvalue="Taxa de Liquidez"
          icon={TrendingUp}
          variant="info"
        />
      </div>

      {/* Main Table - Flux Style */}
      <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardHeader className="p-8 bg-gradient-to-r from-slate-50 to-white dark:from-slate-950 dark:to-background border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">
                Movimentações
              </h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Gestão detalhada de recebíveis
              </p>
            </div>

            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              {selectedAccounts.length > 0 && (
                <Button
                  onClick={() => {
                    if (window.confirm(`Deseja marcar ${selectedAccounts.length} contas como recebidas hoje?`)) {
                      bulkMarkAsReceivedMutation.mutate({
                        ids: selectedAccounts,
                        receivedDate: new Date().toISOString().split('T')[0],
                        paymentMethod: 'pix'
                      });
                    }
                  }}
                  className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-black tracking-tighter animate-in zoom-in-95 duration-200"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Receber Selecionados ({selectedAccounts.length})
                </Button>
              )}

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className={cn("rounded-lg h-9 w-9", viewMode === "table" && "shadow-sm bg-white")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("cards")}
                  className={cn("rounded-lg h-9 w-9", viewMode === "cards" && "shadow-sm bg-white")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 px-3 border-l">
                <Switch
                  id="filled-mode"
                  checked={showOnlyFilled}
                  onCheckedChange={setShowOnlyFilled}
                />
                <Label htmlFor="filled-mode" className="text-xs font-bold whitespace-nowrap opacity-60">
                  PREENCHIDOS
                </Label>
              </div>
            </div>
          </div>

          {/* Filtros Premium */}
          <div className="mt-8 flex flex-row flex-nowrap gap-4 items-center w-full overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
            <div className="relative group min-w-[300px] shrink-0">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar por descrição, cliente ou valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 bg-white/50 border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium shadow-sm w-full"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-14 min-w-[150px] bg-white/50 border-slate-200 rounded-2xl shadow-sm font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                <SelectItem value="all" className="font-bold">Todos Status</SelectItem>
                <SelectItem value="pending" className="text-amber-600 font-bold">Pendentes</SelectItem>
                <SelectItem value="overdue" className="text-rose-600 font-bold">Vencidos</SelectItem>
                <SelectItem value="received" className="text-emerald-600 font-bold">Recebidos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="h-14 min-w-[130px] bg-white/50 border-slate-200 rounded-2xl shadow-sm font-bold">
                <SelectValue placeholder="Visibilidade" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                <SelectItem value="active" className="font-bold">Ativas</SelectItem>
                <SelectItem value="inactive" className="font-bold">Inativas</SelectItem>
                <SelectItem value="all" className="font-bold">Todas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="h-14 min-w-[180px] flex-1 bg-white/50 border-slate-200 rounded-2xl shadow-sm font-bold">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl max-h-[300px]">
                <SelectItem value="all" className="font-bold">Todos Clientes</SelectItem>
                {clients?.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-white/50 border border-slate-200 rounded-2xl px-4 shadow-sm">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="border-0 bg-transparent h-12 w-32 focus-visible:ring-0 p-0 font-bold text-xs"
              />
              <span className="text-slate-300 font-black">→</span>
              <Input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="border-0 bg-transparent h-12 w-32 focus-visible:ring-0 p-0 font-bold text-xs"
              />
            </div>

            {(searchTerm || statusFilter !== "all" || activeFilter !== "active" || clientFilter !== "all" || dateFilter.start !== getDefaultDateRange().start || dateFilter.end !== getDefaultDateRange().end) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 shrink-0 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setActiveFilter("active");
                  setClientFilter("all");
                  setDateFilter(getDefaultDateRange());
                }}
                title="Limpar filtros"
              >
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredAccounts.length > 0 ? (
            viewMode === "table" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="w-[50px] pl-8">
                        <Checkbox
                          checked={selectedAccounts.length > 0 && selectedAccounts.length === filteredAccounts.filter(a => a.status !== 'received').length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAccounts(filteredAccounts.filter(a => a.status !== 'received').map(a => a.id));
                            } else {
                              setSelectedAccounts([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="font-bold text-slate-900 dark:text-slate-100">Descrição</TableHead>
                      <TableHead className="font-bold text-slate-900 dark:text-slate-100">Cliente</TableHead>
                      <TableHead className="font-bold text-slate-900 dark:text-slate-100">Vencimento</TableHead>
                      <TableHead className="text-right font-bold text-slate-900 dark:text-slate-100">Valor</TableHead>
                      <TableHead className="text-right font-bold text-slate-900 dark:text-slate-100">Líquido</TableHead>
                      <TableHead className="font-bold text-slate-900 dark:text-slate-100">Status</TableHead>
                      <TableHead className="w-[80px] pr-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => {
                      const client = clients?.find(c => c.id === account.clientId);
                      const overdue = isOverdue(account.dueDate, account.status);
                      const displayStatus = overdue ? "overdue" : account.status;
                      const amountNum = parseFloat(account.amount);
                      const discountNum = parseFloat(account.discount || "0");
                      const netValue = amountNum - discountNum;

                      return (
                        <TableRow key={account.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-slate-100 dark:border-slate-800 transition-colors">
                          <TableCell className="pl-8">
                            <Checkbox
                              checked={selectedAccounts.includes(account.id)}
                              disabled={account.status === "received"}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAccounts([...selectedAccounts, account.id]);
                                } else {
                                  setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                            {account.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <Users className="h-4 w-4 text-violet-600" />
                              </div>
                              <span className="font-medium">{client?.name || "Cliente não vinculado"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-bold">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                {formatDate(account.dueDate)}
                              </div>
                              {overdue && (
                                <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                  Atrasado
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-black text-emerald-600">
                            {formatCurrency(account.amount)}
                          </TableCell>
                          <TableCell className="text-right font-black">
                            {formatCurrency(netValue.toFixed(2))}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("rounded-full px-4 py-1 font-bold", getStatusColor(displayStatus))}>
                              {getStatusLabel(displayStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-8">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2 min-w-[180px]">
                                <DropdownMenuItem onClick={() => handleView(account)} className="rounded-xl font-bold gap-3 py-3">
                                  <Eye className="h-4 w-4 text-blue-500" /> Visualizar
                                </DropdownMenuItem>
                                {account.status !== "received" && (
                                  <DropdownMenuItem onClick={() => handleMarkAsReceived(account)} className="rounded-xl font-bold gap-3 py-3 text-emerald-600">
                                    <CheckCircle className="h-4 w-4" /> Registrar Recebimento
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleEdit(account)}
                                  disabled={account.status === "received"}
                                  className="rounded-xl font-bold gap-3 py-3"
                                >
                                  <Pencil className="h-4 w-4 text-violet-500" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate(account.id)}
                                  disabled={account.status === "received"}
                                  className="rounded-xl font-bold gap-3 py-3 text-rose-600"
                                >
                                  <Trash2 className="h-4 w-4" /> Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccounts.map((account) => {
                  const client = clients?.find(c => c.id === account.clientId);
                  const overdue = isOverdue(account.dueDate, account.status);
                  const displayStatus = overdue ? "overdue" : account.status;
                  const netValue = parseFloat(account.amount) - parseFloat(account.discount || "0");

                  return (
                    <Card key={account.id} className="group border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <Badge className={cn("rounded-full px-4 py-1 font-bold", getStatusColor(displayStatus))}>
                            {getStatusLabel(displayStatus)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl p-2">
                              <DropdownMenuItem onClick={() => handleView(account)} className="rounded-xl font-bold gap-2">
                                <Eye className="h-4 w-4 text-blue-500" /> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(account)} className="rounded-xl font-bold gap-2">
                                <Pencil className="h-4 w-4 text-violet-500" /> Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h4 className="text-xl font-black tracking-tighter mb-4 group-hover:text-primary transition-colors">
                          {account.description}
                        </h4>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {client?.name || "Sem cliente"}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(account.dueDate)}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Valor Líquido</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(netValue.toFixed(2))}</p>
                          </div>
                          {account.status !== "received" && (
                            <Button
                              onClick={() => handleMarkAsReceived(account)}
                              size="icon"
                              className="h-12 w-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                            >
                              <CheckCircle className="h-6 w-6" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center px-6">
              <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6">
                <BarChart3 className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                Nenhum título encontrado
              </h3>
              <p className="text-muted-foreground font-medium max-w-sm mb-8">
                Não existem lançamentos para o período ou filtros selecionados.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter(getDefaultDateRange());
                }}
                className="rounded-xl font-bold"
              >
                Limpar Todos os Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogOpenChange}>
        <DialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-emerald-500 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                <CheckCircle className="h-8 w-8" />
                Confirmar Recebimento
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium">
                Deseja registrar o ingresso deste valor no caixa?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">Receber de:</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mb-4">{accountToReceive?.description}</p>
              <p className="text-3xl font-black text-emerald-600">{formatCurrency(accountToReceive?.amount || "0")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="font-bold mb-2 block">Data do Recebimento</Label>
                <Input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="h-12 rounded-xl text-lg font-bold"
                />
              </div>
              <div>
                <Label className="font-bold mb-2 block">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-12 rounded-xl font-bold">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="money">Dinheiro</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900 flex gap-3">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="h-14 rounded-2xl px-8 font-bold">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (accountToReceive) {
                  markAsReceivedMutation.mutate({
                    id: accountToReceive.id,
                    receivedDate,
                    paymentMethod
                  });
                }
              }}
              disabled={markAsReceivedMutation.isPending}
              className="h-14 rounded-2xl px-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-tighter text-lg shadow-xl shadow-emerald-500/20"
            >
              {markAsReceivedMutation.isPending ? "Processando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Account Dialog */}
      <Dialog open={viewAccountDialogOpen} onOpenChange={handleViewDialogOpenChange}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tighter text-white">
                Detalhes do Lançamento
              </DialogTitle>
              <DialogDescription className="text-white/40 font-medium">
                Protocolo de conferência de receita
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Descrição</p>
                <p className="text-lg font-black">{accountToView?.description}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Status</p>
                <div>
                  <Badge className={cn("rounded-full font-bold", accountToView ? getStatusColor(isOverdue(accountToView.dueDate, accountToView.status) ? "overdue" : accountToView.status) : "")}>
                    {accountToView ? getStatusLabel(isOverdue(accountToView.dueDate, accountToView.status) ? "overdue" : accountToView.status) : ""}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Valor Total</p>
                <p className="text-2xl font-black text-emerald-600">{formatCurrency(accountToView?.amount || "0")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Vencimento</p>
                <p className="text-lg font-black">{accountToView ? formatDate(accountToView.dueDate) : ""}</p>
              </div>
            </div>

            {accountToView?.notes && (
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Observações</p>
                <p className="text-sm font-medium leading-relaxed italic">"{accountToView.notes}"</p>
              </div>
            )}
          </div>
          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900 mt-0">
            <Button variant="outline" onClick={() => setViewAccountDialogOpen(false)} className="h-14 w-full rounded-2xl font-bold">
              Fechar Visualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Client Dialog */}
      <Dialog open={newClientDialogOpen} onOpenChange={setNewClientDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-violet-600 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter text-white">
                Novo Cliente
              </DialogTitle>
              <DialogDescription className="text-white/60 font-medium">
                Cadastre um novo cliente rapidamente
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8">
            <Form {...clientForm}>
              <form onSubmit={clientForm.handleSubmit((data) => createClientMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={clientForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Nome do Cliente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} className="h-12 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">CPF / CNPJ</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="00.000.000/0000-00" {...field} className="h-12 rounded-xl" />
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-12 rounded-xl"
                            onClick={() => searchCNPJ(field.value || "")}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createClientMutation.isPending}
                  className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl tracking-tighter shadow-xl shadow-violet-600/20 mt-4 transition-all"
                >
                  {createClientMutation.isPending ? "Salvando..." : "Cadastrar Cliente"}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
