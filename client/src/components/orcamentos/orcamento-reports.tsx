import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Client, User } from "@shared/schema";

import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Filter,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ReportData {
  periodo: { inicio: string; fim: string };
  resumo: {
    totalOrçamentos: number;
    valorTotalOrçado: number;
    valorConvertido: number;
    valorDescontos: number;
    ticketMedio: number;
    ticketMedioConvertido: number;
    taxaConversão: number;
  };
  porStatus: {
    editing: number;
    saved: number;
    sent: number;
    viewed: number;
    negotiating: number;
    approved: number;
    rejected: number;
    expired: number;
    converted: number;
  };
  produtosMaisOrçados: Array<{
    descricao: string;
    quantidade: number;
    valorTotal: number;
    count: number;
  }>;
  porCliente: Array<{
    name: string;
    total: number;
    count: number;
    converted: number;
  }>;
  porVendedor: Array<{
    name: string;
    total: number;
    count: number;
    converted: number;
  }>;
  detalhes: any[];
}

interface OrcamentoReportsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrcamentoReports({ open, onOpenChange }: OrcamentoReportsProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vendedorFilter, setVendedorFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: open,
  });

  const { data: vendedores = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/orcamentos/reports", { startDate, endDate, vendedorId: vendedorFilter, clientId: clientFilter }],
    enabled: open,
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatPercent = (val: number) => {
    return `${val.toFixed(1)}%`;
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = ["Número", "Cliente", "Vendedor", "Data", "Validade", "Status", "Total", "Desconto"];
    const rows = reportData.detalhes.map((d) => [
      d.numero,
      d.clientName || "N/A",
      d.vendedorName || "N/A",
      d.data,
      d.validade,
      d.status,
      parseFloat(d.total).toFixed(2),
      parseFloat(d.desconto || 0).toFixed(2),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-orcamentos-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (!reportData) return;

    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-orcamentos-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Relatórios de Orçamentos
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Análise detalhada do funil comercial e performance de vendas
              </p>
            </div>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              ✕
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Data Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Vendedor</Label>
              <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.fullName || v.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Cliente</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="gap-2"
              disabled={!reportData}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToJSON}
              className="gap-2"
              disabled={!reportData}
            >
              <FileText className="h-4 w-4" />
              Exportar JSON
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Carregando relatórios...</div>
        ) : reportData ? (
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Total Orçamentos</CardDescription>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {reportData.resumo.totalOrçamentos}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Valor Orçado</CardDescription>
                  <CardTitle className="text-2xl font-bold text-blue-600">
                    {formatCurrency(reportData.resumo.valorTotalOrçado)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Valor Convertido</CardDescription>
                  <CardTitle className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(reportData.resumo.valorConvertido)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Taxa de Conversão</CardDescription>
                  <CardTitle className="text-2xl font-bold text-purple-600">
                    {formatPercent(reportData.resumo.taxaConversão)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Tabs defaultValue="resumo" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="status">Por Status</TabsTrigger>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
                <TabsTrigger value="ranking">Ranking</TabsTrigger>
              </TabsList>

              <TabsContent value="resumo" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Indicadores Chave</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Ticket Médio</p>
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(reportData.resumo.ticketMedio)}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Ticket Médio Convertido</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {formatCurrency(reportData.resumo.ticketMedioConvertido)}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Total em Descontos</p>
                        <p className="text-lg font-bold text-amber-600">
                          {formatCurrency(reportData.resumo.valorDescontos)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Orçamentos por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(reportData.porStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {status}
                            </Badge>
                            <span className="text-sm text-slate-600 capitalize">
                              {status === "editing" && "Em Edição"}
                              {status === "saved" && "Salvo"}
                              {status === "sent" && "Enviado"}
                              {status === "viewed" && "Visualizado"}
                              {status === "negotiating" && "Em Negociação"}
                              {status === "approved" && "Aprovado"}
                              {status === "rejected" && "Recusado"}
                              {status === "expired" && "Expirado"}
                              {status === "converted" && "Convertido"}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="produtos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Produtos Mais Orçados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Produto</th>
                            <th className="py-2 px-3 text-right">Qtd.</th>
                            <th className="py-2 px-3 text-right">Total</th>
                            <th className="py-2 px-3 text-right">Ocorrências</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportData.produtosMaisOrçados.map((prod, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-medium">{prod.descricao}</td>
                              <td className="py-2 px-3 text-right">{prod.quantidade.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(prod.valorTotal)}</td>
                              <td className="py-2 px-3 text-right">{prod.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ranking" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Ranking por Cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportData.porCliente.map((client, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{client.name}</p>
                              <p className="text-xs text-slate-500">{client.count} orçamentos</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-600">{formatCurrency(client.total)}</p>
                              <p className="text-xs text-emerald-600">{client.converted} convertidos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Ranking por Vendedor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportData.porVendedor.map((vendedor, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{vendedor.name}</p>
                              <p className="text-xs text-slate-500">{vendedor.count} orçamentos</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-600">{formatCurrency(vendedor.total)}</p>
                              <p className="text-xs text-emerald-600">{vendedor.converted} convertidos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            Selecione os filtros para gerar o relatório
          </div>
        )}
      </div>
    </div>
  );
}
