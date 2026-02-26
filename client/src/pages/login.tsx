import * as React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2, ArrowRight, ShieldCheck, PieChart, TrendingUp, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await register(formData.username, formData.email, formData.password, formData.fullName);
        toast({ title: "Conta criada com sucesso!" });
      } else {
        await login(formData.email, formData.password);
        toast({ title: "Login realizado com sucesso!" });
      }
      setLocation("/");
    } catch (err: any) {
      const message = err?.message || (isRegistering ? "Erro ao criar conta" : "Credenciais inválidas");
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Carregando sua experiência...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background overflow-hidden font-sans">
      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-40 mix-blend-multiply bg-cover bg-center transition-transform hover:scale-110"
          style={{ backgroundImage: "url('/login-bg.png')", transitionDuration: "10s" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/50 to-transparent z-10" />

        <div className="relative z-20 max-w-lg text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl">
                <DollarSign className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">FinControl</h1>
            </div>

            <h2 className="text-5xl font-extrabold leading-tight mb-6">
              Domine suas <span className="text-green-300">finanças</span> com inteligência.
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              O sistema definitivo para gestão financeira empresarial, oferecendo controle total sobre seu fluxo de caixa, contas e relatórios estratégicos.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: ShieldCheck, text: "Segurança Total" },
                { icon: PieChart, text: "Análise de Dados" },
                { icon: TrendingUp, text: "Visão Geral" },
                { icon: DollarSign, text: "Controle Preciso" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 text-white/90"
                >
                  <div className="p-2 bg-white/10 rounded-lg">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl animate-pulse delay-1000" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[440px] z-10"
        >
          <div className="md:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-primary">FinControl</h1>
            </div>
          </div>

          <Card className="border-none shadow-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50">
            <CardContent className="p-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                  {isRegistering ? "Comece agora" : "Bem-vindo de volta"}
                </h3>
                <p className="text-muted-foreground">
                  {isRegistering ? "Crie sua conta para gerenciar suas finanças" : "Entre com suas credenciais para acessar o painel"}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.form
                  key={isRegistering ? "register" : "login"}
                  initial={{ opacity: 0, x: isRegistering ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRegistering ? -20 : 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {isRegistering && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                        Nome Completo
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Ex: João Silva"
                        className="h-12 bg-white/50 dark:bg-zinc-950/50"
                        required
                      />
                    </div>
                  )}
                  {isRegistering && (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu.email@exemplo.com"
                        className="h-12 bg-white/50 dark:bg-zinc-950/50"
                        required
                      />
                    </div>
                  )}
                  {!isRegistering && (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu.email@exemplo.com"
                        className="h-12 bg-white/50 dark:bg-zinc-950/50"
                        required
                      />
                    </div>
                  )}
                  {isRegistering && (
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                        Usuário
                      </Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="seu.usuario"
                        className="h-12 bg-white/50 dark:bg-zinc-950/50"
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                        Senha
                      </Label>
                      {!isRegistering && (
                        <a href="#" className="text-xs text-primary hover:underline font-medium">Esqueceu a senha?</a>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="h-12 bg-white/50 dark:bg-zinc-950/50"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {isRegistering ? "Criar Minha Conta" : "Acessar Sistema"}
                        <ArrowRight className="ml-2 h-5 w-5 translate-x-0 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.form>
              </AnimatePresence>

              <div className="mt-8 pt-6 border-t border-border/50 text-center">
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  {isRegistering ? (
                    <>
                      Já possui uma conta? <span className="font-bold text-primary group-hover:underline">Fazer Login</span>
                    </>
                  ) : (
                    <>
                      Novo por aqui? <span className="font-bold text-primary group-hover:underline">Registrar-se</span>
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            &copy; 2026 FinControl. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
