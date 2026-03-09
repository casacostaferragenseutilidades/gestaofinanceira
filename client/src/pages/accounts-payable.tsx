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
  Edit,
  Trash2,
  CheckCircle,
  Upload,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Clock,
  Percent,
  CreditCard,
  FileText,
  Banknote,
  Wallet,
  Copy,
  Mail,
  Phone,
  MapPin,
  Search as SearchIcon,
  Receipt,
  Paperclip,
  Calculator,
  Tag,
  User,
  Building,
  ArrowUpDown,
  AlertCircle,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  BarChart3,
  FileSearch,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { AccountPayable, Supplier, Category, CostCenter } from "@shared/schema";

const accountPayableFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  issueDate: z.string().optional(),
  lateFees: z.string().optional(),
  discount: z.string().optional(),
  supplierId: z.string().min(1, "Fornecedor é obrigatório"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  costCenterId: z.string().min(1, "Centro de Custo é obrigatório"),
  paymentMethod: z.string().min(1, "Meio de pagamento é obrigatório"),
  invoiceNumber: z.string().optional(),
  invoiceType: z.string().optional(),
  taxRate: z.string().optional(),
  taxAmount: z.string().optional(),
  netAmount: z.string().optional(),
  priority: z.string().optional(),
  department: z.string().optional(),
  project: z.string().optional(),
  approvalStatus: z.string().optional(),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  attachment: z.string().optional(),
  recurrence: z.string().optional(),
  recurrenceEnd: z.string().optional(),
  installments: z.string().optional(),
  currentInstallment: z.string().optional(),
});

type AccountPayableFormData = z.infer<typeof accountPayableFormSchema>;

const supplierFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  document: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

