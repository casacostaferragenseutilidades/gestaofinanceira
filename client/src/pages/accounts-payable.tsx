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
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, isOverdue } from "@/lib/utils";
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

export default function AccountsPayable() {
  const [isOpen, setIsOpen] = React.useState(false);
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
  const [newSupplierDialogOpen, setNewSupplierDialogOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table");
  const [empresaAtiva, setEmpresaAtiva] = React.useState<any>(null);
  const [showOnlyFilled, setShowOnlyFilled] = React.useState(false);
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

  const handleEdit = (account: AccountPayable) => {
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

    // Date range filter
    const matchesDateRange = (!dateFilter.start || account.dueDate >= dateFilter.start) &&
      (!dateFilter.end || account.dueDate <= dateFilter.end);

    // Company filter
    const matchesCompany = !empresaAtiva || account.companyId === empresaAtiva.id;

    return matchesSearch && matchesStatus && matchesActive && matchesDateRange && matchesCompany;
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
    <div className="space-y-8">
      {/* Header - Melhorado */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Contas a Pagar</h1>
          <p className="text-lg text-muted-foreground">
            Gerenciamento completo de despesas e pagamentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">Gestão de Despesas</span>
          </div>
        </div>
      </div>

      {/* Botão Nova Conta - Flutuante */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button data-testid="button-new-payable">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingAccount ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da conta a pagar. Campos com * são obrigatórios. Use a seção "Informações Avançadas" para maior controle e categorização.
            </DialogDescription>
          </DialogHeader>
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

              {/* Advanced Information Section */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-900 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Informações Avançadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-amber-300">
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Baixa
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                Média
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Alta
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                Urgente
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
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Departamento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Administrativo, Produção"
                            {...field}
                            className="bg-white border-amber-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="project"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Projeto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Expansão 2024"
                            {...field}
                            className="bg-white border-amber-300"
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
                    name="invoiceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Tipo de Fatura</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-amber-300">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nf">Nota Fiscal</SelectItem>
                            <SelectItem value="invoice">Fatura</SelectItem>
                            <SelectItem value="receipt">Recibo</SelectItem>
                            <SelectItem value="contract">Contrato</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="approvalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Status de Aprovação</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-amber-300">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-500" />
                                Pendente
                              </div>
                            </SelectItem>
                            <SelectItem value="approved">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Aprovado
                              </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <div className="flex items-center gap-2">
                                <X className="h-4 w-4 text-red-500" />
                                Rejeitado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Alíquota de Imposto (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            className="bg-white border-amber-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Valor do Imposto</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            className="bg-white border-amber-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="netAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Valor Líquido</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            className="bg-white border-amber-300"
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
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Parcelas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 12"
                            {...field}
                            className="bg-white border-amber-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentInstallment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Parcela Atual</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 1/12"
                            {...field}
                            className="bg-white border-amber-300"
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
                    name="approvedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Aprovado por</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do aprovador"
                            {...field}
                            className="bg-white border-amber-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900 font-medium">Anexo</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              placeholder="URL do anexo ou caminho do arquivo"
                              {...field}
                              className="bg-white border-amber-300 flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="border-amber-300 hover:bg-amber-50"
                              title="Anexar arquivo"
                            >
                              <Paperclip className="h-4 w-4 text-amber-700" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="internalNotes"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-amber-900 font-medium">Observações Internas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas internas para equipe..."
                          {...field}
                          className="bg-white border-amber-300 min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  data-testid="button-cancel"
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                  className="px-6"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingAccount
                      ? "Atualizar"
                      : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
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

      {/* Cards de Estatísticas - Layout Dinâmico */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Total</p>
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(stats.total)}
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <FileText className="h-3 w-3" />
                  <span>{filteredAccounts.length} contas</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Pendentes</p>
                </div>
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {formatCurrency(stats.pending)}
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>{stats.pendingCount} contas</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">Pagos</p>
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(stats.paid)}
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.paidCount} contas</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Vencidos</p>
                </div>
                <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {formatCurrency(stats.overdue)}
                </div>
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>{stats.overdueCount} contas</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Percent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Juros/Multa</p>
                </div>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {formatCurrency(stats.totalLateFees)}
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>Acréscimos totais</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full group-hover:scale-110 transition-transform">
                <Percent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 border-teal-200 dark:border-teal-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">Descontos</p>
                </div>
                <div className="text-3xl font-bold text-teal-900 dark:text-teal-100">
                  {formatCurrency(stats.totalDiscount)}
                </div>
                <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
                  <TrendingDown className="h-3 w-3" />
                  <span>Economia total</span>
                </div>
              </div>
              <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-full group-hover:scale-110 transition-transform">
                <TrendingDown className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal - Layout Melhorado */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950 dark:to-gray-950">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Lista de Contas</h2>
              <p className="text-sm text-muted-foreground">Gerencie todas as suas contas a pagar</p>
            </div>
            <Button
              onClick={() => {
                setEditingAccount(null);
                form.reset();
                setIsOpen(true);
              }}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
              data-testid="button-new-account"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>

          {/* Filtros - Layout Compacto */}
          <div className="bg-white dark:bg-card p-4 rounded-lg shadow-sm border border-gray-200 dark:border-border mt-4">
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar contas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="overdue">Vencidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  className="w-[140px] h-10"
                  placeholder="Início"
                />
                <span className="text-sm text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  className="w-[140px] h-10"
                  placeholder="Fim"
                />
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="h-8 w-8 p-0"
                      title="Modo Tabela"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                      className="h-8 w-8 p-0"
                      title="Modo Cards"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 px-3 border-l ml-2">
                    <Switch
                      id="filled-mode"
                      checked={showOnlyFilled}
                      onCheckedChange={setShowOnlyFilled}
                    />
                    <Label htmlFor="filled-mode" className="text-xs cursor-pointer whitespace-nowrap">
                      Apenas Preenchidos
                    </Label>
                  </div>
                  {(searchTerm || statusFilter !== "all" || activeFilter !== "active" || dateFilter.start !== getDefaultDateRange().start || dateFilter.end !== getDefaultDateRange().end) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setActiveFilter("active");
                        setDateFilter(getDefaultDateRange());
                      }}
                      title="Limpar filtros"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredAccounts && filteredAccounts.length > 0 ? (
            <>
              {viewMode === "table" ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 bg-muted/30">
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
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(account.dueDate)}</span>
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
                            <Badge className={`${getStatusColor(displayStatus)} px-3 py-1`}>
                              <div className="flex items-center gap-2">
                                {displayStatus === "paid" && <CheckCircle className="h-3 w-3" />}
                                {displayStatus === "pending" && <Clock className="h-3 w-3" />}
                                {displayStatus === "overdue" && <AlertTriangle className="h-3 w-3" />}
                                <span className="font-medium">{getStatusLabel(displayStatus)}</span>
                              </div>
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
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
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Vencimento:</span>
                              <span className="text-sm font-medium">{formatDate(account.dueDate)}</span>
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
      </Card>
    </div>
  );
}
