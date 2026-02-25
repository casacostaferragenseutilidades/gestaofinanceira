
import { useState, useEffect } from "react";
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
    DollarSign,
    TrendingUp,
    Percent,
    FileText,
    Download,
    CreditCard,
    Banknote,
    Smartphone,
    AlertCircle,
    BarChart3,
    PieChart as PieChartIcon,
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CardTransaction } from "@shared/schema";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

const cardTransactionFormSchema = z.object({
    saleDate: z.string().min(1, "Data da venda é obrigatória"),
    paymentMethod: z.string().min(1, "Meio de pagamento é obrigatório"),
    grossAmount: z.string().min(1, "Valor bruto é obrigatório"),
    feePercentage: z.string().min(1, "Taxa é obrigatória"),
    netAmount: z.string().min(1, "Valor líquido é obrigatório"),
    transactionNumber: z.string().optional(),
    status: z.string().min(1, "Status é obrigatório"),
    settlementDate: z.string().optional(),
    notes: z.string().optional(),
    paymentConfigId: z.string().optional(),
});

type CardTransactionFormData = z.infer<typeof cardTransactionFormSchema>;

export default function ReceiptsControl() {
    const [isOpen, setIsOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<CardTransaction | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [methodFilter, setMethodFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const { toast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const { data: configs } = useQuery<PaymentConfig[]>({
        queryKey: ["/api/payment-configs"],
    });

    const { data: transactions, isLoading } = useQuery<CardTransaction[]>({
        queryKey: ["/api/card-transactions", dateRange.start, dateRange.end],
        queryFn: async () => {
            const res = await fetch(`/api/card-transactions?startDate=${dateRange.start}&endDate=${dateRange.end}`);
            if (!res.ok) throw new Error("Erro ao buscar transações");
            return res.json();
        }
    });

    const form = useForm<CardTransactionFormData>({
        resolver: zodResolver(cardTransactionFormSchema),
        defaultValues: {
            saleDate: new Date().toISOString().split('T')[0],
            paymentMethod: "credit_card",
            grossAmount: "",
            feePercentage: "0",
            netAmount: "0",
            transactionNumber: "",
            status: "pending",
            settlementDate: "",
            notes: "",
            paymentConfigId: "",
        },
    });

    const grossAmount = form.watch("grossAmount");
    const feePercentage = form.watch("feePercentage");
    const selectedConfigId = form.watch("paymentConfigId");
    const paymentMethod = form.watch("paymentMethod");

    useEffect(() => {
        if (selectedConfigId && configs) {
            const config = configs.find(c => c.id === selectedConfigId);
            if (config) {
                let fee = "0";
                if (paymentMethod === 'credit_card') fee = config.feeCredit?.toString() || "0";
                else if (paymentMethod === 'debit_card') fee = config.feeDebit?.toString() || "0";
                else if (paymentMethod === 'pix') fee = config.feePix?.toString() || "0";

                form.setValue("feePercentage", fee);
            }
        }
    }, [selectedConfigId, paymentMethod, configs]);

    useEffect(() => {
        const gross = parseFloat(grossAmount || "0");
        const fee = parseFloat(feePercentage || "0");
        const net = gross * (1 - fee / 100);
        form.setValue("netAmount", net.toFixed(2));
    }, [grossAmount, feePercentage, form]);

    const createMutation = useMutation({
        mutationFn: (data: CardTransactionFormData) =>
            apiRequest("POST", "/api/card-transactions", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/card-transactions"] });
            setIsOpen(false);
            form.reset();
            toast({ title: "Sucesso", description: "Transação registrada com sucesso." });
        },
        onError: () => {
            toast({ title: "Erro", description: "Não foi possível registrar a transação.", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: CardTransactionFormData & { id: string }) =>
            apiRequest("PATCH", `/api/card-transactions/${data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/card-transactions"] });
            setIsOpen(false);
            setEditingTransaction(null);
            form.reset();
            toast({ title: "Sucesso", description: "Transação atualizada com sucesso." });
        },
        onError: () => {
            toast({ title: "Erro", description: "Não foi possível atualizar a transação.", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/card-transactions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/card-transactions"] });
            toast({ title: "Sucesso", description: "Transação removida com sucesso." });
        },
    });

    const handleSubmit = (data: CardTransactionFormData) => {
        if (editingTransaction) {
            updateMutation.mutate({ ...data, id: editingTransaction.id });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (transaction: CardTransaction) => {
        setEditingTransaction(transaction);
        form.reset({
            saleDate: transaction.saleDate,
            paymentMethod: transaction.paymentMethod,
            grossAmount: transaction.grossAmount.toString(),
            feePercentage: transaction.feePercentage.toString(),
            netAmount: transaction.netAmount.toString(),
            transactionNumber: transaction.transactionNumber || "",
            status: transaction.status,
            settlementDate: transaction.settlementDate || "",
            notes: transaction.notes || "",
            paymentConfigId: "", // Not stored yet, but could be added to schema later
        });
        setIsOpen(true);
    };

    const filteredTransactions = transactions?.filter((t) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            t.transactionNumber?.toLowerCase().includes(term) ||
            t.notes?.toLowerCase().includes(term);
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesMethod = methodFilter === "all" || t.paymentMethod === methodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
    }) || [];

    const stats = {
        totalGross: filteredTransactions.reduce((acc, t) => acc + parseFloat(t.grossAmount), 0),
        totalNet: filteredTransactions.reduce((acc, t) => acc + parseFloat(t.netAmount), 0),
        totalFees: filteredTransactions.reduce((acc, t) => acc + (parseFloat(t.grossAmount) - parseFloat(t.netAmount)), 0),
        pending: filteredTransactions.filter(t => t.status === "pending").reduce((acc, t) => acc + parseFloat(t.netAmount), 0),
        count: filteredTransactions.length,
    };

    const methodData = Object.entries(
        filteredTransactions.reduce((acc, t) => {
            acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + parseFloat(t.netAmount);
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({
        name: name === 'credit_card' ? 'Crédito' : name === 'debit_card' ? 'Débito' : 'PIX',
        value
    }));

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'credit_card': return <CreditCard className="h-4 w-4 text-blue-500" />;
            case 'debit_card': return <Banknote className="h-4 w-4 text-emerald-500" />;
            case 'pix': return <Smartphone className="h-4 w-4 text-amber-500" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'received': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Recebido</Badge>;
            case 'pending': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Pendente</Badge>;
            case 'cancelled': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Cancelado</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Controle de Recebimentos (PDR)
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestão de transações via Cartão e PIX</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar
                    </Button>
                    <Dialog open={isOpen} onOpenChange={(open) => {
                        setIsOpen(open);
                        if (!open) { setEditingTransaction(null); form.reset(); }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Transação
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingTransaction ? "Editar Transação" : "Nova Transação"}</DialogTitle>
                                <DialogDescription>Preencha os dados do recebimento abaixo.</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="saleDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Data da Venda</FormLabel>
                                                    <FormControl><Input type="date" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="paymentMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Meio de Pagamento</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                                            <SelectItem value="pix">PIX</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="paymentConfigId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Máquina / Configuração de Taxas</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione para carregar taxas automaticamente" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">Manual (Sem automação)</SelectItem>
                                                        {configs?.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                                        <FormField
                                            control={form.control}
                                            name="grossAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Valor Bruto (R$)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="feePercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Taxa (%)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" {...field} disabled={!isAdmin} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="netAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Valor Líquido (R$)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" readOnly {...field} className="bg-background font-bold text-blue-600" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="transactionNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ID / Comprovante</FormLabel>
                                                    <FormControl><Input {...field} placeholder="Ex: TX123456" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Status</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pendente</SelectItem>
                                                            <SelectItem value="received">Recebido</SelectItem>
                                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="settlementDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data de Liquidação (Opcional)</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Observações</FormLabel>
                                                <FormControl><Textarea {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                            {editingTransaction ? "Salvar Alterações" : "Confirmar Lançamento"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gross Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalGross)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" /> Valor total bruto
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalNet)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Valor disponível após taxas</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fees Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">{formatCurrency(stats.totalFees)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Custo total operacional</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Waitings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pending)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Valores ainda não liquidados</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Histórico de Recebimentos</CardTitle>
                            <CardDescription>Visualize e gerencie suas transações recentes</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Buscar por comprovante..."
                                className="w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Select value={methodFilter} onValueChange={setMethodFilter}>
                                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Meio" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Meios</SelectItem>
                                        <SelectItem value="credit_card">Crédito</SelectItem>
                                        <SelectItem value="debit_card">Débito</SelectItem>
                                        <SelectItem value="pix">PIX</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Status</SelectItem>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="received">Recebido</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Data Venda</TableHead>
                                        <TableHead>Meio</TableHead>
                                        <TableHead>Bruto</TableHead>
                                        <TableHead>Taxa</TableHead>
                                        <TableHead>Líquido</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={7} className="text-center py-10">Carregando...</TableCell></TableRow>
                                    ) : filteredTransactions.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="text-center py-10">Nenhuma transação encontrada.</TableCell></TableRow>
                                    ) : (
                                        filteredTransactions.map((t) => (
                                            <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="font-medium">{formatDate(t.saleDate)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getMethodIcon(t.paymentMethod)}
                                                        <span className="capitalize">{t.paymentMethod.replace('_', ' ')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(t.grossAmount)}</TableCell>
                                                <TableCell className="text-rose-500 font-medium">{t.feePercentage}%</TableCell>
                                                <TableCell className="text-blue-600 font-bold">{formatCurrency(t.netAmount)}</TableCell>
                                                <TableCell>{getStatusBadge(t.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(t)}><Pencil className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-rose-600" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Composição por Meio</CardTitle>
                        <CardDescription>Distribuição do valor líquido</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={methodData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {methodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function CardDescription({ children, className }: { children: React.ReactNode, className?: string }) {
    return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}
