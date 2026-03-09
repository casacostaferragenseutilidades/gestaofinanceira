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

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Visão geral das finanças",
    badge: null,
  },
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
    badge: null,
  },
  {
    title: "Recebimentos PDR",
    url: "/controle-recebimentos",
    icon: CreditCard,
    description: "Controle de Cartão e PIX",
    badge: null,
  },
  {
    title: "Vendas Varejo",
    url: "/vendas-varejo",
    icon: Store,
    description: "Registre vendas do dia",
    badge: "new",
  },
  {
    title: "Fluxo de Caixa",
    url: "/fluxo-caixa",
    icon: TrendingUp,
    description: "Acompanhe o movimento",
    badge: null,
  },
  {
    title: "DRE",
    url: "/dre",
    icon: FileText,
    description: "Demonstrativo de resultados",
    badge: null,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
    description: "Análises e insights",
    badge: "new",
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
  {
    title: "Metas",
    url: "/metas-financeiras",
    icon: Target,
    description: "Acompanhe seus objetivos",
    badge: null,
  },
];

const settingsNavItems = [
  {
    title: "Empresas",
    url: "/empresas",
    icon: Building2,
    description: "Gerencie empresas",
    badge: null,
  },
  {
    title: "Cadastros",
    url: "/cadastros",
    icon: Settings,
    description: "Gerencie cadastros",
    badge: null,
    subItems: [
      {
        title: "Fornecedores",
        url: "/fornecedores",
        icon: Building2,
      },
      {
        title: "Clientes",
        url: "/clientes",
        icon: Users,
      },
      {
        title: "Categorias",
        url: "/categorias",
        icon: Tags,
      },
      {
        title: "Centros de Custo",
        url: "/centros-custo",
        icon: FolderTree,
      },
      {
        title: "Taxas e Máquinas",
        url: "/configuracoes-pagamento",
        icon: Settings,
      },
    ],
  },
];

