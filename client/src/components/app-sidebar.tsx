import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  TrendingUp,
  FileText,
  BarChart3,
  Building2,
  Users,
  Tags,
  FolderTree,
  RefreshCw,
  UserCog,
  Target,
  ChevronDown,
  ChevronRight,
  Home,
  Settings,
  LogOut,
  Bell,
  Store,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import * as React from "react";

interface NavSubItem {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  description?: string;
  badge?: "urgent" | "new" | string | null;
  adminOnly?: boolean;
  subItems?: NavSubItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        description: "Visão geral das finanças",
      },
      {
        title: "Metas",
        url: "/metas-financeiras",
        icon: Target,
        description: "Acompanhe seus objetivos",
      },
    ],
  },
  {
    label: "Operacional",
    items: [
      {
        title: "Contas a Pagar",
        url: "/contas-pagar",
        icon: CreditCard,
        description: "Gerencie suas despesas",
        badge: "urgent",
      },
      {
        title: "Contas a Receber",
        url: "/contas-receber",
        icon: Wallet,
        description: "Controle seus recebimentos",
      },
      {
        title: "Recebimentos PDR",
        url: "/controle-recebimentos",
        icon: RefreshCw,
        description: "Controle de Cartão e PIX",
      },
      {
        title: "Vendas Varejo",
        url: "/vendas-varejo",
        icon: Store,
        description: "Registre vendas do dia",
        badge: "new",
      },
    ],
  },
  {
    label: "Análise",
    items: [
      {
        title: "Fluxo de Caixa",
        url: "/fluxo-caixa",
        icon: TrendingUp,
        description: "Acompanhe o movimento",
      },
      {
        title: "DRE",
        url: "/dre",
        icon: FileText,
        description: "Demonstrativo de resultados",
      },
      {
        title: "Relatórios",
        url: "/relatorios",
        icon: BarChart3,
        description: "Análises e insights",
        subItems: [
          {
            title: "Relatório de Caixa",
            url: "/relatorios/caixa",
          },
          {
            title: "Relatório de Vendas",
            url: "/relatorios/vendas",
          },
        ],
      },
    ],
  },
  {
    label: "Configurações",
    items: [
      {
        title: "Empresas",
        url: "/empresas",
        icon: Building2,
        description: "Gerencie empresas",
      },
      {
        title: "Cadastros",
        url: "/cadastros",
        icon: Settings,
        description: "Gerencie cadastros",
        subItems: [
          {
            title: "Fornecedores",
            url: "/fornecedores",
          },
          {
            title: "Clientes",
            url: "/clientes",
          },
          {
            title: "Categorias",
            url: "/categorias",
          },
          {
            title: "Centros de Custo",
            url: "/centros-custo",
          },
          {
            title: "Taxas e Máquinas",
            url: "/configuracoes-pagamento",
          },
        ],
      },
      {
        title: "Usuários",
        url: "/usuarios",
        icon: Users,
        adminOnly: true,
      },
    ],
  },
];

