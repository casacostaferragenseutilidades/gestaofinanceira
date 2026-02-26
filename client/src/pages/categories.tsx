import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tags,
  TrendingUp,
  TrendingDown,
  Grid3X3,
  List,
  BarChart3,
  PieChart,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["income", "expense"], { required_error: "Tipo é obrigatório" }),
  dreCategory: z.string().optional(),
  color: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

const categoryColors = [
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "red", label: "Vermelho", class: "bg-red-500" },
  { value: "yellow", label: "Amarelo", class: "bg-yellow-500" },
  { value: "purple", label: "Roxo", class: "bg-purple-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "orange", label: "Laranja", class: "bg-orange-500" },
  { value: "cyan", label: "Ciano", class: "bg-cyan-500" },
  { value: "indigo", label: "Índigo", class: "bg-indigo-500" },
  { value: "gray", label: "Cinza", class: "bg-gray-500" },
];

const dreCategories = [
  // Receitas
  { value: "revenue", label: "Receita Bruta", type: "income" },
  { value: "service_revenue", label: "Receita de Serviços", type: "income" },
  { value: "product_revenue", label: "Receita de Produtos", type: "income" },
  { value: "commission_revenue", label: "Receita de Comissões", type: "income" },
  { value: "rental_revenue", label: "Receita de Aluguel", type: "income" },
  { value: "financial_revenue", label: "Receitas Financeiras", type: "income" },
  { value: "other_revenue", label: "Outras Receitas", type: "income" },

  // Deduções
  { value: "deductions", label: "Deduções", type: "income" },
  { value: "tax_deductions", label: "Deduções de Impostos", type: "income" },
  { value: "returns", label: "Devoluções e Abatimentos", type: "income" },
  { value: "discounts_given", label: "Descontos Concedidos", type: "income" },

  // Custos
  { value: "costs", label: "Custos", type: "expense" },
  { value: "raw_materials", label: "Matéria-Prima", type: "expense" },
  { value: "direct_labor", label: "Mão de Obra Direta", type: "expense" },
  { value: "packaging", label: "Embalagens", type: "expense" },
  { value: "freight_in", label: "Frete de Compras", type: "expense" },
  { value: "production_costs", label: "Custos de Produção", type: "expense" },

  // Despesas Operacionais
  { value: "operational_expenses", label: "Despesas Operacionais", type: "expense" },

  // Despesas Administrativas
  { value: "administrative_expenses", label: "Despesas Administrativas", type: "expense" },
  { value: "salaries", label: "Salários e Ordenados", type: "expense" },
  { value: "benefits", label: "Benefícios e Encargos", type: "expense" },
  { value: "office_supplies", label: "Material de Escritório", type: "expense" },
  { value: "professional_fees", label: "Honorários Profissionais", type: "expense" },
  { value: "software_subscriptions", label: "Software e Assinaturas", type: "expense" },
  { value: "bank_fees", label: "Taxas Bancárias", type: "expense" },
  { value: "accounting_services", label: "Serviços Contábeis", type: "expense" },
  { value: "legal_services", label: "Serviços Jurídicos", type: "expense" },

  // Despesas Comerciais
  { value: "sales_expenses", label: "Despesas Comerciais", type: "expense" },
  { value: "marketing", label: "Marketing e Publicidade", type: "expense" },
  { value: "commissions", label: "Comissões de Vendas", type: "expense" },
  { value: "sales_commissions", label: "Comissões sobre Vendas", type: "expense" },
  { value: "travel_expenses", label: "Despesas de Viagem", type: "expense" },
  { value: "entertainment", label: "Representação e Entretenimento", type: "expense" },
  { value: "sales_material", label: "Material de Vendas", type: "expense" },

  // Despesas com Imóveis
  { value: "property_expenses", label: "Despesas com Imóveis", type: "expense" },
  { value: "rent", label: "Aluguel", type: "expense" },
  { value: "property_tax", label: "IPTU e Taxas Prediais", type: "expense" },
  { value: "condominium", label: "Condomínio", type: "expense" },
  { value: "maintenance", label: "Manutenção e Conservação", type: "expense" },

  // Despesas com Veículos
  { value: "vehicle_expenses", label: "Despesas com Veículos", type: "expense" },
  { value: "fuel", label: "Combustíveis", type: "expense" },
  { value: "vehicle_maintenance", label: "Manutenção de Veículos", type: "expense" },
  { value: "insurance", label: "Seguros", type: "expense" },
  { value: "vehicle_insurance", label: "Seguro Veicular", type: "expense" },
  { value: "licensing", label: "Licenciamento", type: "expense" },

  // Despesas com Tecnologia
  { value: "technology_expenses", label: "Despesas com Tecnologia", type: "expense" },
  { value: "hardware", label: "Hardware e Equipamentos", type: "expense" },
  { value: "internet", label: "Internet e Telecomunicações", type: "expense" },
  { value: "hosting", label: "Hospedagem e Domínios", type: "expense" },
  { value: "it_services", label: "Serviços de TI", type: "expense" },

  // Despesas Financeiras
  { value: "financial_expenses", label: "Despesas Financeiras", type: "expense" },
  { value: "interest_expenses", label: "Despesas de Juros", type: "expense" },
  { value: "late_fees", label: "Multa e Juros de Atraso", type: "expense" },
  { value: "exchange_loss", label: "Variação Cambial", type: "expense" },
  { value: "bad_debt", label: "Perdas com Créditos", type: "expense" },

  // Impostos e Tributos
  { value: "taxes", label: "Impostos e Tributos", type: "expense" },
  { value: "federal_taxes", label: "Impostos Federais", type: "expense" },
  { value: "state_taxes", label: "Impostos Estaduais", type: "expense" },
  { value: "municipal_taxes", label: "Impostos Municipais", type: "expense" },
  { value: "tax_fines", label: "Multas Fiscais", type: "expense" },

  // Despesas Diversas
  { value: "miscellaneous", label: "Despesas Diversas", type: "expense" },
  { value: "utilities", label: "Água, Luz e Telefone", type: "expense" },
  { value: "cleaning", label: "Limpeza e Higiene", type: "expense" },
  { value: "security", label: "Segurança e Vigilância", type: "expense" },
  { value: "training", label: "Treinamento e Desenvolvimento", type: "expense" },
  { value: "events", label: "Eventos e Congressos", type: "expense" },
  { value: "donations", label: "Doações e Patrocínios", type: "expense" },
  { value: "other_expenses", label: "Outras Despesas", type: "expense" },
];