const paymentFormSchema = z.object({
  lateFees: z.string().optional(),
  discount: z.string().optional(),
  paymentDate: z.string().min(1, "Data de pagamento é obrigatória"),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

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

export default function AccountsPayable() {
  const [isOpen, setIsOpen] = React.useState(false);
  // ... rest of the state ... (proxying for clarity in the tool call)
  const [editingAccount, setEditingAccount] = React.useState<AccountPayable | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [activeFilter, setActiveFilter] = React.useState<string>("active");
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
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [accountToPay, setAccountToPay] = React.useState<AccountPayable | null>(null);
  const [viewAccountDialogOpen, setViewAccountDialogOpen] = React.useState(false);
  const [accountToView, setAccountToView] = React.useState<AccountPayable | null>(null);
  const [newSupplierDialogOpen, setNewSupplierDialogOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = React.useState<any>(null);
  const [showOnlyFilled, setShowOnlyFilled] = React.useState(false);
  const [supplierFilter, setSupplierFilter] = React.useState<string>("all");
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


  const { data: accounts, isLoading } = useQuery<AccountPayable[]>({
    queryKey: ["/api/accounts-payable"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: costCenters } = useQuery<CostCenter[]>({
    queryKey: ["/api/cost-centers"],
  });

  const form = useForm<AccountPayableFormData>({
    resolver: zodResolver(accountPayableFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      dueDate: "",
      supplierId: "",
      categoryId: "",
      costCenterId: "",
      paymentMethod: "",
      lateFees: "",
      discount: "",
      notes: "",
      recurrence: "none",
      recurrenceEnd: "",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      lateFees: "",
      discount: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const supplierForm = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      document: "",
      email: "",
      phone: "",
      contact: "",
      address: "",
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      return await res.json() as Supplier;
    },
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      setNewSupplierDialogOpen(false);
      supplierForm.reset();
      toast({
        title: "Sucesso",
        description: "Fornecedor cadastrado com sucesso.",
      });
      if (newSupplier && newSupplier.id) {
        form.setValue("supplierId", newSupplier.id);
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o fornecedor.",
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
        supplierForm.setValue('name', data.estabelecimento.nome_fantasia || data.estabelecimento.nome_empresarial || '');
        supplierForm.setValue('email', data.estabelecimento.email || '');
        supplierForm.setValue('phone', data.estabelecimento.ddd1 + data.estabelecimento.telefone1 || '');
        supplierForm.setValue('address', `${data.estabelecimento.tipo_logradouro || ''} ${data.estabelecimento.logradouro || ''}, ${data.estabelecimento.numero || ''}, ${data.estabelecimento.bairro || ''}, ${data.estabelecimento.municipio || ''} - ${data.estabelecimento.uf || ''}`.trim());

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

  const createMutation = useMutation({
    mutationFn: (data: AccountPayableFormData) =>
      apiRequest("POST", "/api/accounts-payable", {
        ...data,
        amount: data.amount,
        supplierId: data.supplierId || null,
        categoryId: data.categoryId || null,
        costCenterId: data.costCenterId || null,
        paymentMethod: data.paymentMethod || null,
        lateFees: data.lateFees || null,
        discount: data.discount || null,
        recurrence: data.recurrence || null,
        recurrenceEnd: data.recurrence === "none" ? null : data.recurrenceEnd,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Conta a pagar criada com sucesso.",
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
    mutationFn: (data: AccountPayableFormData & { id: string }) =>
      apiRequest("PATCH", `/api/accounts-payable/${data.id}`, {
        ...data,
        amount: data.amount,
        supplierId: data.supplierId || null,
        categoryId: data.categoryId || null,
        costCenterId: data.costCenterId || null,
        paymentMethod: data.paymentMethod || null,
        lateFees: data.lateFees || null,
        discount: data.discount || null,
        recurrence: data.recurrence || null,
        recurrenceEnd: data.recurrence === "none" ? null : data.recurrenceEnd,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/accounts-payable/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Sucesso",
        description: "Conta desativada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível desativar a conta.",
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (data: { id: string; lateFees?: string; discount?: string; paymentDate: string }) =>
      apiRequest("PATCH", `/api/accounts-payable/${data.id}/pay`, {
        paymentDate: data.paymentDate,
        lateFees: data.lateFees || null,
        discount: data.discount || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setPaymentDialogOpen(false);
      setAccountToPay(null);
      paymentForm.reset();
      toast({
        title: "Sucesso",
        description: "Conta marcada como paga.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a conta como paga.",
        variant: "destructive",
      });
    },
  });

  const bulkMarkAsPaidMutation = useMutation({
    mutationFn: async ({ ids, paymentDate, paymentMethod }: { ids: string[], paymentDate: string, paymentMethod?: string }) => {
      await apiRequest("POST", `/api/accounts-payable/bulk-pay`, {
        ids,
        paymentDate,
        paymentMethod
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contas pagas com sucesso!" });
      setSelectedAccounts([]);
      setPaymentDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao realizar pagamento em massa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AccountPayableFormData) => {
    if (editingAccount) {
      updateMutation.mutate({ ...data, id: editingAccount.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePaymentSubmit = (data: PaymentFormData) => {
    if (accountToPay) {
      markAsPaidMutation.mutate({
        id: accountToPay.id,
        lateFees: data.lateFees,
        discount: data.discount,
        paymentDate: data.paymentDate,
      });
    } else if (selectedAccounts.length > 0) {
      bulkMarkAsPaidMutation.mutate({
        ids: selectedAccounts,
        paymentDate: data.paymentDate,
      });
    }
  };

  const handleMarkAsPaid = (account: AccountPayable) => {
    setAccountToPay(account);
    paymentForm.reset({
      lateFees: account.lateFees || "",
      discount: account.discount || "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentDialogOpenChange = (open: boolean) => {
    setPaymentDialogOpen(open);
    if (!open) {
      setAccountToPay(null);
      paymentForm.reset();
    }
  };

  const handleBulkPay = () => {
    paymentForm.reset({
      lateFees: "",
      discount: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setPaymentDialogOpen(true);
  };

  const toggleAccountSelection = (id: string) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(accountId => accountId !== id) : [...prev, id]
    );
  };

  const toggleAllSelected = (accountsToToggle: AccountPayable[]) => {
    if (selectedAccounts.length === accountsToToggle.length && accountsToToggle.length > 0) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accountsToToggle.map(a => a.id));
    }
  };

  const handleEdit = (account: AccountPayable) => {
    // Bloquear edição se a conta já está paga
    if (account.status === "paid") {
      toast({
        title: "Ação não permitida",
        description: "Contas já pagas não podem ser editadas.",
        variant: "destructive",
      });
      return;
    }
    setEditingAccount(account);
    form.reset({
      description: account.description,
      amount: account.amount,
      dueDate: account.dueDate,
      supplierId: account.supplierId || "",
      categoryId: account.categoryId || "",
      costCenterId: account.costCenterId || "",
      paymentMethod: account.paymentMethod || "",
      lateFees: account.lateFees || "",
      discount: account.discount || "",
      notes: account.notes || "",
      recurrence: account.recurrence || "none",
      recurrenceEnd: account.recurrenceEnd || "",
    });
    setIsOpen(true);
  };

  const handleClone = (account: AccountPayable) => {
    const clonedAccount = {
      description: `${account.description} (Cópia)`,
      amount: account.amount,
      dueDate: account.dueDate,
      supplierId: account.supplierId || "",
      categoryId: account.categoryId || "",
      costCenterId: account.costCenterId || "",
      paymentMethod: account.paymentMethod || "",
      lateFees: account.lateFees || "",
      discount: account.discount || "",
      notes: account.notes || "",
      recurrence: account.recurrence || "none",
      recurrenceEnd: account.recurrenceEnd || "",
    };

    form.reset(clonedAccount);
    setIsOpen(true);
  };

  const handleView = (account: AccountPayable) => {
    setAccountToView(account);
    setViewAccountDialogOpen(true);
  };

  const handleViewDialogOpenChange = (open: boolean) => {
    setViewAccountDialogOpen(open);
    if (!open) {
      setAccountToView(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingAccount(null);
      form.reset();
    }
  };

  const filteredAccounts = accounts?.filter((account) => {
    const term = searchTerm.toLowerCase();

    const supplierName = suppliers?.find(s => s.id === account.supplierId)?.name || "";
    const categoryName = categories?.find(c => c.id === account.categoryId)?.name || "";
    const costCenterName = costCenters?.find(cc => cc.id === account.costCenterId)?.name || "";

    const matchesSearch =
      account.description.toLowerCase().includes(term) ||
      account.amount.toString().includes(term) ||
      formatCurrency(account.amount).toLowerCase().includes(term) ||
      (account.notes || "").toLowerCase().includes(term) ||
      supplierName.toLowerCase().includes(term) ||
      categoryName.toLowerCase().includes(term) ||
      costCenterName.toLowerCase().includes(term);

    const isOverdueAccount = isOverdue(account.dueDate, account.status);
    const displayStatus = isOverdueAccount ? "overdue" : account.status;

    const matchesStatus = statusFilter === "all" || displayStatus === statusFilter;
    const matchesActive = activeFilter === "all" || (activeFilter === "active" && account.active !== false) || (activeFilter === "inactive" && account.active === false);

    // Date range filter - usa vencimento como referência
    // Contas vencidas de meses anteriores sempre aparecem até serem pagas
    const isOverdueFromPreviousMonth = isOverdueAccount && account.status !== "paid";
    const matchesDateRange = isOverdueFromPreviousMonth ||
      ((!dateFilter.start || account.dueDate >= dateFilter.start) &&
        (!dateFilter.end || account.dueDate <= dateFilter.end));

    // Company filter
    const matchesCompany = !empresaAtiva || account.companyId === empresaAtiva.id;

    // Supplier filter
    const matchesSupplier = supplierFilter === "all" || account.supplierId === supplierFilter;

    return matchesSearch && matchesStatus && matchesActive && matchesDateRange && matchesCompany && matchesSupplier;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) || [];

  // Calculate statistics based on filtered accounts
  const stats = {
    total: filteredAccounts.reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    pending: filteredAccounts.filter(acc => acc.status === "pending" && !isOverdue(acc.dueDate, acc.status)).reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    paid: filteredAccounts.filter(acc => acc.status === "paid").reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdue: filteredAccounts.filter(acc => isOverdue(acc.dueDate, acc.status)).reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdueCount: filteredAccounts.filter(acc => isOverdue(acc.dueDate, acc.status)).length,
    pendingCount: filteredAccounts.filter(acc => acc.status === "pending" && !isOverdue(acc.dueDate, acc.status)).length,
    paidCount: filteredAccounts.filter(acc => acc.status === "paid").length,
    totalLateFees: filteredAccounts.reduce((sum, acc) => sum + (acc.lateFees && acc.lateFees !== null ? parseFloat(acc.lateFees) : 0), 0),
    totalDiscount: filteredAccounts.reduce((sum, acc) => sum + (acc.discount && acc.discount !== null ? parseFloat(acc.discount) : 0), 0),
  };

  const expenseCategories = categories?.filter((c) => c.type === "expense");
  const recurrence = form.watch("recurrence");

  return (
    <div className="space-y-10 p-2 md:p-6">
      {/* Header - Modernizado Flux Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-gradient-to-b from-primary to-violet-600 rounded-full" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-primary via-violet-600 to-indigo-700 bg-clip-text text-transparent">
              Contas a Pagar
            </h1>
          </div>
          <p className="text-muted-foreground font-medium max-w-2xl px-4 italic">
            Gestão estratégica de obrigações financeiras e controle de liquidez.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-3 overflow-hidden">
            {/* Decorative avatars or status indicators could go here */}
          </div>

          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                data-testid="button-new-payable"
                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-violet-700 hover:scale-105 transition-all shadow-xl shadow-primary/20 font-black tracking-tighter text-lg group"
              >
                <Plus className="h-6 w-6 mr-2 group-hover:rotate-90 transition-transform" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-violet-600 to-indigo-700 p-8 text-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tighter text-white">
                    {editingAccount ? "Editar Conta a Pagar" : "Nova Movimentação"}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 font-medium">
                    Preencha os dados necessários para o registro financeiro.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-8 overflow-y-auto flex-1 min-h-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Main Information Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Informações Principais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-900 font-medium">Descrição *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Aluguel do escritório"
                                  {...field}
                                  data-testid="input-description"
                                  className="bg-white border-blue-300"
                                />
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
                              <FormLabel className="text-blue-900 font-medium">Valor *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  {...field}
                                  data-testid="input-amount"
                                  className="bg-white border-blue-300"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="issueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-900 font-medium">Data de Emissão</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="bg-white border-blue-300" />
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
                              <FormLabel className="text-blue-900 font-medium">Data de Vencimento *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-due-date" className="bg-white border-blue-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="invoiceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-900 font-medium">Nº da Fatura</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="0001/2024"
                                  {...field}
                                  className="bg-white border-blue-300"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="lateFees"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-900 font-medium">Juros / Multa</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  {...field}
                                  data-testid="input-late-fees"
                                  className="bg-white border-blue-300"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="discount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-900 font-medium">Desconto Previsto</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  {...field}
                                  className="bg-white border-blue-300"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-900 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Detalhes Financeiros
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="supplierId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-green-900 font-medium">Fornecedor *</FormLabel>
                              <div className="flex gap-2">
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-supplier" className="bg-white border-green-300 flex-1">
                                      <SelectValue placeholder="Selecione um fornecedor" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {suppliers?.map((supplier) => (
                                      <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="border-green-300 hover:bg-green-50"
                                  onClick={() => setNewSupplierDialogOpen(true)}
                                  title="Cadastrar Novo Fornecedor"
                                >
                                  <Plus className="h-4 w-4 text-green-700" />
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
                              <FormLabel className="text-green-900 font-medium">Categoria *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-category" className="bg-white border-green-300">
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {expenseCategories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
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
                          name="costCenterId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-green-900 font-medium">Centro de Custo *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-cost-center" className="bg-white border-green-300">
                                    <SelectValue placeholder="Selecione um centro de custo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {costCenters?.map((cc) => (
                                    <SelectItem key={cc.id} value={cc.id}>
                                      {cc.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-900 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Informações Adicionais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-purple-900 font-medium">Meio de Pagamento *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-payment-method" className="bg-white border-purple-300">
                                    <SelectValue placeholder="Selecione o meio de pagamento" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="boleto">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Boleto
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="credit_card">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      Cartão de Crédito
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="debit_card">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      Cartão de Débito
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="cash">
                                    <div className="flex items-center gap-2">
                                      <Banknote className="h-4 w-4" />
                                      Dinheiro
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="transfer">
                                    <div className="flex items-center gap-2">
                                      <Wallet className="h-4 w-4" />
                                      Transferência Bancária
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="pix">
                                    <div className="flex items-center gap-2">
                                      <Wallet className="h-4 w-4" />
                                      PIX
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="recurrence"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-purple-900 font-medium">Recorrência</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-recurrence" className="bg-white border-purple-300">
                                    <SelectValue placeholder="Sem recorrência" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sem recorrência</SelectItem>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                  <SelectItem value="yearly">Anual</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {recurrence && recurrence !== "none" && (
                          <FormField
                            control={form.control}
                            name="recurrenceEnd"
                            render={({ field }) => (
                              <FormItem className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <FormLabel className="text-purple-900 font-medium">Até Quando? *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="bg-white border-purple-300" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel className="text-purple-900 font-medium">Observações</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Informações adicionais..."
                                {...field}
                                data-testid="input-notes"
                                className="bg-white border-purple-300 min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter className="flex gap-3 pt-8 border-t border-slate-100 mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        data-testid="button-cancel"
                        className="h-12 px-8 rounded-xl font-bold border-slate-200 hover:bg-slate-50 transition-all"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-submit"
                        className="h-12 px-10 rounded-xl bg-gradient-to-r from-primary to-violet-700 shadow-lg shadow-primary/20 font-black tracking-tighter text-white hover:scale-105 transition-all"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? "Processando..."
                          : editingAccount
                            ? "Salvar Alterações"
                            : "Confirmar Lançamento"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Estatísticas - Flux Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard
          title="Total Projetado"
          value={formatCurrency(stats.total)}
          subvalue={`${filteredAccounts.length} movimentações`}
          icon={DollarSign}
          variant="primary"
        />
        <KPICard
          title="Aguardando"
          value={formatCurrency(stats.pending)}
          subvalue={`${stats.pendingCount} títulos`}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Liquidados"
          value={formatCurrency(stats.paid)}
          subvalue={`${stats.paidCount} pagos`}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Vencidos"
          value={formatCurrency(stats.overdue)}
          subvalue={`${stats.overdueCount} atrasados`}
          icon={AlertTriangle}
          variant="danger"
        />
        <KPICard
          title="Encargos"
          value={formatCurrency(stats.totalLateFees)}
          subvalue="Juros e multas"
          icon={Percent}
          variant="secondary"
        />
        <KPICard
          title="Economia"
          value={formatCurrency(stats.totalDiscount)}
          subvalue="Descontos obtidos"
          icon={TrendingDown}
          variant="info"
        />
      </div>
      {/* New Supplier Dialog */}
      <Dialog open={newSupplierDialogOpen} onOpenChange={setNewSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Cadastre um novo fornecedor rapidamente
            </DialogDescription>
          </DialogHeader>
          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit((data) => createSupplierMutation.mutate(data))} className="space-y-4">
              <FormField
                control={supplierForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={supplierForm.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="00.000.000/0000-00" {...field} />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => searchCNPJ(field.value || "")}
                          disabled={!field.value || field.value.replace(/[^\d]/g, '').length !== 14}
                        >
                          <SearchIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={supplierForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={supplierForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewSupplierDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                >
                  {createSupplierMutation.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmar Pagamento
            </DialogTitle>
            <DialogDescription>
              {accountToPay && (
                <span>
                  Registrar pagamento para: <strong>{accountToPay.description}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Valor original: <strong>{accountToPay && formatCurrency(accountToPay.amount)}</strong></p>
                  <p>Data de vencimento: <strong>{accountToPay && formatDate(accountToPay.dueDate)}</strong></p>
                </div>
              </div>

              <FormField
                control={paymentForm.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Pagamento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name="lateFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juros / Multa (se aplicável)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (se aplicável)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePaymentDialogOpenChange(false)}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={markAsPaidMutation.isPending}
                  className="px-6 bg-green-600 hover:bg-green-700"
                >
                  {markAsPaidMutation.isPending
                    ? "Processando..."
                    : "Confirmar Pagamento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Account Dialog */}
      <Dialog open={viewAccountDialogOpen} onOpenChange={handleViewDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Detalhes da Conta
            </DialogTitle>
            <DialogDescription>
              Visualize todas as informações da conta a pagar
            </DialogDescription>
          </DialogHeader>
          {accountToView && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{accountToView.description}</h2>
                <Badge className={`${getStatusColor(isOverdue(accountToView.dueDate, accountToView.status) ? "overdue" : accountToView.status)} px-3 py-1`}>
                  <div className="flex items-center gap-2">
                    {accountToView.status === "paid" && <CheckCircle className="h-3 w-3" />}
                    {accountToView.status === "pending" && !isOverdue(accountToView.dueDate, accountToView.status) && <Clock className="h-3 w-3" />}
                    {(isOverdue(accountToView.dueDate, accountToView.status) || accountToView.status === "overdue") && <AlertTriangle className="h-3 w-3" />}
                    <span className="font-medium">{getStatusLabel(isOverdue(accountToView.dueDate, accountToView.status) ? "overdue" : accountToView.status)}</span>
                  </div>
                </Badge>
              </div>

              {/* Informações Principais */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informações Principais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-lg font-bold text-red-600">-{formatCurrency(accountToView.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Vencimento</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(accountToView.dueDate)}
                    </p>
                  </div>
                  {accountToView?.paymentDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Pagamento</p>
                      <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {formatDate(accountToView?.paymentDate)}
                      </p>
                    </div>
                  )}
                  {accountToView?.originalDueDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data Original de Vencimento</p>
                      <p className="text-sm font-medium text-amber-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(accountToView?.originalDueDate)}
                      </p>
                    </div>
                  )}
                  {accountToView?.invoiceNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground">Nº da Fatura</p>
                      <p className="text-sm font-medium">{accountToView?.invoiceNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalhes Financeiros */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-900 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Detalhes Financeiros
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fornecedor:</span>
                    <span className="text-sm font-medium">{suppliers?.find(s => s.id === accountToView.supplierId)?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Categoria:</span>
                    <span className="text-sm font-medium">{categories?.find(c => c.id === accountToView.categoryId)?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Centro de Custo:</span>
                    <span className="text-sm font-medium">{costCenters?.find(cc => cc.id === accountToView.costCenterId)?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Meio de Pagamento:</span>
                    <span className="text-sm font-medium capitalize">{accountToView.paymentMethod || "-"}</span>
                  </div>
                  {(accountToView.lateFees && parseFloat(accountToView.lateFees) > 0) && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Juros/Multa:</span>
                      <span className="text-sm font-medium text-orange-600">+{formatCurrency(accountToView.lateFees)}</span>
                    </div>
                  )}
                  {(accountToView.discount && parseFloat(accountToView.discount) > 0) && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Desconto:</span>
                      <span className="text-sm font-medium text-green-600">-{formatCurrency(accountToView.discount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {accountToView.notes && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{accountToView.notes}</p>
                </div>
              )}

              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleViewDialogOpenChange(false)}
                  className="px-6"
                >
                  Fechar
                </Button>
                {accountToView.status !== "paid" && (
                  <Button
                    type="button"
                    onClick={() => {
                      handleViewDialogOpenChange(false);
                      handleMarkAsPaid(accountToView);
                    }}
                    className="px-6 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabela Principal - Flux Dashboard Layout */}
      <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardHeader className="p-8 bg-gradient-to-r from-slate-50 to-white dark:from-slate-950 dark:to-background border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">
                Movimentações
              </h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Detalhamento analítico de saídas
              </p>
            </div>

            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              {selectedAccounts.length > 0 && (
                <Button
                  onClick={handleBulkPay}
                  className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-black tracking-tighter animate-in zoom-in-95 duration-200"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Liquidar Selecionados ({selectedAccounts.length})
                </Button>
              )}

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className={cn("rounded-lg", viewMode === "table" && "shadow-sm bg-white")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("cards")}
                  className={cn("rounded-lg", viewMode === "cards" && "shadow-sm bg-white")}
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
                placeholder="Buscar por descrição, fornecedor ou valor..."
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
                <SelectItem value="paid" className="text-emerald-600 font-bold">Pagos</SelectItem>
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

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="h-14 min-w-[180px] flex-1 bg-white/50 border-slate-200 rounded-2xl shadow-sm font-bold">
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl max-h-[300px]">
                <SelectItem value="all" className="font-bold">Todos Fornecedores</SelectItem>
                {suppliers?.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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

            {(searchTerm || statusFilter !== "all" || activeFilter !== "active" || supplierFilter !== "all" || dateFilter.start !== getDefaultDateRange().start || dateFilter.end !== getDefaultDateRange().end) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setActiveFilter("active");
                  setSupplierFilter("all");
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
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredAccounts && filteredAccounts.length > 0 ? (
            <>
              {viewMode === "table" ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 bg-muted/30">
                        <TableHead className="w-[40px] px-4">
                          <Checkbox
                            checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                            onCheckedChange={() => toggleAllSelected(filteredAccounts)}
                          />
                        </TableHead>
                        <TableHead className="font-semibold text-sm">Descrição</TableHead>
                        <TableHead className="font-semibold text-sm">Fornecedor</TableHead>
                        <TableHead className="font-semibold text-sm">Categoria</TableHead>
                        <TableHead className="font-semibold text-sm">Vencimento</TableHead>
                        <TableHead className="font-semibold text-sm text-right">Valor</TableHead>
                        <TableHead className="font-semibold text-sm text-right">Juros/Multa</TableHead>
                        <TableHead className="font-semibold text-sm text-right">Desconto</TableHead>
                        <TableHead className="font-semibold text-sm text-right font-bold">Valor Líquido</TableHead>
                        <TableHead className="font-semibold text-sm">Pagamento</TableHead>
                        <TableHead className="font-semibold text-sm">Status</TableHead>
                        <TableHead className="font-semibold text-sm w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAccounts.map((account, index) => {
                        const supplier = suppliers?.find((s) => s.id === account.supplierId);
                        const category = categories?.find((c) => c.id === account.categoryId);
                        const overdue = isOverdue(account.dueDate, account.status);
                        const displayStatus = overdue ? "overdue" : account.status;
                        const amountNum = parseFloat(account.amount?.toString() || "0");
                        const lateFeesNum = parseFloat(account.lateFees?.toString() || "0");
                        const discountNum = parseFloat(account.discount?.toString() || "0");
                        const netValue = amountNum + lateFeesNum - discountNum;

                        return (
                          <TableRow
                            key={account.id}
                            data-testid={`row-payable-${account.id}`}
                            className={`hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                          >
                            <TableCell className="px-4">
                              <Checkbox
                                checked={selectedAccounts.includes(account.id)}
                                onCheckedChange={() => toggleAccountSelection(account.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px]">
                              <div className="truncate" title={account.description}>
                                {account.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              {supplier ? (
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{supplier.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {category ? (
                                <Badge variant="secondary" className="font-normal text-xs px-2 py-1">
                                  {category.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{formatDate(account.dueDate)}</span>
                                </div>
                                {account.originalDueDate && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-amber-600 font-medium">
                                      Original: {formatDate(account.originalDueDate)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                              -{formatCurrency(account.amount)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {account.lateFees && parseFloat(account.lateFees) > 0 ? (
                                <span className="text-orange-600 font-medium">+{formatCurrency(account.lateFees)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {account.discount && parseFloat(account.discount) > 0 ? (
                                <span className="text-green-600 font-medium">-{formatCurrency(account.discount)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold text-lg">
                              <span className={netValue > amountNum ? "text-orange-600" : netValue < amountNum ? "text-green-600" : "text-red-600"}>
                                -{formatCurrency(netValue.toFixed(2))}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {account.paymentDate ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {formatDate(account.paymentDate)}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(displayStatus)} px-3 py-1`}>
                                <div className="flex items-center gap-2">
                                  {displayStatus === "paid" && <CheckCircle className="h-3 w-3" />}
                                  {displayStatus === "pending" && <Clock className="h-3 w-3" />}
                                  {displayStatus === "overdue" && <AlertTriangle className="h-3 w-3" />}
                                  <span className="font-medium">{getStatusLabel(displayStatus)}</span>
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(account)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(account)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleClone(account)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Clonar
                                  </DropdownMenuItem>
                                  {account.status !== "paid" && (
                                    <DropdownMenuItem
                                      onClick={() => handleMarkAsPaid(account)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Marcar como Pago
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => deleteMutation.mutate(account.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Desativar
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
                // Visualização em Cards
                // Visualização em Cards
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAccounts.map((account) => {
                    const supplier = suppliers?.find((s) => s.id === account.supplierId);
                    const category = categories?.find((c) => c.id === account.categoryId);
                    const overdue = isOverdue(account.dueDate, account.status);
                    const displayStatus = overdue ? "overdue" : account.status;
                    const amountNum = parseFloat(account.amount?.toString() || "0");
                    const lateFeesNum = parseFloat(account.lateFees?.toString() || "0");
                    const discountNum = parseFloat(account.discount?.toString() || "0");
                    const netValue = amountNum + lateFeesNum - discountNum;

                    return (
                      <Card key={account.id} className="hover:shadow-lg transition-all duration-200 group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedAccounts.includes(account.id)}
                                onCheckedChange={() => toggleAccountSelection(account.id)}
                              />
                              <Badge className={`${getStatusColor(displayStatus)} px-3 py-1`}>
                                <div className="flex items-center gap-2">
                                  {displayStatus === "paid" && <CheckCircle className="h-3 w-3" />}
                                  {displayStatus === "pending" && <Clock className="h-3 w-3" />}
                                  {displayStatus === "overdue" && <AlertTriangle className="h-3 w-3" />}
                                  <span className="font-medium">{getStatusLabel(displayStatus)}</span>
                                </div>
                              </Badge>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(account)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(account)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleClone(account)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Clonar
                                </DropdownMenuItem>
                                {account.status !== "paid" && (
                                  <DropdownMenuItem
                                    onClick={() => handleMarkAsPaid(account)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como Pago
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate(account.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <h3 className="font-semibold text-lg mb-2 group-hover:text-red-600 transition-colors truncate" title={account.description}>
                            {account.description}
                          </h3>

                          <div className="space-y-2 mb-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Vencimento:</span>
                                <span className="text-sm font-medium">{formatDate(account.dueDate)}</span>
                              </div>
                              {account.originalDueDate && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-amber-600 font-medium">Original:</span>
                                  <span className="text-xs text-amber-600 font-medium">{formatDate(account.originalDueDate)}</span>
                                </div>
                              )}
                            </div>

                            {/* Detalhes que aparecem apenas se houver dados ou se "showOnlyFilled" estiver desativado */}
                            {(!showOnlyFilled || (supplier && supplier.name)) && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Fornecedor:</span>
                                <span className="text-sm font-medium truncate max-w-[150px]">
                                  {supplier ? supplier.name : "-"}
                                </span>
                              </div>
                            )}

                            {(!showOnlyFilled || (category && category.name)) && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Categoria:</span>
                                <span className="text-sm font-medium">
                                  {category ? category.name : "-"}
                                </span>
                              </div>
                            )}

                            {(!showOnlyFilled || account.costCenterId) && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">C. Custo:</span>
                                <span className="text-sm font-medium">
                                  {costCenters?.find(cc => cc.id === account.costCenterId)?.name || "-"}
                                </span>
                              </div>
                            )}

                            {(!showOnlyFilled || account.notes) && account.notes && (
                              <div className="pt-2 border-t mt-2">
                                <span className="text-xs text-muted-foreground block mb-1 font-semibold uppercase">Observações:</span>
                                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                  {account.notes}
                                </p>
                              </div>
                            )}

                            {(!showOnlyFilled || account.invoiceNumber) && account.invoiceNumber && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">NF nº:</span>
                                <span className="font-medium">{account.invoiceNumber}</span>
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Valor:</span>
                              <span className="font-bold text-lg text-red-600">-{formatCurrency(account.amount)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Valor Líquido:</span>
                              <span className="font-bold text-lg">
                                <span className={netValue > amountNum ? "text-orange-600" : netValue < amountNum ? "text-green-600" : "text-red-600"}>
                                  -{formatCurrency(netValue.toFixed(2))}
                                </span>
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-full mb-4">
                <TrendingDown className="h-12 w-12 text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma conta encontrada</h3>
              <p className="text-muted-foreground max-w-md">
                Não há contas a pagar no período selecionado. Tente ajustar os filtros ou clique em "Nova Conta" para adicionar.
              </p>
            </div>
          )}
        </CardContent>
      </Card >
    </div >
  );
}