const adminNavItems = [
  {
    title: "Usuários",
    url: "/usuarios",
    icon: UserCog,
    adminOnly: true,
  },
];

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
      <SidebarContent className="px-2 py-1 group-data-[state=collapsed]:px-1 group-data-[state=collapsed]:py-0.5">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70 tracking-wider uppercase">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 group-data-[state=collapsed]:space-y-0">
              {mainNavItems.map((item) => {
                const isActive = location === item.url || isSubItemActive(item.subItems);
                const isExpanded = expandedItems.includes(item.title);
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={!hasSubItems}
                      isActive={isActive}
                      className={cn(
                        "h-11 px-2 rounded-xl transition-all duration-300 hover:bg-sidebar-accent group",
                        isActive && "bg-sidebar-accent shadow-md shadow-primary/5 ring-1 ring-primary/10",
                        "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-11 group-data-[state=collapsed]:h-11"
                      )}
                      onClick={hasSubItems ? () => toggleExpanded(item.title) : undefined}
                    >
                      {hasSubItems ? (
                        <div className="flex items-center justify-between w-full group-data-[state=collapsed]:justify-center">
                          <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                            <item.icon className={cn(
                              "h-5 w-5 transition-colors flex-shrink-0",
                              isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                            )} />
                            <span className={cn(
                              "truncate font-medium group-data-[state=collapsed]:hidden",
                              isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                            )}>{item.title}</span>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform duration-200 text-sidebar-foreground/60 group-data-[state=collapsed]:hidden flex-shrink-0",
                            isExpanded && "rotate-90"
                          )} />
                        </div>
                      ) : (
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`} className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                          <item.icon className={cn(
                            "h-5 w-5 transition-colors flex-shrink-0",
                            isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                          )} />
                          <span className={cn(
                            "truncate font-medium transition-colors group-data-[state=collapsed]:hidden",
                            isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                          )}>{item.title}</span>
                          {item.badge && (
                            <Badge variant={getBadgeVariant(item.badge)} className="ml-auto text-[10px] font-bold px-1.5 py-0.5 group-data-[state=collapsed]:hidden flex-shrink-0 rounded-full">
                              {item.badge === 'urgent' ? '!' : item.badge === 'new' ? 'Flux' : ''}
                            </Badge>
                          )}
                        </Link>
                      )}
                    </SidebarMenuButton>

                    {hasSubItems && isExpanded && (
                      <SidebarMenuSub className="ml-6 mt-1 space-y-0.5 group-data-[state=collapsed]:hidden">
                        {item.subItems!.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className="h-8 px-2 rounded-md transition-all duration-200 hover:bg-sidebar-accent/30 text-sm"
                              >
                                <Link href={subItem.url}>
                                  <span className="truncate">{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-1 bg-sidebar-border/50 group-data-[state=collapsed]:my-0.5" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-4 text-[10px] font-black text-muted-foreground/50 tracking-[0.2em] uppercase">
            Cadastros
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 group-data-[state=collapsed]:space-y-0">
              {settingsNavItems.map((item) => {
                const isActive = location === item.url || isSubItemActive(item.subItems);
                const isExpanded = expandedItems.includes(item.title);
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={!hasSubItems}
                      isActive={isActive}
                      className={cn(
                        "h-11 px-2 rounded-xl transition-all duration-300 hover:bg-sidebar-accent group",
                        isActive && "bg-sidebar-accent shadow-md shadow-primary/5 ring-1 ring-primary/10",
                        "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-11 group-data-[state=collapsed]:h-11"
                      )}
                      onClick={hasSubItems ? () => toggleExpanded(item.title) : undefined}
                    >
                      {hasSubItems ? (
                        <div className="flex items-center justify-between w-full group-data-[state=collapsed]:justify-center">
                          <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                            <item.icon className={cn(
                              "h-5 w-5 transition-colors flex-shrink-0",
                              isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                            )} />
                            <span className={cn(
                              "truncate font-medium group-data-[state=collapsed]:hidden",
                              isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                            )}>{item.title}</span>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform duration-200 text-sidebar-foreground/60 group-data-[state=collapsed]:hidden flex-shrink-0",
                            isExpanded && "rotate-90"
                          )} />
                        </div>
                      ) : (
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`} className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                          <item.icon className={cn(
                            "h-5 w-5 transition-colors flex-shrink-0",
                            isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                          )} />
                          <span className={cn(
                            "truncate font-medium transition-colors group-data-[state=collapsed]:hidden",
                            isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                          )}>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>

                    {hasSubItems && isExpanded && (
                      <SidebarMenuSub className="ml-8 mt-1 space-y-1 border-l-2 border-primary/10 pl-2 group-data-[state=collapsed]:hidden">
                        {item.subItems!.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className={cn(
                                  "h-9 px-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/50 text-sm font-medium",
                                  isSubActive ? "text-primary bg-primary/5" : "text-sidebar-foreground/60"
                                )}
                              >
                                <Link href={subItem.url}>
                                  <span className="truncate">{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user?.role === "admin" && (
          <>
            <Separator className="my-2 bg-sidebar-border/50 group-data-[state=collapsed]:my-1" />
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 py-4 text-[10px] font-black text-muted-foreground/50 tracking-[0.2em] uppercase">
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 group-data-[state=collapsed]:space-y-0">
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        className={cn(
                          "h-11 px-2 rounded-xl transition-all duration-300 hover:bg-sidebar-accent group",
                          location === item.url && "bg-sidebar-accent shadow-md shadow-primary/5 ring-1 ring-primary/10",
                          "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-11 group-data-[state=collapsed]:h-11"
                        )}
                      >
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`} className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                          <item.icon className={cn(
                            "h-5 w-5 transition-colors flex-shrink-0",
                            location === item.url ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                          )} />
                          <span className={cn(
                            "truncate font-medium transition-colors group-data-[state=collapsed]:hidden",
                            location === item.url ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
                          )}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border/50 group-data-[state=collapsed]:p-1">
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2 h-8 transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10"
            data-testid="button-sync-mercadopago"
          >
            <RefreshCw className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180 flex-shrink-0" />
            <span className="truncate group-data-[state=collapsed]:hidden">Sincronizar</span>
          </Button>

          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gradient-to-br from-muted/50 to-muted dark:from-muted/20 dark:to-muted/10 border border-border/50 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-11 group-data-[state=collapsed]:h-11">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0 group-data-[state=collapsed]:hidden">
              <span className="text-sm font-bold text-sidebar-foreground truncate">
                {user?.fullName || 'Usuário'}
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter truncate">
                {user?.role || 'Premium'}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