// function AppSidebar follows

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isSubItemActive = (subItems?: { url: string }[]) => {
    if (!subItems) return false;
    return subItems.some(item => location === item.url);
  };

  const getBadgeVariant = (badge: string | null) => {
    switch (badge) {
      case 'urgent':
        return 'destructive';
      case 'new':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/90">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50 group-data-[state=collapsed]:p-2">
        <div className="flex items-center gap-3 transition-all duration-300 group-data-[state=collapsed]:justify-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-violet-600 to-indigo-700 shadow-xl shadow-primary/30 ring-1 ring-white/10 transition-all duration-300 hover:shadow-primary/50 hover:scale-105">
            <TrendingUp className="h-6 w-6 text-white transition-transform duration-300 group-data-[state=collapsed]:scale-110 flex-shrink-0" />
          </div>
          <div className="flex flex-col group-data-[state=collapsed]:hidden overflow-hidden transition-all duration-300">
            <span className="text-xl font-black tracking-tight text-sidebar-foreground truncate bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent" data-testid="text-app-name">
              FinControl
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
              Finance Hub
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4 space-y-4 group-data-[state=collapsed]:px-1.5 overflow-x-hidden">
        {navGroups.map((group: NavGroup) => {
          // Filter out adminItems if user is not admin
          const visibleItems: NavItem[] = group.items.filter((item: NavItem) => !item.adminOnly || user?.role === "admin");
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="p-0">
              <SidebarGroupLabel className="px-2 mb-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 uppercase group-data-[state=collapsed]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {visibleItems.map((item: NavItem) => {
                    const isActive = location === item.url || isSubItemActive(item.subItems);
                    const isExpanded = expandedItems.includes(item.title);
                    const hasSubItems = item.subItems && item.subItems.length > 0;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild={!hasSubItems}
                          isActive={isActive}
                          className={cn(
                            "h-10 px-3 rounded-lg transition-all duration-200 relative group/btn",
                            isActive 
                              ? "bg-primary/10 text-primary font-semibold" 
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0"
                          )}
                          onClick={hasSubItems ? () => toggleExpanded(item.title) : undefined}
                        >
                          {hasSubItems ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <item.icon className={cn(
                                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover/btn:scale-110",
                                  isActive ? "text-primary" : "text-muted-foreground group-hover/btn:text-foreground"
                                )} />
                                <span className="truncate text-sm group-data-[state=collapsed]:hidden">{item.title}</span>
                              </div>
                              <ChevronRight className={cn(
                                "h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground/50 group-data-[state=collapsed]:hidden",
                                isExpanded && "rotate-90"
                              )} />
                            </div>
                          ) : (
                            <Link href={item.url} className="flex items-center gap-3 w-full">
                              <item.icon className={cn(
                                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover/btn:scale-110",
                                isActive ? "text-primary" : "text-muted-foreground group-hover/btn:text-foreground"
                                )} />
                              <span className="truncate text-sm group-data-[state=collapsed]:hidden">{item.title}</span>
                              {isActive && (
                                <div className="absolute left-0 w-0.5 h-4 bg-primary rounded-full group-data-[state=collapsed]:left-1" />
                              )}
                              {item.badge && (
                                <div className={cn(
                                  "ml-auto flex h-4 items-center justify-center rounded-full px-1.5 text-[9px] font-bold group-data-[state=collapsed]:hidden",
                                  item.badge === 'urgent' 
                                    ? "bg-destructive text-destructive-foreground animate-pulse" 
                                    : "bg-primary text-primary-foreground"
                                )}>
                                  {item.badge === 'urgent' ? '!' : 'Flux'}
                                </div>
                              )}
                            </Link>
                          )}
                        </SidebarMenuButton>

                        {hasSubItems && isExpanded && (
                          <div className="ml-5 mt-1 border-l border-border/50 pl-4 space-y-1 group-data-[state=collapsed]:hidden">
                            {item.subItems!.map((subItem: NavSubItem) => {
                              const isSubActive = location === subItem.url;
                              return (
                                <Link 
                                  key={subItem.title} 
                                  href={subItem.url}
                                  className={cn(
                                    "flex items-center h-8 text-[13px] rounded-md px-2 transition-all duration-200",
                                    isSubActive 
                                      ? "text-primary font-medium bg-primary/5" 
                                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                                  )}
                                >
                                  {subItem.title}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border/50 bg-muted/20 backdrop-blur-sm group-data-[state=collapsed]:p-2">
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
            className="w-full justify-start gap-3 h-9 px-2 text-muted-foreground hover:text-primary hover:bg-primary/5 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0"
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-medium group-data-[state=collapsed]:hidden">Sincronizar Dados</span>
          </Button>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-background/50 border border-border/50 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-1.5 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-md shadow-primary/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0 group-data-[state=collapsed]:hidden">
              <span className="text-xs font-bold text-foreground truncate leading-none mb-1">
                {user?.fullName || 'Usuário'}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {user?.role || 'Membro'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
