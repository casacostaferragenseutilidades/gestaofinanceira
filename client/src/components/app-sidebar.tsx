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
  RefreshCw,
  UserCog,
  Target,
  ChevronRight,
  Settings,
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import * as React from "react";

interface NavSubItem {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
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
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Metas", url: "/metas-financeiras", icon: Target },
    ],
  },
  {
    label: "Operacional",
    items: [
      { title: "Contas a Pagar", url: "/contas-pagar", icon: CreditCard, badge: "urgent" },
      { title: "Contas a Receber", url: "/contas-receber", icon: Wallet },
      { title: "Recebimentos PDR", url: "/controle-recebimentos", icon: RefreshCw },
      { title: "Vendas Varejo", url: "/vendas-varejo", icon: Store, badge: "new" },
    ],
  },
  {
    label: "Análise",
    items: [
      { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: TrendingUp },
      { title: "DRE", url: "/dre", icon: FileText },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "Configurações",
    items: [
      { title: "Empresas", url: "/empresas", icon: Building2 },
      {
        title: "Cadastros",
        url: "/cadastros",
        icon: Settings,
        subItems: [
          { title: "Fornecedores", url: "/fornecedores" },
          { title: "Clientes", url: "/clientes" },
          { title: "Categorias", url: "/categorias" },
          { title: "Centros de Custo", url: "/centros-custo" },
          { title: "Taxas e Máquinas", url: "/configuracoes-pagamento" },
        ],
      },
      { title: "Usuários", url: "/usuarios", icon: Users, adminOnly: true },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(i => i !== title) : [...prev, title]
    );
  };

  const isSubItemActive = (subItems?: { url: string }[]) =>
    subItems?.some(item => location === item.url) ?? false;

  const initials = (user?.fullName || "U")
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-white"
    >
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <SidebarHeader className="p-4 border-b border-sidebar-border group-data-[state=collapsed]:p-3">
        <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-md shadow-blue-500/25 transition-transform duration-200 hover:scale-105">
            <TrendingUp className="h-5 w-5 text-white shrink-0" />
          </div>
          <div className="flex flex-col group-data-[state=collapsed]:hidden overflow-hidden">
            <span
              className="text-lg font-bold tracking-tight text-blue-700 truncate leading-none"
              data-testid="text-app-name"
            >
              FinControl
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate mt-0.5">
              Gestão Financeira
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <SidebarContent className="px-3 py-4 space-y-5 group-data-[state=collapsed]:px-2 overflow-x-hidden">
        {navGroups.map((group: NavGroup) => {
          const visibleItems = group.items.filter(
            item => !item.adminOnly || user?.role === "admin"
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="p-0">
              <SidebarGroupLabel className="px-2 mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase group-data-[state=collapsed]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
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
                            "h-9 px-3 rounded-lg transition-all duration-150 relative",
                            isActive
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                            "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0"
                          )}
                          onClick={hasSubItems ? () => toggleExpanded(item.title) : undefined}
                        >
                          {hasSubItems ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2.5">
                                <item.icon className={cn(
                                  "h-4 w-4 shrink-0",
                                  isActive ? "text-blue-600" : "text-slate-400"
                                )} />
                                <span className="truncate text-sm group-data-[state=collapsed]:hidden">
                                  {item.title}
                                </span>
                              </div>
                              <ChevronRight className={cn(
                                "h-3.5 w-3.5 text-slate-300 transition-transform duration-200 group-data-[state=collapsed]:hidden",
                                isExpanded && "rotate-90"
                              )} />
                            </div>
                          ) : (
                            <Link href={item.url} className="flex items-center gap-2.5 w-full">
                              {/* Indicador lateral ativo */}
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full group-data-[state=collapsed]:left-0.5" />
                              )}
                              <item.icon className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-blue-600" : "text-slate-400"
                              )} />
                              <span className="truncate text-sm group-data-[state=collapsed]:hidden">
                                {item.title}
                              </span>
                              {item.badge && (
                                <div className={cn(
                                  "ml-auto flex h-4 items-center rounded-full px-1.5 text-[9px] font-bold group-data-[state=collapsed]:hidden",
                                  item.badge === "urgent"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-blue-100 text-blue-600"
                                )}>
                                  {item.badge === "urgent" ? "!" : "Novo"}
                                </div>
                              )}
                            </Link>
                          )}
                        </SidebarMenuButton>

                        {/* Sub-items */}
                        {hasSubItems && isExpanded && (
                          <div className="ml-6 mt-0.5 border-l-2 border-slate-100 pl-3 space-y-0.5 group-data-[state=collapsed]:hidden">
                            {item.subItems!.map((subItem: NavSubItem) => {
                              const isSubActive = location === subItem.url;
                              return (
                                <Link
                                  key={subItem.title}
                                  href={subItem.url}
                                  className={cn(
                                    "flex items-center h-8 text-[13px] rounded-md px-2 transition-all duration-150",
                                    isSubActive
                                      ? "text-blue-700 font-semibold bg-blue-50"
                                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
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

      {/* ── Footer — Usuário ─────────────────────────────────────── */}
      <SidebarFooter className="p-3 border-t border-sidebar-border group-data-[state=collapsed]:p-2">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-1.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex flex-col min-w-0 group-data-[state=collapsed]:hidden">
            <span className="text-[13px] font-semibold text-slate-800 truncate leading-none">
              {user?.fullName || "Usuário"}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {user?.role || "Membro"}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
