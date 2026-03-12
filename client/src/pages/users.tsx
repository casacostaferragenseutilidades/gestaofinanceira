import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, UserCog, Trash2, Edit, Loader2, Users, Shield, 
  Eye, Pencil, Mail, Key, UserCheck, Timer, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  team: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  financial: "Financeiro",
  viewer: "Visualizador",
};

const roleIcons: Record<string, typeof Shield> = {
  admin: Shield,
  financial: Pencil,
  viewer: Eye,
};

const roleColors: Record<string, string> = {
  admin: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  financial: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  viewer: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function UsersPage() {
  const { user: currentUser, register } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [formLoading, setFormLoading] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "viewer",
    team: "",
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const resetForm = () => {
    setFormData({ 
      fullName: "", 
      username: "",
      email: "",
      password: "",
      role: "viewer", 
      team: "" 
    });
    setEditingUser(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      setFormLoading(true);
      try {
        // Calling the register function which creates user in DB and Supabase Auth
        // We pass the role as well, though the backend register needs update to accept it
        await apiRequest("POST", "/api/auth/register", data);
      } finally {
        setFormLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ 
        title: "Usuário registrado!", 
        description: "O usuário foi criado com sucesso no banco de dados e no Supabase Auth." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar usuário", 
        variant: "destructive", 
        description: error.message || "Verifique os dados e tente novamente." 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Usuário atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar usuário", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário removido!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao remover usuário", 
        variant: "destructive",
        description: error.message
      });
    },
  });

  function handleEdit(user: User) {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || "",
      username: user.username || "",
      email: user.email || "",
      password: "", // Don't show password
      role: user.role,
      team: user.team || "",
    });
    setIsDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingUser) {
      const { password, ...updateData } = formData;
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-red-100 bg-red-50/30 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-900 mb-2">Acesso Restrito</h2>
              <p className="text-red-700/70 mb-8">
                Esta área é exclusiva para administradores do sistema. Seu perfil atual não possui permissão para gerenciar usuários.
              </p>
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100" onClick={() => window.history.back()}>
                Voltar para o Início
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { label: "Total de Usuários", value: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Administradores", value: users.filter(u => u.role === 'admin').length, icon: Shield, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Financeiro", value: users.filter(u => u.role === 'financial').length, icon: Pencil, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <UserCheck className="h-7 w-7 text-white" />
            </div>
            Gestão de Equipe
          </h1>
          <p className="text-slate-500 font-medium">
            Controle de acessos, perfis e usuários do sistema FinControl.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95 group">
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
              Cadastrar Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <DialogHeader className="pt-4">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {editingUser ? "Atualizar Perfil" : "Novo Cadastro"}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                {editingUser
                  ? "Modifique os dados do usuário. O e-mail não pode ser alterado por aqui."
                  : "Crie uma nova conta que será sincronizada com o Supabase Auth."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-400">Nome Completo</Label>
                  <div className="relative">
                    <UserCog className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="fullName"
                      placeholder="Ex: João Silva"
                      className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-400">Usuário</Label>
                  <Input
                    id="username"
                    placeholder="joao.silva"
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@empresa.com"
                    className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">Senha Provisória</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-slate-400">Perfil de Acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="financial">Financeiro</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team" className="text-xs font-bold uppercase tracking-wider text-slate-400">Departamento</Label>
                  <Input
                    id="team"
                    placeholder="Ex: Comercial"
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-slate-500"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || formLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
                >
                  {(createMutation.isPending || updateMutation.isPending || formLoading) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    editingUser ? "Salvar Alterações" : "Concluir Cadastro"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-md overflow-hidden group hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Users List */}
      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Membros da Organização</CardTitle>
            <CardDescription>Gerencie as contas e as permissões individuais</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            <Timer className="h-3 w-3" />
            Atualizado agora
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-slate-400 font-medium animate-pulse">Carregando usuários...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-400">Usuário</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-400">Perfil</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-400">Departamento</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {users.map((user, i) => {
                      const RoleIcon = roleIcons[user.role] || Eye;
                      const isMe = user.id === currentUser?.id;
                      
                      return (
                        <motion.tr 
                          key={user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {user.fullName?.charAt(0) || user.username?.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 flex items-center gap-2">
                                  {user.fullName}
                                  {isMe && <Badge className="text-[10px] h-4 px-1.5 bg-indigo-100 text-indigo-600 border-none">VOCÊ</Badge>}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">{user.email || `@${user.username}`}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <Badge variant="outline" className={`font-semibold px-3 py-1 ${roleColors[user.role]}`}>
                              <RoleIcon className="h-3 w-3 mr-1.5" />
                              {roleLabels[user.role]}
                            </Badge>
                          </td>
                          <td className="p-5">
                            <span className="text-sm font-semibold text-slate-600">{user.team || "Geral"}</span>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                {user.status === 'active' ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(user)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!isMe && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if(confirm(`Tem certeza que deseja remover ${user.fullName}?`)) {
                                      deleteMutation.mutate(user.id);
                                    }
                                  }}
                                  disabled={deleteMutation.isPending}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-400 font-medium">Nenhum usuário encontrado.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-center text-xs text-slate-400 font-medium pt-4">
        &copy; 2026 FinControl &bull; Sistema Seguro de Gestão de Identidade
      </p>
    </div>
  );
}
