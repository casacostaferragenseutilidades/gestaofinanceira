import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { OrdemServicoWithRelations, OrdemServicoDashboardStats } from "@shared/schema";

import {
  Wrench,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  MoreVertical,
  Printer,
  BarChart3,
  FileText,
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

import { OrdemServicoDialog } from "@/components/ordens-servico/ordem-servico-dialog";
import { OrdemServicoPdf } from "@/components/ordens-servico/ordem-servico-pdf";

export default function OrdensServicoPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrdem, setEditingOrdem] = useState<OrdemServicoWithRelations | null>(null);
  const [pdfOrdem, setPdfOrdem] = useState<OrdemServicoWithRelations | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Verificar se há dados pré-preenchidos do orçamento ao carregar a página
  useEffect(() => {
    const orcamentoData = localStorage.getItem('novaOrdemServicoFromOrcamento');
    if (orcamentoData) {
      setDialogOpen(true);
    }
  }, []);

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
  const { data: stats } = useQuery<OrdemServicoDashboardStats>({
    queryKey: ["/api/ordens-servico/dashboard", selectedCompanyId],
  });

  // Fetch Ordens List
  const { data: ordensList = [], isLoading } = useQuery<OrdemServicoWithRelations[]>({
    queryKey: ["/api/ordens-servico", { status: statusFilter, search, companyId: selectedCompanyId }],
    queryFn: async () => {
      let url = "/api/ordens-servico";
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);
      if (selectedCompanyId && selectedCompanyId !== "all") params.append("companyId", selectedCompanyId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Erro ao carregar ordens de serviço");
      return res.json();
    },
  });

  // Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ordens-servico/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordens-servico/dashboard"] });
      toast({ title: "Ordem de serviço excluída com sucesso." });
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    },
  });

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, descricao }: { id: string; status: string; descricao?: string }) => {
      await apiRequest("PATCH", `/api/ordens-servico/${id}/status`, { status, descricao });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordens-servico/dashboard"] });
      toast({ title: "Status da ordem de serviço atualizado!" });
    },
  });

  const formatCurrency = (val?: number | string | null) => {
    const num = typeof val === "string" ? parseFloat(val) : val ?? 0;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberta":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Aberta</Badge>;
      case "em_andamento":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Em Andamento</Badge>;
      case "aguardando_peca":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Aguardando Peça</Badge>;
      case "aguardando_aprovacao":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Aguardando Aprovação</Badge>;
      case "concluida":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Concluída</Badge>;
      case "cancelada":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelada</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{status}</Badge>;
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "baixa":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Baixa</Badge>;
      case "normal":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Normal</Badge>;
      case "alta":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Alta</Badge>;
      case "urgente":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Urgente</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{prioridade}</Badge>;
    }
  };

  const handleEdit = async (ordem: OrdemServicoWithRelations) => {
    setEditingOrdem(ordem);
    setDialogOpen(true);
  };

  const handleViewPdf = async (ordem: OrdemServicoWithRelations) => {
    setPdfOrdem(ordem);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const handleStatusChange = (ordem: OrdemServicoWithRelations, newStatus: string) => {
    updateStatusMutation.mutate({ id: ordem.id, status: newStatus });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" />
            Ordens de Serviço
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie suas ordens de serviço técnico</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          Nova Ordem
        </Button>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Hoje</div>
            <div className="text-2xl font-bold text-slate-800">{stats.totalHoje}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Em Aberto</div>
            <div className="text-2xl font-bold text-slate-800">{stats.emAberto}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Em Andamento</div>
            <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Aguardando Peça</div>
            <div className="text-2xl font-bold text-amber-600">{stats.aguardandoPeca}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Concluídas</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.concluidas}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Valor Total</div>
            <div className="text-lg font-bold text-slate-800">{formatCurrency(stats.valorTotal)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por número, cliente ou problema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="aberta">Aberta</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
            <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Nº</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Problema</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Prioridade</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Data Abertura</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Valor</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              ) : ordensList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhuma ordem de serviço encontrada
                  </td>
                </tr>
              ) : (
                ordensList.map((ordem) => (
                  <tr key={ordem.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      #{ordem.numero}
                      {ordem.orcamentoNumero && (
                        <span className="text-xs text-slate-500 block">Orç #{ordem.orcamentoNumero}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{ordem.clientName || "N/A"}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {ordem.descricaoProblema}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(ordem.status)}</td>
                    <td className="py-3 px-4">{getPrioridadeBadge(ordem.prioridade)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(ordem.dataAbertura)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{formatCurrency(ordem.valorTotal)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => handleViewPdf(ordem)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => handleEdit(ordem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(ordem, "aberta")}>
                              <Clock className="h-4 w-4 mr-2" /> Aberta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(ordem, "em_andamento")}>
                              <PlayCircle className="h-4 w-4 mr-2" /> Em Andamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(ordem, "aguardando_peca")}>
                              <AlertTriangle className="h-4 w-4 mr-2" /> Aguardando Peça
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(ordem, "aguardando_aprovacao")}>
                              <PauseCircle className="h-4 w-4 mr-2" /> Aguardando Aprovação
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(ordem, "concluida")}>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Concluída
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(ordem.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <OrdemServicoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ordemToEdit={editingOrdem}
      />

      {/* PDF Viewer */}
      {pdfOrdem && (
        <OrdemServicoPdf
          ordem={pdfOrdem}
          onClose={() => setPdfOrdem(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}