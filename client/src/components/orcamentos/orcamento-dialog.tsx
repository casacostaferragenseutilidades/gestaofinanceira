import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Client, OrcamentoWithRelations } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface OrcamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoToEdit?: OrcamentoWithRelations | null;
}

interface FormItem {
  produtoCodigo?: string;
  produtoDescricao: string;
  unidade?: string;
  quantidade: number;
  valorUnitario: number;
  descontoPercentual?: number;
  descontoValor?: number;
  subtotal: number;
}

interface FormData {
  clientId?: string;
  data: string;
  validade: string;
  descontoPercentual: number;
  frete: number;
  impostos: number;
  observacoes?: string;
  condicoesPagamento?: string;
  itens: FormItem[];
}

export function OrcamentoDialog({ open, onOpenChange, orcamentoToEdit }: OrcamentoDialogProps) {
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const defaultDate = new Date().toISOString().split("T")[0];
  const defaultValidade = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      data: defaultDate,
      validade: defaultValidade,
      descontoPercentual: 0,
      frete: 0,
      impostos: 0,
      observacoes: "",
      condicoesPagamento: "À vista / Pix / Cartão em 3x",
      itens: [
        {
          produtoCodigo: "",
          produtoDescricao: "",
          unidade: "UN",
          quantidade: 1,
          valorUnitario: 0,
          descontoPercentual: 0,
          descontoValor: 0,
          subtotal: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  useEffect(() => {
    if (orcamentoToEdit) {
      reset({
        clientId: orcamentoToEdit.clientId || undefined,
        data: orcamentoToEdit.data ? orcamentoToEdit.data.split("T")[0] : defaultDate,
        validade: orcamentoToEdit.validade ? orcamentoToEdit.validade.split("T")[0] : defaultValidade,
        descontoPercentual: parseFloat(orcamentoToEdit.descontoPercentual?.toString() || "0"),
        frete: parseFloat(orcamentoToEdit.frete?.toString() || "0"),
        impostos: parseFloat(orcamentoToEdit.impostos?.toString() || "0"),
        observacoes: orcamentoToEdit.observacoes || "",
        condicoesPagamento: orcamentoToEdit.condicoesPagamento || "",
        itens: orcamentoToEdit.itens && orcamentoToEdit.itens.length > 0
          ? orcamentoToEdit.itens.map((item) => ({
              produtoCodigo: item.produtoCodigo || "",
              produtoDescricao: item.produtoDescricao,
              unidade: item.unidade || "UN",
              quantidade: parseFloat(item.quantidade?.toString() || "1"),
              valorUnitario: parseFloat(item.valorUnitario?.toString() || "0"),
              descontoPercentual: parseFloat(item.descontoPercentual?.toString() || "0"),
              descontoValor: parseFloat(item.descontoValor?.toString() || "0"),
              subtotal: parseFloat(item.subtotal?.toString() || "0"),
            }))
          : [
              {
                produtoCodigo: "",
                produtoDescricao: "",
                unidade: "UN",
                quantidade: 1,
                valorUnitario: 0,
                descontoPercentual: 0,
                descontoValor: 0,
                subtotal: 0,
              },
            ],
      });
    } else {
      reset({
        data: defaultDate,
        validade: defaultValidade,
        descontoPercentual: 0,
        frete: 0,
        impostos: 0,
        observacoes: "",
        condicoesPagamento: "À vista / Pix / Cartão em 3x",
        itens: [
          {
            produtoCodigo: "",
            produtoDescricao: "",
            unidade: "UN",
            quantidade: 1,
            valorUnitario: 0,
            descontoPercentual: 0,
            descontoValor: 0,
            subtotal: 0,
          },
        ],
      });
    }
  }, [orcamentoToEdit, open, reset]);

  const watchedItens = watch("itens");
  const watchedDescontoPct = watch("descontoPercentual") || 0;
  const watchedFrete = watch("frete") || 0;
  const watchedImpostos = watch("impostos") || 0;

  // Calculos automáticos
  const itemsSubtotal = (watchedItens || []).reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0;
    const val = Number(item.valorUnitario) || 0;
    const descPct = Number(item.descontoPercentual) || 0;
    const itemSubtotal = qtd * val * (1 - descPct / 100);
    return acc + itemSubtotal;
  }, 0);

  const descontoTotalGeral = (itemsSubtotal * (Number(watchedDescontoPct) || 0)) / 100;
  const totalGeral = itemsSubtotal - descontoTotalGeral + Number(watchedFrete) + Number(watchedImpostos);

  const requiresApproval = (Number(watchedDescontoPct) || 0) > 10;

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Formata itens com subtotal individual recalculado
      const formattedItens = data.itens.map((item) => {
        const qtd = Number(item.quantidade) || 0;
        const val = Number(item.valorUnitario) || 0;
        const descPct = Number(item.descontoPercentual) || 0;
        const descVal = (qtd * val * descPct) / 100;
        const subtotal = qtd * val - descVal;

        return {
          produtoCodigo: item.produtoCodigo,
          produtoDescricao: item.produtoDescricao,
          unidade: item.unidade || "UN",
          quantidade: qtd,
          valorUnitario: val,
          descontoPercentual: descPct,
          descontoValor: descVal,
          subtotal: subtotal,
        };
      });

      const payload = {
        clientId: data.clientId || null,
        data: data.data,
        validade: data.validade,
        subtotal: itemsSubtotal,
        descontoPercentual: data.descontoPercentual,
        desconto: descontoTotalGeral,
        frete: data.frete,
        impostos: data.impostos,
        total: totalGeral,
        observacoes: data.observacoes,
        condicoesPagamento: data.condicoesPagamento,
        itens: formattedItens,
      };

      if (orcamentoToEdit) {
        return apiRequest("PATCH", `/api/orcamentos/${orcamentoToEdit.id}`, payload);
      } else {
        return apiRequest("POST", "/api/orcamentos", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos/dashboard"] });
      toast({
        title: "Sucesso!",
        description: orcamentoToEdit ? "Orçamento atualizado com sucesso." : "Orçamento criado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar orçamento",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const updateItemCalculations = (index: number) => {
    const item = watchedItens[index];
    if (!item) return;
    const qtd = Number(item.quantidade) || 0;
    const val = Number(item.valorUnitario) || 0;
    const descPct = Number(item.descontoPercentual) || 0;
    const itemSubtotal = qtd * val * (1 - descPct / 100);
    setValue(`itens.${index}.subtotal`, itemSubtotal);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {orcamentoToEdit ? `Editar Orçamento #${orcamentoToEdit.numero}` : "Novo Orçamento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
          {/* Alerta de Desconto */}
          {requiresApproval && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Atenção:</strong> Descontos superiores a 10% entram automaticamente em fluxo de aprovação do Gerente.
              </span>
            </div>
          )}

          {/* Seção Dados Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-semibold text-slate-600">Cliente</Label>
              <Select
                value={watch("clientId") || ""}
                onValueChange={(val) => setValue("clientId", val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Data de Emissão</Label>
              <Input type="date" className="h-9" {...register("data", { required: true })} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Validade</Label>
              <Input type="date" className="h-9" {...register("validade", { required: true })} />
            </div>
          </div>

          {/* Tabela Dinâmica de Produtos/Serviços */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Itens do Orçamento</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() =>
                  append({
                    produtoCodigo: "",
                    produtoDescricao: "",
                    unidade: "UN",
                    quantidade: 1,
                    valorUnitario: 0,
                    descontoPercentual: 0,
                    descontoValor: 0,
                    subtotal: 0,
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Produto
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-24">Código</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 w-16">Un.</th>
                    <th className="py-2.5 px-3 w-20 text-right">Qtd.</th>
                    <th className="py-2.5 px-3 w-28 text-right">Val. Unit.</th>
                    <th className="py-2.5 px-3 w-20 text-right">Desc. %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, index) => {
                    const qtd = watch(`itens.${index}.quantidade`) || 0;
                    const val = watch(`itens.${index}.valorUnitario`) || 0;
                    const descPct = watch(`itens.${index}.descontoPercentual`) || 0;
                    const itemSub = qtd * val * (1 - descPct / 100);

                    return (
                      <tr key={field.id} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <Input
                            className="h-8 text-xs font-mono"
                            placeholder="Cód."
                            {...register(`itens.${index}.produtoCodigo`)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Descrição do produto ou serviço"
                            {...register(`itens.${index}.produtoDescricao`, { required: true })}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8 text-xs text-center"
                            placeholder="UN"
                            {...register(`itens.${index}.unidade`)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="any"
                            className="h-8 text-xs text-right"
                            {...register(`itens.${index}.quantidade`, {
                              valueAsNumber: true,
                              onChange: () => updateItemCalculations(index),
                            })}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-8 text-xs text-right"
                            {...register(`itens.${index}.valorUnitario`, {
                              valueAsNumber: true,
                              onChange: () => updateItemCalculations(index),
                            })}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="any"
                            className="h-8 text-xs text-right"
                            {...register(`itens.${index}.descontoPercentual`, {
                              valueAsNumber: true,
                              onChange: () => updateItemCalculations(index),
                            })}
                          />
                        </td>
                        <td className="p-2 text-right font-bold text-slate-700 self-center">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(itemSub)}
                        </td>
                        <td className="p-2 text-center">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo de Totais e Descontos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Condições de Pagamento</Label>
                <Input className="h-9 text-xs" {...register("condicoesPagamento")} placeholder="Ex: Entrada + 2x no Boleto" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Observações Internas / Cliente</Label>
                <Textarea className="text-xs min-h-[70px]" {...register("observacoes")} placeholder="Observações importantes..." />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Totais e Ajustes</h4>
              
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Subtotal dos Itens:</span>
                <span className="font-semibold text-slate-800">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(itemsSubtotal)}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 text-xs">
                <span className="text-slate-600">Desconto Geral (%):</span>
                <Input
                  type="number"
                  step="0.1"
                  className="h-8 w-24 text-right text-xs"
                  {...register("descontoPercentual", { valueAsNumber: true })}
                />
              </div>

              <div className="flex justify-between items-center gap-2 text-xs">
                <span className="text-slate-600">Frete (R$):</span>
                <Input
                  type="number"
                  step="0.01"
                  className="h-8 w-28 text-right text-xs"
                  {...register("frete", { valueAsNumber: true })}
                />
              </div>

              <div className="flex justify-between items-center gap-2 text-xs">
                <span className="text-slate-600">Impostos / Outros (R$):</span>
                <Input
                  type="number"
                  step="0.01"
                  className="h-8 w-28 text-right text-xs"
                  {...register("impostos", { valueAsNumber: true })}
                />
              </div>

              <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Final:</span>
                <span className="text-blue-700 text-base">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalGeral)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : orcamentoToEdit ? "Salvar Alterações" : "Criar Orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
