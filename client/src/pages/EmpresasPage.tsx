import * as React from 'react';
import { Plus, Building2, Trash2, Edit, Users, DollarSign, TrendingUp, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  razaoSocial: string;
  telefone: string;
  email: string;
  endereco: string;
  status: 'ativa' | 'inativa';
  created_at: string;
  total_contas_pagar?: number;
  total_contas_receber?: number;
  saldo_caixa?: number;
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingEmpresa, setEditingEmpresa] = React.useState<Empresa | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searchingCnpj, setSearchingCnpj] = React.useState(false);
  const [formData, setFormData] = React.useState({
    nome: '',
    cnpj: '',
    razaoSocial: '',
    telefone: '',
    email: '',
    endereco: ''
  });
  const { toast } = useToast();

  React.useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Falha ao carregar empresas');
      const data = await response.json();
      setEmpresas(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as empresas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const url = editingEmpresa ? `/api/companies/${editingEmpresa.id}` : '/api/companies';
      const method = editingEmpresa ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();

        if (response.status === 400 && error.error?.includes('CNPJ já cadastrado')) {
          toast({
            title: "CNPJ já cadastrado",
            description: "Este CNPJ já está cadastrado no sistema. Por favor, verifique a lista de empresas.",
            variant: "destructive"
          });
          return;
        }

        throw new Error(error.error || 'Erro ao salvar empresa');
      }

      const savedEmpresa = await response.json();

      if (editingEmpresa) {
        setEmpresas(empresas.map(emp =>
          emp.id === editingEmpresa.id ? savedEmpresa : emp
        ));
        toast({
          title: "Empresa atualizada",
          description: "Os dados da empresa foram atualizados com sucesso."
        });
      } else {
        setEmpresas([...empresas, savedEmpresa]);
        toast({
          title: "Empresa cadastrada",
          description: "Nova empresa adicionada com sucesso."
        });
      }

      // Resetar formulário
      setFormData({
        nome: '',
        cnpj: '',
        razaoSocial: '',
        telefone: '',
        email: '',
        endereco: ''
      });
      setShowForm(false);
      setEditingEmpresa(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a empresa.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setFormData({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      razaoSocial: empresa.razaoSocial,
      telefone: empresa.telefone,
      email: empresa.email,
      endereco: empresa.endereco
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir empresa');
      }

      setEmpresas(empresas.filter(emp => emp.id !== id));
      toast({
        title: "Empresa excluída",
        description: "A empresa foi removida com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a empresa.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const empresa = empresas.find(emp => emp.id === id);
      if (!empresa) return;

      const newStatus = empresa.status === 'ativa' ? 'inativa' : 'ativa';
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status');
      }

      const updatedEmpresa = await response.json();
      setEmpresas(empresas.map(emp =>
        emp.id === id ? updatedEmpresa : emp
      ));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da empresa.",
        variant: "destructive"
      });
    }
  };

  const searchCnpj = async () => {
    const cnpj = formData.cnpj.replace(/\D/g, '');

    if (cnpj.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ completo com 14 dígitos.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSearchingCnpj(true);

      // Usar o backend como proxy para evitar CORS
      const response = await fetch(`/api/companies/search/cnpj/${cnpj}`);

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          // CNPJ já cadastrado
          toast({
            title: "CNPJ já cadastrado",
            description: `Este CNPJ já está cadastrado para a empresa: ${error.company.nome}`,
            variant: "destructive"
          });
          return;
        }
        throw new Error(error.error || 'CNPJ não encontrado');
      }

      const data = await response.json();

      // O backend já retorna os dados formatados
      if (data.nome || data.razaoSocial) {
        setFormData({
          ...formData,
          nome: data.nome || '',
          razaoSocial: data.razaoSocial || '',
          endereco: data.endereco || '',
          telefone: data.telefone || '',
          email: data.email || ''
        });

        toast({
          title: "CNPJ encontrado",
          description: "Dados da empresa foram preenchidos automaticamente.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message || "Não foi possível buscar os dados do CNPJ.",
        variant: "destructive"
      });
    } finally {
      setSearchingCnpj(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">Gerencie suas empresas e controle financeiro separado</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Lista de Empresas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {empresas.map((empresa) => (
          <Card key={empresa.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{empresa.nome}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(empresa)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(empresa.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-sm">
                {empresa.razaoSocial}
              </CardDescription>
              <Badge
                variant={empresa.status === 'ativa' ? 'default' : 'secondary'}
                className="mt-2"
              >
                {empresa.status === 'ativa' ? 'Ativa' : 'Inativa'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">CNPJ:</span>
                  <p className="text-muted-foreground">{empresa.cnpj}</p>
                </div>
                <div>
                  <span className="font-medium">Telefone:</span>
                  <p className="text-muted-foreground">{empresa.telefone}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Email:</span>
                  <p className="text-muted-foreground">{empresa.email}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Endereço:</span>
                  <p className="text-muted-foreground">{empresa.endereco}</p>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Resumo Financeiro
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-red-600 font-medium">Contas a Pagar</p>
                    <p className="text-lg font-bold text-red-700">
                      R$ {(empresa.total_contas_pagar || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-green-600 font-medium">Contas a Receber</p>
                    <p className="text-lg font-bold text-green-700">
                      R$ {(empresa.total_contas_receber || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-blue-600 font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Saldo Caixa
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      R$ {(empresa.saldo_caixa || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(empresa.id)}
                  className="flex-1"
                >
                  {empresa.status === 'ativa' ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    // Selecionar empresa ativa
                    localStorage.setItem('empresaAtiva', JSON.stringify(empresa));
                    toast({
                      title: "Empresa selecionada",
                      description: `${empresa.nome} é agora a empresa ativa.`
                    });
                    window.location.reload();
                  }}
                  className="flex-1"
                >
                  Selecionar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {empresas.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre sua primeira empresa para começar a controlar o fluxo financeiro.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cadastro/Edição */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingEmpresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
              </CardTitle>
              <CardDescription>
                Preencha os dados da empresa para controle financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Fantasia *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      value={formData.razaoSocial}
                      onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                      placeholder="Razão social completa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                        required
                        disabled={searchingCnpj}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={searchCnpj}
                        disabled={searchingCnpj || !formData.cnpj}
                        className="px-3"
                      >
                        {searchingCnpj ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="empresa@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, número, bairro, cidade - UF"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEmpresa(null);
                      setFormData({
                        nome: '',
                        cnpj: '',
                        razaoSocial: '',
                        telefone: '',
                        email: '',
                        endereco: ''
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingEmpresa ? 'Atualizando...' : 'Cadastrando...'}
                      </>
                    ) : (
                      editingEmpresa ? 'Atualizar' : 'Cadastrar'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
