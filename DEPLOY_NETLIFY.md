# Gestão Financeira 2026 - Guia de Deploy no Netlify

## 🚀 Deploy no Netlify

### Pré-requisitos
1. Conta no GitHub
2. Conta no Netlify (gratuita)

### Passo a Passo

#### 1. Preparar o Repositório Git

```bash
# Inicializar Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Preparar aplicação para deploy no Netlify"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU_USUARIO/gestao-financeira-2026.git
git branch -M main
git push -u origin main
```

#### 2. Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com) e faça login
2. Clique em **"New site from Git"**
3. Escolha **GitHub** e autorize o acesso
4. Selecione seu repositório `gestao-financeira-2026`
5. Configure as configurações de build:
   - **Build command:** `npm run build:netlify`
   - **Publish directory:** `dist/public`
6. Clique em **"Deploy site"**
7. Aguarde o deploy (3-5 minutos)

#### 3. Configurar Banco de Dados

**Opção 1: Supabase (Recomendado)**
1. Acesse [supabase.com](https://supabase.com)
2. Crie um projeto PostgreSQL gratuito
3. Copie a connection string
4. Adicione no Netlify: `DATABASE_URL=postgresql://...`

**Opção 2: Neon.tech**
1. Acesse [neon.tech](https://neon.tech)
2. Crie um projeto PostgreSQL gratuito
3. Copie a connection string
4. Adicione no Netlify: `DATABASE_URL=postgresql://...`

#### 4. Variáveis de Ambiente no Netlify

No dashboard do Netlify, vá para **Site settings > Build & deploy > Environment** e adicione:

- `DATABASE_URL` - String de conexão PostgreSQL
- `SESSION_SECRET` - Chave secreta para sessões (use: `openssl rand -base64 32`)
- `NODE_ENV=production`
- `SUPABASE_URL` (se usar Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` (se usar Supabase)

#### 5. Configurar Functions

As funções serverless serão automaticamente detectadas e implantadas pelo Netlify a partir do diretório `netlify/functions`.

#### 6. Acessar Aplicação

Use as credenciais padrão:
- **Usuário:** `admin`
- **Senha:** `admin123`

---

## 🔧 Build Configuration

O projeto usa configuração otimizada para Netlify:
- **Frontend:** Vite build para `dist/public`
- **Backend:** API routes via Netlify Functions
- **Functions:** Diretório `netlify/functions`

---

## 🌐 Estrutura de Arquivos para Netlify

```
gestao-financeira-2026/
├── netlify.toml              # Configuração do Netlify
├── netlify/functions/         # Funções serverless (gerado automaticamente)
│   └── api.ts
├── dist/public/              # Arquivos estáticos do frontend
└── server/                   # Código fonte do backend
```

---

## ✅ Checklist Pós-Deploy

- [ ] Aplicação acessível via HTTPS
- [ ] Banco de dados conectado
- [ ] Login funcionando com admin/admin123
- [ ] API routes respondendo corretamente
- [ ] Testar todas as funcionalidades principais
- [ ] Configurar backup do banco (recomendado)

---

## 🔒 Segurança

### Recomendações:
1. ✅ Use HTTPS (já configurado no Netlify)
2. ✅ Senhas fortes para usuários
3. ✅ Backup regular do banco de dados
4. ✅ Monitore logs de acesso
5. ✅ Atualize dependências regularmente

---

## 📊 Monitoramento

### Netlify Dashboard
- Logs em tempo real
- Métricas de uso
- Status do serviço
- Deploy history
- Form submissions (se usar)

---

## 💰 Custos

### Netlify Free Tier:
- ✅ 100GB bandwidth/mês
- ✅ 300 minutos build time/mês
- ✅ SSL/HTTPS incluído
- ✅ Deploy automático via Git
- ✅ Custom domains
- ✅ Functions (125k invocações/mês)

### Upgrade quando necessário:
- **Pro:** $19/mês (mais bandwidth e features)
- **Business:** $74/mês (mais funções e analytics)
- **Enterprise**: Custom pricing

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns:

**1. Erro de conexão com banco**
- Verifique `DATABASE_URL` nas variáveis de ambiente
- Confirme que o banco permite conexões externas
- Teste a connection string localmente

**2. Functions não funcionando**
- Verifique os logs de functions no Netlify Dashboard
- Confirme que `npm run build:functions` funciona localmente
- Verifique o arquivo `netlify.toml`

**3. Aplicação não carrega**
- Verifique se o build foi bem-sucedido
- Confirme que `dist/public` foi gerado
- Verifique os redirects no `netlify.toml`

**4. Sessões não persistem**
- Verifique `SESSION_SECRET` está configurado
- Confirme que cookies estão habilitados no browser

---

## 📞 Contato

Para suporte adicional:
- Documentação Netlify: https://docs.netlify.com
- Documentação Supabase: https://supabase.com/docs
- Documentação Neon: https://neon.tech/docs

---

## 🔄 Deploy Automático

O Netlify configurará automaticamente:
- ✅ Deploy automático em cada push para main
- ✅ Deploy previews para pull requests
- ✅ Rollback automático em caso de falha
- ✅ Cache otimizado para assets estáticos
