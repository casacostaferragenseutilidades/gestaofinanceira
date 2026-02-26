import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Calendar,
  Calculator,
  Receipt,
  Percent,
  Building,
  Users,
  Truck,
  Package,
  Zap,
  Shield,
  PiggyBank,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/utils";
import type { DREData } from "@shared/schema";

interface DREPeriod {
  year: number;
  month: number;
}

interface DREComparison {
  current: DREData;
  previous: DREData;
  percentageChange: {
    grossRevenue: number;
    netProfit: number;
  };
}

interface DRELineItem {
  label: string;
  value: number;
  percentage?: number;
  indent?: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
  items?: DRELineItem[];
  icon?: React.ReactNode;
  description?: string;
  fiscalCode?: string;
}

function DRERow({
  item,
  comparison,
}: {
  item: DRELineItem;
  comparison?: number;
}) {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasChildren = item.items && item.items.length > 0;

  const bgClass = item.isTotal
    ? "bg-gradient-to-r from-slate-50 to-slate-100 border-l-4 border-slate-400"
    : item.isSubtotal
      ? "bg-gradient-to-r from-slate-25 to-slate-50 border-l-4 border-slate-300"
      : "hover:bg-slate-50 transition-colors duration-200";

  const paddingClass = item.indent ? `pl-${(item.indent + 1) * 4}` : "pl-4";

  return (
    <>
      <div
        className={`flex items-center justify-between py-4 px-6 border-b border-slate-200 ${bgClass}`}
        data-testid={`dre-row-${item.label.toLowerCase().replace(/\s/g, "-")}`}
      >
        <div className={`flex items-center gap-3 ${paddingClass} flex-1`}>
          {hasChildren && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-slate-200">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
          {item.icon && (
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
              {item.icon}
            </div>
          )}
          <div className="flex-1">
            <span className={`${item.isTotal || item.isSubtotal ? "font-semibold text-slate-900" : "text-slate-700"}`}>
              {item.label}
            </span>
            {item.description && (
              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
            )}
            {item.fiscalCode && (
              <Badge variant="outline" className="text-xs mt-1">
                {item.fiscalCode}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-8">
          <span
            className={`text-right min-w-[140px] font-semibold ${item.value < 0 ? "text-red-600" : item.value > 0 ? "text-slate-900" : "text-slate-600"
              }`}
          >
            {formatCurrency(Math.abs(item.value))}
            {item.value < 0 && " (-)"}
          </span>
          {item.percentage !== undefined && (
            <span className="text-right min-w-[80px] text-slate-600 font-medium">
              {item.percentage.toFixed(1)}%
            </span>
          )}
          {comparison !== undefined && (
            <span
              className={`text-right min-w-[100px] flex items-center gap-1 font-medium ${comparison >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
            >
              {comparison >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {comparison >= 0 ? "+" : ""}
              {comparison.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      {hasChildren && isOpen && (
        <div className="bg-slate-25/50">
          {item.items!.map((child, index) => (
            <DRERow key={index} item={child} />
          ))}
        </div>
      )}
    </>
  );
}

export default function DRE() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedPeriod, setSelectedPeriod] = React.useState({
    year: currentYear,
    month: currentMonth,
  });
  const [comparisonPeriod, setComparisonPeriod] = React.useState({
    year: currentYear,
    month: currentMonth - 1 || 12,
  });

  const { data: dreData, isLoading } = useQuery<DREComparison>({
    queryKey: ["/api/dre", { year: selectedPeriod.year, month: selectedPeriod.month }],
  });

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const dreItems: DRELineItem[] = dreData
    ? [
      {
        label: "RECEITA BRUTA",
        value: dreData.current.grossRevenue,
        percentage: 100,
        isTotal: true,
        icon: <DollarSign className="h-4 w-4 text-blue-600" />,
        fiscalCode: "Receita Operacional Bruta",
      },
      {
        label: "(-) Deduções da Receita",
        value: -dreData.current.deductions,
        percentage: dreData.current.grossRevenue > 0
          ? (dreData.current.deductions / dreData.current.grossRevenue) * 100
          : 0,
        indent: 1,
        items: [
          {
            label: "PIS",
            value: -dreData.current.pis,
            percentage: dreData.current.grossRevenue > 0
              ? (dreData.current.pis / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            fiscalCode: "PIS - Programa de Integração Social",
          },
          {
            label: "COFINS",
            value: -dreData.current.cofins,
            percentage: dreData.current.grossRevenue > 0
              ? (dreData.current.cofins / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            fiscalCode: "COFINS - Contribuição para Financiamento da Seguridade Social",
          },
          {
            label: "ICMS",
            value: -dreData.current.icms,
            percentage: dreData.current.grossRevenue > 0
              ? (dreData.current.icms / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            fiscalCode: "ICMS - Imposto sobre Circulação de Mercadorias e Serviços",
          },
          {
            label: "ISS",
            value: -dreData.current.iss,
            percentage: dreData.current.grossRevenue > 0
              ? (dreData.current.iss / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            fiscalCode: "ISS - Imposto Sobre Serviços",
          },
          {
            label: "Outras Deduções",
            value: -(dreData.current.deductions - dreData.current.pis - dreData.current.cofins - dreData.current.icms - dreData.current.iss),
            percentage: dreData.current.grossRevenue > 0
              ? ((dreData.current.deductions - dreData.current.pis - dreData.current.cofins - dreData.current.icms - dreData.current.iss) / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            fiscalCode: "Deduções diversas",
          },
        ],
      },
      {
        label: "RECEITA LÍQUIDA",
        value: dreData.current.netRevenue,
        percentage: dreData.current.grossRevenue > 0
          ? (dreData.current.netRevenue / dreData.current.grossRevenue) * 100
          : 0,
        isSubtotal: true,
        icon: <Receipt className="h-4 w-4 text-emerald-600" />,
        fiscalCode: "Receita Operacional Líquida",
      },
      {
        label: "(-) Custo dos Produtos Vendidos (CPV)",
        value: -dreData.current.costs,
        percentage: dreData.current.grossRevenue > 0
          ? (dreData.current.costs / dreData.current.grossRevenue) * 100
          : 0,
        indent: 1,
        icon: <Package className="h-4 w-4 text-orange-600" />,
        description: "Matéria-prima, mão de obra direta, custos de fabricação",
        fiscalCode: "Custo dos Produtos Vendidos",
      },
      {
        label: "LUCRO BRUTO",
        value: dreData.current.grossProfit,
        percentage: dreData.current.grossRevenue > 0
          ? (dreData.current.grossProfit / dreData.current.grossRevenue) * 100
          : 0,
        isSubtotal: true,
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        fiscalCode: "Lucro Bruto Operacional",
      },
      {
        label: "(-) Despesas Operacionais",
        value: -dreData.current.operationalExpenses,
        percentage: dreData.current.grossRevenue > 0
          ? (dreData.current.operationalExpenses / dreData.current.grossRevenue) * 100
          : 0,
        indent: 1,
        items: [
          {
            label: "Despesas Administrativas",
            value: -(dreData.current.operationalExpenses * 0.4),
            percentage: dreData.current.grossRevenue > 0
              ? ((dreData.current.operationalExpenses * 0.4) / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            icon: <Building className="h-4 w-4 text-slate-600" />,
            description: "Salários administrativos, aluguel, contabilidade",
          },
          {
            label: "Despesas de Vendas",
            value: -(dreData.current.operationalExpenses * 0.3),
            percentage: dreData.current.grossRevenue > 0
              ? ((dreData.current.operationalExpenses * 0.3) / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            icon: <Users className="h-4 w-4 text-blue-600" />,
            description: "Comissões, marketing, propaganda",
          },
          {
            label: "Despesas Financeiras",
            value: -(dreData.current.operationalExpenses * 0.2),
            percentage: dreData.current.grossRevenue > 0
              ? ((dreData.current.operationalExpenses * 0.2) / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            icon: <Percent className="h-4 w-4 text-purple-600" />,
            description: "Juros, multas, variações cambiais",
          },
          {
            label: "Outras Despesas Operacionais",
            value: -(dreData.current.operationalExpenses * 0.1),
            percentage: dreData.current.grossRevenue > 0
              ? ((dreData.current.operationalExpenses * 0.1) / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            icon: <Zap className="h-4 w-4 text-amber-600" />,
            description: "Serviços terceiros, materiais, outros",
          },
        ],
      },
      {
        label: "LUCRO OPERACIONAL (EBIT)",
        value: dreData.current.operationalProfit,
        percentage: dreData.current.grossRevenue > 0
          ? (dreData.current.operationalProfit / dreData.current.grossRevenue) * 100
          : 0,
        isSubtotal: true,
        icon: <Calculator className="h-4 w-4 text-indigo-600" />,
        fiscalCode: "Earnings Before Interest and Taxes",
      },
      {
        label: "EBITDA",
        value: dreData.current.ebitda,
        percentage: dreData.current.grossRevenue > 0
          ? (dreData.current.ebitda / dreData.current.grossRevenue) * 100
          : 0,
        isSubtotal: true,
        icon: <Target className="h-4 w-4 text-purple-600" />,
        description: "Lucro antes de juros, impostos, depreciação e amortização",
        fiscalCode: "Earnings Before Interest, Taxes, Depreciation and Amortization",
      },
      {
        label: "(-) Despesas Não Operacionais",
        value: -(dreData.current.irpj + dreData.current.csll + dreData.current.otherTaxes),
        percentage: dreData.current.grossRevenue > 0
          ? ((dreData.current.irpj + dreData.current.csll + dreData.current.otherTaxes) / dreData.current.grossRevenue) * 100
          : 0,
        indent: 1,
        items: [
          {
            label: "IRPJ",
            value: -dreData.current.irpj,
            percentage: dreData.current.grossRevenue > 0
              ? (dreData.current.irpj / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            icon: <Shield className="h-4 w-4 text-red-600" />,
            description: "Imposto de Renda Pessoa Jurídica",
            fiscalCode: "Imposto de Renda - Lucro Real",
          },
          {
            label: "CSLL",
            value: -dreData.current.csll,
            percentage: dreData.current.grossRevenue > 0
              ? (dreData.current.csll / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            icon: <Shield className="h-4 w-4 text-orange-600" />,
            description: "Contribuição Social sobre Lucro Líquido",
            fiscalCode: "Contribuição Social - 9% ou 20%",
          },
          {
            label: "Outros Tributos",
            value: -dreData.current.otherTaxes,
            percentage: dreData.current.grossRevenue > 0
              ? (dreData.current.otherTaxes / dreData.current.grossRevenue) * 100
              : 0,
            indent: 2,
            icon: <Receipt className="h-4 w-4 text-slate-600" />,
            description: "Outros tributos e contribuições",
          },
        ],
      },
      {
        label: "LUCRO LÍQUIDO",
        value: dreData.current.netProfit,
        percentage: dreData.current.grossRevenue > 0
          ? (dreData.current.netProfit / dreData.current.grossRevenue) * 100
          : 0,
        isTotal: true,
        icon: <PiggyBank className="h-4 w-4 text-emerald-700" />,
        fiscalCode: "Lucro Líquido do Exercício",
      },
    ]
    : [];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent" data-testid="text-page-title">
            DRE - Demonstração do Resultado do Exercício
          </h1>
          <p className="text-muted-foreground mt-2">
            Análise financeira conforme legislação fiscal brasileira
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedPeriod.month.toString()}
            onValueChange={(v) =>
              setSelectedPeriod((prev) => ({ ...prev, month: parseInt(v) }))
            }
          >
            <SelectTrigger className="w-[140px] bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300" data-testid="select-month">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedPeriod.year.toString()}
            onValueChange={(v) =>
              setSelectedPeriod((prev) => ({ ...prev, year: parseInt(v) }))
            }
          >
            <SelectTrigger className="w-[100px] bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300" data-testid="select-year">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Receita Bruta
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900" data-testid="text-gross-revenue">
                  {formatCurrency(dreData?.current.grossRevenue || 0)}
                </div>
                {dreData?.percentageChange?.grossRevenue !== undefined && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    {dreData.percentageChange.grossRevenue >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${dreData.percentageChange.grossRevenue >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                        }`}
                    >
                      {dreData.percentageChange.grossRevenue >= 0 ? "+" : ""}
                      {dreData.percentageChange.grossRevenue.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs. mês anterior</span>
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Lucro Bruto
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900" data-testid="text-gross-profit">
                  {formatCurrency(dreData?.current.grossProfit || 0)}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  Margem: {" "}
                  {dreData?.current.grossRevenue
                    ? (
                      (dreData.current.grossProfit / dreData.current.grossRevenue) *
                      100
                    ).toFixed(1)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  EBITDA
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900" data-testid="text-ebitda">
                  {formatCurrency(dreData?.current.ebitda || 0)}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  {dreData?.current.grossRevenue
                    ? (
                      (dreData.current.ebitda / dreData.current.grossRevenue) *
                      100
                    ).toFixed(1)
                    : 0}
                  % da receita
                </p>
              </CardContent>
            </Card>
            <Card
              className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${(dreData?.current.netProfit || 0) >= 0
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100"
                : "bg-gradient-to-br from-red-50 to-red-100"
                }`}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Lucro Líquido
                </CardTitle>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${(dreData?.current.netProfit || 0) >= 0
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-br from-red-500 to-red-600"
                  }`}>
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${(dreData?.current.netProfit || 0) >= 0
                    ? "text-emerald-700"
                    : "text-red-700"
                    }`}
                  data-testid="text-net-profit"
                >
                  {formatCurrency(dreData?.current.netProfit || 0)}
                </div>
                {dreData?.percentageChange?.netProfit !== undefined && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    {dreData.percentageChange.netProfit >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${dreData.percentageChange.netProfit >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                        }`}
                    >
                      {dreData.percentageChange.netProfit >= 0 ? "+" : ""}
                      {dreData.percentageChange.netProfit.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs. mês anterior</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold text-slate-900">Demonstrativo Detalhado - DRE</CardTitle>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span className="font-medium">Valor (R$)</span>
              <span className="font-medium">% Receita</span>
              <span className="font-medium">Variação</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : dreItems.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {dreItems.map((item, index) => (
                <DRERow
                  key={index}
                  item={item}
                  comparison={
                    item.label === "RECEITA BRUTA"
                      ? dreData?.percentageChange?.grossRevenue
                      : item.label === "LUCRO LÍQUIDO"
                        ? dreData?.percentageChange?.netProfit
                        : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Sem dados para o período</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Cadastre receitas e despesas para gerar a Demonstração do Resultado do Exercício
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
