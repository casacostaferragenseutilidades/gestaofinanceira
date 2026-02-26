import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
    ArrowLeft,
    Users,
    Mail,
    Phone,
    MapPin,
    FileText,
    Calendar,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
    UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client, AccountReceivable } from "@shared/schema";

type AccountReceivableWithClient = AccountReceivable & {
    client?: Client;
};

export default function ClientDetails() {
    const params = useParams();
    const [, setLocation] = useLocation();
    const clientId = params.id as string;

    const { data: client, isLoading: clientLoading } = useQuery({
        queryKey: ["/api/clients"],
        select: (clients: Client[]) => clients.find(c => c.id === clientId),
    });

    const { data: receivables, isLoading: receivablesLoading } = useQuery<AccountReceivableWithClient[]>({
        queryKey: ["/api/accounts-receivable"],
        select: (data: AccountReceivableWithClient[]) =>
            data.filter(receivable => receivable.clientId === clientId),
        enabled: !!clientId,
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "received":
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Recebido</Badge>;
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
            case "overdue":
                return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" /> Vencido</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const totalReceived = receivables?.filter(r => r.status === "received").reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    const totalPending = receivables?.filter(r => r.status === "pending").reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    const totalOverdue = receivables?.filter(r => r.status === "overdue").reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    if (clientLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">Cliente não encontrado</p>
                    <Button onClick={() => setLocation("/clientes")} className="mt-4">
                        Voltar para Clientes
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button onClick={() => setLocation("/clientes")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Clientes
                </Button>
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                        <UserCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{client.name}</h1>
                        {client.document && (
                            <p className="text-muted-foreground">{client.document}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            Total Recebido
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                            R$ {totalReceived.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {receivables?.filter(r => r.status === "received").length || 0} recebimento(s)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            A Receber
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-yellow-600">
                            R$ {totalPending.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {receivables?.filter(r => r.status === "pending").length || 0} recebimento(s)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Vencido
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-600">
                            R$ {totalOverdue.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {receivables?.filter(r => r.status === "overdue").length || 0} recebimento(s)
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {client.email && (
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">E-mail</p>
                                    <p className="text-muted-foreground">{client.email}</p>
                                </div>
                            </div>
                        )}
                        {client.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Telefone</p>
                                    <p className="text-muted-foreground">{client.phone}</p>
                                </div>
                            </div>
                        )}
                        {client.address && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Endereço</p>
                                    <p className="text-muted-foreground">{client.address}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Histórico Financeiro
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {receivablesLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : receivables && receivables.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {receivables.map((receivable) => (
                                    <div key={receivable.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{receivable.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                Venc: {new Date(receivable.dueDate).toLocaleDateString('pt-BR')}
                                                {receivable.receivedDate && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Rec: {new Date(receivable.receivedDate).toLocaleDateString('pt-BR')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">R$ {Number(receivable.amount).toFixed(2)}</p>
                                            {getStatusBadge(receivable.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                Nenhum registro financeiro encontrado para este cliente
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {receivables && receivables.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Todas as Movimentações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Data Vencimento</TableHead>
                                    <TableHead>Data Recebimento</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receivables.map((receivable) => (
                                    <TableRow key={receivable.id}>
                                        <TableCell className="font-medium">{receivable.description}</TableCell>
                                        <TableCell>R$ {Number(receivable.amount).toFixed(2)}</TableCell>
                                        <TableCell>{new Date(receivable.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>
                                            {receivable.receivedDate
                                                ? new Date(receivable.receivedDate).toLocaleDateString('pt-BR')
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>{getStatusBadge(receivable.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
