# Deploy para Render

## 🚀 Deploy Automático com Render

### Pré-requisitos
- Conta no [Render](https://render.com)
- Repositório GitHub conectado
- Variáveis de ambiente configuradas

### Passo 1: Conectar Repositório

1. **Acesse:** [Render Dashboard](https://dashboard.render.com)
2. **Clique em:** "New +" → "Web Service"
3. **Conecte seu GitHub**
4. **Selecione o repositório:** `gestao-financeira-2026`

### Passo 2: Configurar Service

**Basic Settings:**
- **Name:** `gestao-financeira`
- **Environment:** `Node`
- **Region:** `Nearest to your users`

**Build Settings:**
- **Build Command:** `npm run build:render`
- **Start Command:** `npm start`

**Environment Variables:**
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
VITE_SUPABASE_URL=https://[PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY]
SESSION_SECRET=[RANDOM_SECRET]
```

### Passo 3: Deploy

1. **Clique em:** "Create Web Service"
2. **Aguarde o build** (primeiro deploy pode demorar)
3. **Acesse:** `https://gestao-financeira.onrender.com`

### Passo 4: Configurar Health Check

**No service settings:**
- **Health Check Path:** `/api/health`
- **Auto-deploy:** ✅ (ativado)
- **Plan:** Free (ou Starter se precisar mais recursos)

## 🛠️ Deploy Manual

### Via Render CLI

```bash
# Instalar Render CLI
npm install -g @render/cli

# Login
render login

# Criar service
render create web-service --name gestao-financeira

# Deploy
render deploy
```

### Via Git (Automatic)

```bash
# Commit e push para deploy automático
git add .
git commit -m "Deploy para Render"
git push origin main
```

## 📋 Verificação Pós-Deploy

### Testes Automáticos
- ✅ Health check: `https://seu-app.onrender.com/api/health`
- ✅ Frontend carregando
- ✅ API endpoints funcionando
- ✅ Login funcionando

### Logs e Debug
- **Acesse:** Render Dashboard → Logs
- **Verifique:** Build logs e runtime logs
- **Health check:** Deve retornar `{"status": "ok"}`

## 🔧 Troubleshooting

### Problemas Comuns

**1. Build falha:**
```bash
# Verificar dependências
npm install
npm run build:render
```

**2. Runtime error:**
- Verificar variáveis de ambiente
- Verificar PORT (deve ser 10000 no Render)

**3. Health check falha:**
- Verificar se `/api/health` está funcionando
- Verificar se server está rodando na porta correta

**4. Login não funciona:**
- Verificar variáveis do Supabase
- Verificar se API endpoints estão acessíveis

### Comandos Úteis

```bash
# Verificar build localmente
npm run build:render

# Testar produção localmente
npm start

# Verificar logs
# Acessar Render Dashboard → Logs
```

## 🎯 Vantagens do Render vs Netlify

### Render
- ✅ Full-stack (frontend + backend)
- ✅ Banco de dados PostgreSQL integrado
- ✅ Variáveis de ambiente fáceis
- ✅ Health checks automáticos
- ✅ Deploy automático via Git

### Netlify
- ❌ Apenas frontend (functions limitadas)
- ❌ Sem banco de dados integrado
- ❌ Configuração complexa para backend

## 📊 URLs Finais

**Após deploy:**
- **App:** `https://gestao-financeira.onrender.com`
- **API:** `https://gestao-financeira.onrender.com/api/*`
- **Health:** `https://gestao-financeira.onrender.com/api/health`

## 🔄 CI/CD Automático

**Toda vez que fizer push para main:**
1. Render detecta mudanças
2. Build automático
3. Deploy automático
4. Health check automático
5. App atualizado

---

**Pronto! Sua aplicação está configurada para o Render!** 🚀
