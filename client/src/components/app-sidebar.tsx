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
      <SidebarHeader className="p-3 border-b border-sidebar-border/50 group-data-[state=collapsed]:p-2">
        <div className="flex items-center gap-3 transition-all duration-300 group-data-[state=collapsed]:justify-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-emerald-500 to-emerald-600 shadow-lg shadow-primary/25 ring-1 ring-white/10 transition-all duration-300 hover:shadow-primary/40 hover:scale-105">
            <TrendingUp className="h-6 w-6 text-white transition-transform duration-300 group-data-[state=collapsed]:scale-110 flex-shrink-0" />
          </div>
          <div className="flex flex-col group-data-[state=collapsed]:hidden overflow-hidden transition-all duration-300">
            <span className="text-lg font-bold tracking-tight text-sidebar-foreground truncate bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent" data-testid="text-app-name">
              FinControl
            </span>
            <span className="text-xs font-medium text-muted-foreground truncate">
              Gestão Financeira
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
                        "h-8 px-1 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/50 group",
                        isActive && "bg-sidebar-accent shadow-sm border-l-2 border-primary",
                        "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10"
                      )}
                      onClick={hasSubItems ? () => toggleExpanded(item.title) : undefined}
                    >
                      {hasSubItems ? (
                        <div className="flex items-center justify-between w-full group-data-[state=collapsed]:justify-center">
                          <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                            <item.icon className="h-4 w-4 text-sidebar-foreground/80 group-hover:text-sidebar-foreground transition-colors flex-shrink-0" />
                            <span className="truncate group-data-[state=collapsed]:hidden">{item.title}</span>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform duration-200 text-sidebar-foreground/60 group-data-[state=collapsed]:hidden flex-shrink-0",
                            isExpanded && "rotate-90"
                          )} />
                        </div>
                      ) : (
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`} className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                          <item.icon className="h-4 w-4 text-sidebar-foreground/80 group-hover:text-sidebar-foreground transition-colors flex-shrink-0" />
                          <span className="truncate group-data-[state=collapsed]:hidden">{item.title}</span>
                          {item.badge && (
                            <Badge variant={getBadgeVariant(item.badge)} className="ml-auto text-xs px-1.5 py-0.5 group-data-[state=collapsed]:hidden flex-shrink-0">
                              {item.badge === 'urgent' ? '!' : item.badge === 'new' ? 'Novo' : ''}
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
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70 tracking-wider uppercase">
            Cadastros
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 group-data-[state=collapsed]:space-y-0">
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
                        "h-8 px-1 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/50 group",
                        isActive && "bg-sidebar-accent shadow-sm border-l-2 border-primary",
                        "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10"
                      )}
                      onClick={hasSubItems ? () => toggleExpanded(item.title) : undefined}
                    >
                      {hasSubItems ? (
                        <div className="flex items-center justify-between w-full group-data-[state=collapsed]:justify-center">
                          <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                            <item.icon className="h-4 w-4 text-sidebar-foreground/80 group-hover:text-sidebar-foreground transition-colors flex-shrink-0" />
                            <span className="truncate group-data-[state=collapsed]:hidden">{item.title}</span>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform duration-200 text-sidebar-foreground/60 group-data-[state=collapsed]:hidden flex-shrink-0",
                            isExpanded && "rotate-90"
                          )} />
                        </div>
                      ) : (
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`} className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                          <item.icon className="h-4 w-4 text-sidebar-foreground/80 group-hover:text-sidebar-foreground transition-colors flex-shrink-0" />
                          <span className="truncate group-data-[state=collapsed]:hidden">{item.title}</span>
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
        {user?.role === "admin" && (
          <>
            <Separator className="my-1 bg-sidebar-border/50 group-data-[state=collapsed]:my-0.5" />
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70 tracking-wider uppercase">
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 group-data-[state=collapsed]:space-y-0">
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        className={cn(
                          "h-8 px-1 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/50 group",
                          location === item.url && "bg-sidebar-accent shadow-sm border-l-2 border-primary",
                          "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10"
                        )}
                      >
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`} className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                          <item.icon className="h-4 w-4 text-sidebar-foreground/80 group-hover:text-sidebar-foreground transition-colors flex-shrink-0" />
                          <span className="truncate group-data-[state=collapsed]:hidden">{item.title}</span>
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

          <div className="flex items-center gap-2 px-1 py-1 rounded-lg bg-muted/50 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0 group-data-[state=collapsed]:hidden">
              <span className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.fullName || 'Usuário'}
              </span>
              <span className="text-xs text-muted-foreground truncate capitalize">
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
