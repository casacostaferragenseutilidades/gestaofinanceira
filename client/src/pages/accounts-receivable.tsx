import { useState } from "react";
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
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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


export default function AccountsReceivable() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountReceivable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("active");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [accountToReceive, setAccountToReceive] = useState<AccountReceivable | null>(null);
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const { toast } = useToast();

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

    // Date range filter
    const matchesDateRange = (!dateFilter.start || account.dueDate >= dateFilter.start) &&
      (!dateFilter.end || account.dueDate <= dateFilter.end);

    return matchesSearch && matchesStatus && matchesActive && matchesDateRange;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) || [];

  const incomeCategories = categories?.filter((c) => c.type === "income");

  // Calculate statistics based on filtered accounts
  const stats = {
    total: filteredAccounts.reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    pending: filteredAccounts.filter(acc => acc.status === "pending").reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    received: filteredAccounts.filter(acc => acc.status === "received").reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdue: filteredAccounts.filter(acc => isOverdue(acc.dueDate, acc.status)).reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdueCount: filteredAccounts.filter(acc => isOverdue(acc.dueDate, acc.status)).length,
    pendingCount: filteredAccounts.filter(acc => acc.status === "pending").length,
    receivedCount: filteredAccounts.filter(acc => acc.status === "received").length,
    totalDiscounts: filteredAccounts.reduce((sum, acc) => sum + (acc.discount && acc.discount !== null ? parseFloat(acc.discount) : 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground" data-testid="text-page-title">Contas a Receber</h1>
          <p className="text-gray-600 mt-1">Gerencie suas receitas e recebimentos</p>
        </div>
        <Button
          onClick={() => {
            setEditingAccount(null);
            form.reset();
            setIsOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:scale-[1.02]"
          data-testid="button-new-receivable"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {editingAccount ? <Pencil className="h-6 w-6 text-blue-500" /> : <Plus className="h-6 w-6 text-blue-500" />}
              {editingAccount ? "Editar Conta a Receber" : "Nova Conta a Receber"}
            </DialogTitle>
            <DialogDescription className="text-base">
              Preencha os dados abaixo para registrar um novo recebimento.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

              {/* Linha 1: Descrição e Valores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-base font-medium text-gray-700">Descrição *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Ex: Venda de Consultoria..."
                            {...field}
                            className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                            data-testid="input-description"
                          />
                          <Wallet className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
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
                      <FormLabel className="text-base font-medium text-gray-700">Valor (R$) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-medium"
                            data-testid="input-amount"
                          />
                          <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-700">Desconto (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-red-500"
                          />
                          <Percent className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 2: Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-700">Data de Vencimento *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="date" {...field} className="h-10 pl-10 cursor-pointer" data-testid="input-due-date" />
                          <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de Status/Recebimento Imediato - Novo */}
                {!editingAccount && (
                  <FormField
                    control={form.control}
                    name="markAsReceived"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50 shadow-sm mt-1">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">Já recebido?</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Marcar como pago no ato
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("markAsReceived") && !editingAccount && (
                  <FormField
                    control={form.control}
                    name="receivedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-700">Data do Recebimento *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="date" {...field} className="h-10 pl-10 cursor-pointer border-green-200 focus:border-green-500" />
                            <CheckCircle className="absolute left-3 top-2.5 h-5 w-5 text-green-500" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recorrência</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">Lançamento Recorrente?</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Repetir este lançamento periodicamente
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("isRecurring") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                      <FormField
                        control={form.control}
                        name="recurrence"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-700">Frequência *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Selecione a frequência" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="recurrencePeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-700">Data Final da Recorrência *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="date" {...field} className="h-10 pl-10 cursor-pointer" />
                                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Classificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-700">Cliente *</FormLabel>
                        <div className="flex gap-2">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-client" className="h-10">
                                <SelectValue placeholder="Selecione um cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0 border-gray-300 hover:bg-gray-50"
                            onClick={() => setNewClientDialogOpen(true)}
                            title="Cadastrar Novo Cliente"
                          >
                            <UserPlus className="h-4 w-4 text-blue-600" />
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
                        <FormLabel className="text-base font-medium text-gray-700">Categoria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-category" className="h-10">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incomeCategories?.map((category) => (
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-700">Forma de Pagamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="money">Dinheiro</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
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

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-700">Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais, número da NF, etc..."
                          {...field}
                          className="resize-none min-h-[80px]"
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 pt-2 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  data-testid="button-cancel"
                  className="h-10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                  className="h-10 bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center">
                      <span className="animate-spin mr-2">⏳</span> Salvando...
                    </div>
                  ) : (
                    editingAccount ? "Atualizar Lançamento" : "Confirmar Lançamento"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total a Receber</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(stats.total)}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{filteredAccounts.length} contas</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Pendentes</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(stats.pending)}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{stats.pendingCount} contas</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Recebidos</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(stats.received)}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stats.receivedCount} contas</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Vencidos</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{formatCurrency(stats.overdue)}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{stats.overdueCount} contas</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Ajustes</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(0)}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Total de ajustes</p>
              </div>
              <Percent className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600 dark:text-teal-400">Descontos</p>
                <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">{formatCurrency(stats.totalDiscounts)}</p>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Concessão total</p>
              </div>
              <TrendingDown className="h-8 w-8 text-teal-500 dark:text-teal-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div>
              <CardTitle className="text-lg">Lista de Contas</CardTitle>
            </div>
            {selectedAccounts.length > 0 && (
              <div className="flex items-center gap-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg animate-in fade-in slide-in-from-top-1">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedAccounts.length} {selectedAccounts.length === 1 ? 'item selecionado' : 'itens selecionados'}
                </span>
                <div className="h-4 w-px bg-blue-200 dark:bg-blue-800" />
                <Button
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Deseja marcar ${selectedAccounts.length} contas como recebidas hoje?`)) {
                      bulkMarkAsReceivedMutation.mutate({
                        ids: selectedAccounts,
                        receivedDate: new Date().toISOString().split('T')[0],
                        paymentMethod: 'pix' // Defaulting to PIX for bulk received or just unset
                      });
                    }
                  }}
                  disabled={bulkMarkAsReceivedMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                >
                  {bulkMarkAsReceivedMutation.isPending ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Marcar como Recebido
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAccounts([])}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 h-8"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Ativos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Desativados</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="received">Recebidos</SelectItem>
                    <SelectItem value="overdue">Vencidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground mb-1 ml-1">Vencimento Início</span>
                  <Input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    className="w-[140px]"
                  />
                </div>
                <span className="text-sm text-muted-foreground pt-5">até</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground mb-1 ml-1">Vencimento Fim</span>
                  <Input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                    className="w-[140px]"
                  />
                </div>
                {(searchTerm || statusFilter !== "all" || activeFilter !== "active" || dateFilter.start || dateFilter.end) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setActiveFilter("active");
                      setDateFilter({ start: "", end: "" });
                    }}
                    title="Limpar filtros"
                    className="mt-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
                {(searchTerm || statusFilter !== "all" || activeFilter !== "active" || dateFilter.start || dateFilter.end) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setActiveFilter("active");
                      setDateFilter({ start: "", end: "" });
                    }}
                    title="Limpar filtros"
                    className="mt-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAccounts && filteredAccounts.length > 0 ? (
            <>
              {viewMode === "table" ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={
                              filteredAccounts.length > 0 &&
                              selectedAccounts.length === filteredAccounts.filter(a => a.status !== 'received').length
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAccounts(filteredAccounts.filter(a => a.status !== 'received').map(a => a.id));
                              } else {
                                setSelectedAccounts([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Desconto</TableHead>
                        <TableHead className="text-right font-bold">Valor Líquido</TableHead>
                        <TableHead>Forma de Pagto</TableHead>
                        <TableHead>Data Recebimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAccounts.map((account) => {
                        const client = clients?.find((c) => c.id === account.clientId);
                        const category = categories?.find((c) => c.id === account.categoryId);
                        const overdue = isOverdue(account.dueDate, account.status);
                        const displayStatus = overdue ? "overdue" : account.status;
                        const amountNum = parseFloat(account.amount?.toString() || "0");
                        const discountNum = parseFloat(account.discount?.toString() || "0");
                        const netValue = amountNum - discountNum;

                        return (
                          <TableRow key={account.id} data-testid={`row-receivable-${account.id}`}>
                            <TableCell>
                              <Checkbox
                                disabled={account.status === 'received'}
                                checked={selectedAccounts.includes(account.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedAccounts([...selectedAccounts, account.id]);
                                  } else {
                                    setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {account.description}
                            </TableCell>
                            <TableCell>
                              {client ? (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span>{client.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {category ? (
                                <Badge variant="secondary" className="font-normal">
                                  {category.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(account.dueDate)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(account.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {account.discount && account.discount !== null ? (
                                <span className="text-red-600 font-medium">
                                  {formatCurrency(account.discount)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(netValue.toFixed(2))}
                            </TableCell>
                            <TableCell>
                              {account.paymentMethod ? (
                                <Badge variant="outline" className="font-normal capitalize">
                                  {account.paymentMethod === 'money' ? 'Dinheiro' :
                                    account.paymentMethod === 'pix' ? 'PIX' :
                                      account.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                                        account.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                                          account.paymentMethod === 'boleto' ? 'Boleto' :
                                            account.paymentMethod === 'transfer' ? 'Transferência' : account.paymentMethod}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {account.receivedDate ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600">{formatDate(account.receivedDate)}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(displayStatus)}>
                                {getStatusLabel(displayStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-actions-${account.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleClone(account)}
                                    data-testid={`button-clone-${account.id}`}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Clonar Lançamento
                                  </DropdownMenuItem>
                                  {account.status !== "received" && (
                                    <DropdownMenuItem
                                      onClick={() => handleMarkAsReceived(account)}
                                      data-testid={`button-mark-received-${account.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Marcar como Recebido
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(account)}
                                    data-testid={`button-edit-${account.id}`}
                                    disabled={account.status === "received"}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                    {account.status === "received" && (
                                      <span className="ml-2 text-xs text-gray-400">(Não disponível)</span>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteMutation.mutate(account.id)}
                                    data-testid={`button-delete-${account.id}`}
                                    className="text-red-600"
                                    disabled={account.status === "received"}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Desativar
                                    {account.status === "received" && (
                                      <span className="ml-2 text-xs text-gray-400">(Não disponível)</span>
                                    )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAccounts.map((account) => {
                    const client = clients?.find((c) => c.id === account.clientId);
                    const category = categories?.find((c) => c.id === account.categoryId);
                    const overdue = isOverdue(account.dueDate, account.status);
                    const displayStatus = overdue ? "overdue" : account.status;
                    const amountNum = parseFloat(account.amount?.toString() || "0");
                    const discountNum = parseFloat(account.discount?.toString() || "0");
                    const netValue = amountNum - discountNum;

                    return (
                      <Card key={account.id} className="hover:shadow-lg transition-all duration-200 group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                disabled={account.status === 'received'}
                                checked={selectedAccounts.includes(account.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedAccounts([...selectedAccounts, account.id]);
                                  } else {
                                    setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                                  }
                                }}
                              />
                              <Badge className={getStatusColor(displayStatus)}>
                                {getStatusLabel(displayStatus)}
                              </Badge>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsReceived(account)}
                                  data-testid={`button-receive-${account.id}`}
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Receber Conta
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(account)}
                                  data-testid={`button-edit-${account.id}`}
                                  disabled={account.status === "received"}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                  {account.status === "received" && (
                                    <span className="ml-2 text-xs text-gray-400">(Não disponível)</span>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate(account.id)}
                                  data-testid={`button-delete-${account.id}`}
                                  className="text-red-600"
                                  disabled={account.status === "received"}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Desativar
                                  {account.status === "received" && (
                                    <span className="ml-2 text-xs text-gray-400">(Não disponível)</span>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                            {account.description}
                          </h3>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Cliente:</span>
                              <span className="text-sm font-medium">
                                {client ? client.name : "-"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Categoria:</span>
                              <span className="text-sm font-medium">
                                {category ? category.name : "-"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Vencimento:</span>
                              <span className="text-sm font-medium">{formatDate(account.dueDate)}</span>
                            </div>
                          </div>

                          <div className="border-t pt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Valor:</span>
                              <span className="font-bold text-lg text-green-600">{formatCurrency(account.amount)}</span>
                            </div>

                            {discountNum > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Desconto:</span>
                                <span className="font-medium text-red-600">-{formatCurrency(account.discount)}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Valor Líquido:</span>
                              <span className="font-bold text-lg">{formatCurrency(netValue.toFixed(2))}</span>
                            </div>

                            {account.receivedDate && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Recebido em:</span>
                                <span className="text-sm font-medium text-green-600">{formatDate(account.receivedDate)}</span>
                              </div>
                            )}

                            {account.paymentMethod && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Forma Pagto:</span>
                                <Badge variant="outline" className="font-normal capitalize">
                                  {account.paymentMethod === 'money' ? 'Dinheiro' :
                                    account.paymentMethod === 'pix' ? 'PIX' :
                                      account.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                                        account.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                                          account.paymentMethod === 'boleto' ? 'Boleto' :
                                            account.paymentMethod === 'transfer' ? 'Transferência' : account.paymentMethod}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Nenhuma conta encontrada</p>
              <p className="text-sm">Tente ajustar os filtros ou clique em "Nova Conta" para adicionar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              {accountToReceive && `Registrar recebimento da conta: ${accountToReceive.description}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Data do Recebimento</label>
              <Input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valor Original</label>
              <p className="text-lg font-semibold">
                {accountToReceive && formatCurrency(accountToReceive.amount)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Desconto (opcional)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                onChange={(e) => {
                  if (accountToReceive) {
                    setAccountToReceive({ ...accountToReceive, discount: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valor Líquido</label>
              <p className="text-lg font-semibold">
                {accountToReceive && formatCurrency((parseFloat(accountToReceive.amount?.toString() || "0") - parseFloat(accountToReceive.discount?.toString() || "0")).toFixed(2))}
              </p>
            </div>
            {accountToReceive && accountToReceive.paymentDate && (
              <div>
                <label className="text-sm font-medium">Forma de Pagamento</label>
                <Badge variant="outline" className="font-normal capitalize">
                  {accountToReceive.paymentMethod === 'money' ? 'Dinheiro' :
                    accountToReceive.paymentMethod === 'pix' ? 'PIX' :
                      accountToReceive.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                        accountToReceive.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                          accountToReceive.paymentMethod === 'boleto' ? 'Boleto' :
                            accountToReceive.paymentMethod === 'transfer' ? 'Transferência' : accountToReceive.paymentMethod}
                </Badge>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={markAsReceivedMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (accountToReceive) {
                  markAsReceivedMutation.mutate({
                    id: accountToReceive.id,
                    discount: accountToReceive.discount || "",
                    receivedDate: receivedDate,
                    paymentMethod: paymentMethod
                  });
                }
              }}
            >
              {markAsReceivedMutation.isPending ? "Salvando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Client Dialog */}
      <Dialog open={newClientDialogOpen} onOpenChange={setNewClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Novo Cliente
            </DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente rapidamente preenchendo os dados básicos.
            </DialogDescription>
          </DialogHeader>
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit((data) => createClientMutation.mutate(data))} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome / Razão Social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} className="bg-white" />
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
                    <FormLabel>CNPJ / CPF</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="00.000.000/0000-00" {...field} className="bg-white" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => searchCNPJ(field.value || "")}
                          disabled={!field.value || field.value.replace(/[^\d]/g, '').length !== 14}
                          className="shrink-0"
                          title="Buscar CNPJ"
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
                  control={clientForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="email" placeholder="email@exemplo.com" {...field} className="pl-9 bg-white" />
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clientForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="(00) 00000-0000" {...field} className="pl-9 bg-white" />
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={clientForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Endereço completo" {...field} className="pl-9 bg-white" />
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewClientDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createClientMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createClientMutation.isPending ? "Salvando..." : "Cadastrar Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AccountsReceivable();
