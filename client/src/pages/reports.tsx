import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  BarChart3,
  CreditCard,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  formats: ("pdf" | "excel")[];
}

const reportTypes: ReportType[] = [
  {
    id: "financial",
    title: "Relatório Financeiro Geral",
    description: "Resumo completo das finanças incluindo receitas, despesas e saldos",
    icon: BarChart3,
    formats: ["pdf", "excel"],
  },
  {
    id: "payables",
    title: "Contas a Pagar",
    description: "Lista detalhada de todas as contas a pagar com status e vencimentos",
    icon: CreditCard,
    formats: ["pdf", "excel"],
  },
  {
    id: "receivables",
    title: "Contas a Receber",
    description: "Lista detalhada de todas as contas a receber com status e vencimentos",
    icon: Wallet,
    formats: ["pdf", "excel"],
  },
  {
    id: "dre",
    title: "DRE - Demonstrativo de Resultado",
    description: "Demonstrativo completo do resultado do exercício por período",
    icon: FileText,
    formats: ["pdf", "excel"],
  },
  {
    id: "cashflow",
    title: "Fluxo de Caixa",
    description: "Movimentação detalhada do fluxo de caixa com projeções",
    icon: BarChart3,
    formats: ["pdf", "excel"],
  },
  {
    id: "mercadopago",
    title: "Conciliação Mercado Pago",
    description: "Relatório de conciliação das transações do Mercado Pago",
    icon: RefreshCw,
    formats: ["pdf", "excel"],
  },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

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

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth.toString());
  const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
  const [generatingReport, setGeneratingReport] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async (reportId: string, format: "pdf" | "excel") => {
    setGeneratingReport(`${reportId}-${format}`);

    try {
      const response = await fetch(
        `/api/reports/${reportId}?format=${format}&month=${selectedMonth}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar relatório");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${reportId}-${selectedMonth}-${selectedYear}.${format === "pdf" ? "pdf" : "xlsx"
        }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Relatório gerado",
        description: "O download foi iniciado automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios financeiros detalhados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]" data-testid="select-month">
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
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]" data-testid="select-year">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;

          return (
            <Card key={report.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="flex flex-wrap gap-2">
                  {report.formats.includes("pdf") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport(report.id, "pdf")}
                      disabled={generatingReport === `${report.id}-pdf`}
                      className="gap-2"
                      data-testid={`button-download-${report.id}-pdf`}
                    >
                      <FileText className="h-4 w-4" />
                      {generatingReport === `${report.id}-pdf` ? "Gerando..." : "PDF"}
                    </Button>
                  )}
                  {report.formats.includes("excel") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport(report.id, "excel")}
                      disabled={generatingReport === `${report.id}-excel`}
                      className="gap-2"
                      data-testid={`button-download-${report.id}-excel`}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      {generatingReport === `${report.id}-excel` ? "Gerando..." : "Excel"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emissão Automática</CardTitle>
          <CardDescription>
            Configure a emissão automática de relatórios recorrentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Em breve</p>
            <p className="text-sm text-center max-w-md">
              A funcionalidade de emissão automática de relatórios será disponibilizada em breve.
              Configure para receber relatórios por e-mail periodicamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