export default function Categories() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const { toast } = useToast();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: "expense",
      dreCategory: "",
      color: "",
    },
  });

  const watchType = form.watch("type");

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      apiRequest("POST", "/api/categories", {
        ...data,
        dreCategory: data.dreCategory || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Categoria cadastrada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar a categoria.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryFormData & { id: string }) =>
      apiRequest("PATCH", `/api/categories/${data.id}`, {
        ...data,
        dreCategory: data.dreCategory || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ ...data, id: editingCategory.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      type: category.type as "income" | "expense",
      dreCategory: category.dreCategory || "",
      color: category.color || "",
    });
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingCategory(null);
      form.reset();
    }
  };

  const filteredCategories = categories?.filter((category) => {
    const matchesSearch = category.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || category.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Estatísticas
  const totalCategories = categories?.length || 0;
  const incomeCategories = categories?.filter(c => c.type === "income").length || 0;
  const expenseCategories = categories?.filter(c => c.type === "expense").length || 0;
  const filteredCount = filteredCategories?.length || 0;

  const getDreCategoryLabel = (value: string | null) => {
    if (!value) return "-";
    return dreCategories.find((c) => c.value === value)?.label || value;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias de receitas e despesas
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-category">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da categoria
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
                          placeholder="Nome da categoria"
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              Receita
                            </div>
                          </SelectItem>
                          <SelectItem value="expense">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              Despesa
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
                  name="dreCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria DRE</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-dre-category">
                            <SelectValue placeholder="Selecione a categoria DRE" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dreCategories
                            .filter((c) => !c.type || c.type === watchType)
                            .map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
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
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor da Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-color">
                            <SelectValue placeholder="Selecione uma cor">
                              {field.value && (
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full ${categoryColors.find(c => c.value === field.value)?.class || 'bg-gray-500'}`}></div>
                                  {categoryColors.find(c => c.value === field.value)?.label}
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${color.class}`}></div>
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      : editingCategory
                        ? "Atualizar"
                        : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalCategories}</p>
              </div>
              <Tags className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-green-600">{incomeCategories}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-red-600">{expenseCategories}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtradas</p>
                <p className="text-2xl font-bold text-blue-600">{filteredCount}</p>
              </div>
              <Filter className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Filtros e Visualização</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                  data-testid="input-search"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Categorias */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCategories && filteredCategories.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                // Visualização em Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCategories.map((category) => (
                    <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {category.color && (
                              <div className={`w-4 h-4 rounded-full ${categoryColors.find(c => c.value === category.color)?.class || 'bg-gray-500'}`}></div>
                            )}
                            <Badge
                              className={
                                category.type === "income"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }
                            >
                              <span className="flex items-center gap-1 text-xs">
                                {category.type === "income" ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {category.type === "income" ? "Receita" : "Despesa"}
                              </span>
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
                                onClick={() => handleEdit(category)}
                                data-testid={`button-edit-${category.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(category.id)}
                                className="text-destructive"
                                data-testid={`button-delete-${category.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getDreCategoryLabel(category.dreCategory)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Visualização em Lista (Melhorada)
                <div className="space-y-3">
                  {filteredCategories.map((category) => (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {category.color && (
                              <div className={`w-4 h-4 rounded-full ${categoryColors.find(c => c.value === category.color)?.class || 'bg-gray-500'}`}></div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{category.name}</h3>
                                <Badge
                                  className={
                                    category.type === "income"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  }
                                >
                                  <span className="flex items-center gap-1 text-xs">
                                    {category.type === "income" ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    {category.type === "income" ? "Receita" : "Despesa"}
                                  </span>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {getDreCategoryLabel(category.dreCategory)}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${category.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(category)}
                                data-testid={`button-edit-${category.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(category.id)}
                                className="text-destructive"
                                data-testid={`button-delete-${category.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Tags className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Nenhuma categoria encontrada</p>
              <p className="text-sm">Tente ajustar os filtros ou clique em "Nova Categoria" para adicionar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
