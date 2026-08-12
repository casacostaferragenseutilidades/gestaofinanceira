import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Client, OrdemServicoWithRelations } from "@shared/schema";

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

interface OrdemServicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordemToEdit?: OrdemServicoWithRelations | null;
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
  tipo: string;
}

interface FormData {
  orcamentoId?: string;
  clientId?: string;
  dataAbertura: string;
  dataPrevistaConclusao?: string;
  prioridade: string;
  status: string;
  descricaoProblema: string;
  diagnostico?: string;
  solucao?: string;
  observacoes?: string;
  valorMaoObra: number;
  valorPecas: number;
  itens: FormItem[];
}

export function OrdemServicoDialog({ open, onOpenChange, ordemToEdit }: OrdemServicoDialogProps) {
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const defaultDate = new Date().toISOString().split("T")[0];
  const defaultPrevista = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      dataAbertura: defaultDate,
      dataPrevistaConclusao: defaultPrevista,
      prioridade: "normal",
      status: "aberta",
      descricaoProblema: "",
      diagnostico: "",
      solucao: "",
      observacoes: "",
      valorMaoObra: 0,
      valorPecas: 0,
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
          tipo: "servico",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  useEffect(() => {
    if (ordemToEdit) {
      reset({
        orcamentoId: ordemToEdit.orcamentoId || undefined,
        clientId: ordemToEdit.clientId || undefined,
        dataAbertura: ordemToEdit.dataAbertura ? ordemToEdit.dataAbertura.split("T")[0] : defaultDate,
        dataPrevistaConclusao: ordemToEdit.dataPrevistaConclusao ? ordemToEdit.dataPrevistaConclusao.split("T")[0] : defaultPrevista,
        prioridade: ordemToEdit.prioridade || "normal",
        status: ordemToEdit.status || "aberta",
        descricaoProblema: ordemToEdit.descricaoProblema || "",
        diagnostico: ordemToEdit.diagnostico || "",
        solucao: ordemToEdit.solucao || "",
        observacoes: ordemToEdit.observacoes || "",
        valorMaoObra: parseFloat(ordemToEdit.valorMaoObra?.toString() || "0"),
        valorPecas: parseFloat(ordemToEdit.valorPecas?.toString() || "0"),
        itens: ordemToEdit.itens && ordemToEdit.itens.length > 0
          ? ordemToEdit.itens.map((item) => ({
              produtoCodigo: item.produtoCodigo || "",
              produtoDescricao: item.produtoDescricao,
              unidade: item.unidade || "UN",
              quantidade: parseFloat(item.quantidade?.toString() || "1"),
              valorUnitario: parseFloat(item.valorUnitario?.toString() || "0"),
              descontoPercentual: parseFloat(item.descontoPercentual?.toString() || "0"),
              descontoValor: parseFloat(item.descontoValor?.toString() || "0"),
              subtotal: parseFloat(item.subtotal?.toString() || "0"),
              tipo: item.tipo || "servico",
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
                tipo: "servico",
              },
            ],
      });
    } else {
      // Verificar se há dados pré-preenchidos do orçamento
      const orcamentoData = localStorage.getItem('novaOrdemServicoFromOrcamento');
      if (orcamentoData) {
        try {
          const data = JSON.parse(orcamentoData);
          reset({
            orcamentoId: data.orcamentoId || undefined,
            clientId: data.clientId || undefined,
            dataAbertura: defaultDate,
            dataPrevistaConclusao: defaultPrevista,
            prioridade: "normal",
            status: "aberta",
            descricaoProblema: data.descricaoProblema || "",
            diagnostico: "",
            solucao: "",
            observacoes: "",
            valorMaoObra: 0,
            valorPecas: 0,
            itens: data.itens && data.itens.length > 0
              ? data.itens.map((item: any) => ({
                  produtoCodigo: item.produtoCodigo || "",
                  produtoDescricao: item.produtoDescricao,
                  unidade: item.unidade || "UN",
                  quantidade: parseFloat(item.quantidade?.toString() || "1"),
                  valorUnitario: parseFloat(item.valorUnitario?.toString() || "0"),
                  descontoPercentual: parseFloat(item.descontoPercentual?.toString() || "0"),
                  descontoValor: parseFloat(item.descontoValor?.toString() || "0"),
                  subtotal: parseFloat(item.subtotal?.toString() || "0"),
                  tipo: item.tipo || "servico",
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
                    tipo: "servico",
                  },
                ],
          });
          // Limpar os dados pré-preenchidos após usar
          localStorage.removeItem('novaOrdemServicoFromOrcamento');
        } catch (e) {
          console.error('Erro ao carregar dados do orçamento:', e);
          reset({
            dataAbertura: defaultDate,
            dataPrevistaConclusao: defaultPrevista,
            prioridade: "normal",
            status: "aberta",
            descricaoProblema: "",
            diagnostico: "",
            solucao: "",
            observacoes: "",
            valorMaoObra: 0,
            valorPecas: 0,
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
                tipo: "servico",
              },
            ],
          });
        }
      } else {
        reset({
          dataAbertura: defaultDate,
          dataPrevistaConclusao: defaultPrevista,
          prioridade: "normal",
          status: "aberta",
          descricaoProblema: "",
          diagnostico: "",
          solucao: "",
          observacoes: "",
          valorMaoObra: 0,
          valorPecas: 0,
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
              tipo: "servico",
            },
          ],
        });
      }
    }
  }, [ordemToEdit, open, reset]);

  const watchedItens = watch("itens");
  const watchedValorMaoObra = watch("valorMaoObra") || 0;
  const watchedValorPecas = watch("valorPecas") || 0;

  // Calculos automáticos
  const itensSubtotal = (watchedItens || []).reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0;
    const val = Number(item.valorUnitario) || 0;
    const descPct = Number(item.descontoPercentual) || 0;
    const itemSubtotal = qtd * val * (1 - descPct / 100);
    return acc + itemSubtotal;
  }, 0);

  const totalGeral = itensSubtotal + Number(watchedValorMaoObra) + Number(watchedValorPecas);

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
          tipo: item.tipo || "servico",
        };
      });

      const payload = {
        orcamentoId: data.orcamentoId || null,
        clientId: data.clientId || null,
        dataAbertura: data.dataAbertura,
        dataPrevistaConclusao: data.dataPrevistaConclusao,
        prioridade: data.prioridade,
        status: data.status,
        descricaoProblema: data.descricaoProblema,
        diagnostico: data.diagnostico,
        solucao: data.solucao,
        observacoes: data.observacoes,
        valorMaoObra: data.valorMaoObra,
        valorPecas: data.valorPecas,
        valorTotal: totalGeral,
        itens: formattedItens,
      };

      if (ordemToEdit) {
        return apiRequest("PATCH", `/api/ordens-servico/${ordemToEdit.id}`, payload);
      } else {
        return apiRequest("POST", "/api/ordens-servico", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordens-servico/dashboard"] });
      toast({
        title: "Sucesso!",
        description: ordemToEdit ? "Ordem de serviço atualizada com sucesso." : "Ordem de serviço criada com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar ordem de serviço",
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
            {ordemToEdit ? `Editar Ordem de Serviço #${ordemToEdit.numero}` : "Nova Ordem de Serviço"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
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
              <Label className="text-xs font-semibold text-slate-600">Data de Abertura</Label>
              <Input type="date" className="h-9" {...register("dataAbertura", { required: true })} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Previsão de Conclusão</Label>
              <Input type="date" className="h-9" {...register("dataPrevistaConclusao")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Prioridade</Label>
              <Select
                value={watch("prioridade")}
                onValueChange={(val) => setValue("prioridade", val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(val) => setValue("status", val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                  <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição do Problema */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Descrição do Problema</Label>
            <Textarea
              placeholder="Descreva o problema relatado pelo cliente..."
              className="min-h-[80px]"
              {...register("descricaoProblema", { required: true })}
            />
          </div>

          {/* Diagnóstico e Solução */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Diagnóstico</Label>
              <Textarea
                placeholder="Diagnóstico técnico..."
                className="min-h-[80px]"
                {...register("diagnostico")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Solução</Label>
              <Textarea
                placeholder="Solução aplicada..."
                className="min-h-[80px]"
                {...register("solucao")}
              />
            </div>
          </div>

          {/* Tabela Dinâmica de Itens */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Itens da Ordem de Serviço</h3>
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
                    tipo: "servico",
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-24">Código</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 w-20">Tipo</th>
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
                            placeholder="Descrição do item"
                            {...register(`itens.${index}.produtoDescricao`, { required: true })}
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={watch(`itens.${index}.tipo`)}
                            onValueChange={(val) => setValue(`itens.${index}.tipo`, val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="servico">Serviço</SelectItem>
                              <SelectItem value="peca">Peça</SelectItem>
                              <SelectItem value="acessorio">Acessório</SelectItem>
                            </SelectContent>
                          </Select>
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

          {/* Valores Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Valor Mão de Obra</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9"
                {...register("valorMaoObra", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Valor Peças</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9"
                {...register("valorPecas", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Observações</Label>
            <Textarea
              placeholder="Observações adicionais..."
              className="min-h-[60px]"
              {...register("observacoes")}
            />
          </div>

          {/* Resumo Total */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Subtotal Itens:</span>
              <span className="font-medium text-slate-800">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(itensSubtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-600">Mão de Obra:</span>
              <span className="font-medium text-slate-800">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(watchedValorMaoObra)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-600">Peças:</span>
              <span className="font-medium text-slate-800">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(watchedValorPecas)}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-slate-300">
              <span className="text-slate-800">Total:</span>
              <span className="text-blue-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalGeral)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {ordemToEdit ? "Atualizar" : "Criar"} Ordem de Serviço
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}