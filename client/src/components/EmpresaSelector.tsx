import * as React from 'react';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  razao_social: string;
  status: 'ativa' | 'inativa';
}

interface EmpresaSelectorProps {
  onNovaEmpresa?: () => void;
}

export function EmpresaSelector({ onNovaEmpresa }: EmpresaSelectorProps) {
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = React.useState<Empresa | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  React.useEffect(() => {
    loadEmpresas();
    loadEmpresaAtiva();
  }, []);

  const loadEmpresas = async () => {
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Usuário não autenticado. Faça login para acessar as empresas.');
          // O usuário precisa estar autenticado para acessar a API
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setEmpresas(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      // Se for erro de parse, provavelmente é problema de autenticação
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('Resposta não é JSON - verifique se está autenticado');
        // Tenta carregar do localStorage como fallback
        const storedEmpresas = localStorage.getItem('empresas');
        if (storedEmpresas) {
          try {
            setEmpresas(JSON.parse(storedEmpresas));
          } catch (e) {
            console.error('Erro ao carregar do localStorage:', e);
          }
        }
      }
    }
  };

  const loadEmpresaAtiva = () => {
    const storedAtiva = localStorage.getItem('empresaAtiva');
    if (storedAtiva) {
      setEmpresaAtiva(JSON.parse(storedAtiva));
    }
  };

  const selecionarEmpresa = (empresa: Empresa) => {
    setEmpresaAtiva(empresa);
    localStorage.setItem('empresaAtiva', JSON.stringify(empresa));
    // Recarregar a página para atualizar os dados
    window.location.reload();
  };

  const empresasAtivas = empresas.filter(emp => emp.status === 'ativa');
  const empresasInativas = empresas.filter(emp => emp.status === 'inativa');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 min-w-[250px] justify-start">
          {empresaAtiva ? (
            <>
              <Building2 className="h-4 w-4" />
              <div className="flex-1 text-left">
                <div className="font-medium">{empresaAtiva.nome}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {empresaAtiva.razao_social}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {empresasAtivas.length} empresas
              </Badge>
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4" />
              <span className="flex-1">Selecione uma empresa</span>
            </>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        {empresasAtivas.length > 0 && (
          <>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-muted-foreground">Empresas Ativas</p>
            </div>
            {empresasAtivas.map((empresa) => (
              <DropdownMenuItem
                key={empresa.id}
                onClick={() => selecionarEmpresa(empresa)}
                className="flex items-center gap-3 p-3 cursor-pointer"
              >
                <Building2 className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">{empresa.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {empresa.razao_social}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    CNPJ: {empresa.cnpj}
                  </div>
                </div>
                {empresaAtiva?.id === empresa.id && (
                  <Badge variant="default" className="text-xs">
                    Ativa
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {empresasInativas.length > 0 && (
          <>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-muted-foreground">Empresas Inativas</p>
            </div>
            {empresasInativas.map((empresa) => (
              <DropdownMenuItem
                key={empresa.id}
                onClick={() => selecionarEmpresa(empresa)}
                className="flex items-center gap-3 p-3 cursor-pointer opacity-60"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{empresa.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {empresa.razao_social}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    CNPJ: {empresa.cnpj}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Inativa
                </Badge>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => navigate('/empresas')}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <Building2 className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Gerenciar Empresas</div>
            <div className="text-xs text-muted-foreground">
              Cadastrar, editar e configurar empresas
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onNovaEmpresa}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <Plus className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="font-medium">Nova Empresa</div>
            <div className="text-xs text-muted-foreground">
              Cadastrar nova empresa
            </div>
          </div>
        </DropdownMenuItem>

        {empresas.length === 0 && (
          <div className="px-2 py-4 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma empresa cadastrada
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
