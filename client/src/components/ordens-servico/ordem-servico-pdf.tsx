import React from "react";
import { OrdemServicoWithRelations } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface OrdemServicoPdfProps {
  ordem: OrdemServicoWithRelations;
  onClose: () => void;
}

export function OrdemServicoPdf({ ordem, onClose }: OrdemServicoPdfProps) {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (val?: number | string | null) => {
    const num = typeof val === "string" ? parseFloat(val) : val ?? 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      aberta: "Aberta",
      em_andamento: "Em Andamento",
      aguardando_peca: "Aguardando Peça",
      aguardando_aprovacao: "Aguardando Aprovação",
      concluida: "Concluída",
      cancelada: "Cancelada",
    };
    return statusMap[status] || status;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeMap: Record<string, string> = {
      baixa: "Baixa",
      normal: "Normal",
      alta: "Alta",
      urgente: "Urgente",
    };
    return prioridadeMap[prioridade] || prioridade;
  };

  const getTipoBadge = (tipo: string) => {
    const tipoMap: Record<string, string> = {
      servico: "Serviço",
      peca: "Peça",
      acessorio: "Acessório",
    };
    return tipoMap[tipo] || tipo;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Botões de Ação Fixos no Topo da Modal */}
      <div className="fixed top-4 right-4 flex items-center gap-2 print:hidden z-50">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg">
          <Printer className="h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
        <Button onClick={onClose} variant="secondary" className="gap-2 shadow-lg">
          <X className="h-4 w-4" />
          Fechar
        </Button>
      </div>

      {/* Conteúdo Imprimível do Documento */}
      <div className="bg-white text-slate-800 w-full max-w-4xl p-8 sm:p-12 rounded-xl shadow-2xl my-auto print:shadow-none print:m-0 print:p-0 print:w-full print:max-w-none">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Ordem de Serviço #{ordem.numero}</h1>
            <p className="text-sm text-slate-500 mt-1">Data de Abertura: {formatDate(ordem.dataAbertura)}</p>
            <p className="text-sm text-slate-500">Previsão de Conclusão: {formatDate(ordem.dataPrevistaConclusao)}</p>
            {ordem.dataConclusao && (
              <p className="text-sm text-slate-500">Data de Conclusão: {formatDate(ordem.dataConclusao)}</p>
            )}
            {ordem.companyName && (
              <p className="text-sm text-slate-500 mt-1">Empresa: {ordem.companyName}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-blue-700">FinControl Gestão</h2>
            <p className="text-xs text-slate-500">Sistema de Gestão de Serviços</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500">Status: <span className="font-semibold uppercase">{getStatusBadge(ordem.status)}</span></p>
              <p className="text-xs text-slate-500">Prioridade: <span className="font-semibold uppercase">{getPrioridadeBadge(ordem.prioridade)}</span></p>
            </div>
          </div>
        </div>

        {/* Informações de Cliente e Técnico */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
            <p className="font-semibold text-slate-800 text-base">{ordem.clientName || "Cliente Geral / Não Informado"}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Atendimento</h3>
            <p className="text-sm text-slate-700"><span className="font-medium text-slate-500">Técnico:</span> {ordem.vendedorName || "Sistema"}</p>
          </div>
        </div>

        {/* Vinculação com Orçamento */}
        {ordem.orcamentoNumero && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Vinculado ao Orçamento:</span> #{ordem.orcamentoNumero}
            </p>
          </div>
        )}

        {/* Descrição do Problema */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Descrição do Problema</h3>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700">{ordem.descricaoProblema || "Não informado"}</p>
          </div>
        </div>

        {/* Diagnóstico e Solução */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Diagnóstico</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">{ordem.diagnostico || "Não informado"}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Solução</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">{ordem.solucao || "Não informado"}</p>
            </div>
          </div>
        </div>

        {/* Tabela de Itens */}
        <div className="mb-6 overflow-hidden border border-slate-200 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Código</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Descrição</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right">Qtd</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right">Valor Unit.</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right">Desc. %</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordem.itens && ordem.itens.length > 0 ? (
                ordem.itens.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{item.produtoCodigo || "-"}</td>
                    <td className="py-3 px-4 text-slate-800">{item.produtoDescricao}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                        {getTipoBadge(item.tipo)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{item.quantidade}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(item.valorUnitario)}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{item.descontoPercentual || 0}%</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum item adicionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumo de Valores */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal Itens:</span>
              <span className="font-medium text-slate-800">
                {formatCurrency(ordem.itens?.reduce((sum, item) => sum + parseFloat(item.subtotal?.toString() || "0"), 0) || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Mão de Obra:</span>
              <span className="font-medium text-slate-800">{formatCurrency(ordem.valorMaoObra)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Peças:</span>
              <span className="font-medium text-slate-800">{formatCurrency(ordem.valorPecas)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300 mt-2">
              <span className="text-slate-800">Total:</span>
              <span className="text-blue-600">{formatCurrency(ordem.valorTotal)}</span>
            </div>
          </div>
        </div>

        {/* Observações */}
        {ordem.observacoes && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Observações</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">{ordem.observacoes}</p>
            </div>
          </div>
        )}

        {/* Histórico */}
        {ordem.historico && ordem.historico.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Histórico de Alterações</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-2">
                {ordem.historico.map((hist, index) => (
                  <div key={index} className="text-xs text-slate-600 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium">{formatDate(hist.dataHora)}</span>
                    <span className="ml-2 text-slate-800">{hist.acao}</span>
                    {hist.descricao && <span className="ml-2 text-slate-500">- {hist.descricao}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>Documento gerado automaticamente pelo sistema FinControl Gestão</p>
          <p className="mt-1">Data de emissão: {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}