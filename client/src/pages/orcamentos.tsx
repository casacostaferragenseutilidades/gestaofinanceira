import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { OrcamentoWithRelations, OrcamentoDashboardStats } from "@shared/schema";

import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
  Ban,
  FileCheck,
  Send,
  MoreVertical,
  Printer,
  BarChart3,
  MessageCircle,
  Mail,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { OrcamentoDialog } from "@/components/orcamentos/orcamento-dialog";
import { OrcamentoPdf } from "@/components/orcamentos/orcamento-pdf";
import { OrcamentoReports } from "@/components/orcamentos/orcamento-reports";

export default function OrcamentosPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<OrcamentoWithRelations | null>(null);
  const [isLoadingOrcamentoToEdit, setIsLoadingOrcamentoToEdit] = useState(false);
  const [pdfOrcamento, setPdfOrcamento] = useState<OrcamentoWithRelations | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reportsOpen, setReportsOpen] = useState(false);
  
  // Empresa selecionada
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    const stored = localStorage.getItem('empresaAtiva');
    if (stored) {
      try {
        const empresa = JSON.parse(stored);
        return empresa.id || "all";
      } catch (e) {
        return "all";
      }
    }
    return "all";
  });

  // Fetch Dashboard Stats
  const { data: stats } = useQuery<OrcamentoDashboardStats>({
    queryKey: ["/api/orcamentos/dashboard", selectedCompanyId],
  });

  // Fetch Orcamentos List
  const { data: orcamentosList = [], isLoading } = useQuery<OrcamentoWithRelations[]>({
    queryKey: ["/api/orcamentos", { status: statusFilter, search, companyId: selectedCompanyId }],
    queryFn: async () => {
      let url = "/api/orcamentos";
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);
      if (selectedCompanyId && selectedCompanyId !== "all") params.append("companyId", selectedCompanyId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Erro ao carregar orçamentos");
      return res.json();
    },
  });

  const derivedStats = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const totalHoje = orcamentosList.filter((o) => o.data === today).length;
    const valorTotal = orcamentosList.reduce((sum, o) => sum + parseFloat(o.total?.toString() || "0"), 0);
    const aprovados = orcamentosList.filter((o) => o.status === "approved" || o.status === "converted").length;
    const recusados = orcamentosList.filter((o) => o.status === "rejected").length;
    const pendentes = orcamentosList.filter((o) => ["saved", "sent", "viewed", "negotiating"].includes(o.status)).length;
    const convertidos = orcamentosList.filter((o) => o.status === "converted").length;
    const enviados = orcamentosList.filter((o) => ["sent", "viewed", "negotiating", "approved", "rejected", "converted"].includes(o.status)).length;
    const taxaConversao = enviados > 0 ? (convertidos / enviados) * 100 : 0;

    return {
      totalHoje,
      valorTotal,
      aprovados,
      recusados,
      pendentes,
      taxaConversao,
      rankingVendedores: [],
    } as OrcamentoDashboardStats;
  }, [orcamentosList]);

  const displayStats = stats ?? derivedStats;

  // Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/orcamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos/dashboard"] });
      toast({ title: "Orçamento excluído com sucesso." });
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    },
  });

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/orcamentos/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos/dashboard"] });
      toast({ title: "Status do orçamento atualizado!" });
    },
  });

  // Mutation for approving discount
  const approveDiscountMutation = useMutation({
    mutationFn: async ({ id, aprovado }: { id: string; aprovado: boolean }) => {
      await apiRequest("PATCH", `/api/orcamentos/${id}/approve-discount`, { aprovado });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos/dashboard"] });
      toast({ title: "Aprovação de desconto atualizada!" });
    },
  });

  // Mutation for converting to sale / receivable
  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/orcamentos/${id}/convert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      toast({
        title: "Orçamento convertido em Venda!",
        description: "Lançamento de Contas a Receber gerado com sucesso.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Erro na conversão", description: err.message, variant: "destructive" });
    },
  });

  const loadOrcamentoForEdit = async (id: string) => {
    setEditingOrcamento(null);
    setIsLoadingOrcamentoToEdit(true);
    try {
      const res = await apiRequest("GET", `/api/orcamentos/${id}`);
      const data = await res.json();
      setEditingOrcamento(data);
      setDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar orçamento",
        description: error?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrcamentoToEdit(false);
    }
  };

  const formatCurrency = (val?: number | string | null) => {
    const num = typeof val === "string" ? parseFloat(val) : val ?? 0;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const shareViaWhatsApp = (orcamento: OrcamentoWithRelations) => {
    const message = `*Orçamento #${orcamento.numero}*\n\n` +
      `Cliente: ${orcamento.clientName || "N/A"}\n` +
      `Data: ${formatDate(orcamento.data)}\n` +
      `Validade: ${formatDate(orcamento.validade)}\n` +
      `Total: ${formatCurrency(orcamento.total)}\n\n` +
      `Status: ${orcamento.status}\n\n` +
      `Condições: ${orcamento.condicoesPagamento || "A combinar"}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareViaEmail = (orcamento: OrcamentoWithRelations) => {
    const subject = `Orçamento #${orcamento.numero} - ${orcamento.clientName || "Cliente"}`;
    const body = `Olá,\n\nSegue o orçamento #${orcamento.numero}:\n\n` +
      `Cliente: ${orcamento.clientName || "N/A"}\n` +
      `Data: ${formatDate(orcamento.data)}\n` +
      `Validade: ${formatDate(orcamento.validade)}\n` +
      `Total: ${formatCurrency(orcamento.total)}\n\n` +
      `Status: ${orcamento.status}\n\n` +
      `Condições: ${orcamento.condicoesPagamento || "A combinar"}\n\n` +
      `Atenciosamente.`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const createOrdemServicoFromOrcamento = (orcamento: OrcamentoWithRelations) => {
    // Abrir página de ordens de serviço com parâmetros pré-preenchidos
    const params = new URLSearchParams();
    params.append('orcamentoId', orcamento.id);
    params.append('orcamentoNumero', orcamento.numero.toString());
    params.append('clientId', orcamento.clientId || '');
    params.append('valorTotal', orcamento.total.toString());
    
    // Armazenar no localStorage para ser usado no dialog
    localStorage.setItem('novaOrdemServicoFromOrcamento', JSON.stringify({
      orcamentoId: orcamento.id,
      orcamentoNumero: orcamento.numero,
      clientId: orcamento.clientId,
      descricaoProblema: `Baseado no orçamento #${orcamento.numero}`,
      itens: orcamento.itens?.map(item => ({
        produtoCodigo: item.produtoCodigo,
        produtoDescricao: item.produtoDescricao,
        unidade: item.unidade,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        descontoPercentual: item.descontoPercentual,
        descontoValor: item.descontoValor,
        subtotal: item.subtotal,
        tipo: 'servico', // Converter itens para serviço por padrão
      })) || []
    }));
    
    // Navegar para a página de ordens de serviço
    window.location.href = '/ordens-servico';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: string, descontoPercentual?: string | number, descontoAprovado?: boolean) => {
    const descPct = typeof descontoPercentual === "string" ? parseFloat(descontoPercentual) : descontoPercentual || 0;

    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Recusado</Badge>;
      case "expired":
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Expirado</Badge>;
      case "converted":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Convertido em Venda</Badge>;
      case "negotiating":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Em Negociação</Badge>;
      case "sent":
        return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">Enviado</Badge>;
      default:
        if (descPct > 10 && !descontoAprovado) {
          return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Aguardando Gerente</Badge>;
        }
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Em Edição</Badge>;
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            Gestão de Orçamentos
          </h1>
          <p className="text-sm text-slate-500">
            Crie, aprove e converta orçamentos em vendas rapidamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setReportsOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </Button>
          <Button
            onClick={() => {
              setEditingOrcamento(null);
              setDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* KPI Cards / Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Do Dia</span>
          <p className="text-xl font-bold text-slate-900">{displayStats.totalHoje || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor Orçado</span>
          <p className="text-lg font-bold text-blue-700">{formatCurrency(displayStats.valorTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aprovados</span>
          <p className="text-xl font-bold text-emerald-600">{displayStats.aprovados || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recusados</span>
          <p className="text-xl font-bold text-red-600">{displayStats.recusados || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendentes</span>
          <p className="text-xl font-bold text-amber-600">{displayStats.pendentes || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversão</span>
          <p className="text-xl font-bold text-purple-600">{displayStats.taxaConversao?.toFixed(1) || 0}%</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid gap-4 lg:grid-cols-[1fr_auto] items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-48 text-sm">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="saved">Em Edição</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="negotiating">Em Negociação</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Recusados</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
              <SelectItem value="converted">Convertidos em Venda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-[0.08em]">
              <tr>
                <th className="py-4 px-5 w-20">Nº</th>
                <th className="py-4 px-5">Cliente</th>
                <th className="py-4 px-5">Emissão</th>
                <th className="py-4 px-5">Validade</th>
                <th className="py-4 px-5 text-right">Total</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Carregando orçamentos...
                  </td>
                </tr>
              ) : orcamentosList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              ) : (
                orcamentosList.map((orcamento) => {
                  const isManagerOrAdmin = user?.role === "admin" || user?.role === "financial";
                  const needsManagerApproval =
                    parseFloat(orcamento.descontoPercentual?.toString() || "0") > 10 && !orcamento.descontoAprovado;

                  return (
                    <tr key={orcamento.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-5 font-mono font-semibold text-slate-900">
                        #{orcamento.numero}
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-800">
                        {orcamento.clientName || "Cliente Geral"}
                      </td>
                      <td className="py-4 px-5 text-slate-600">{formatDate(orcamento.data)}</td>
                      <td className="py-4 px-5 text-slate-600">{formatDate(orcamento.validade)}</td>
                      <td className="py-4 px-5 text-right font-bold text-slate-900">
                        {formatCurrency(orcamento.total)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        {getStatusBadge(orcamento.status, orcamento.descontoPercentual, orcamento.descontoAprovado)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Visualizar / Imprimir PDF"
                            onClick={() => setPdfOrcamento(orcamento)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              <DropdownMenuLabel>Ações do Orçamento</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => loadOrcamentoForEdit(orcamento.id)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                Editar
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => shareViaWhatsApp(orcamento)}
                                className="text-green-600"
                              >
                                <MessageCircle className="h-3.5 w-3.5 mr-2" />
                                Compartilhar no WhatsApp
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => shareViaEmail(orcamento)}
                                className="text-blue-600"
                              >
                                <Mail className="h-3.5 w-3.5 mr-2" />
                                Enviar por E-mail
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => createOrdemServicoFromOrcamento(orcamento)}
                                className="text-purple-600 font-semibold"
                              >
                                <Wrench className="h-3.5 w-3.5 mr-2" />
                                Criar Ordem de Serviço
                              </DropdownMenuItem>

                              {/* Aprovação do Gerente caso o desconto seja > 10% */}
                              {needsManagerApproval && isManagerOrAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      approveDiscountMutation.mutate({ id: orcamento.id, aprovado: true })
                                    }
                                    className="text-emerald-600 font-semibold"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-2" />
                                    Aprovar Desconto Gerente
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Mudar Status */}
                              <DropdownMenuSeparator />
                              {orcamento.status !== "approved" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: orcamento.id, status: "approved" })
                                  }
                                  className="text-emerald-600"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                  Marcar como Aprovado
                                </DropdownMenuItem>
                              )}

                              {orcamento.status !== "rejected" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: orcamento.id, status: "rejected" })
                                  }
                                  className="text-red-600"
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-2" />
                                  Marcar como Recusado
                                </DropdownMenuItem>
                              )}

                              {/* Converter em Venda */}
                              {orcamento.status === "approved" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => convertMutation.mutate(orcamento.id)}
                                    className="text-blue-600 font-bold"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                                    Converter em Venda
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingId(orcamento.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <OrcamentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orcamentoToEdit={editingOrcamento}
      />

      {/* Modal de PDF / Impressão */}
      {pdfOrcamento && (
        <OrcamentoPdf
          orcamento={pdfOrcamento}
          onClose={() => setPdfOrcamento(null)}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O orçamento será permanentemente desativado do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Relatórios */}
      <OrcamentoReports open={reportsOpen} onOpenChange={setReportsOpen} />
    </div>
  );
}
