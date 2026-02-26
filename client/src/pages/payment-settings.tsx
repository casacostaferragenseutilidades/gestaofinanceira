import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Plus,
    Pencil,
    Trash2,
    Building,
    CreditCard,
    Banknote,
    Smartphone,
    Info,
    Save,
    ChevronRight,
    Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BankAccount, PaymentConfig } from "@shared/schema";

// SCHEMAS
const bankAccountSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    bank: z.string().optional(),
    agency: z.string().optional(),
    account: z.string().optional(),
    type: z.string().min(1, "Tipo é obrigatório"),
});

const paymentConfigSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    type: z.string().min(1, "Tipo é obrigatório"),
    bankAccountId: z.string().min(1, "Conta bancária é obrigatória"),
    feeDebit: z.string().default("0"),
    feeCredit: z.string().default("0"),
    feePix: z.string().default("0"),
});

export default function PaymentSettings() {
    const [activeTab, setActiveTab] = React.useState("taxas");
    const [bankDialogOpen, setBankDialogOpen] = React.useState(false);
    const [configDialogOpen, setConfigDialogOpen] = React.useState(false);
    const [editingBank, setEditingBank] = React.useState<BankAccount | null>(null);
    const [editingConfig, setEditingConfig] = React.useState<PaymentConfig | null>(null);
    const { toast } = useToast();

    // QUERIES
    const { data: bankAccounts, isLoading: loadingBanks } = useQuery<BankAccount[]>({
        queryKey: ["/api/bank-accounts"],
    });

    const { data: configs, isLoading: loadingConfigs } = useQuery<PaymentConfig[]>({
        queryKey: ["/api/payment-configs"],
    });

    // FORMS
    const bankForm = useForm<z.infer<typeof bankAccountSchema>>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: { name: "", bank: "", agency: "", account: "", type: "checking" },
    });

    const configForm = useForm<z.infer<typeof paymentConfigSchema>>({
        resolver: zodResolver(paymentConfigSchema),
        defaultValues: { name: "", type: "card_machine", bankAccountId: "", feeDebit: "0", feeCredit: "0", feePix: "0" },
    });

    // MUTATIONS - Bank
    const bankMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingBank) return apiRequest("PATCH", `/api/bank-accounts/${editingBank.id}`, data);
            return apiRequest("POST", "/api/bank-accounts", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
            setBankDialogOpen(false);
            setEditingBank(null);
            bankForm.reset();
            toast({ title: "Sucesso", description: "Conta bancária salva com sucesso." });
        },
    });

    const deleteBankMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/bank-accounts/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
            toast({ title: "Sucesso", description: "Conta removida." });
        },
    });

    // MUTATIONS - Config
    const configMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingConfig) return apiRequest("PATCH", `/api/payment-configs/${editingConfig.id}`, data);
            return apiRequest("POST", "/api/payment-configs", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payment-configs"] });
            setConfigDialogOpen(false);
            setEditingConfig(null);
            configForm.reset();
            toast({ title: "Sucesso", description: "Configuração de taxas salva com sucesso." });
        },
    });

    const deleteConfigMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/payment-configs/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payment-configs"] });
            toast({ title: "Sucesso", description: "Configuração removida." });
        },
    });

    // HANDLERS
    const handleEditBank = (bank: BankAccount) => {
        setEditingBank(bank);
        bankForm.reset({
            name: bank.name,
            bank: bank.bank || "",
            agency: bank.agency || "",
            account: bank.account || "",
            type: bank.type || "checking",
        });
        setBankDialogOpen(true);
    };

    const handleEditConfig = (config: PaymentConfig) => {
        setEditingConfig(config);
        configForm.reset({
            name: config.name,
            type: config.type,
            bankAccountId: config.bankAccountId || "",
            feeDebit: config.feeDebit?.toString() || "0",
            feeCredit: config.feeCredit?.toString() || "0",
            feePix: config.feePix?.toString() || "0",
        });
        setConfigDialogOpen(true);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Configurações de Recebimento
                </h1>
                <p className="text-muted-foreground">Configure suas contas bancárias e taxas de máquinas de cartão.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6">
                    <TabsTrigger value="taxas" className="gap-2">
                        <CreditCard className="h-4 w-4" /> Taxas e Máquinas
                    </TabsTrigger>
                    <TabsTrigger value="bancos" className="gap-2">
                        <Building className="h-4 w-4" /> Contas Bancárias
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="taxas" className="space-y-6">
                    <Card className="border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>Máquinas e Gateways</CardTitle>
                                <CardDescription>Gerencie as taxas de cada meio de recebimento.</CardDescription>
                            </div>
                            <Button onClick={() => { setEditingConfig(null); configForm.reset(); setConfigDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" /> Nova Configuração
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Débito</TableHead>
                                        <TableHead>Crédito</TableHead>
                                        <TableHead>PIX</TableHead>
                                        <TableHead>Conta Destino</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {configs?.map((config) => (
                                        <TableRow key={config.id}>
                                            <TableCell className="font-medium">{config.name}</TableCell>
                                            <TableCell className="capitalize">{config.type.replace('_', ' ')}</TableCell>
                                            <TableCell>{config.feeDebit}%</TableCell>
                                            <TableCell>{config.feeCredit}%</TableCell>
                                            <TableCell>{config.feePix}%</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">
                                                    {bankAccounts?.find(b => b.id === config.bankAccountId)?.name || "Não definida"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditConfig(config)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => deleteConfigMutation.mutate(config.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!configs?.length && (
                                        <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Nenhuma configuração de taxa cadastrada.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bancos" className="space-y-6">
                    <Card className="border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>Contas Cadastradas</CardTitle>
                                <CardDescription>Bancos e contas onde os valores são recebidos.</CardDescription>
                            </div>
                            <Button onClick={() => { setEditingBank(null); bankForm.reset(); setBankDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="h-4 w-4 mr-2" /> Nova Conta
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {bankAccounts?.map((bank) => (
                                    <Card key={bank.id} className="relative group hover:border-emerald-200 transition-all">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                    <Building className="h-5 w-5" />
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditBank(bank)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => deleteBankMutation.mutate(bank.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="mt-2 text-lg">{bank.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 font-medium">
                                                {bank.bank} <ChevronRight className="h-3 w-3" /> {bank.type === 'checking' ? 'Corrente' : 'Poupança'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-sm font-mono bg-muted/30 p-3 rounded-b-lg">
                                            Ag: {bank.agency || '---'} | CC: {bank.account || '---'}
                                        </CardContent>
                                    </Card>
                                ))}
                                {!bankAccounts?.length && (
                                    <div className="col-span-full py-10 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                                        Nenhuma conta bancária cadastrada.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* DIALOG BANK */}
            <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBank ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
                        <DialogDescription>Infome os dados da conta para recebimento.</DialogDescription>
                    </DialogHeader>
                    <Form {...bankForm}>
                        <form onSubmit={bankForm.handleSubmit((d) => bankMutation.mutate(d))} className="space-y-4">
                            <FormField
                                control={bankForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Identificação (Ex: Stone Principal)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={bankForm.control}
                                    name="bank"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Banco</FormLabel>
                                            <FormControl><Input placeholder="Ex: Itaú, Nubank..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={bankForm.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="checking">Corrente</SelectItem>
                                                    <SelectItem value="savings">Poupança</SelectItem>
                                                    <SelectItem value="cash">Dinheiro em Mãos</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={bankForm.control}
                                    name="agency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Agência</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={bankForm.control}
                                    name="account"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Conta</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={bankMutation.isPending}>
                                    {bankMutation.isPending ? "Salvando..." : <><Save className="h-4 w-4 mr-2" /> Salvar Conta</>}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* DIALOG CONFIG */}
            <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingConfig ? "Editar Configuração" : "Nova Máquina/Taxa"}</DialogTitle>
                        <DialogDescription>Configure as taxas e a conta de destino.</DialogDescription>
                    </DialogHeader>
                    <Form {...configForm}>
                        <form onSubmit={configForm.handleSubmit((d) => configMutation.mutate(d))} className="space-y-4">
                            <FormField
                                control={configForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome (Ex: Maquininha Stone #1)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={configForm.control}
                                name="bankAccountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Conta de Destino</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {bankAccounts?.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name} ({b.bank})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="p-4 bg-muted rounded-xl space-y-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold uppercase"><Settings2 className="h-4 w-4" /> Taxas de Operação (%)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={configForm.control}
                                        name="feeDebit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Débito</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={configForm.control}
                                        name="feeCredit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Crédito à Vista</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={configForm.control}
                                        name="feePix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">PIX</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={configMutation.isPending}>
                                    {configMutation.isPending ? "Salvando..." : <><Save className="h-4 w-4 mr-2" /> Salvar Taxas</>}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
