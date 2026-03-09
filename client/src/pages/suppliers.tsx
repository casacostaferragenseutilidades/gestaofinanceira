import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Building2,
  Mail,
  Phone,
  MapPin,
  ArrowUpDown,
  Grid3X3,
  Table as TableIcon,
  ChevronUp,
  ChevronDown,
  Eye,
  Search as SearchIcon,
  Ban,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Supplier } from "@shared/schema";

const supplierFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  document: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

export default function Suppliers() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("table");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Supplier; direction: 'asc' | 'desc' } | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<SupplierFormData>({
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

  const createMutation = useMutation({
    mutationFn: (data: SupplierFormData) =>
      apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Fornecedor cadastrado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o fornecedor.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SupplierFormData & { id: string }) =>
      apiRequest("PATCH", `/api/suppliers/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsOpen(false);
      setEditingSupplier(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o fornecedor.",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/suppliers/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Sucesso",
        description: "Fornecedor inativado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível inativar o fornecedor.",
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/suppliers/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Sucesso",
        description: "Fornecedor reativado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível reativar o fornecedor.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateMutation.mutate({ ...data, id: editingSupplier.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      document: supplier.document || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      contact: supplier.contact || "",
      address: supplier.address || "",
    });
    setIsOpen(true);
  };

  const searchCNPJ = async (cnpj: string) => {
    try {
      const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
      if (cleanCNPJ.length !== 14) return;

      // Use the backend proxy (which now uses BrasilAPI)
      const response = await fetch(`/api/companies/search/cnpj/${cleanCNPJ}`);

      if (!response.ok) {
        toast({
          title: "Erro na busca",
          description: "CNPJ não encontrado ou erro na consulta.",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();

      if (data.nome || data.razaoSocial) {
        form.setValue('name', data.nome || '');
        form.setValue('email', data.email || '');
        form.setValue('phone', data.telefone || '');
        form.setValue('address', data.endereco || '');

        // If contact is empty, maybe use a default? Or leave it.
        // form.setValue('contact', ...);

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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingSupplier(null);
      form.reset();
    }
  };

  const filteredSuppliers = React.useMemo(() => {
    let filtered = suppliers?.filter((supplier) => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.document && supplier.document.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && supplier.active) ||
        (statusFilter === "inactive" && !supplier.active);
      
      return matchesSearch && matchesStatus;
    }) || [];

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [suppliers, searchTerm, statusFilter, sortConfig]);

  const stats = React.useMemo(() => {
    if (!suppliers) return { total: 0, active: 0, recent: 0 };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.active).length,
      recent: suppliers.filter(s => {
        // Fallback for missing createdAt since it's not in the schema for suppliers
        return true;
      }).length
    };
  }, [suppliers]);

  const handleSort = (key: keyof Supplier) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleViewDetails = (supplierId: string) => {
    setLocation(`/fornecedores/${supplierId}`);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header Moderno */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white" data-testid="text-page-title">Fornecedores</h1>
              <p className="text-blue-100 mt-1 text-sm">
                Gerencie seu cadastro de fornecedores e parceiros comerciais
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg p-1">
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={viewMode === "cards" ? "bg-white text-blue-700" : "text-white hover:bg-white/20"}
                  data-testid="button-view-cards"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "bg-white text-blue-700" : "text-white hover:bg-white/20"}
                  data-testid="button-view-table"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
              <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg"
                    data-testid="button-new-supplier"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Fornecedor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do fornecedor
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nome do fornecedor"
                                {...field}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ/CPF</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="00.000.000/0000-00"
                                  {...field}
                                  data-testid="input-document"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => searchCNPJ(field.value || "")}
                                  disabled={!field.value || (field.value as string).replace(/[^\d]/g, '').length !== 14}
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
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="email@exemplo.com"
                                  {...field}
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="(00) 00000-0000"
                                  {...field}
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contato</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nome do contato"
                                  {...field}
                                  data-testid="input-contact"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Endereço completo"
                                  {...field}
                                  data-testid="input-address"
                                />
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
                          onClick={() => handleOpenChange(false)}
                          data-testid="button-cancel"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createMutation.isPending || updateMutation.isPending}
                          data-testid="button-submit"
                        >
                          {createMutation.isPending || updateMutation.isPending
                            ? "Salvando..."
                            : editingSupplier
                              ? "Atualizar"
                              : "Cadastrar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Fornecedores</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fornecedores Ativos</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adicionados Recentemente</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.recent}</p>
                <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Filtros Modernos */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fornecedor por nome, CNPJ ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:shadow-xl transition-shadow duration-300"
            data-testid="input-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              title="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
        <>
          {viewMode === "cards" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} data-testid={`card-supplier-${supplier.id}`} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">{supplier.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {supplier.document && (
                            <p className="text-sm text-muted-foreground font-mono">
                              {supplier.document}
                            </p>
                          )}
                          <Badge
                            variant={!supplier.active ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {!supplier.active ? 'Inativo' : 'Ativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-actions-${supplier.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(supplier.id)}
                          data-testid={`button-details-${supplier.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detalhar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(supplier)}
                          data-testid={`button-edit-${supplier.id}`}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {supplier.active !== false ? (
                          <DropdownMenuItem
                            onClick={() => deactivateMutation.mutate(supplier.id)}
                            className="text-destructive"
                            data-testid={`button-deactivate-${supplier.id}`}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Inativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => activateMutation.mutate(supplier.id)}
                            className="text-green-600"
                            data-testid={`button-activate-${supplier.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {supplier.email && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-slate-700">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-slate-700">{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-slate-700 truncate">{supplier.address}</span>
                      </div>
                    )}
                    {supplier.contact && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-slate-700">{supplier.contact}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-semibold hover:bg-slate-100"
                        onClick={() => handleSort('name')}
                      >
                        Nome
                        {sortConfig?.key === 'name' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                        {sortConfig?.key !== 'name' && <ArrowUpDown className="h-4 w-4 ml-1" />}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-semibold hover:bg-slate-100"
                        onClick={() => handleSort('document')}
                      >
                        CNPJ/CPF
                        {sortConfig?.key === 'document' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                        {sortConfig?.key !== 'document' && <ArrowUpDown className="h-4 w-4 ml-1" />}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-semibold hover:bg-slate-100"
                        onClick={() => handleSort('email')}
                      >
                        E-mail
                        {sortConfig?.key === 'email' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                        {sortConfig?.key !== 'email' && <ArrowUpDown className="h-4 w-4 ml-1" />}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-semibold hover:bg-slate-100"
                        onClick={() => handleSort('phone')}
                      >
                        Telefone
                        {sortConfig?.key === 'phone' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                        {sortConfig?.key !== 'phone' && <ArrowUpDown className="h-4 w-4 ml-1" />}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier, index) => (
                    <TableRow
                      key={supplier.id}
                      className="hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100"
                    >
                      <TableCell className="font-medium text-slate-900">{supplier.name}</TableCell>
                      <TableCell className="font-mono text-sm">{supplier.document || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={!supplier.active ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {!supplier.active ? 'Inativo' : 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {supplier.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="text-slate-700">{supplier.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            <span className="text-slate-700">{supplier.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${supplier.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(supplier.id)}
                              data-testid={`button-details-${supplier.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Detalhar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(supplier)}
                              data-testid={`button-edit-${supplier.id}`}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {supplier.active !== false ? (
                              <DropdownMenuItem
                                onClick={() => deactivateMutation.mutate(supplier.id)}
                                className="text-destructive"
                                data-testid={`button-deactivate-${supplier.id}`}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Inativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => activateMutation.mutate(supplier.id)}
                                className="text-green-600"
                                data-testid={`button-activate-${supplier.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Reativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-6">
              <Building2 className="h-10 w-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Comece adicionando seu primeiro fornecedor para gerenciar melhor seus parceiros comerciais
            </p>
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Fornecedor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
