import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, requireFinancial, requireViewer } from "./auth";
console.log("[Routes] Module loading started...");
import supabaseAuthRoutes from "./routes/supabase-auth";
import { scrypt, randomBytes, randomUUID } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { createClient } from '@supabase/supabase-js';

const scryptAsync = promisify(scrypt);

// Initialize Supabase Admin client for user management
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  : null;

if (!supabaseAdmin) {
  console.warn('⚠️ [Routes] Supabase Admin client not initialized - users will not be synced to Supabase Auth');
} else {
  console.log('✅ [Routes] Supabase Admin client initialized for user sync');
}

export function registerRoutes(
  httpServer: Server | null,
  app: Express
): Server | null {
  // setupAuth(app); // Called in index.ts

  // Register Supabase Auth routes
  app.use("/api/supabase-auth", supabaseAuthRoutes);

  // Health check endpoints for Render
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Debug endpoint
  app.get("/debug", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      user: req.user,
      session: req.session,
      headers: req.headers
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/auth/login", (req, res, next) => {
    console.log(`[Login API] Starting login for: ${req.body?.email}`);
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      try {
        if (err) {
          console.error("[Login API] Passport error:", err);
          return res.status(500).json({ error: "Erro interno do servidor", details: err.message });
        }
        if (!user) {
          console.warn("[Login API] Authentication failed for:", req.body?.email);
          return res.status(401).json({ error: "E-mail ou senha inválidos" });
        }

        // Sync user to Supabase Auth if not already there
        if (supabaseAdmin && req.body?.email) {
          try {
            const { data: supabaseUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
            if (!supabaseUser?.user) {
              console.log(`[Login API] User ${user.id} not found in Supabase Auth, syncing...`);
              const { data: newSupaUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email: req.body.email,
                password: req.body.password,
                email_confirm: true,
                user_metadata: {
                  full_name: user.fullName,
                  username: user.username,
                },
              });
              if (createErr) {
                // If user already exists by email, that's OK
                if (!createErr.message?.includes('already')) {
                  console.warn(`[Login API] Supabase sync warning:`, createErr.message);
                }
              } else {
                console.log(`[Login API] User synced to Supabase Auth: ${newSupaUser?.user?.id}`);
                // Update local DB user ID to match Supabase ID if different
                if (newSupaUser?.user?.id && newSupaUser.user.id !== user.id) {
                  console.log(`[Login API] Updating local user ID from ${user.id} to ${newSupaUser.user.id}`);
                  // Note: updating user ID is complex; just log for now
                }
              }
            } else {
              console.log(`[Login API] User ${user.id} already exists in Supabase Auth ✓`);
            }
          } catch (syncErr: any) {
            console.warn(`[Login API] Supabase sync error (non-blocking):`, syncErr.message);
          }
        }

        console.log(`[Login API] Passport authenticated ${user.username}, calling req.logIn`);
        req.logIn(user, (err) => {
          if (err) {
            console.error("[Login API] session logIn error:", err);
            return res.status(500).json({ error: "Erro ao estabelecer sessão" });
          }

          console.log(`[Login API] Session established for ${user.username}`);
          return res.json({
            user: {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              role: user.role,
              status: user.status,
              team: user.team
            }
          });
        });
      } catch (handlerError) {
        console.error("[Login API] Critical handler error:", handlerError);
        res.status(500).json({ error: "Erro crítico no servidor" });
      }
    })(req, res, next);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName } = req.body;
      console.log(`[Register API] Starting registration for: ${username}`);

      // Database connection test
      try {
        const dbCheck = await db.execute(sql`SELECT 1`);
        console.log(`[Register API] Database check OK: ${JSON.stringify(dbCheck)}`);
      } catch (dbErr: any) {
        console.error(`[Register API] Database check FAILED:`, dbErr);
        return res.status(500).json({ error: "Banco de dados indisponível", details: dbErr.message });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log(`[Register API] Username already exists: ${username}`);
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      // Also check by email
      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        console.log(`[Register API] Email already exists: ${email}`);
        return res.status(400).json({ error: "Este email já está cadastrado" });
      }

      // Step 1: Create user in Supabase Auth first
      let supabaseUserId: string | null = null;
      if (supabaseAdmin) {
        try {
          console.log(`[Register API] Creating user in Supabase Auth: ${email}`);
          const { data: supabaseUser, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              full_name: fullName,
              username: username,
            },
          });

          if (supabaseError) {
            // If user already exists in Supabase, try to get their ID
            if (supabaseError.message?.includes('already been registered') || supabaseError.message?.includes('already exists')) {
              console.log(`[Register API] User already exists in Supabase Auth, fetching ID...`);
              const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
              const existingSupaUser = listData?.users?.find(u => u.email === email);
              if (existingSupaUser) {
                supabaseUserId = existingSupaUser.id;
                console.log(`[Register API] Found existing Supabase user: ${supabaseUserId}`);
              }
            } else {
              console.error(`[Register API] Supabase Auth error:`, supabaseError);
              // Continue with local-only registration if Supabase fails
            }
          } else if (supabaseUser?.user) {
            supabaseUserId = supabaseUser.user.id;
            console.log(`[Register API] Supabase Auth user created: ${supabaseUserId}`);
          }
        } catch (supabaseErr: any) {
          console.error(`[Register API] Supabase Auth exception:`, supabaseErr);
          // Continue with local-only registration if Supabase fails
        }
      } else {
        console.warn(`[Register API] Supabase Admin not configured, skipping Supabase Auth registration`);
      }

      // Step 2: Hash password and create user in local database
      console.log(`[Register API] Hashing password...`);
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      // Use Supabase user ID if available, otherwise generate our own
      const userId = supabaseUserId || randomUUID();

      console.log(`[Register API] Creating user in storage with ID: ${userId}`);
      const newUser = await storage.createUser({
        id: userId,
        username,
        email,
        password: hashedPassword,
        name: fullName,
        fullName,
        role: "viewer",
        status: "active"
      });
      console.log(`[Register API] User created successfully: ${newUser.id}`);

      // Auto-login after registration - WAIT for it
      const userToLogin = {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        status: newUser.status,
        team: newUser.team
      };

      req.login(userToLogin, (err) => {
        if (err) {
          console.error("[Register API] Auto-login error:", err);
          // Return the user anyway as they were created
          return res.json({ user: userToLogin, loginError: err.message });
        }

        console.log(`[Register API] Auto-login success for: ${username}`);
        return res.json({ user: userToLogin });
      });

    } catch (error: any) {
      console.error("[Register API] registration error:", error);
      res.status(500).json({
        error: "Erro ao criar usuário",
        details: error.message,
        stack: error.stack,
        type: error.name
      });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    try {
      console.log(`[Me API] Authenticated: ${req.isAuthenticated()}`);
      if (!req.isAuthenticated()) {
        return res.status(200).json({ user: null, authenticated: false });
      }
      res.json({
        user: {
          id: req.user!.id,
          username: req.user!.username,
          fullName: req.user!.fullName,
          role: req.user!.role,
          status: req.user!.status,
          team: req.user!.team
        }
      });
    } catch (err: any) {
      console.error("[Me API] Error:", err);
      res.status(500).json({ error: "Erro ao obter usuário atual", details: err.message, stack: err.stack });
    }
  });

  app.get("/api/users", requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(u => ({ id: u.id, fullName: u.fullName, role: u.role, status: u.status, team: u.team })));
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    const data = req.body;
    const user = await storage.updateUser(req.params.id, data);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ id: user.id, fullName: user.fullName, role: user.role, status: user.status, team: user.team });
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    if (req.user!.id === req.params.id) {
      return res.status(400).json({ error: "Você não pode excluir sua própria conta" });
    }
    await storage.deleteUser(req.params.id);
    res.status(204).send();
  });

  // Sync all existing database users to Supabase Auth
  app.post("/api/users/sync-supabase", requireAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin não configurado" });
    }

    try {
      const allUsers = await storage.getUsers();
      const results: { synced: string[], alreadyExists: string[], errors: string[] } = {
        synced: [],
        alreadyExists: [],
        errors: [],
      };

      for (const user of allUsers) {
        if (!user.email) {
          results.errors.push(`${user.username}: sem email cadastrado`);
          continue;
        }

        try {
          // Check if user already exists in Supabase Auth
          const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
          if (existingUser?.user) {
            results.alreadyExists.push(user.email);
            continue;
          }

          // Create user in Supabase Auth with a temporary password
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            email_confirm: true,
            user_metadata: {
              full_name: user.fullName,
              username: user.username,
            },
          });

          if (createError) {
            if (createError.message?.includes('already')) {
              results.alreadyExists.push(user.email);
            } else {
              results.errors.push(`${user.email}: ${createError.message}`);
            }
          } else {
            results.synced.push(user.email);
            console.log(`[Sync] User synced to Supabase: ${user.email} -> ${newUser?.user?.id}`);
          }
        } catch (err: any) {
          results.errors.push(`${user.email}: ${err.message}`);
        }
      }

      console.log(`[Sync] Results: ${results.synced.length} synced, ${results.alreadyExists.length} already exist, ${results.errors.length} errors`);
      res.json({
        message: "Sincronização concluída",
        total: allUsers.length,
        ...results,
      });
    } catch (error: any) {
      console.error("[Sync] Error:", error);
      res.status(500).json({ error: "Erro ao sincronizar usuários", details: error.message });
    }
  });

  // Companies (Empresas) routes
  app.get("/api/companies", requireViewer, async (req, res) => {
    const companies = await storage.getCompanies();
    res.json(companies);
  });

  app.get("/api/companies/:id", requireViewer, async (req, res) => {
    const company = await storage.getCompany(req.params.id);
    if (!company) return res.status(404).json({ error: "Empresa não encontrada" });
    res.json(company);
  });

  app.post("/api/companies", requireFinancial, async (req, res) => {
    try {
      // Check if CNPJ already exists
      const existingCompany = await storage.getCompanyByCnpj(req.body.cnpj);
      if (existingCompany) {
        return res.status(400).json({ error: "CNPJ já cadastrado" });
      }

      const company = await storage.createCompany(req.body);
      res.status(201).json(company);
    } catch (error: any) {
      console.error("Error creating company:", error);
      res.status(400).json({ error: "Erro ao criar empresa", details: error.message });
    }
  });

  app.patch("/api/companies/:id", requireFinancial, async (req, res) => {
    try {
      // If updating CNPJ, check if it already exists
      if (req.body.cnpj) {
        const existingCompany = await storage.getCompanyByCnpj(req.body.cnpj);
        if (existingCompany && existingCompany.id !== req.params.id) {
          return res.status(400).json({ error: "CNPJ já cadastrado" });
        }
      }

      const company = await storage.updateCompany(req.params.id, req.body);
      if (!company) return res.status(404).json({ error: "Empresa não encontrada" });
      res.json(company);
    } catch (error: any) {
      console.error("Error updating company:", error);
      res.status(400).json({ error: "Erro ao atualizar empresa", details: error.message });
    }
  });

  app.delete("/api/companies/:id", requireFinancial, async (req, res) => {
    try {
      await storage.deleteCompany(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Erro ao excluir empresa", details: error.message });
    }
  });

  // CNPJ Search endpoint - sem autenticação para permitir teste
  app.get("/api/companies/search/cnpj/:cnpj", async (req, res) => {
    try {
      const { cnpj } = req.params;
      // Remove qualquer caractere não numérico do CNPJ
      const cleanCnpj = cnpj.replace(/\D/g, '');

      if (cleanCnpj.length !== 14) {
        return res.status(400).json({ error: "CNPJ inválido" });
      }

      // Search CNPJ in BrasilAPI (more reliable for this usage)
      console.log(`Searching CNPJ ${cleanCnpj} in BrasilAPI...`);
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        headers: {
          'User-Agent': 'GestaoFinanceira/1.0'
        }
      });

      console.log(`BrasilAPI response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "CNPJ não encontrado na base de dados" });
        }
        return res.status(response.status).json({ error: "Erro ao consultar API de CNPJ" });
      }

      const data = await response.json();

      // Transform response to match our format
      const formattedData = {
        razaoSocial: data.razao_social || '',
        nome: data.nome_fantasia || data.razao_social || '',
        cnpj: cleanCnpj,
        endereco: `${data.logradouro || ''}, ${data.numero || ''} ${data.complemento || ''}, ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}`.replace(/, ,/g, ',').replace(/, $/g, '').trim(),
        telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone_1}` : '',
        email: data.email || ''
      };

      res.json(formattedData);
    } catch (error: any) {
      console.error("Error searching CNPJ:", error);
      res.status(500).json({ error: "Erro ao buscar CNPJ", details: error.message });
    }
  });

  app.get("/api/suppliers", requireViewer, async (req, res) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", requireViewer, async (req, res) => {
    const supplier = await storage.getSupplier(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Fornecedor não encontrado" });
    res.json(supplier);
  });

  app.post("/api/suppliers", requireFinancial, async (req, res) => {
    const supplier = await storage.createSupplier(req.body);
    res.status(201).json(supplier);
  });

  app.patch("/api/suppliers/:id", requireFinancial, async (req, res) => {
    const supplier = await storage.updateSupplier(req.params.id, req.body);
    if (!supplier) return res.status(404).json({ error: "Not found" });
    res.json(supplier);
  });

  app.patch("/api/suppliers/:id/deactivate", requireFinancial, async (req, res) => {
    const supplier = await storage.deactivateSupplier(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Not found" });
    res.json(supplier);
  });

  app.patch("/api/suppliers/:id/activate", requireFinancial, async (req, res) => {
    const supplier = await storage.activateSupplier(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Not found" });
    res.json(supplier);
  });

  app.get("/api/clients", requireViewer, async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get("/api/clients/:id", requireViewer, async (req, res) => {
    const client = await storage.getClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json(client);
  });

  app.post("/api/clients", requireFinancial, async (req, res) => {
    const client = await storage.createClient(req.body);
    res.status(201).json(client);
  });

  app.patch("/api/clients/:id", requireFinancial, async (req, res) => {
    const client = await storage.updateClient(req.params.id, req.body);
    if (!client) return res.status(404).json({ error: "Not found" });
    res.json(client);
  });

  app.delete("/api/clients/:id", requireFinancial, async (req, res) => {
    await storage.deleteClient(req.params.id);
    res.status(204).send();
  });

  app.get("/api/categories", requireViewer, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", requireAdmin, async (req, res) => {
    const category = await storage.createCategory(req.body);
    res.status(201).json(category);
  });

  app.patch("/api/categories/:id", requireAdmin, async (req, res) => {
    const category = await storage.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: "Not found" });
    res.json(category);
  });

  app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
    await storage.deleteCategory(req.params.id);
    res.status(204).send();
  });

  app.get("/api/cost-centers", requireViewer, async (req, res) => {
    const costCenters = await storage.getCostCenters();
    res.json(costCenters);
  });

  app.post("/api/cost-centers", requireAdmin, async (req, res) => {
    const costCenter = await storage.createCostCenter(req.body);
    res.status(201).json(costCenter);
  });

  app.patch("/api/cost-centers/:id", requireAdmin, async (req, res) => {
    const costCenter = await storage.updateCostCenter(req.params.id, req.body);
    if (!costCenter) return res.status(404).json({ error: "Not found" });
    res.json(costCenter);
  });

  app.delete("/api/cost-centers/:id", requireAdmin, async (req, res) => {
    await storage.deleteCostCenter(req.params.id);
    res.status(204).send();
  });

  app.get("/api/accounts-payable", requireViewer, async (req, res) => {
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;

    // Handle case where companyId might be an array or comma-separated string due to duplicate query params
    if (Array.isArray(companyId)) {
      companyId = companyId.includes('all') ? 'all' : companyId[0];
    } else if (typeof companyId === 'string' && companyId.includes(',')) {
      const parts = companyId.split(',');
      companyId = parts.includes('all') ? 'all' : parts[0];
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    console.log(`GET /api/accounts-payable called. CompanyID: ${companyId}, Dates: ${startDate} to ${endDate}`);
    const accounts = await storage.getAccountsPayable(companyId, startDate, endDate);
    console.log(`GET /api/accounts-payable returning ${accounts.length} accounts`);
    res.json(accounts);
  });

  app.get("/api/accounts-payable/upcoming", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }
    const upcoming = await storage.getUpcomingAccountsPayable(startDate, endDate, companyId);
    res.json(upcoming);
  });


  app.post("/api/accounts-payable", requireFinancial, async (req, res) => {
    try {
      console.log("POST /api/accounts-payable", JSON.stringify(req.body));
      const companyId = req.headers['x-company-id'] as string;
      // Merge companyId into the body
      const account = await storage.createAccountPayable({ ...req.body, companyId });
      res.status(201).json(account);
    } catch (err) {
      res.status(400).json({ error: "Erro ao criar conta a pagar" });
    }
  });

  app.patch("/api/accounts-payable/:id", requireFinancial, async (req, res) => {
    const account = await storage.updateAccountPayable(req.params.id, req.body);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.patch("/api/accounts-payable/:id/pay", requireFinancial, async (req, res) => {
    const account = await storage.markAccountPayableAsPaid(req.params.id, req.body.paymentDate, req.body.lateFees, req.body.discount);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.post("/api/accounts-payable/bulk-pay", requireFinancial, async (req, res) => {
    try {
      const { ids, paymentDate, paymentMethod } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Lista de IDs inválida" });
      }
      const updated = await storage.bulkMarkAccountsPayableAsPaid(ids, paymentDate, paymentMethod);
      res.json(updated);
    } catch (error: any) {
      console.error("Error in bulk pay:", error);
      res.status(500).json({ error: "Erro ao processar pagamento em massa", details: error.message });
    }
  });

  app.delete("/api/accounts-payable/:id", requireFinancial, async (req, res) => {
    await storage.deleteAccountPayable(req.params.id);
    res.status(204).send();
  });

  app.patch("/api/accounts-payable/:id/deactivate", requireFinancial, async (req, res) => {
    const account = await storage.deactivateAccountPayable(req.params.id);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.get("/api/accounts-receivable", requireViewer, async (req, res) => {
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;

    // Handle case where companyId might be an array or comma-separated string
    if (Array.isArray(companyId)) {
      companyId = companyId.includes('all') ? 'all' : companyId[0];
    } else if (typeof companyId === 'string' && companyId.includes(',')) {
      const parts = companyId.split(',');
      companyId = parts.includes('all') ? 'all' : parts[0];
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    console.log(`GET /api/accounts-receivable called. CompanyID: ${companyId}, Dates: ${startDate} to ${endDate}`);
    const accounts = await storage.getAccountsReceivable(companyId, startDate, endDate);
    res.json(accounts);
  });

  app.get("/api/accounts-receivable/upcoming", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }
    const upcoming = await storage.getUpcomingAccountsReceivable(startDate, endDate, companyId);
    res.json(upcoming);
  });

  app.post("/api/accounts-receivable", requireFinancial, async (req, res) => {
    const companyId = req.headers['x-company-id'] as string;
    const account = await storage.createAccountReceivable({ ...req.body, companyId });
    res.status(201).json(account);
  });

  app.patch("/api/accounts-receivable/:id", requireFinancial, async (req, res) => {
    const account = await storage.updateAccountReceivable(req.params.id, req.body);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.patch("/api/accounts-receivable/:id/receive", requireFinancial, async (req, res) => {
    const account = await storage.markAccountReceivableAsReceived(req.params.id, req.body.receivedDate, req.body.discount, req.body.paymentMethod);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.post("/api/accounts-receivable/bulk-receive", requireFinancial, async (req, res) => {
    try {
      const { ids, receivedDate, paymentMethod } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Lista de IDs inválida" });
      }
      const updated = await storage.bulkMarkAccountsReceivableAsReceived(ids, receivedDate, paymentMethod);
      res.json(updated);
    } catch (error: any) {
      console.error("Error in bulk receive:", error);
      res.status(500).json({ error: "Erro ao processar recebimento em massa", details: error.message });
    }
  });

  app.delete("/api/accounts-receivable/:id", requireFinancial, async (req, res) => {
    await storage.deleteAccountReceivable(req.params.id);
    res.status(204).send();
  });

  // Card Transactions Routes (PDR)
  app.get("/api/card-transactions", requireViewer, async (req, res) => {
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const transactions = await storage.getCardTransactions(companyId, startDate, endDate);
    res.json(transactions);
  });

  app.get("/api/card-transactions/:id", requireViewer, async (req, res) => {
    const transaction = await storage.getCardTransaction(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    res.json(transaction);
  });

  app.post("/api/card-transactions", requireFinancial, async (req, res) => {
    try {
      const companyId = req.headers['x-company-id'] as string;
      const transaction = await storage.createCardTransaction({ ...req.body, companyId });
      res.status(201).json(transaction);
    } catch (err) {
      res.status(400).json({ error: "Error creating card transaction" });
    }
  });

  app.patch("/api/card-transactions/:id", requireFinancial, async (req, res) => {
    try {
      if (req.body.feePercentage !== undefined && req.user?.role !== "admin") {
        // If they are trying to change fee but are not admin, we could either error or just omit it.
        // PRD says "Apenas administradores podem alterar taxas".
        const existing = await storage.getCardTransaction(req.params.id);
        if (existing && existing.feePercentage !== req.body.feePercentage) {
          return res.status(403).json({ error: "Apenas administradores podem alterar taxas" });
        }
      }
      const transaction = await storage.updateCardTransaction(req.params.id, req.body);
      if (!transaction) return res.status(404).json({ error: "Transaction not found" });
      res.json(transaction);
    } catch (err) {
      res.status(400).json({ error: "Erro ao atualizar transação" });
    }
  });

  app.delete("/api/card-transactions/:id", requireFinancial, async (req, res) => {
    const success = await storage.deleteCardTransaction(req.params.id);
    if (!success) return res.status(404).json({ error: "Transaction not found" });
    res.status(204).send();
  });

  // Bank Accounts Routes
  app.get("/api/bank-accounts", requireViewer, async (req, res) => {
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    const accounts = await storage.getBankAccounts(companyId);
    res.json(accounts);
  });

  app.post("/api/bank-accounts", requireFinancial, async (req, res) => {
    const companyId = req.headers['x-company-id'] as string;
    const account = await storage.createBankAccount({ ...req.body, companyId });
    res.status(201).json(account);
  });

  app.patch("/api/bank-accounts/:id", requireFinancial, async (req, res) => {
    const account = await storage.updateBankAccount(req.params.id, req.body);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.delete("/api/bank-accounts/:id", requireFinancial, async (req, res) => {
    await storage.deleteBankAccount(req.params.id);
    res.status(204).send();
  });

  // Payment Configs (Taxas) Routes
  app.get("/api/payment-configs", requireViewer, async (req, res) => {
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    const configs = await storage.getPaymentConfigs(companyId);
    res.json(configs);
  });

  app.post("/api/payment-configs", requireFinancial, async (req, res) => {
    const companyId = req.headers['x-company-id'] as string;
    const config = await storage.createPaymentConfig({ ...req.body, companyId });
    res.status(201).json(config);
  });

  app.patch("/api/payment-configs/:id", requireFinancial, async (req, res) => {
    const config = await storage.updatePaymentConfig(req.params.id, req.body);
    if (!config) return res.status(404).json({ error: "Not found" });
    res.json(config);
  });

  app.delete("/api/payment-configs/:id", requireFinancial, async (req, res) => {
    await storage.deletePaymentConfig(req.params.id);
    res.status(204).send();
  });

  app.get("/api/dashboard/stats", requireViewer, async (req, res) => {
    console.log(`[Dashboard API] Fetching stats for user: ${req.user?.username}, authenticated: ${req.isAuthenticated()}`);
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }
    const stats = await storage.getDashboardStats(startDate, endDate, companyId);
    res.json(stats);
  });

  app.get("/api/dashboard/cash-flow", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }
    const data = await storage.getCashFlowDataByDateRange(startDate, endDate, companyId);
    res.json(data);
  });

  app.get("/api/dashboard/category-expenses", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }
    const data = await storage.getCategoryExpensesByDateRange(startDate, endDate, companyId);
    res.json(data);
  });

  app.get("/api/cash-flow", requireViewer, async (req, res) => {
    const period = (req.query.period as string) || "daily";
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }

    console.log(`[DEBUG] /api/cash-flow - companyId: ${companyId}, period: ${period}, startDate: ${startDate}, endDate: ${endDate}`);
    console.log(`[DEBUG] Data de hoje: ${new Date().toISOString().split('T')[0]}`);

    let data;
    if (startDate && endDate) {
      data = await storage.getCashFlowDataByDateRange(startDate, endDate, companyId);
    } else {
      data = await storage.getCashFlowData(period, companyId);
    }
    console.log(`[DEBUG] /api/cash-flow - returning ${data.length} items`);
    if (data.length > 0) {
      console.log(`[DEBUG] Primeiro item:`, data[0]);
      console.log(`[DEBUG] Último item:`, data[data.length - 1]);
    }
    res.json(data);
  });

  app.get("/api/cash-flow/summary", requireViewer, async (req, res) => {
    const period = (req.query.period as string) || "daily";
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }

    console.log(`[DEBUG] /api/cash-flow/summary - companyId: ${companyId}, period: ${period}`);

    let summary;
    if (startDate && endDate) {
      summary = await storage.getCashFlowSummaryByDateRange(startDate, endDate, companyId);
    } else {
      summary = await storage.getCashFlowSummary(period, companyId);
    }
    console.log(`[DEBUG] /api/cash-flow/summary - returning summary with totalIncome: ${summary?.totalIncome}`);
    res.json(summary);
  });

  app.get("/api/cash-flow/kpis", requireViewer, async (req, res) => {
    const period = (req.query.period as string) || "daily";
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }

    let kpis;
    if (startDate && endDate) {
      kpis = await storage.getCashFlowKPIsByDateRange(startDate, endDate, companyId);
    } else {
      kpis = await storage.getCashFlowKPIs(period, companyId);
    }
    res.json(kpis);
  });

  app.get("/api/cash-flow/alerts", requireViewer, async (req, res) => {
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }
    const alerts = await storage.getCashFlowAlerts(companyId);
    res.json(alerts);
  });

  app.get("/api/cash-flow/movements/:date", requireViewer, async (req, res) => {
    const { date } = req.params;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }
    const movements = await storage.getDailyMovements(date, companyId);
    res.json(movements);
  });

  app.get("/api/cash-flow/movements", requireViewer, async (req, res) => {
    const date = req.query.date as string;
    const period = req.query.period as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
    if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
    else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }

    console.log(`[DEBUG] /api/cash-flow/movements - companyId: ${companyId}, date: ${date}, period: ${period}, startDate: ${startDate}, endDate: ${endDate}`);

    let movements;
    if (startDate && endDate) {
      movements = await storage.getMovementsByDateRange(startDate, endDate, companyId);
    } else if (period) {
      movements = await storage.getMovementsByPeriod(period, companyId);
    } else if (date) {
      movements = await storage.getDailyMovements(date, companyId);
    } else {
      // Default to today's movements
      const today = new Date().toISOString().split("T")[0];
      movements = await storage.getDailyMovements(today, companyId);
    }
    console.log(`[DEBUG] /api/cash-flow/movements - returning ${movements.length} movements`);
    res.json(movements);
  });

  app.post("/api/cash-flow/entries", requireFinancial, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      console.log("Creating cash flow entry with body:", req.body);
      const companyId = req.headers['x-company-id'] as string;
      const entry = await storage.createCashFlowEntry({ ...req.body, userId, companyId });
      res.json(entry);
    } catch (error: any) {
      console.error("Error creating cash flow entry:", error);
      res.status(400).json({ error: "Erro ao criar movimentação", details: error.message });
    }
  });

  app.get("/api/cash-flow/entries", requireViewer, async (req, res) => {
    const companyId = (req.query.companyId as string) || (req.headers['x-company-id'] as string);
    const entries = await storage.getCashFlowEntries(companyId);
    res.json(entries);
  });

  app.post("/api/balance-adjustments", requireFinancial, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const adjustment = await storage.createBalanceAdjustment({ ...req.body, userId });
      res.json(adjustment);
    } catch (error) {
      console.error("Error creating balance adjustment:", error);
      res.status(400).json({ error: "Erro ao criar ajuste de saldo" });
    }
  });

  app.get("/api/balance-adjustments", requireViewer, async (req, res) => {
    const date = req.query.date as string;
    const adjustments = await storage.getBalanceAdjustments(date);
    res.json(adjustments);
  });

  app.get("/api/dre", requireViewer, async (req, res) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const data = await storage.getDREData(year, month);
    res.json(data);
  });

  app.get("/api/notes", requireViewer, async (req, res) => {
    const notes = await storage.getNotes();
    res.json(notes);
  });

  app.post("/api/notes", requireFinancial, async (req, res) => {
    const note = await storage.createNote(req.body);
    res.status(201).json(note);
  });

  app.patch("/api/notes/:id", requireFinancial, async (req, res) => {
    const note = await storage.updateNote(req.params.id, req.body);
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json(note);
  });

  app.delete("/api/notes/:id", requireFinancial, async (req, res) => {
    await storage.deleteNote(req.params.id);
    res.status(204).send();
  });

  app.get("/api/financial-goals", requireViewer, async (req, res) => {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const goals = await storage.getFinancialGoals(month, year);
    res.json(goals);
  });

  app.post("/api/financial-goals", requireFinancial, async (req, res) => {
    try {
      console.log("POST /api/financial-goals", JSON.stringify(req.body));
      const goal = await storage.createFinancialGoal(req.body);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(400).json({ error: "Erro ao criar meta" });
    }
  });

  app.patch("/api/financial-goals/:id", requireFinancial, async (req, res) => {
    const goal = await storage.updateFinancialGoal(req.params.id, req.body);
    if (!goal) return res.status(404).json({ error: "Not found" });
    res.json(goal);
  });

  app.delete("/api/financial-goals/:id", requireFinancial, async (req, res) => {
    await storage.deleteFinancialGoal(req.params.id);
    res.status(204).send();
  });

  app.get("/api/financial-goals/progress", requireViewer, async (req, res) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const progress = await storage.getFinancialGoalsProgress(month, year);
    res.json(progress);
  });

  app.get("/api/reports/:type", requireViewer, async (req, res) => {
    const { type } = req.params;
    const { format, month, year } = req.query;

    res.json({
      message: `Report ${type} requested in ${format} format for ${month}/${year}`,
      note: "PDF/Excel generation requires additional libraries",
    });
  });

  // Retail Sales Routes (Vendas de Varejo)
  app.get("/api/retail-sales", requireViewer, async (req, res) => {
    try {
      let companyId = req.query.companyId as string || req.headers['x-company-id'] as string;
      if (Array.isArray(companyId)) { companyId = companyId.includes('all') ? 'all' : companyId[0]; }
      else if (typeof companyId === 'string' && companyId.includes(',')) { const parts = companyId.split(','); companyId = parts.includes('all') ? 'all' : parts[0]; }

      const sales = await storage.getRetailSales(companyId);
      res.json(sales);
    } catch (error: any) {
      console.error("Error fetching retail sales:", error);
      res.status(500).json({ error: "Erro ao buscar vendas", details: error.message });
    }
  });

  app.post("/api/retail-sales", requireFinancial, async (req, res) => {
    console.log("[DEBUG] POST /api/retail-sales recebido:", req.body);
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const companyId = req.headers['x-company-id'] as string;
      const type = req.body.type || 'income';

      // Create the retail sale
      const sale = await storage.createRetailSale({
        ...req.body,
        userId,
        companyId
      });

      // Automatically create cash flow entry for this sale
      console.log(`[DEBUG] Creating cash flow entry for sale:`, {
        date: sale.date,
        description: `${type === 'income' ? 'Venda' : 'Despesa'}: ${sale.description}`,
        type: type,
        amount: parseFloat(sale.amount.toString()),
        companyId
      });

      const cashFlowEntry = await storage.createCashFlowEntry({
        date: sale.date,
        description: `${type === 'income' ? 'Venda' : 'Despesa'}: ${sale.description}`,
        type: type, // 'income' or 'expense'
        movementType: 'normal',
        amount: parseFloat(sale.amount.toString()).toString(),
        paymentMethod: sale.paymentMethod,
        account: sale.account,
        categoryId: sale.categoryId,
        status: 'confirmed',
        document: sale.document,
        costCenter: sale.costCenter,
        userId,
        companyId,
      });

      console.log(`[DEBUG] Cash flow entry created:`, cashFlowEntry);

      // Update the sale with the cash flow entry reference
      await storage.updateRetailSale(sale.id, { cashFlowEntryId: cashFlowEntry.id });

      res.status(201).json({ ...sale, cashFlowEntryId: cashFlowEntry.id });
    } catch (error: any) {
      console.error("Error creating retail sale:", error);
      res.status(400).json({ error: "Erro ao registrar movimentação", details: error.message });
    }
  });

  app.patch("/api/retail-sales/:id", requireFinancial, async (req, res) => {
    try {
      const sale = await storage.updateRetailSale(req.params.id, req.body);
      if (!sale) return res.status(404).json({ error: "Venda não encontrada" });
      res.json(sale);
    } catch (error: any) {
      console.error("Error updating retail sale:", error);
      res.status(400).json({ error: "Erro ao atualizar venda", details: error.message });
    }
  });

  app.delete("/api/retail-sales/:id", requireFinancial, async (req, res) => {
    try {
      // Get the sale first to find the associated cash flow entry
      const sale = await storage.getRetailSale(req.params.id);
      if (sale && sale.cashFlowEntryId) {
        // Delete the associated cash flow entry
        await storage.deleteCashFlowEntry(sale.cashFlowEntryId);
      }

      await storage.deleteRetailSale(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting retail sale:", error);
      res.status(500).json({ error: "Erro ao excluir venda", details: error.message });
    }
  });

  return httpServer;
}
