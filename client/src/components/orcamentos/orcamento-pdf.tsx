import React from "react";
import { OrcamentoWithRelations } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface OrcamentoPdfProps {
  orcamento: OrcamentoWithRelations;
  onClose: () => void;
}

export function OrcamentoPdf({ orcamento, onClose }: OrcamentoPdfProps) {
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
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Orçamento #{orcamento.numero}</h1>
            <p className="text-sm text-slate-500 mt-1">Data: {formatDate(orcamento.data)}</p>
            <p className="text-sm text-slate-500">Validade: {formatDate(orcamento.validade)}</p>
            {orcamento.companyName && (
              <p className="text-sm text-slate-500 mt-1">Empresa: {orcamento.companyName}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-blue-700">FinControl Gestão</h2>
            <p className="text-xs text-slate-500">Sistema de Gestão Comercial</p>
            <p className="text-xs text-slate-500 mt-1">Status: <span className="font-semibold uppercase">{orcamento.status}</span></p>
          </div>
        </div>

        {/* Informações de Cliente e Vendedor */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
            <p className="font-semibold text-slate-800 text-base">{orcamento.clientName || "Cliente Geral / Não Informado"}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Atendimento</h3>
            <p className="text-sm text-slate-700"><span className="font-medium text-slate-500">Vendedor:</span> {orcamento.vendedorName || "Sistema"}</p>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="mb-6 overflow-hidden border border-slate-200 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Cód.</th>
                <th className="py-3 px-4">Descrição do Produto/Serviço</th>
                <th className="py-3 px-4 text-center">Un.</th>
                <th className="py-3 px-4 text-right">Qtd.</th>
                <th className="py-3 px-4 text-right">Val. Unit.</th>
                <th className="py-3 px-4 text-right">Desc.</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orcamento.itens && orcamento.itens.length > 0 ? (
                orcamento.itens.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-xs">{item.produtoCodigo || "-"}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{item.produtoDescricao}</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">{item.unidade || "UN"}</td>
                    <td className="py-2.5 px-4 text-right font-medium">{item.quantidade}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(item.valorUnitario)}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {item.descontoValor && parseFloat(item.descontoValor.toString()) > 0
                        ? formatCurrency(item.descontoValor)
                        : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400 italic">Nenhum item adicionado ao orçamento</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumo de Totais */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-xs space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(orcamento.subtotal)}</span>
            </div>
            {orcamento.desconto && parseFloat(orcamento.desconto.toString()) > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Desconto Total:</span>
                <span>- {formatCurrency(orcamento.desconto)}</span>
              </div>
            )}
            {orcamento.frete && parseFloat(orcamento.frete.toString()) > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Frete:</span>
                <span>+ {formatCurrency(orcamento.frete)}</span>
              </div>
            )}
            {orcamento.impostos && parseFloat(orcamento.impostos.toString()) > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Impostos:</span>
                <span>+ {formatCurrency(orcamento.impostos)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-900">
              <span>Total Final:</span>
              <span className="text-blue-700">{formatCurrency(orcamento.total)}</span>
            </div>
          </div>
        </div>

        {/* Condições de Pagamento e Observações */}
        <div className="grid grid-cols-2 gap-6 text-sm border-t border-slate-200 pt-4 mb-12">
          <div>
            <h4 className="font-semibold text-slate-700 mb-1">Condições de Pagamento</h4>
            <p className="text-slate-600 whitespace-pre-line">{orcamento.condicoesPagamento || "A combinar"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-1">Observações</h4>
            <p className="text-slate-600 whitespace-pre-line">{orcamento.observacoes || "Nenhuma observação informada."}</p>
          </div>
        </div>

        {/* Campo de Assinatura */}
        <div className="grid grid-cols-2 gap-12 border-t border-slate-200 pt-8 mt-auto">
          <div className="text-center">
            <div className="border-t border-slate-300 w-3/4 mx-auto mb-2"></div>
            <p className="text-xs text-slate-500 font-medium">Assinatura do Vendedor / Responsável</p>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-300 w-3/4 mx-auto mb-2"></div>
            <p className="text-xs text-slate-500 font-medium">Aceite do Cliente / Assinatura</p>
          </div>
        </div>
      </div>
    </div>
  );
}
