import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Target,
    Plus,
    TrendingUp,
    TrendingDown,
    Calendar,
    Trash2,
    Edit2,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Filter,
    BarChart3,
    PieChart as PieChartIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFinancialGoalSchema, type FinancialGoal, type FinancialGoalProgress, type Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function FinancialGoals() {
    const { toast } = useToast();
    const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingGoal, setEditingGoal] = React.useState<FinancialGoal | null>(null);

    const { data: progress, isLoading: loadingProgress } = useQuery<FinancialGoalProgress[]>({
        queryKey: ["/api/financial-goals/progress", { month: selectedMonth, year: selectedYear }],
    });

    const { data: categories } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const form = useForm({
        resolver: zodResolver(insertFinancialGoalSchema),
        defaultValues: {
            name: "",
            type: "income_total",
            targetAmount: "",
            month: selectedMonth,
            year: selectedYear,
            categoryId: "",
            active: true,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => apiRequest("POST", "/api/financial-goals", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/financial-goals/progress"] });
            setIsDialogOpen(false);
            form.reset();
            toast({ title: "Meta criada com sucesso!" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; body: any }) => apiRequest("PATCH", `/api/financial-goals/${data.id}`, data.body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/financial-goals/progress"] });
            setIsDialogOpen(false);
            setEditingGoal(null);
            form.reset();
            toast({ title: "Meta atualizada com sucesso!" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/financial-goals/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/financial-goals/progress"] });
            toast({ title: "Meta removida com sucesso!" });
        },
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            month: selectedMonth,
            year: selectedYear,
            targetAmount: data.targetAmount.toString(),
            categoryId: data.type === 'category' ? data.categoryId : null,
        };

        if (editingGoal) {
            updateMutation.mutate({ id: editingGoal.id, body: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (goal: FinancialGoal) => {
        setEditingGoal(goal);
        form.reset({
            name: goal.name,
            type: goal.type as any,
            targetAmount: goal.targetAmount.toString(),
            month: goal.month,
            year: goal.year,
            categoryId: goal.categoryId || "",
            active: goal.active,
        });
        setIsDialogOpen(true);
    };

    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const getProgressColor = (percentage: number, type: string, categoryId?: string | null) => {
        const isExpense = type === 'expense_total' || (type === 'category' && categories?.find((c: Category) => c.id === categoryId)?.type === 'expense');
        if (isExpense) {
            if (percentage > 100) return "bg-red-500";
            if (percentage > 80) return "bg-amber-500";
            return "bg-emerald-500";
        }
        if (percentage >= 100) return "bg-emerald-500";
        if (percentage > 50) return "bg-amber-500";
        return "bg-blue-500";
    };

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Metas Financeiras</h1>
                    <p className="text-muted-foreground mt-2">
                        Acompanhe o desempenho do seu negócio em relação aos seus objetivos mensais.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-lg border shadow-sm p-1">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-4 font-semibold text-sm min-w-[140px] text-center">
                            {monthNames[selectedMonth - 1]} {selectedYear}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                            setEditingGoal(null);
                            form.reset();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-md">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Meta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingGoal ? "Editar Meta" : "Nova Meta Financeira"}</DialogTitle>
                                <CardDescription>Defina um objetivo de receita ou limite de despesa.</CardDescription>
                            </DialogHeader>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome da Meta</Label>
                                    <Input id="name" {...form.register("name")} placeholder="Ex: Meta de Vendas Janeiro" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipo de Meta</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue("type", value as any)}
                                        value={form.watch("type")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income_total">Total de Receitas</SelectItem>
                                            <SelectItem value="expense_total">Limite de Despesas</SelectItem>
                                            <SelectItem value="category">Por Categoria</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {form.watch("type") === "category" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="categoryId">Categoria</Label>
                                        <Select
                                            onValueChange={(value) => form.setValue("categoryId", value)}
                                            value={form.watch("categoryId")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories?.map((cat: Category) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name} ({cat.type === 'income' ? 'Receita' : 'Despesa'})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="targetAmount">Valor Alvo (R$)</Label>
                                    <Input id="targetAmount" {...form.register("targetAmount")} type="number" step="0.01" placeholder="0,00" />
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                        {editingGoal ? "Salvar Alterações" : "Criar Meta"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loadingProgress ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-2 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : progress && progress.length > 0 ? (
                    progress.map((goal) => {
                        const isRevenue = goal.type === 'income_total' || (goal.type === 'category' && categories?.find(c => c.id === goal.categoryId)?.type === 'income');
                        const Icon = isRevenue ? TrendingUp : TrendingDown;
                        const progressColor = getProgressColor(goal.percentage, goal.type, goal.categoryId);

                        return (
                            <Card key={goal.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1 h-full ${isRevenue ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${isRevenue ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <CardTitle className="text-lg font-semibold truncate max-w-[180px]">{goal.name}</CardTitle>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(goal)}>
                                                    <Edit2 className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(goal.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription>
                                        {goal.type === 'income_total' ? 'Meta de Receita Total' :
                                            goal.type === 'expense_total' ? 'Limite de Despesa Total' :
                                                `Categoria: ${categories?.find((c: Category) => c.id === goal.categoryId)?.name}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Atual / Alvo</p>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-bold text-slate-900">{formatCurrency(goal.currentAmount)}</span>
                                                <span className="text-sm text-muted-foreground">/ {formatCurrency(goal.targetAmount)}</span>
                                            </div>
                                        </div>
                                        <Badge variant={goal.percentage >= 100 ? (isRevenue ? "default" : "destructive") : "secondary"} className="mb-1">
                                            {goal.percentage >= 100 ? (isRevenue ? "Alcançada!" : "Excedida") : `${goal.percentage.toFixed(1)}%`}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>Progresso</span>
                                            <span>{goal.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${progressColor} transition-all duration-500 ease-in-out`}
                                                style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                                            />
                                        </div>
                                        {goal.percentage > 100 && !isRevenue && (
                                            <p className="text-[10px] text-red-600 font-medium animate-pulse flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> Atenção: Meta excedida!
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                            <Target className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Nenhuma meta definida</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            Comece definindo seus primeiros objetivos financeiros para ter um melhor controle do seu negócio.
                        </p>
                        <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
                            Criar minha primeira meta
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-600" />
                            Dicas de Planejamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0 space-y-4">
                        <div className="flex gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                <TrendingUp className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Metas de Receita</h4>
                                <p className="text-sm text-slate-600 mt-1">Defina metas realistas baseadas no histórico dos últimos 3 meses e adicione uma margem de crescimento de 5% a 10%.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                <TrendingDown className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Limites de Despesa</h4>
                                <p className="text-sm text-slate-600 mt-1">Monitore categorias críticas como 'Custos Operacionais' para garantir que não ultrapassem 30% do seu faturamento.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-indigo-900 text-white border-0 shadow-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Target className="h-32 w-32" />
                    </div>
                    <CardHeader className="px-0 pt-0">
                        <div className={`p-2 rounded-lg bg-white/10 w-fit mb-4`}>
                            <Target className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl font-bold">Resumo do Período</CardTitle>
                        <CardDescription className="text-indigo-200">Visão consolidada do progresso mensal.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0 space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-indigo-300 uppercase tracking-wider font-bold">Metas Ativas</p>
                                <p className="text-3xl font-bold">{progress?.length || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-indigo-300 uppercase tracking-wider font-bold">Alcançadas</p>
                                <p className="text-3xl font-bold">{progress?.filter((g: FinancialGoalProgress) => g.percentage >= 100 && (g.type === 'income_total' || (g.type === 'category' && categories?.find((c: Category) => c.id === g.categoryId)?.type === 'income'))).length || 0}</p>
                            </div>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-white/10">
                            <p className="text-xs text-indigo-300 font-medium">Lembrete: Metas são essenciais para manter o fluxo de caixa saudável e prever expansões futuras.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const AlertTriangle = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
);
