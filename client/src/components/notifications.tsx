import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
    Bell,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    CreditCard,
    Wallet
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CashFlowAlert } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Notifications() {
    const { data: alerts, isLoading } = useQuery<CashFlowAlert[]>({
        queryKey: ["/api/cash-flow/alerts"],
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const unreadCount = alerts?.length || 0;

    const getAlertIcon = (type: string) => {
        switch (type) {
            case "negative_balance":
                return <AlertTriangle className="h-4 w-4 text-destructive" />;
            case "overdue_account":
                return <CreditCard className="h-4 w-4 text-orange-500" />;
            case "late_receipt":
                return <Wallet className="h-4 w-4 text-blue-500" />;
            default:
                return <Bell className="h-4 w-4 text-primary" />;
        }
    };

    const getAlertUrl = (alert: CashFlowAlert) => {
        if (alert.type === "overdue_account") return "/contas-pagar";
        if (alert.type === "late_receipt") return "/contas-receber";
        return "/fluxo-caixa";
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-primary/10 transition-colors"
                    data-testid="button-notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground animate-in zoom-in duration-300"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden border-sidebar-border bg-sidebar/95 backdrop-blur shadow-2xl" align="end">
                <div className="p-4 border-b border-sidebar-border/50 bg-sidebar-accent/50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sidebar-foreground flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" />
                            Notificações
                        </h3>
                        {unreadCount > 0 && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0">
                                {unreadCount} Pendentes
                            </Badge>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[350px]">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <Clock className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Buscando alertas...</p>
                        </div>
                    ) : alerts && alerts.length > 0 ? (
                        <div className="divide-y divide-sidebar-border/30">
                            {alerts.map((alert) => (
                                <Link
                                    key={alert.id}
                                    href={getAlertUrl(alert)}
                                    className="block p-4 hover:bg-sidebar-accent/50 transition-colors group"
                                >
                                    <div className="flex gap-3">
                                        <div className={cn(
                                            "mt-1 p-2 rounded-full ring-1 ring-inset",
                                            alert.severity === 'high' ? "bg-destructive/10 ring-destructive/20" : "bg-primary/10 ring-primary/20"
                                        )}>
                                            {getAlertIcon(alert.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={cn(
                                                "text-sm font-medium leading-none group-hover:text-primary transition-colors",
                                                alert.severity === 'high' ? "text-destructive" : "text-sidebar-foreground"
                                            )}>
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[11px] text-muted-foreground">
                                                    {(() => {
                                                        if (!alert.date) return "Data indefinida";
                                                        try {
                                                            const parts = alert.date.split('-');
                                                            if (parts.length !== 3) return alert.date;
                                                            const [year, month, day] = parts.map(Number);
                                                            const dateObj = new Date(year, month - 1, day);
                                                            if (isNaN(dateObj.getTime())) return alert.date;
                                                            return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
                                                        } catch (e) {
                                                            return alert.date;
                                                        }
                                                    })()}
                                                </span>
                                                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-1" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 text-center">
                            <div className="mb-4 flex justify-center text-emerald-500/50">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                            <p className="text-sm font-medium text-sidebar-foreground">Tudo em dia!</p>
                            <p className="text-xs text-muted-foreground mt-1 px-4">
                                Não há pagamentos ou recebimentos atrasados no momento.
                            </p>
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t border-sidebar-border/50 bg-sidebar-accent/30">
                    <Link href="/fluxo-caixa">
                        <Button variant="ghost" className="w-full text-xs gap-2 h-8 text-muted-foreground hover:text-primary">
                            Ver Fluxo de Caixa <TrendingUp className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
