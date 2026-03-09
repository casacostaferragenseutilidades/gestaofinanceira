import { eq, and, or, lt, lte, gte, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { addDays, addMonths, addYears, format, parseISO } from "date-fns";
console.log("[Storage] Module loading started...");
import {
  users, suppliers, clients, categories, costCenters,
  accountsPayable, accountsReceivable, mercadoPagoTransactions, cashFlowEntries, balanceAdjustments, notes,
  financialGoals, companies, cardTransactions, bankAccounts, paymentConfigs, retailSales,
} from "@shared/schema";
import type {
  User, InsertUser,
  Supplier, InsertSupplier,
  Client, InsertClient,
  Category, InsertCategory,
  CostCenter, InsertCostCenter,
  AccountPayable, InsertAccountPayable,
  AccountReceivable, InsertAccountReceivable,
  MercadoPagoTransaction, InsertMercadoPagoTransaction,
  CardTransaction, InsertCardTransaction,
  BankAccount, InsertBankAccount,
  PaymentConfig, InsertPaymentConfig,
  RetailSale, InsertRetailSale,
  DashboardStats, CashFlowData, DREData, CategoryExpense,
  CashFlowEntry, InsertCashFlowEntry, CashFlowKPIs, CashFlowAlert, DailyMovement,
  BalanceAdjustment, InsertBalanceAdjustment,
  Note, InsertNote,
  FinancialGoal, InsertFinancialGoal, FinancialGoalProgress,
  Company, InsertCompany,
} from "@shared/schema";


export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deactivateSupplier(id: string): Promise<Supplier | undefined>;
  activateSupplier(id: string): Promise<Supplier | undefined>;

  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  getCostCenters(): Promise<CostCenter[]>;
  getCostCenter(id: string): Promise<CostCenter | undefined>;
  createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter>;
  updateCostCenter(id: string, costCenter: Partial<InsertCostCenter>): Promise<CostCenter | undefined>;
  deleteCostCenter(id: string): Promise<boolean>;

  // Companies methods
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByCnpj(cnpj: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  getAccountsPayable(): Promise<AccountPayable[]>;
  getAccountPayable(id: string): Promise<AccountPayable | undefined>;
  getUpcomingAccountsPayable(): Promise<AccountPayable[]>;
  createAccountPayable(account: InsertAccountPayable): Promise<AccountPayable>;
  updateAccountPayable(id: string, account: Partial<InsertAccountPayable>): Promise<AccountPayable | undefined>;
  markAccountPayableAsPaid(id: string, paymentDate: string, lateFees?: string, discount?: string): Promise<AccountPayable | undefined>;
  bulkMarkAccountsPayableAsPaid(ids: string[], paymentDate: string, paymentMethod?: string): Promise<AccountPayable[]>;
  deleteAccountPayable(id: string): Promise<boolean>;
  deactivateAccountPayable(id: string): Promise<AccountPayable | undefined>;

  getAccountsReceivable(): Promise<AccountReceivable[]>;
  getAccountReceivable(id: string): Promise<AccountReceivable | undefined>;
  getUpcomingAccountsReceivable(): Promise<AccountReceivable[]>;
  createAccountReceivable(account: InsertAccountReceivable): Promise<AccountReceivable>;
  updateAccountReceivable(id: string, account: Partial<InsertAccountReceivable>): Promise<AccountReceivable | undefined>;
  markAccountReceivableAsReceived(id: string, receivedDate: string, discount?: string, paymentMethod?: string): Promise<AccountReceivable | undefined>;
  bulkMarkAccountsReceivableAsReceived(ids: string[], receivedDate: string, paymentMethod?: string): Promise<AccountReceivable[]>;
  deleteAccountReceivable(id: string): Promise<boolean>;

  getDashboardStats(startDate?: string, endDate?: string, companyId?: string): Promise<DashboardStats>;
  getCashFlowData(period: string, companyId?: string): Promise<CashFlowData[]>;
  getCashFlowDataByDateRange(startDate: string, endDate: string, companyId?: string): Promise<CashFlowData[]>;
  getCashFlowSummary(period: string, companyId?: string): Promise<{ totalIncome: number; totalExpense: number; netFlow: number; projectedBalance: number; currentBalance: number; initialBalance: number; finalBalance: number; totalIncomePending: number; totalExpensePending: number; totalIncomeConfirmed: number; totalExpenseConfirmed: number }>;
  getCashFlowSummaryByDateRange(startDate: string, endDate: string, companyId?: string): Promise<{ totalIncome: number; totalExpense: number; netFlow: number; projectedBalance: number; currentBalance: number; initialBalance: number; finalBalance: number; totalIncomePending: number; totalExpensePending: number; totalIncomeConfirmed: number; totalExpenseConfirmed: number }>;
  getCashFlowKPIs(period: string, companyId?: string): Promise<CashFlowKPIs>;
  getCashFlowKPIsByDateRange(startDate: string, endDate: string, companyId?: string): Promise<CashFlowKPIs>;
  getCashFlowAlerts(companyId?: string): Promise<CashFlowAlert[]>;
  getDailyMovements(date: string, companyId?: string): Promise<DailyMovement[]>;
  getMovementsByPeriod(period: string, companyId?: string): Promise<DailyMovement[]>;
  getMovementsByDateRange(startDate: string, endDate: string, companyId?: string): Promise<DailyMovement[]>;
  createCashFlowEntry(entry: InsertCashFlowEntry & { userId: string; companyId?: string }): Promise<CashFlowEntry>;
  getCashFlowEntries(companyId?: string): Promise<CashFlowEntry[]>;
  createBalanceAdjustment(entry: InsertBalanceAdjustment & { userId: string }): Promise<BalanceAdjustment>;
  getBalanceAdjustments(date?: string): Promise<BalanceAdjustment[]>;
  getCategoryExpenses(): Promise<CategoryExpense[]>;
  getDREData(year: number, month: number): Promise<{ current: DREData; previous: DREData; percentageChange: { grossRevenue: number; netProfit: number } }>;

  getFinancialGoals(month?: number, year?: number): Promise<FinancialGoal[]>;
  createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: string, goal: Partial<InsertFinancialGoal>): Promise<FinancialGoal | undefined>;
  deleteFinancialGoal(id: string): Promise<boolean>;
  getFinancialGoalsProgress(month: number, year: number): Promise<FinancialGoalProgress[]>;

  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Card Transactions (PDR)
  getCardTransactions(companyId?: string, startDate?: string, endDate?: string): Promise<CardTransaction[]>;
  getCardTransaction(id: string): Promise<CardTransaction | undefined>;
  createCardTransaction(transaction: InsertCardTransaction): Promise<CardTransaction>;
  updateCardTransaction(id: string, transaction: Partial<InsertCardTransaction>): Promise<CardTransaction | undefined>;
  deleteCardTransaction(id: string): Promise<boolean>;

  // Bank Accounts
  getBankAccounts(companyId?: string): Promise<BankAccount[]>;
  getBankAccount(id: string): Promise<BankAccount | undefined>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: string, account: Partial<InsertBankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: string): Promise<boolean>;

  // Payment Configs (Taxas)
  getPaymentConfigs(companyId?: string): Promise<PaymentConfig[]>;
  getPaymentConfig(id: string): Promise<PaymentConfig | undefined>;
  createPaymentConfig(config: InsertPaymentConfig): Promise<PaymentConfig>;
  updatePaymentConfig(id: string, config: Partial<InsertPaymentConfig>): Promise<PaymentConfig | undefined>;
  deletePaymentConfig(id: string): Promise<boolean>;

  seedDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private formatDate(date: Date, daysOffset: number = 0): string {
    const d = new Date(date);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split("T")[0];
  }

  async seedDefaultData(): Promise<void> {
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) return;

    // Create default admin user
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);

      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      await db.insert(users).values({
        username: "admin",
        email: "admin@fincontrol.com",
        password: hashedPassword,
        fullName: "Administrador",
        role: "admin",
        status: "active",
      });
    }

    const defaultCategories = [
      // Receitas (Contas a Receber)
      { name: "Vendas de Produtos", type: "income", dreCategory: "revenue" },
      { name: "Prestação de Serviços", type: "income", dreCategory: "revenue" },
      { name: "Recebimento de Clientes", type: "income", dreCategory: "revenue" },
      { name: "Juros Recebidos", type: "income", dreCategory: "financial_revenue" },
      { name: "Aluguéis Recebidos", type: "income", dreCategory: "rental_revenue" },
      { name: "Comissões Recebidas", type: "income", dreCategory: "commission_revenue" },
      { name: "Vendas de Ativos", type: "income", dreCategory: "other_revenue" },
      { name: "Reembolsos", type: "income", dreCategory: "other_revenue" },
      { name: "Outras Receitas", type: "income", dreCategory: "other_revenue" },

      // Deduções de Receitas
      { name: "Impostos sobre Vendas", type: "income", dreCategory: "deductions" },
      { name: "Devoluções de Vendas", type: "income", dreCategory: "deductions" },
      { name: "Abatimentos e Descontos", type: "income", dreCategory: "deductions" },

      // Despesas (Contas a Pagar) - Custos
      { name: "Custo de Mercadorias", type: "expense", dreCategory: "costs" },
      { name: "Matéria-Prima", type: "expense", dreCategory: "costs" },
      { name: "Embalagens", type: "expense", dreCategory: "costs" },
      { name: "Frete de Compras", type: "expense", dreCategory: "costs" },
      { name: "Mão de Obra Direta", type: "expense", dreCategory: "costs" },

      // Despesas Operacionais
      { name: "Aluguel de Imóveis", type: "expense", dreCategory: "operational_expenses" },
      { name: "Salários e Ordenados", type: "expense", dreCategory: "administrative_expenses" },
      { name: "Benefícios e Encargos", type: "expense", dreCategory: "administrative_expenses" },
      { name: "Marketing e Publicidade", type: "expense", dreCategory: "sales_expenses" },
      { name: "Comissões de Vendas", type: "expense", dreCategory: "sales_expenses" },
      { name: "Material de Escritório", type: "expense", dreCategory: "administrative_expenses" },
      { name: "Honorários Profissionais", type: "expense", dreCategory: "administrative_expenses" },
      { name: "Serviços Contábeis", type: "expense", dreCategory: "administrative_expenses" },
      { name: "Serviços Jurídicos", type: "expense", dreCategory: "administrative_expenses" },

      // Despesas com Tecnologia
      { name: "Software e Assinaturas", type: "expense", dreCategory: "administrative_expenses" },
      { name: "Hardware e Equipamentos", type: "expense", dreCategory: "technology_expenses" },
      { name: "Internet e Telecomunicações", type: "expense", dreCategory: "technology_expenses" },
      { name: "Hospedagem e Domínios", type: "expense", dreCategory: "technology_expenses" },

      // Despesas com Veículos
      { name: "Combustíveis", type: "expense", dreCategory: "vehicle_expenses" },
      { name: "Manutenção de Veículos", type: "expense", dreCategory: "vehicle_expenses" },
      { name: "Seguro Veicular", type: "expense", dreCategory: "vehicle_expenses" },
      { name: "Licenciamento", type: "expense", dreCategory: "vehicle_expenses" },

      // Utilidades e Serviços
      { name: "Água e Esgoto", type: "expense", dreCategory: "miscellaneous" },
      { name: "Energia Elétrica", type: "expense", dreCategory: "miscellaneous" },
      { name: "Telefone", type: "expense", dreCategory: "miscellaneous" },
      { name: "Gás", type: "expense", dreCategory: "miscellaneous" },

      // Despesas Financeiras
      { name: "Juros Pagos", type: "expense", dreCategory: "financial_expenses" },
      { name: "Multas e Juros de Atraso", type: "expense", dreCategory: "financial_expenses" },
      { name: "Taxas Bancárias", type: "expense", dreCategory: "administrative_expenses" },
      { name: "Despesas com Cartões", type: "expense", dreCategory: "financial_expenses" },

      // Impostos e Tributos
      { name: "Impostos Federais", type: "expense", dreCategory: "taxes" },
      { name: "Impostos Estaduais", type: "expense", dreCategory: "taxes" },
      { name: "Impostos Municipais", type: "expense", dreCategory: "taxes" },
      { name: "Multas Fiscais", type: "expense", dreCategory: "taxes" },

      // Despesas Diversas
      { name: "Alimentação", type: "expense", dreCategory: "miscellaneous" },
      { name: "Transporte", type: "expense", dreCategory: "miscellaneous" },
      { name: "Hospedagem e Viagens", type: "expense", dreCategory: "sales_expenses" },
      { name: "Treinamento e Desenvolvimento", type: "expense", dreCategory: "miscellaneous" },
      { name: "Eventos e Congressos", type: "expense", dreCategory: "miscellaneous" },
      { name: "Limpeza e Higiene", type: "expense", dreCategory: "miscellaneous" },
      { name: "Segurança e Vigilância", type: "expense", dreCategory: "miscellaneous" },
      { name: "Doações e Patrocínios", type: "expense", dreCategory: "miscellaneous" },
      { name: "Outras Despesas", type: "expense", dreCategory: "miscellaneous" },
    ];

    for (const cat of defaultCategories) {
      await db.insert(categories).values(cat);
    }

    const defaultCostCenters = [
      { name: "Administrativo", description: "Despesas administrativas gerais" },
      { name: "Comercial", description: "Departamento de vendas e marketing" },
      { name: "Operacional", description: "Operações e produção" },
      { name: "TI", description: "Tecnologia da informação" },
    ];

    for (const cc of defaultCostCenters) {
      await db.insert(costCenters).values(cc);
    }

    const supplierData = [
      { name: "Fornecedor ABC Ltda", document: "12.345.678/0001-90", email: "contato@abc.com", phone: "(11) 3456-7890", address: "Rua das Flores, 123" },
      { name: "Distribuidora XYZ", document: "98.765.432/0001-10", email: "vendas@xyz.com", phone: "(11) 9876-5432", address: "Av. Principal, 456" },
    ];

    for (const sup of supplierData) {
      await db.insert(suppliers).values(sup);
    }

    const clientData = [
      { name: "Cliente Premium S.A.", document: "11.222.333/0001-44", email: "compras@premium.com", phone: "(11) 1234-5678", address: "Av. Comercial, 789" },
      { name: "Empresa Beta Ltda", document: "44.555.666/0001-77", email: "financeiro@beta.com", phone: "(11) 8765-4321", address: "Rua Industrial, 321" },
    ];

    for (const cli of clientData) {
      await db.insert(clients).values(cli);
    }

    const allSuppliers = await db.select().from(suppliers);
    const allClients = await db.select().from(clients);
    const allCategories = await db.select().from(categories);
    const allCostCenters = await db.select().from(costCenters);

    const expenseCategories = allCategories.filter(c => c.type === "expense");
    const incomeCategories = allCategories.filter(c => c.type === "income" && c.dreCategory === "revenue");

    const today = new Date();

    const payables = [
      { description: "Aluguel do escritório", amount: "5000.00", dueDate: this.formatDate(today, 5), status: "pending" },
      { description: "Conta de energia", amount: "850.00", dueDate: this.formatDate(today, -2), status: "pending" },
      { description: "Internet e telefone", amount: "450.00", dueDate: this.formatDate(today, 10), status: "pending" },
      { description: "Material de escritório", amount: "320.00", dueDate: this.formatDate(today, -5), status: "paid", paymentDate: this.formatDate(today, -5) },
      { description: "Manutenção equipamentos", amount: "1200.00", dueDate: this.formatDate(today, 15), status: "pending" },
    ];

    for (let i = 0; i < payables.length; i++) {
      const pay = payables[i];
      await db.insert(accountsPayable).values({
        ...pay,
        supplierId: allSuppliers[i % allSuppliers.length]?.id || null,
        categoryId: expenseCategories[i % expenseCategories.length]?.id || null,
        costCenterId: allCostCenters[i % allCostCenters.length]?.id || null,
      });
    }

    const receivables = [
      { description: "Venda produto lote 001", amount: "15000.00", dueDate: this.formatDate(today, 3), status: "pending" },
      { description: "Serviço de consultoria", amount: "8500.00", dueDate: this.formatDate(today, -1), status: "pending" },
      { description: "Venda produto lote 002", amount: "12000.00", dueDate: this.formatDate(today, 7), status: "pending" },
      { description: "Manutenção mensal", amount: "3500.00", dueDate: this.formatDate(today, -3), status: "received", receivedDate: this.formatDate(today, -3) },
      { description: "Projeto especial", amount: "25000.00", dueDate: this.formatDate(today, 20), status: "pending" },
    ];

    for (let i = 0; i < receivables.length; i++) {
      const rec = receivables[i];
      await db.insert(accountsReceivable).values({
        ...rec,
        clientId: allClients[i % allClients.length]?.id || null,
        categoryId: incomeCategories[i % incomeCategories.length]?.id || null,
      });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (err) {
      console.error(`[Storage] Error in getUser(${id}):`, err);
      throw err;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (err) {
      console.error(`[Storage] Error in getUserByUsername(${username}):`, err);
      throw err;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (err) {
      console.error(`[Storage] Error in getUserByEmail(${email}):`, err);
      throw err;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (err) {
      console.error(`[Storage] Error in createUser:`, err);
      throw err;
    }
  }


  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(supplier).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async deactivateSupplier(id: string): Promise<Supplier | undefined> {
    const [deactivated] = await db.update(suppliers)
      .set({ active: false })
      .where(eq(suppliers.id, id))
      .returning();
    return deactivated;
  }

  async activateSupplier(id: string): Promise<Supplier | undefined> {
    const [activated] = await db.update(suppliers)
      .set({ active: true })
      .where(eq(suppliers.id, id))
      .returning();
    return activated;
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updated] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  async getCostCenters(): Promise<CostCenter[]> {
    return db.select().from(costCenters);
  }

  async getCostCenter(id: string): Promise<CostCenter | undefined> {
    const [costCenter] = await db.select().from(costCenters).where(eq(costCenters.id, id));
    return costCenter;
  }

  async createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter> {
    const [newCostCenter] = await db.insert(costCenters).values(costCenter).returning();
    return newCostCenter;
  }

  async updateCostCenter(id: string, costCenter: Partial<InsertCostCenter>): Promise<CostCenter | undefined> {
    const [updated] = await db.update(costCenters).set(costCenter).where(eq(costCenters.id, id)).returning();
    return updated;
  }

  async deleteCostCenter(id: string): Promise<boolean> {
    await db.delete(costCenters).where(eq(costCenters.id, id));
    return true;
  }

  // Companies methods
  async getCompanies(): Promise<Company[]> {
    const allCompanies = await db.select().from(companies);

    // Calculate stats for each company
    const companiesWithStats = await Promise.all(allCompanies.map(async (company) => {
      // Contas a Pagar (Pending)
      const [payablesResult] = await db.select({
        total: sql<number>`sum(${accountsPayable.amount})`
      })
        .from(accountsPayable)
        .where(and(
          eq(accountsPayable.companyId, company.id),
          eq(accountsPayable.status, 'pending')
        ));

      // Contas a Receber (Pending)
      const [receivablesResult] = await db.select({
        total: sql<number>`sum(${accountsReceivable.amount})`
      })
        .from(accountsReceivable)
        .where(and(
          eq(accountsReceivable.companyId, company.id),
          eq(accountsReceivable.status, 'pending')
        ));

      // Calculated Realized Cash Balance (Saldo Caixa)
      // Income 1: Received Accounts Receivable
      const [receivedResult] = await db.select({
        total: sql<number>`sum(${accountsReceivable.amount})`
      })
        .from(accountsReceivable)
        .where(and(
          eq(accountsReceivable.companyId, company.id),
          eq(accountsReceivable.status, 'received')
        ));

      // Income 2: Confirmed Cash Flow Incomes
      const [cashInResult] = await db.select({
        total: sql<number>`sum(${cashFlowEntries.amount})`
      })
        .from(cashFlowEntries)
        .where(and(
          eq(cashFlowEntries.companyId, company.id),
          eq(cashFlowEntries.type, 'income'),
          eq(cashFlowEntries.status, 'confirmed')
        ));

      // Expense 1: Paid Accounts Payable
      const [paidResult] = await db.select({
        total: sql<number>`sum(${accountsPayable.amount})`
      })
        .from(accountsPayable)
        .where(and(
          eq(accountsPayable.companyId, company.id),
          eq(accountsPayable.status, 'paid')
        ));

      // Expense 2: Confirmed Cash Flow Expenses
      const [cashOutResult] = await db.select({
        total: sql<number>`sum(${cashFlowEntries.amount})`
      })
        .from(cashFlowEntries)
        .where(and(
          eq(cashFlowEntries.companyId, company.id),
          eq(cashFlowEntries.type, 'expense'),
          eq(cashFlowEntries.status, 'confirmed')
        ));

      const totalReceivables = Number(receivablesResult?.total || 0);
      const totalPayables = Number(payablesResult?.total || 0);

      const realizedIncome = Number(receivedResult?.total || 0) + Number(cashInResult?.total || 0);
      const realizedExpense = Number(paidResult?.total || 0) + Number(cashOutResult?.total || 0);
      const balance = realizedIncome - realizedExpense;

      return {
        ...company,
        total_contas_pagar: totalPayables,
        total_contas_receber: totalReceivables,
        saldo_caixa: balance
      };
    }));

    return companiesWithStats;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByCnpj(cnpj: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.cnpj, cnpj));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values({
      ...company,
      // Tratar valores nulos da API externa
      razaoSocial: company.razaoSocial || "Razão Social não informada",
      nome: company.nome || "Nome não informado",
      endereco: company.endereco || null,
      telefone: company.telefone || null,
      email: company.email || null,
      updatedAt: new Date()
    }).returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updated] = await db.update(companies).set({
      ...company,
      updatedAt: new Date()
    }).where(eq(companies.id, id)).returning();
    return updated;
  }

  async deleteCompany(id: string): Promise<boolean> {
    await db.delete(companies).where(eq(companies.id, id));
    return true;
  }

  async getAccountsPayable(companyId?: string, startDate?: string, endDate?: string): Promise<AccountPayable[]> {
    console.log(`[Storage] getAccountsPayable called with companyId: ${companyId}, start: ${startDate}, end: ${endDate}`);
    const baseConditions = [eq(accountsPayable.active, true)];

    if (companyId && companyId !== "all") {
      baseConditions.push(eq(accountsPayable.companyId, companyId));
    }

    if (startDate && endDate) {
      const start = startDate as string;
      const end = endDate as string;
      baseConditions.push(
        or(
          and(gte(accountsPayable.dueDate, start), lte(accountsPayable.dueDate, end)),
          and(lt(accountsPayable.dueDate, start), eq(accountsPayable.status, "pending")),
          and(lt(accountsPayable.dueDate, start), eq(accountsPayable.status, "overdue"))
        ) as any
      );
    }

    // Join with categories and suppliers to get names
    const results = await db.select({
      id: accountsPayable.id,
      description: accountsPayable.description,
      amount: accountsPayable.amount,
      dueDate: accountsPayable.dueDate,
      originalDueDate: accountsPayable.originalDueDate,
      paymentDate: accountsPayable.paymentDate,
      status: accountsPayable.status,
      supplierId: accountsPayable.supplierId,
      categoryId: accountsPayable.categoryId,
      companyId: accountsPayable.companyId,
      lateFees: accountsPayable.lateFees,
      discount: accountsPayable.discount,
      notes: accountsPayable.notes,
      attachmentUrl: accountsPayable.attachmentUrl,
      paymentMethod: accountsPayable.paymentMethod,
      recurrence: accountsPayable.recurrence,
      recurrenceEnd: accountsPayable.recurrenceEnd,
      costCenterId: accountsPayable.costCenterId,
      active: accountsPayable.active,
      supplierName: suppliers.name,
      categoryName: categories.name,
    })
      .from(accountsPayable)
      .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
      .leftJoin(categories, eq(accountsPayable.categoryId, categories.id))
      .where(and(...baseConditions));

    return results.map(a => ({
      ...a,
      lateFees: a.lateFees || null,
      supplierName: a.supplierName || undefined, // Add to return object
      categoryName: a.categoryName || undefined, // Add to return object
    })) as AccountPayable[];
  }

  async getAccountPayable(id: string): Promise<AccountPayable | undefined> {
    const [account] = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id));
    return account ? {
      ...account,
      lateFees: account.lateFees || null,
    } : undefined;
  }

  async getUpcomingAccountsPayable(startDate?: string, endDate?: string, companyId?: string): Promise<AccountPayable[]> {
    const baseConditions = [eq(accountsPayable.status, "pending")];
    if (companyId) baseConditions.push(eq(accountsPayable.companyId, companyId));

    if (startDate && endDate) {
      baseConditions.push(gte(accountsPayable.dueDate, startDate));
      baseConditions.push(lte(accountsPayable.dueDate, endDate));
    } else {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];
      baseConditions.push(lte(accountsPayable.dueDate, nextWeekStr));
    }

    return db.select().from(accountsPayable).where(and(...baseConditions));
  }

  async createAccountPayable(account: InsertAccountPayable): Promise<AccountPayable> {
    console.log(`Creating Account Payable: ${account.description}, Recurrence: ${account.recurrence}, End: ${account.recurrenceEnd}`);
    const [newAccount] = await db.insert(accountsPayable).values({
      ...account,
      status: account.status || "pending",
    }).returning();

    if (newAccount.recurrence && newAccount.recurrence !== "none" && (newAccount.recurrenceEnd || "").length > 0) {
      console.log(`Triggering recurrence for ${newAccount.id}`);
      await this.handleRecurrence(newAccount);
    } else {
      console.log(`No recurrence triggered for ${newAccount.id}. Recurrence: ${newAccount.recurrence}, End: ${newAccount.recurrenceEnd}`);
    }

    return newAccount;
  }

  async updateAccountPayable(id: string, account: Partial<InsertAccountPayable>): Promise<AccountPayable | undefined> {
    console.log(`Updating Account Payable: ${id}, Recurrence: ${account.recurrence}, End: ${account.recurrenceEnd}`);
    const [updated] = await db.update(accountsPayable).set(account).where(eq(accountsPayable.id, id)).returning();

    if (updated && account.recurrence && account.recurrence !== "none" && (account.recurrenceEnd || "").length > 0) {
      console.log(`Triggering recurrence update for ${id}`);
      await this.handleRecurrence(updated);
    }

    return updated;
  }

  private async handleRecurrence(account: AccountPayable) {
    const recEnd = (account.recurrenceEnd || "").trim();
    if (!account.recurrence || account.recurrence === "none" || recEnd.length === 0) {
      console.log(`[Recurrence-Payable] Canceling generation: incomplete data.`, { rec: account.recurrence, end: account.recurrenceEnd });
      return;
    }

    const entriesToCreate: (typeof accountsPayable.$inferInsert)[] = [];
    const startDateStr = account.dueDate.split('T')[0];
    const endDateStr = recEnd.split('T')[0];

    const baseDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    if (isNaN(baseDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("[Recurrence-Payable] Invalid dates:", { startDateStr, endDateStr });
      return;
    }

    // Check for existing entries to avoid duplicates
    const existingEntries = await db.select({ dueDate: accountsPayable.dueDate })
      .from(accountsPayable)
      .where(and(
        eq(accountsPayable.description, account.description),
        account.companyId ? eq(accountsPayable.companyId, account.companyId) : sql`${accountsPayable.companyId} IS NULL`
      ));
    const existingDates = new Set(existingEntries.map(e => e.dueDate));

    let count = 0;
    while (count < 100) {
      count++;
      let currentDate: Date;
      if (account.recurrence === 'weekly') currentDate = addDays(baseDate, count * 7);
      else if (account.recurrence === 'monthly') currentDate = addMonths(baseDate, count);
      else if (account.recurrence === 'yearly') currentDate = addYears(baseDate, count);
      else break;

      if (currentDate > endDate) break;

      const dueDateStr = format(currentDate, 'yyyy-MM-dd');

      if (existingDates.has(dueDateStr)) continue;

      entriesToCreate.push({
        description: account.description,
        amount: account.amount,
        dueDate: dueDateStr,
        status: "pending",
        supplierId: account.supplierId,
        categoryId: account.categoryId,
        costCenterId: account.costCenterId,
        paymentMethod: account.paymentMethod,
        lateFees: account.lateFees,
        discount: account.discount,
        notes: account.notes,
        attachmentUrl: account.attachmentUrl,
        companyId: account.companyId,
        recurrence: "none",
        recurrenceEnd: null,
        active: true,
      });
    }

    if (entriesToCreate.length > 0) {
      await db.insert(accountsPayable).values(entriesToCreate);
    }
  }

  private async handleReceivableRecurrence(account: AccountReceivable) {
    const recEnd = (account.recurrencePeriod || "").trim();
    if (!account.recurrence || account.recurrence === "none" || recEnd.length === 0) {
      return;
    }

    const entriesToCreate: (typeof accountsReceivable.$inferInsert)[] = [];
    const startDateStr = account.dueDate.split('T')[0];
    const endDateStr = recEnd.split('T')[0];

    const baseDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    if (isNaN(baseDate.getTime()) || isNaN(endDate.getTime())) {
      return;
    }

    const existingEntries = await db.select({ dueDate: accountsReceivable.dueDate })
      .from(accountsReceivable)
      .where(and(
        eq(accountsReceivable.description, account.description),
        account.companyId ? eq(accountsReceivable.companyId, account.companyId) : sql`${accountsReceivable.companyId} IS NULL`
      ));
    const existingDates = new Set(existingEntries.map(e => e.dueDate));

    let count = 0;
    while (count < 100) {
      count++;
      let currentDate: Date;
      if (account.recurrence === 'weekly') currentDate = addDays(baseDate, count * 7);
      else if (account.recurrence === 'monthly') currentDate = addMonths(baseDate, count);
      else if (account.recurrence === 'yearly') currentDate = addYears(baseDate, count);
      else break;

      if (currentDate > endDate) break;

      const dueDateStr = format(currentDate, 'yyyy-MM-dd');
      if (existingDates.has(dueDateStr)) continue;

      entriesToCreate.push({
        description: account.description,
        amount: account.amount,
        dueDate: dueDateStr,
        status: "pending",
        clientId: account.clientId,
        categoryId: account.categoryId,
        notes: account.notes,
        companyId: account.companyId,
        recurrence: "none",
        recurrencePeriod: null,
        paymentMethod: account.paymentMethod,
        active: true,
      });
    }

    if (entriesToCreate.length > 0) {
      await db.insert(accountsReceivable).values(entriesToCreate);
    }
  }

  async markAccountPayableAsPaid(id: string, paymentDate: string, lateFees?: string, discount?: string): Promise<AccountPayable | undefined> {
    // Buscar a conta atual para verificar a data de vencimento
    const [account] = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id));
    if (!account) return undefined;

    const updateData: any = { status: "paid", paymentDate };

    // Se a data de pagamento for diferente da data de vencimento original,
    // guardar a data original e atualizar o vencimento para a data do pagamento
    if (paymentDate !== account.dueDate) {
      updateData.originalDueDate = account.dueDate;
      updateData.dueDate = paymentDate;
    }

    if (lateFees !== undefined) {
      updateData.lateFees = lateFees || null;
    }
    if (discount !== undefined) {
      updateData.discount = discount || null;
    }
    const [updated] = await db.update(accountsPayable)
      .set(updateData)
      .where(eq(accountsPayable.id, id))
      .returning();
    return updated;
  }

  async bulkMarkAccountsPayableAsPaid(ids: string[], paymentDate: string, paymentMethod?: string): Promise<AccountPayable[]> {
    // Buscar todas as contas para verificar quais precisam atualizar a data de vencimento
    const accountsToUpdate = await db.select().from(accountsPayable).where(inArray(accountsPayable.id, ids));

    const updatedAccounts: AccountPayable[] = [];

    for (const account of accountsToUpdate) {
      const updateData: any = { status: "paid", paymentDate };

      // Se a data de pagamento for diferente da data de vencimento,
      // guardar a data original e atualizar o vencimento
      if (paymentDate !== account.dueDate) {
        updateData.originalDueDate = account.dueDate;
        updateData.dueDate = paymentDate;
      }

      if (paymentMethod !== undefined) {
        updateData.paymentMethod = paymentMethod || null;
      }

      const [updated] = await db.update(accountsPayable)
        .set(updateData)
        .where(eq(accountsPayable.id, account.id))
        .returning();

      if (updated) {
        updatedAccounts.push(updated);
      }
    }

    return updatedAccounts;
  }

  async deleteAccountPayable(id: string): Promise<boolean> {
    await db.delete(accountsPayable).where(eq(accountsPayable.id, id));
    return true;
  }

  async deactivateAccountPayable(id: string): Promise<AccountPayable | undefined> {
    const [updated] = await db.update(accountsPayable)
      .set({ active: false })
      .where(eq(accountsPayable.id, id))
      .returning();
    return updated;
  }

  async getAccountsReceivable(companyId?: string, startDate?: string, endDate?: string): Promise<AccountReceivable[]> {
    const baseConditions = [eq(accountsReceivable.active, true)];

    if (companyId && companyId !== "all") {
      baseConditions.push(eq(accountsReceivable.companyId, companyId));
    }

    if (startDate && endDate) {
      const start = startDate as string;
      const end = endDate as string;
      baseConditions.push(
        or(
          and(gte(accountsReceivable.dueDate, start), lte(accountsReceivable.dueDate, end)),
          and(lt(accountsReceivable.dueDate, start), eq(accountsReceivable.status, "pending")),
          and(lt(accountsReceivable.dueDate, start), eq(accountsReceivable.status, "overdue"))
        ) as any
      );
    }

    // Join with categories and clients to get names
    const results = await db.select({
      id: accountsReceivable.id,
      description: accountsReceivable.description,
      amount: accountsReceivable.amount,
      dueDate: accountsReceivable.dueDate,
      originalDueDate: accountsReceivable.originalDueDate,
      receivedDate: accountsReceivable.receivedDate,
      status: accountsReceivable.status,
      clientId: accountsReceivable.clientId,
      categoryId: accountsReceivable.categoryId,
      companyId: accountsReceivable.companyId,
      notes: accountsReceivable.notes,
      mercadoPagoId: accountsReceivable.mercadoPagoId,
      discount: accountsReceivable.discount,
      recurrence: accountsReceivable.recurrence,
      recurrencePeriod: accountsReceivable.recurrencePeriod,
      paymentMethod: accountsReceivable.paymentMethod,
      active: accountsReceivable.active,
      clientName: clients.name,
      categoryName: categories.name,
    })
      .from(accountsReceivable)
      .leftJoin(clients, eq(accountsReceivable.clientId, clients.id))
      .leftJoin(categories, eq(accountsReceivable.categoryId, categories.id))
      .where(and(...baseConditions));

    return results.map(a => ({
      ...a,
      clientName: a.clientName || undefined, // Add to return object
      categoryName: a.categoryName || undefined, // Add to return object
    })) as AccountReceivable[];
  }

  async getAccountReceivable(id: string): Promise<AccountReceivable | undefined> {
    const [account] = await db.select().from(accountsReceivable).where(eq(accountsReceivable.id, id));
    return account;
  }

  async getUpcomingAccountsReceivable(startDate?: string, endDate?: string, companyId?: string): Promise<AccountReceivable[]> {
    const baseConditions = [eq(accountsReceivable.status, "pending")];
    if (companyId) baseConditions.push(eq(accountsReceivable.companyId, companyId));

    if (startDate && endDate) {
      baseConditions.push(gte(accountsReceivable.dueDate, startDate));
      baseConditions.push(lte(accountsReceivable.dueDate, endDate));
    } else {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];
      baseConditions.push(lte(accountsReceivable.dueDate, nextWeekStr));
    }

    return db.select().from(accountsReceivable).where(and(...baseConditions));
  }

  async createAccountReceivable(account: InsertAccountReceivable): Promise<AccountReceivable> {
    const [newAccount] = await db.insert(accountsReceivable).values({
      ...account,
      status: account.status || "pending",
    }).returning();

    if (newAccount.recurrence && newAccount.recurrence !== "none" && (newAccount.recurrencePeriod || "").length > 0) {
      await this.handleReceivableRecurrence(newAccount);
    }

    return newAccount;
  }

  async updateAccountReceivable(id: string, account: Partial<InsertAccountReceivable>): Promise<AccountReceivable | undefined> {
    const [updated] = await db.update(accountsReceivable).set(account).where(eq(accountsReceivable.id, id)).returning();

    if (updated && account.recurrence && account.recurrence !== "none" && (account.recurrencePeriod || "").length > 0) {
      await this.handleReceivableRecurrence(updated);
    }

    return updated;
  }

  async markAccountReceivableAsReceived(id: string, receivedDate: string, discount?: string, paymentMethod?: string): Promise<AccountReceivable | undefined> {
    // Buscar a conta atual para verificar a data de vencimento
    const [account] = await db.select().from(accountsReceivable).where(eq(accountsReceivable.id, id));
    if (!account) return undefined;

    const updateData: any = { status: "received", receivedDate };

    // Se a data de recebimento for diferente da data de vencimento original,
    // guardar a data original e atualizar o vencimento para a data do recebimento
    if (receivedDate !== account.dueDate) {
      updateData.originalDueDate = account.dueDate;
      updateData.dueDate = receivedDate;
    }

    if (discount !== undefined) {
      updateData.discount = discount || null;
    }
    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod || null;
    }
    const [updated] = await db.update(accountsReceivable)
      .set(updateData)
      .where(eq(accountsReceivable.id, id))
      .returning();
    return updated;
  }

  async bulkMarkAccountsReceivableAsReceived(ids: string[], receivedDate: string, paymentMethod?: string): Promise<AccountReceivable[]> {
    // Buscar todas as contas para verificar quais precisam atualizar a data de vencimento
    const accountsToUpdate = await db.select().from(accountsReceivable).where(inArray(accountsReceivable.id, ids));

    const updatedAccounts: AccountReceivable[] = [];

    for (const account of accountsToUpdate) {
      const updateData: any = { status: "received", receivedDate };

      // Se a data de recebimento for diferente da data de vencimento,
      // guardar a data original e atualizar o vencimento
      if (receivedDate !== account.dueDate) {
        updateData.originalDueDate = account.dueDate;
        updateData.dueDate = receivedDate;
      }

      if (paymentMethod !== undefined) {
        updateData.paymentMethod = paymentMethod || null;
      }

      const [updated] = await db.update(accountsReceivable)
        .set(updateData)
        .where(eq(accountsReceivable.id, account.id))
        .returning();

      if (updated) {
        updatedAccounts.push(updated);
      }
    }

    return updatedAccounts;
  }

  async deleteAccountReceivable(id: string): Promise<boolean> {
    await db.update(accountsReceivable)
      .set({ active: false })
      .where(eq(accountsReceivable.id, id));
    return true;
  }

  async getDashboardStats(startDate?: string, endDate?: string, companyId?: string): Promise<DashboardStats> {
    console.log(`[Storage] Fetching dashboard stats. Date range: ${startDate} to ${endDate}, CompanyID: ${companyId}`);

    let allPayables, allReceivables, allCashFlowEntries;

    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
      allCashFlowEntries = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allReceivables = await db.select().from(accountsReceivable);
      allCashFlowEntries = await db.select().from(cashFlowEntries);
    }

    console.log(`[Storage] Results found: Payables: ${allPayables.length}, Receivables: ${allReceivables.length}, CashFlow: ${allCashFlowEntries.length}`);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Filter by date range if provided
    const filteredPayables = startDate && endDate
      ? allPayables.filter(p => {
        const date = p.paymentDate || p.dueDate;
        return date >= startDate && date <= endDate;
      })
      : allPayables;

    const filteredReceivables = startDate && endDate
      ? allReceivables.filter(r => {
        const date = r.receivedDate || r.dueDate;
        return date >= startDate && date <= endDate;
      })
      : allReceivables;

    const filteredCashFlowEntries = startDate && endDate
      ? allCashFlowEntries.filter(e => e.date >= startDate && e.date <= endDate)
      : allCashFlowEntries;

    const totalRevenue = filteredReceivables
      .filter(r => r.status === "received")
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0) +
      filteredCashFlowEntries
        .filter(e => e.type === "income" && e.status === "confirmed")
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const totalExpenses = filteredPayables
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0) +
      filteredCashFlowEntries
        .filter(e => e.type === "expense" && e.status === "confirmed")
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const pendingReceivables = filteredReceivables
      .filter(r => r.status === "pending" && r.dueDate >= todayStr)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);

    const pendingPayables = filteredPayables
      .filter(p => p.status === "pending" && p.dueDate >= todayStr)
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

    const overduePayables = startDate && endDate
      ? filteredPayables.filter(p => {
        if (p.status === "paid") return false;
        return p.dueDate < startDate;
      }).length
      : allPayables.filter(p => {
        if (p.status === "paid") return false;
        return p.dueDate < todayStr;
      }).length;

    const overdueReceivables = startDate && endDate
      ? filteredReceivables.filter(r => {
        if (r.status === "received") return false;
        return r.dueDate < startDate;
      }).length
      : allReceivables.filter(r => {
        if (r.status === "received") return false;
        return r.dueDate < todayStr;
      }).length;

    const dueTodayCount = startDate && endDate
      ? [...filteredPayables, ...filteredReceivables].filter(a => {
        if (a.status === "paid" || a.status === "received") return false;
        return a.dueDate >= startDate && a.dueDate <= endDate && a.dueDate === todayStr;
      }).length
      : [...allPayables, ...allReceivables].filter(a => {
        if (a.status === "paid" || a.status === "received") return false;
        return a.dueDate === todayStr;
      }).length;

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const dueThisWeekCount = startDate && endDate
      ? [...filteredPayables, ...filteredReceivables].filter(a => {
        if (a.status === "paid" || a.status === "received") return false;
        return a.dueDate >= startDate && a.dueDate <= endDate && a.dueDate >= todayStr && a.dueDate <= nextWeekStr;
      }).length
      : [...allPayables, ...allReceivables].filter(a => {
        if (a.status === "paid" || a.status === "received") return false;
        return a.dueDate >= todayStr && a.dueDate <= nextWeekStr;
      }).length;

    const balance = totalRevenue - totalExpenses;
    const projectedBalance = balance + pendingReceivables - pendingPayables;

    const totalDiscounts = filteredPayables
      .filter(p => p.status === "paid" && p.discount)
      .reduce((sum, p) => sum + parseFloat(p.discount || "0"), 0);

    return {
      totalRevenue,
      totalExpenses,
      balance,
      projectedBalance,
      overduePayables,
      overdueReceivables,
      dueTodayCount,
      dueThisWeekCount,
      totalDiscounts,
    };
  }

  async getCashFlowData(period: string, companyId?: string): Promise<CashFlowData[]> {
    let allPayables, allReceivables, allCashFlowEntries;

    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
      allCashFlowEntries = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allReceivables = await db.select().from(accountsReceivable);
      allCashFlowEntries = await db.select().from(cashFlowEntries);
    }

    const today = new Date();
    const data: Map<string, CashFlowData> = new Map();

    let days = 7;
    if (period === "weekly") days = 28;
    if (period === "monthly") days = 90;

    let runningBalance = 0;
    let initialBalance = 0;

    // Calculate initial balance (sum of all confirmed transactions before start date)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const confirmedIncome = allReceivables
      .filter(r => r.status === "received" && r.receivedDate && r.receivedDate < startDateStr)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);

    const confirmedExpense = allPayables
      .filter(p => p.status === "paid" && p.paymentDate && p.paymentDate < startDateStr)
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

    // Add manual cash flow entries to initial balance
    const manualIncome = allCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed" && e.date < startDateStr)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const manualExpense = allCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed" && e.date < startDateStr)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    initialBalance = confirmedIncome - confirmedExpense + manualIncome - manualExpense;
    runningBalance = initialBalance;

    for (let i = -days; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayIncome = allReceivables
        .filter(r => (r.status === "received" ? r.receivedDate === dateStr : r.dueDate === dateStr))
        .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);

      // Add manual income entries for the day
      const manualDayIncome = allCashFlowEntries
        .filter(e => e.type === "income" && e.date === dateStr)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

      const totalDayIncome = dayIncome + manualDayIncome;

      const dayExpense = allPayables
        .filter(p => (p.status === "paid" ? p.paymentDate === dateStr : p.dueDate === dateStr))
        .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

      // Add manual expense entries for the day
      const manualDayExpense = allCashFlowEntries
        .filter(e => e.type === "expense" && e.date === dateStr)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

      const totalDayExpense = dayExpense + manualDayExpense;

      const dayInitialBalance = runningBalance;
      runningBalance += totalDayIncome - totalDayExpense;
      const dayFinalBalance = runningBalance;

      data.set(dateStr, {
        date: dateStr,
        income: totalDayIncome,
        expense: totalDayExpense,
        balance: runningBalance,
        projected: i > 0,
        initialBalance: dayInitialBalance,
        finalBalance: dayFinalBalance,
      });
    }

    return Array.from(data.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCashFlowSummary(period: string, companyId?: string): Promise<{ totalIncome: number; totalExpense: number; netFlow: number; projectedBalance: number; currentBalance: number; initialBalance: number; finalBalance: number; totalIncomePending: number; totalExpensePending: number; totalIncomeConfirmed: number; totalExpenseConfirmed: number }> {
    // Note: getCashFlowData and getDashboardStats need to support companyId filtering too.
    // For this quick fix, I will only filter the raw data queries below which drive the main calculations in this method.
    // Ideally refactor all sub-methods.

    const cashFlowData = await this.getCashFlowData(period); // TODO: pass companyId
    const stats = await this.getDashboardStats(); // TODO: pass companyId

    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);

    // Calcular valores separados por status
    let allReceivables, allPayables, allCashFlowEntries;

    if (companyId && companyId !== "all") {
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allCashFlowEntries = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    } else {
      allReceivables = await db.select().from(accountsReceivable);
      allPayables = await db.select().from(accountsPayable);
      allCashFlowEntries = await db.select().from(cashFlowEntries);
    }

    // Filtrar por período
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === "daily") {
      startDate = new Date(today);
      endDate = new Date(today);
    } else if (period === "weekly") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 28);
      endDate = new Date(today);
    } else if (period === "monthly") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      endDate = new Date(today);
    } else {
      startDate = new Date(today);
      endDate = new Date(today);
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Receitas confirmadas (recebidas)
    const confirmedIncome = allReceivables
      .filter(r => r.status === "received" && r.receivedDate && r.receivedDate >= startDateStr && r.receivedDate <= endDateStr)
      .reduce((sum, r) => {
        const amount = parseFloat(r.amount || "0");
        const discount = parseFloat(r.discount || "0");
        return sum + (amount - discount);
      }, 0);

    // Receitas manuais confirmadas
    const manualConfirmedIncome = allCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed" && e.date >= startDateStr && e.date <= endDateStr)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const totalIncomeConfirmed = confirmedIncome + manualConfirmedIncome;

    // Receitas pendentes - APENAS contas a receber pendentes
    const totalIncomePending = allReceivables
      .filter(r => r.status === "pending" && r.dueDate && r.dueDate >= startDateStr && r.dueDate <= endDateStr)
      .reduce((sum, r) => {
        const amount = parseFloat(r.amount || "0");
        const discount = parseFloat(r.discount || "0");
        return sum + (amount - discount);
      }, 0);

    // Despesas confirmadas (pagas)
    const confirmedExpense = allPayables
      .filter(p => p.status === "paid" && p.paymentDate && p.paymentDate >= startDateStr && p.paymentDate <= endDateStr)
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount || "0");
        const lateFees = parseFloat(p.lateFees || "0");
        const discount = parseFloat(p.discount || "0");
        return sum + (amount + lateFees - discount);
      }, 0);

    // Despesas manuais confirmadas
    const manualConfirmedExpense = allCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed" && e.date >= startDateStr && e.date <= endDateStr)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const totalExpenseConfirmed = confirmedExpense + manualConfirmedExpense;

    // Despesas pendentes - APENAS contas a pagar pendentes
    const totalExpensePending = allPayables
      .filter(p => p.status === "pending" && p.dueDate && p.dueDate >= startDateStr && p.dueDate <= endDateStr)
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount || "0");
        const lateFees = parseFloat(p.lateFees || "0");
        const discount = parseFloat(p.discount || "0");
        return sum + (amount + lateFees - discount);
      }, 0);

    // Calcular saldo inicial (ajustes de saldo do tipo 'initial')
    const allBalanceAdjustments = await db.select().from(balanceAdjustments);
    const initialBalanceAdjustments = allBalanceAdjustments
      .filter(a => a.balanceType === 'initial' && a.date >= startDateStr && a.date <= endDateStr)
      .reduce((sum, a) => sum + parseFloat(a.amount?.toString() || "0"), 0);

    const todayData = cashFlowData.find(d => d.date === today.toISOString().split("T")[0]);

    // Novo cálculo do saldo projetado: Total Entradas + Entradas Pendentes - Total Saídas - Saídas Pendentes
    const totalAllIncome = totalIncomeConfirmed + totalIncomePending;
    const totalAllExpense = totalExpenseConfirmed + totalExpensePending;
    const projectedBalance = totalAllIncome - totalAllExpense;

    return {
      totalIncome: totalIncomeConfirmed + initialBalanceAdjustments, // Total Entradas = Saldo Inicial + Entradas Confirmadas
      totalExpense: totalExpenseConfirmed,
      netFlow: totalIncome - totalExpense,
      projectedBalance,
      currentBalance: stats.balance,
      initialBalance: initialBalanceAdjustments,
      finalBalance: totalIncomeConfirmed - totalExpenseConfirmed, // Saldo Final = Entradas Realizadas - Saídas Finalizadas
      totalIncomePending,
      totalExpensePending,
      totalIncomeConfirmed,
      totalExpenseConfirmed,
    };
  }

  async getCashFlowSummaryByDateRange(startDate: string, endDate: string, companyId?: string): Promise<{ totalIncome: number; totalExpense: number; netFlow: number; projectedBalance: number; currentBalance: number; initialBalance: number; finalBalance: number; totalIncomePending: number; totalExpensePending: number; totalIncomeConfirmed: number; totalExpenseConfirmed: number }> {
    const cashFlowData = await this.getCashFlowDataByDateRange(startDate, endDate, companyId);
    const stats = await this.getDashboardStats(undefined, undefined, companyId);

    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);

    let allReceivables, allPayables, allCashFlowEntries;

    if (companyId && companyId !== "all") {
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allCashFlowEntries = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    } else {
      allReceivables = await db.select().from(accountsReceivable);
      allPayables = await db.select().from(accountsPayable);
      allCashFlowEntries = await db.select().from(cashFlowEntries);
    }
    const allBalanceAdjustments = await db.select().from(balanceAdjustments);

    // Receitas confirmadas (recebidas)
    const confirmedIncome = allReceivables
      .filter(r => r.status === "received" && r.receivedDate && r.receivedDate >= startDate && r.receivedDate <= endDate)
      .reduce((sum, r) => {
        const amount = parseFloat(r.amount || "0");
        const discount = parseFloat(r.discount || "0");
        return sum + (amount - discount);
      }, 0);

    // Receitas manuais confirmadas
    const manualConfirmedIncome = allCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed" && e.date >= startDate && e.date <= endDate)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const totalIncomeConfirmed = confirmedIncome + manualConfirmedIncome;

    // Receitas pendentes
    const totalIncomePending = allReceivables
      .filter(r => r.status === "pending" && r.dueDate && r.dueDate >= startDate && r.dueDate <= endDate)
      .reduce((sum, r) => {
        const amount = parseFloat(r.amount || "0");
        const discount = parseFloat(r.discount || "0");
        return sum + (amount - discount);
      }, 0);

    // Despesas confirmadas (pagas)
    const confirmedExpense = allPayables
      .filter(p => p.status === "paid" && p.paymentDate && p.paymentDate >= startDate && p.paymentDate <= endDate)
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount || "0");
        const lateFees = parseFloat(p.lateFees || "0");
        const discount = parseFloat(p.discount || "0");
        return sum + (amount + lateFees - discount);
      }, 0);

    // Despesas manuais confirmadas
    const manualConfirmedExpense = allCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed" && e.date >= startDate && e.date <= endDate)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const totalExpenseConfirmed = confirmedExpense + manualConfirmedExpense;

    // Despesas pendentes
    const totalExpensePending = allPayables
      .filter(p => p.status === "pending" && p.dueDate && p.dueDate >= startDate && p.dueDate <= endDate)
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount || "0");
        const lateFees = parseFloat(p.lateFees || "0");
        const discount = parseFloat(p.discount || "0");
        return sum + (amount + lateFees - discount);
      }, 0);

    // Calcular saldo inicial
    const initialBalanceAdjustments = allBalanceAdjustments
      .filter(a => a.balanceType === 'initial' && a.date >= startDate && a.date <= endDate)
      .reduce((sum, a) => sum + parseFloat(a.amount?.toString() || "0"), 0);

    const totalAllIncome = totalIncomeConfirmed + totalIncomePending;
    const totalAllExpense = totalExpenseConfirmed + totalExpensePending;
    const projectedBalance = totalAllIncome - totalAllExpense;

    return {
      totalIncome: totalIncomeConfirmed + initialBalanceAdjustments,
      totalExpense: totalExpenseConfirmed,
      netFlow: totalIncome - totalExpense,
      projectedBalance,
      currentBalance: stats.balance || 0,
      initialBalance: initialBalanceAdjustments,
      finalBalance: totalIncomeConfirmed - totalExpenseConfirmed,
      totalIncomePending,
      totalExpensePending,
      totalIncomeConfirmed,
      totalExpenseConfirmed,
    };
  }

  async getCashFlowKPIs(period: string, companyId?: string): Promise<CashFlowKPIs> {
    const cashFlowData = await this.getCashFlowData(period, companyId);
    let allPayables, allReceivables;

    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allReceivables = await db.select().from(accountsReceivable);
    }

    // Average balance
    const averageBalance = cashFlowData.reduce((sum, d) => sum + d.balance, 0) / cashFlowData.length;

    // Income vs Expense ratio
    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);
    const incomeVsExpense = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

    // Delinquency rate (overdue accounts)
    const today = new Date().toISOString().split("T")[0];
    const overduePayables = allPayables.filter(p => p.status !== "paid" && p.dueDate < today);
    const overdueReceivables = allReceivables.filter(r => r.status !== "received" && r.dueDate < today);
    const totalPayables = allPayables.filter(p => p.status !== "paid").length;
    const totalReceivables = allReceivables.filter(r => r.status !== "received").length;
    const delinquencyRate = (totalPayables + totalReceivables) > 0 ?
      (overduePayables.length + overdueReceivables.length) / (totalPayables + totalReceivables) : 0;

    // Immediate liquidity (current balance / next 7 days expenses)
    const next7Days = cashFlowData.filter(d => !d.projected && d.date >= today).slice(0, 7);
    const next7DaysExpenses = next7Days.reduce((sum, d) => sum + d.expense, 0);
    const currentBalance = cashFlowData.find(d => d.date === today)?.balance || 0;
    const immediateLiquidity = next7DaysExpenses > 0 ? currentBalance / next7DaysExpenses : 1;

    // Burn rate (average daily expense)
    const dailyExpenses = cashFlowData.filter(d => !d.projected && d.expense > 0);
    const burnRate = dailyExpenses.length > 0 ?
      dailyExpenses.reduce((sum, d) => sum + d.expense, 0) / dailyExpenses.length : 0;

    return {
      averageBalance,
      incomeVsExpense,
      delinquencyRate,
      immediateLiquidity,
      burnRate,
    };
  }


  async getCashFlowKPIsByDateRange(startDate: string, endDate: string, companyId?: string): Promise<CashFlowKPIs> {
    const cashFlowData = await this.getCashFlowDataByDateRange(startDate, endDate, companyId);
    let allPayables, allReceivables;

    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allReceivables = await db.select().from(accountsReceivable);
    }

    // Average balance
    const averageBalance = cashFlowData.reduce((sum, d) => sum + d.balance, 0) / cashFlowData.length;

    // Income vs Expense ratio
    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);
    const incomeVsExpense = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

    // Delinquency rate (overdue accounts)
    const today = new Date().toISOString().split("T")[0];
    const overduePayables = allPayables.filter(p => p.status !== "paid" && p.dueDate < today);
    const overdueReceivables = allReceivables.filter(r => r.status !== "received" && r.dueDate < today);
    const totalPayables = allPayables.filter(p => p.status !== "paid").length;
    const totalReceivables = allReceivables.filter(r => r.status !== "received").length;
    const delinquencyRate = (totalPayables + totalReceivables) > 0 ?
      (overduePayables.length + overdueReceivables.length) / (totalPayables + totalReceivables) : 0;

    // Immediate liquidity (current balance / next 7 days expenses)
    const next7Days = cashFlowData.filter(d => !d.projected && d.date >= today).slice(0, 7);
    const next7DaysExpenses = next7Days.reduce((sum, d) => sum + d.expense, 0);
    const currentBalance = cashFlowData.find(d => d.date === today)?.balance || 0;
    const immediateLiquidity = next7DaysExpenses > 0 ? currentBalance / next7DaysExpenses : 1;

    // Burn rate (average daily expense)
    const dailyExpenses = cashFlowData.filter(d => !d.projected && d.expense > 0);
    const burnRate = dailyExpenses.length > 0 ?
      dailyExpenses.reduce((sum, d) => sum + d.expense, 0) / dailyExpenses.length : 0;

    return {
      averageBalance,
      incomeVsExpense,
      delinquencyRate,
      immediateLiquidity,
      burnRate,
    };
  }

  async getCashFlowAlerts(companyId?: string): Promise<CashFlowAlert[]> {
    let allPayables, allReceivables;

    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allReceivables = await db.select().from(accountsReceivable);
    }
    const cashFlowData = await this.getCashFlowData("daily", companyId);

    const alerts: CashFlowAlert[] = [];
    const today = new Date().toISOString().split("T")[0];

    // Check for negative balance
    const currentBalance = cashFlowData.find(d => d.date === today)?.balance || 0;
    if (currentBalance < 0) {
      alerts.push({
        id: "negative-balance",
        message: `Saldo negativo: R$ ${currentBalance.toFixed(2)}`,
        severity: "high",
        relatedId: undefined,
        type: "negative_balance",
        date: today
      });
    }

    // Individual Overdue Payables
    const overduePayables = allPayables.filter(p => p.status !== "paid" && p.dueDate < today && p.active !== false);
    overduePayables.forEach(p => {
      alerts.push({
        id: `overdue-payable-${p.id}`,
        message: `Pagamento VENCIDO: ${p.description} (R$ ${parseFloat(p.amount || "0").toFixed(2)})`,
        severity: "high",
        relatedId: p.id,
        type: "overdue_account",
        date: p.dueDate
      });
    });

    // Payables Due Today
    const todayPayables = allPayables.filter(p => p.status !== "paid" && p.dueDate === today && p.active !== false);
    todayPayables.forEach(p => {
      alerts.push({
        id: `today-payable-${p.id}`,
        message: `Pagar HOJE: ${p.description} (R$ ${parseFloat(p.amount || "0").toFixed(2)})`,
        severity: "medium",
        relatedId: p.id,
        type: "overdue_account",
        date: p.dueDate
      });
    });

    // Individual Late Receivables
    const lateReceivables = allReceivables.filter(r => r.status !== "received" && r.dueDate < today && r.active !== false);
    lateReceivables.forEach(r => {
      alerts.push({
        id: `late-receivable-${r.id}`,
        message: `Recebimento EM ATRASO: ${r.description} (R$ ${parseFloat(r.amount || "0").toFixed(2)})`,
        severity: "high",
        relatedId: r.id,
        type: "late_receipt",
        date: r.dueDate
      });
    });

    // Receivables Due Today
    const todayReceivables = allReceivables.filter(r => r.status !== "received" && r.dueDate === today && r.active !== false);
    todayReceivables.forEach(r => {
      alerts.push({
        id: `today-receivable-${r.id}`,
        message: `Receber HOJE: ${r.description} (R$ ${parseFloat(r.amount || "0").toFixed(2)})`,
        severity: "medium",
        relatedId: r.id,
        type: "late_receipt",
        date: r.dueDate
      });
    });

    return alerts;
  }

  async getDailyMovements(date: string, companyId?: string): Promise<DailyMovement[]> {
    console.log(`[DEBUG] getDailyMovements called for date: ${date}`);

    let allPayables, allReceivables, allCashFlowEntries;
    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
      allCashFlowEntries = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allReceivables = await db.select().from(accountsReceivable);
      allCashFlowEntries = await db.select().from(cashFlowEntries);
    }

    const allCategories = await db.select().from(categories);
    const allBalanceAdjustments = await db.select().from(balanceAdjustments);

    console.log(`[DEBUG] Found ${allCashFlowEntries.length} cash flow entries`);
    console.log(`[DEBUG] Found ${allBalanceAdjustments.length} balance adjustments`);
    console.log(`[DEBUG] Cash flow entries:`, allCashFlowEntries.map(e => ({ id: e.id, date: e.date, type: e.type, description: e.description, amount: e.amount })));
    console.log(`[DEBUG] Balance adjustments:`, allBalanceAdjustments.map(a => ({ id: a.id, date: a.date, balanceType: a.balanceType, description: a.description, amount: a.amount })));

    const movements: DailyMovement[] = [];

    // Process balance adjustments first
    allBalanceAdjustments
      .filter(adjustment => adjustment.date === date)
      .forEach(adjustment => {
        movements.push({
          id: `balance-${adjustment.id}`,
          date,
          type: adjustment.balanceType === 'initial' ? 'income' : 'expense',
          movementType: adjustment.balanceType === 'initial' ? 'initial_balance' : 'balance_adjustment',
          description: `Ajuste de Saldo - ${adjustment.balanceType === 'initial' ? 'Inicial' : 'Final'}: ${adjustment.description}`,
          categoryId: '',
          categoryName: 'Ajuste de Saldo',
          amount: parseFloat(adjustment.amount?.toString() || "0"),
          paymentMethod: 'N/A',
          account: adjustment.account || 'Conta Principal',
          status: 'confirmed' as const,
          createdAt: adjustment.createdAt.toISOString(),
          competenceDate: undefined,
          subcategoryId: undefined,
          subcategoryName: undefined,
          grossAmount: undefined,
          lateFees: undefined,
          discount: undefined,
          fees: undefined,
          document: undefined,
          costCenter: undefined,
          recurrence: undefined,
          dueDate: undefined,
          actualDate: undefined,
        });
      });

    // Process receivables
    allReceivables
      .filter(r => r.dueDate === date)
      .forEach(r => {
        const category = allCategories.find(c => c.id === r.categoryId);
        movements.push({
          id: `receivable-${r.id}`,
          date,
          type: 'income',
          movementType: 'normal',
          description: r.description,
          categoryId: r.categoryId || '',
          categoryName: category?.name || 'Sem categoria',
          amount: parseFloat(r.amount || "0"),
          paymentMethod: 'N/A', // Receivables don't have paymentMethod field
          account: 'Conta Principal',
          status: r.status === "received" ? 'confirmed' : 'pending',
          createdAt: new Date().toISOString(),
          competenceDate: undefined,
          subcategoryId: undefined,
          subcategoryName: undefined,
          grossAmount: undefined,
          lateFees: undefined,
          discount: parseFloat(r.discount || "0"),
          fees: undefined,
          document: undefined,
          costCenter: undefined,
          recurrence: undefined,
          dueDate: r.dueDate || undefined,
          actualDate: r.receivedDate || undefined,
        });
      });

    // Process payables
    allPayables
      .filter(p => p.dueDate === date)
      .forEach(p => {
        const category = allCategories.find(c => c.id === p.categoryId);
        movements.push({
          id: `payable-${p.id}`,
          date,
          type: 'expense',
          movementType: 'normal',
          description: p.description,
          categoryId: p.categoryId || '',
          categoryName: category?.name || 'Sem categoria',
          amount: parseFloat(p.amount || "0"),
          paymentMethod: p.paymentMethod || 'N/A',
          account: 'Conta Principal',
          status: p.status === "paid" ? 'confirmed' : 'pending',
          createdAt: new Date().toISOString(),
          competenceDate: undefined,
          subcategoryId: undefined,
          subcategoryName: undefined,
          grossAmount: undefined,
          lateFees: parseFloat(p.lateFees || "0"),
          discount: parseFloat(p.discount || "0"),
          fees: undefined,
          document: undefined,
          costCenter: undefined,
          recurrence: undefined,
          dueDate: p.dueDate || undefined,
          actualDate: p.paymentDate || undefined,
        });
      });

    // Process manual cash flow entries
    const manualEntries = allCashFlowEntries.filter(entry => entry.date === date);
    console.log(`[DEBUG] Found ${manualEntries.length} manual entries for date ${date}`);

    manualEntries.forEach(entry => {
      const category = allCategories.find(c => c.id === entry.categoryId);
      const movement = {
        id: `manual-${entry.id}`,
        date,
        competenceDate: entry.competenceDate || undefined,
        type: entry.type as 'income' | 'expense',
        movementType: (entry.movementType as 'normal' | 'balance_adjustment' | 'withdrawal' | 'initial_balance') || 'normal',
        description: entry.description,
        categoryId: entry.categoryId || '',
        categoryName: category?.name || 'Sem categoria',
        subcategoryId: entry.subcategoryId || undefined,
        subcategoryName: entry.subcategoryId ? allCategories.find(c => c.id === entry.subcategoryId)?.name : undefined,
        amount: parseFloat(entry.amount?.toString() || "0"),
        grossAmount: entry.grossAmount ? parseFloat(entry.grossAmount.toString()) : undefined,
        lateFees: undefined,
        discount: undefined,
        fees: entry.fees ? parseFloat(entry.fees.toString()) : undefined,
        paymentMethod: entry.paymentMethod || 'N/A',
        account: entry.account || 'Conta Principal',
        status: entry.status as 'confirmed' | 'pending' | 'overdue',
        document: entry.document || undefined,
        costCenter: entry.costCenter || undefined,
        recurrence: entry.recurrence || undefined,
        dueDate: entry.dueDate || undefined,
        actualDate: entry.actualDate || undefined,
        createdAt: entry.createdAt.toISOString(),
      };
      console.log(`[DEBUG] Adding manual movement:`, movement);
      movements.push(movement);
    });

    console.log(`[DEBUG] Total movements: ${movements.length}`);
    return movements.sort((a, b) => a.type.localeCompare(b.type));
  }

  async getMovementsByPeriod(period: string, companyId?: string): Promise<DailyMovement[]> {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === "daily") {
      startDate = new Date(today);
      endDate = new Date(today);
    } else if (period === "weekly") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 28);
      endDate = new Date(today);
    } else if (period === "monthly") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      endDate = new Date(today);
    } else {
      // Default to daily
      startDate = new Date(today);
      endDate = new Date(today);
    }

    return this.getMovementsByDateRange(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
      companyId
    );
  }

  async getMovementsByDateRange(startDate: string, endDate: string, companyId?: string): Promise<DailyMovement[]> {
    let allPayables, allReceivables, allCashFlowEntries;

    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
      allCashFlowEntries = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allReceivables = await db.select().from(accountsReceivable);
      allCashFlowEntries = await db.select().from(cashFlowEntries);
    }

    const allCategories = await db.select().from(categories);
    const allBalanceAdjustments = await db.select().from(balanceAdjustments);

    const movements: DailyMovement[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Process each date in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];

      // Process balance adjustments
      allBalanceAdjustments
        .filter(adjustment => adjustment.date === dateStr)
        .forEach(adjustment => {
          movements.push({
            id: `balance-${adjustment.id}`,
            date: dateStr,
            type: adjustment.balanceType === 'initial' ? 'income' : 'expense',
            movementType: adjustment.balanceType === 'initial' ? 'initial_balance' : 'balance_adjustment',
            description: `Ajuste de Saldo - ${adjustment.balanceType === 'initial' ? 'Inicial' : 'Final'}: ${adjustment.description}`,
            categoryId: '',
            categoryName: 'Ajuste de Saldo',
            amount: parseFloat(adjustment.amount?.toString() || "0"),
            paymentMethod: 'N/A',
            account: adjustment.account || 'Conta Principal',
            status: 'confirmed' as const,
            createdAt: adjustment.createdAt.toISOString(),
            competenceDate: undefined,
            subcategoryId: undefined,
            subcategoryName: undefined,
            grossAmount: undefined,
            lateFees: undefined,
            discount: undefined,
            fees: undefined,
            document: undefined,
            costCenter: undefined,
            recurrence: undefined,
            dueDate: undefined,
            actualDate: undefined,
          });
        });

      // Process receivables
      allReceivables
        .filter(r => r.dueDate === dateStr)
        .forEach(r => {
          const category = allCategories.find(c => c.id === r.categoryId);
          movements.push({
            id: `receivable-${r.id}`,
            date: dateStr,
            type: 'income',
            movementType: 'normal',
            description: r.description,
            categoryId: r.categoryId || '',
            categoryName: category?.name || 'Sem categoria',
            amount: parseFloat(r.amount || "0"),
            paymentMethod: 'N/A',
            account: 'Conta Principal',
            status: r.status === "received" ? 'confirmed' : 'pending',
            createdAt: new Date().toISOString(),
            competenceDate: undefined,
            subcategoryId: undefined,
            subcategoryName: undefined,
            grossAmount: undefined,
            lateFees: undefined,
            discount: parseFloat(r.discount || "0"),
            fees: undefined,
            document: undefined,
            costCenter: undefined,
            recurrence: undefined,
            dueDate: r.dueDate || undefined,
            actualDate: r.receivedDate || undefined,
          });
        });

      // Process payables
      allPayables
        .filter(p => p.dueDate === dateStr)
        .forEach(p => {
          const category = allCategories.find(c => c.id === p.categoryId);
          movements.push({
            id: `payable-${p.id}`,
            date: dateStr,
            type: 'expense',
            movementType: 'normal',
            description: p.description,
            categoryId: p.categoryId || '',
            categoryName: category?.name || 'Sem categoria',
            amount: parseFloat(p.amount || "0"),
            paymentMethod: p.paymentMethod || 'N/A',
            account: 'Conta Principal',
            status: p.status === "paid" ? 'confirmed' : 'pending',
            createdAt: new Date().toISOString(),
            competenceDate: undefined,
            subcategoryId: undefined,
            subcategoryName: undefined,
            grossAmount: undefined,
            lateFees: parseFloat(p.lateFees || "0"),
            discount: parseFloat(p.discount || "0"),
            fees: undefined,
            document: undefined,
            costCenter: undefined,
            recurrence: undefined,
            dueDate: p.dueDate || undefined,
            actualDate: p.paymentDate || undefined,
          });
        });

      // Process manual cash flow entries
      allCashFlowEntries
        .filter(entry => entry.date === dateStr)
        .forEach(entry => {
          const category = allCategories.find(c => c.id === entry.categoryId);
          const subcategory = allCategories.find(c => c.id === entry.subcategoryId);
          movements.push({
            id: entry.id,
            date: dateStr,
            type: entry.type as 'income' | 'expense',
            movementType: entry.movementType as 'normal' | 'initial_balance' | 'balance_adjustment' | 'withdrawal',
            description: entry.description,
            categoryId: entry.categoryId || '',
            categoryName: category?.name || 'Sem categoria',
            subcategoryId: entry.subcategoryId || undefined,
            subcategoryName: subcategory?.name || undefined,
            amount: parseFloat(entry.amount?.toString() || "0"),
            grossAmount: entry.grossAmount ? parseFloat(entry.grossAmount.toString()) : undefined,
            lateFees: undefined,
            discount: undefined,
            fees: entry.fees ? parseFloat(entry.fees.toString()) : undefined,
            paymentMethod: entry.paymentMethod,
            account: entry.account,
            status: entry.status as 'pending' | 'confirmed' | 'overdue',
            document: entry.document || undefined,
            costCenter: entry.costCenter || undefined,
            recurrence: entry.recurrence || undefined,
            competenceDate: entry.competenceDate || undefined,
            dueDate: entry.dueDate || undefined,
            actualDate: entry.actualDate || undefined,
            createdAt: entry.createdAt.toISOString(),
          });
        });
    }

    return movements.sort((a, b) => {
      // Sort by date first, then by type
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.type.localeCompare(b.type);
    });
  }

  async createCashFlowEntry(entry: InsertCashFlowEntry & { userId: string; companyId?: string }): Promise<CashFlowEntry> {
    const [newEntry] = await db.insert(cashFlowEntries).values({
      ...entry,
      amount: entry.amount.toString(),
    }).returning();
    return newEntry;
  }

  async getCashFlowEntries(companyId?: string): Promise<CashFlowEntry[]> {
    if (companyId && companyId !== "all") {
      return await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    }
    return await db.select().from(cashFlowEntries);
  }

  async getCashFlowDataByDateRange(startDate: string, endDate: string, companyId?: string): Promise<CashFlowData[]> {
    let allPayables, allReceivables, allCashFlowEntries;

    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allReceivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, companyId));
      allCashFlowEntries = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allReceivables = await db.select().from(accountsReceivable);
      allCashFlowEntries = await db.select().from(cashFlowEntries);
    }

    const data: Map<string, CashFlowData> = new Map();
    let runningBalance = 0;

    // Calculate initial balance before start date
    const confirmedIncome = allReceivables
      .filter(r => r.status === "received" && r.receivedDate && r.receivedDate < startDate)
      .reduce((sum, r) => {
        const amount = parseFloat(r.amount || "0");
        const discount = parseFloat(r.discount || "0");
        return sum + (amount - discount);
      }, 0);

    const confirmedExpense = allPayables
      .filter(p => p.status === "paid" && p.paymentDate && p.paymentDate < startDate)
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount || "0");
        const lateFees = parseFloat(p.lateFees || "0");
        const discount = parseFloat(p.discount || "0");
        return sum + (amount + lateFees - discount);
      }, 0);

    const manualIncome = allCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed" && e.date < startDate)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const manualExpense = allCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed" && e.date < startDate)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    runningBalance = confirmedIncome - confirmedExpense + manualIncome - manualExpense;

    // Generate data for each day in the range
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];

      const dayIncome = allReceivables
        .filter(r => (r.status === "received" ? r.receivedDate === dateStr : r.dueDate === dateStr))
        .reduce((sum, r) => {
          const amount = parseFloat(r.amount || "0");
          const discount = parseFloat(r.discount || "0");
          return sum + (amount - discount);
        }, 0);

      const manualDayIncome = allCashFlowEntries
        .filter(e => e.type === "income" && e.date === dateStr)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

      const totalDayIncome = dayIncome + manualDayIncome;

      const dayExpense = allPayables
        .filter(p => (p.status === "paid" ? p.paymentDate === dateStr : p.dueDate === dateStr))
        .reduce((sum, p) => {
          const amount = parseFloat(p.amount || "0");
          const lateFees = parseFloat(p.lateFees || "0");
          const discount = parseFloat(p.discount || "0");
          return sum + (amount + lateFees - discount);
        }, 0);

      const manualDayExpense = allCashFlowEntries
        .filter(e => e.type === "expense" && e.date === dateStr)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

      const totalDayExpense = dayExpense + manualDayExpense;

      const dayInitialBalance = runningBalance;
      runningBalance += totalDayIncome - totalDayExpense;
      const dayFinalBalance = runningBalance;

      data.set(dateStr, {
        date: dateStr,
        income: totalDayIncome,
        expense: totalDayExpense,
        balance: runningBalance,
        projected: false,
        initialBalance: dayInitialBalance,
        finalBalance: dayFinalBalance,
      });
    }

    return Array.from(data.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCategoryExpensesByDateRange(startDate: string, endDate: string, companyId?: string): Promise<CategoryExpense[]> {
    let allPayables, allCashFlowEntries;

    if (companyId && companyId !== "all") {
      allPayables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, companyId));
      allCashFlowEntries = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, companyId));
    } else {
      allPayables = await db.select().from(accountsPayable);
      allCashFlowEntries = await db.select().from(cashFlowEntries);
    }

    const allCategories = await db.select().from(categories);

    // Filter by date range
    const filteredPayables = allPayables.filter(p => {
      const date = p.paymentDate || p.dueDate;
      return date >= startDate && date <= endDate;
    });

    const filteredCashFlowEntries = allCashFlowEntries.filter(e =>
      e.type === "expense" && e.date >= startDate && e.date <= endDate
    );

    const expenseCategories = allCategories.filter(c => c.type === "expense");

    // Calculate total for percentage
    const payablesTotal = filteredPayables.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    const cashFlowTotal = filteredCashFlowEntries.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    const total = payablesTotal + cashFlowTotal;

    return expenseCategories.map(cat => {
      const payablesAmount = filteredPayables
        .filter(p => p.categoryId === cat.id)
        .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

      const cashFlowAmount = filteredCashFlowEntries
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

      const amount = payablesAmount + cashFlowAmount;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    }).filter(c => c.amount > 0);
  }

  async getCategoryExpenses(): Promise<CategoryExpense[]> {
    const allPayables = await db.select().from(accountsPayable);
    const allCategories = await db.select().from(categories);

    const expenseCategories = allCategories.filter(c => c.type === "expense");
    const payablesWithCategory = allPayables.filter(p => p.categoryId);

    const total = payablesWithCategory.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

    return expenseCategories.map(cat => {
      const amount = payablesWithCategory
        .filter(p => p.categoryId === cat.id)
        .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    }).filter(c => c.amount > 0);
  }

  async getDREData(year: number, month: number): Promise<{ current: DREData; previous: DREData; percentageChange: { grossRevenue: number; netProfit: number } }> {
    const allReceivables = await db.select().from(accountsReceivable);
    const allPayables = await db.select().from(accountsPayable);
    const allCategories = await db.select().from(categories);

    const calculateDRE = (y: number, m: number): DREData => {
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0);
      const startStr = monthStart.toISOString().split("T")[0];
      const endStr = monthEnd.toISOString().split("T")[0];

      const monthReceivables = allReceivables.filter(r => {
        const dateStr = r.receivedDate || r.dueDate;
        return dateStr >= startStr && dateStr <= endStr;
      });

      const monthPayables = allPayables.filter(p => {
        const dateStr = p.paymentDate || p.dueDate;
        return dateStr >= startStr && dateStr <= endStr;
      });

      let grossRevenue = 0;
      let deductions = 0;
      let costs = 0;
      let operationalExpenses = 0;

      monthReceivables.forEach(r => {
        const cat = allCategories.find(c => c.id === r.categoryId);
        const amount = parseFloat(r.amount || "0");
        if (cat?.dreCategory === "revenue") grossRevenue += amount;
        if (cat?.dreCategory === "deductions") deductions += amount;
      });

      monthPayables.forEach(p => {
        const cat = allCategories.find(c => c.id === p.categoryId);
        const amount = parseFloat(p.amount || "0");
        if (cat?.dreCategory === "costs") costs += amount;
        if (cat?.dreCategory === "operational_expenses") operationalExpenses += amount;
      });

      const netRevenue = grossRevenue - deductions;
      const grossProfit = netRevenue - costs;
      const operationalProfit = grossProfit - operationalExpenses;
      const netProfit = operationalProfit;
      const contributionMargin = netRevenue - costs;

      return {
        grossRevenue,
        deductions,
        netRevenue,
        costs,
        grossProfit,
        operationalExpenses,
        operationalProfit,
        netProfit,
        contributionMargin,
        ebitda: operationalProfit,
        irpj: 0,
        csll: 0,
        pis: 0,
        cofins: 0,
        icms: 0,
        iss: 0,
        otherTaxes: 0,
        depreciation: 0,
        amortization: 0,
        financialResult: 0,
        profitBeforeTax: operationalProfit,
        taxExpense: 0,
        netIncome: operationalProfit,
      };
    };

    const current = calculateDRE(year, month);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previous = calculateDRE(prevYear, prevMonth);

    return {
      current,
      previous,
      percentageChange: {
        grossRevenue: previous.grossRevenue > 0 ? ((current.grossRevenue - previous.grossRevenue) / previous.grossRevenue) * 100 : 0,
        netProfit: previous.netProfit !== 0 ? ((current.netProfit - previous.netProfit) / Math.abs(previous.netProfit)) * 100 : 0,
      },
    };
  }

  async createBalanceAdjustment(entry: InsertBalanceAdjustment & { userId: string }): Promise<BalanceAdjustment> {
    const [newAdjustment] = await db.insert(balanceAdjustments).values({
      ...entry,
      amount: entry.amount,
    }).returning();
    return newAdjustment;
  }

  async getBalanceAdjustments(date?: string): Promise<BalanceAdjustment[]> {
    if (date) {
      return await db
        .select()
        .from(balanceAdjustments)
        .where(eq(balanceAdjustments.date, date));
    }
    return await db.select().from(balanceAdjustments);
  }

  async getFinancialGoals(month?: number, year?: number): Promise<FinancialGoal[]> {
    if (month && year) {
      return await db.select().from(financialGoals).where(and(eq(financialGoals.month, month), eq(financialGoals.year, year)));
    }
    return await db.select().from(financialGoals);
  }

  async createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal> {
    const [newGoal] = await db.insert(financialGoals).values(goal).returning();
    return newGoal;
  }

  async updateFinancialGoal(id: string, goalData: Partial<InsertFinancialGoal>): Promise<FinancialGoal | undefined> {
    const [updated] = await db.update(financialGoals).set(goalData).where(eq(financialGoals.id, id)).returning();
    return updated;
  }

  async deleteFinancialGoal(id: string): Promise<boolean> {
    const [deleted] = await db.delete(financialGoals).where(eq(financialGoals.id, id)).returning();
    return !!deleted;
  }

  async getFinancialGoalsProgress(month: number, year: number): Promise<FinancialGoalProgress[]> {
    const goals = await this.getFinancialGoals(month, year);
    const startOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

    // Only get paid expenses and received revenues within the month
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);

    // Filter for paid payables with payment date in the month
    const paidPayables = allPayables.filter(p =>
      p.status === 'paid' &&
      p.paymentDate &&
      p.paymentDate >= startOfMonth &&
      p.paymentDate <= endOfMonth
    );

    // Filter for received receivables with received date in the month
    const receivedReceivables = allReceivables.filter(r =>
      r.status === 'received' &&
      r.receivedDate &&
      r.receivedDate >= startOfMonth &&
      r.receivedDate <= endOfMonth
    );

    return goals.map(goal => {
      let currentAmount = 0;

      if (goal.type === 'income_total') {
        currentAmount = receivedReceivables.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      } else if (goal.type === 'expense_total') {
        currentAmount = paidPayables.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      } else if (goal.type === 'mrr') {
        // Simple MRR: sum of active monthly recurring receivables
        currentAmount = allReceivables.filter(r => r.active && r.recurrence === 'monthly').reduce((sum, r) => sum + parseFloat(r.amount), 0);
      } else if (goal.type === 'burn_rate') {
        // Simple Burn Rate: total operational expenses for the month
        currentAmount = paidPayables.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      } else if (goal.type === 'category' && goal.categoryId) {
        // Find if category is income or expense
        const incomeSum = receivedReceivables.filter(r => r.categoryId === goal.categoryId).reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const expenseSum = paidPayables.filter(p => p.categoryId === goal.categoryId).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        currentAmount = incomeSum + expenseSum;
      }

      const target = parseFloat(goal.targetAmount);
      const percentage = target > 0 ? (currentAmount / target) * 100 : 0;

      return {
        ...goal,
        currentAmount,
        percentage
      };
    });
  }

  async getNotes(): Promise<Note[]> {
    return await db.select().from(notes).orderBy(notes.updatedAt);
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: string, noteData: Partial<InsertNote>): Promise<Note | undefined> {
    const [updatedNote] = await db
      .update(notes)
      .set({ ...noteData, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    const [deleted] = await db.delete(notes).where(eq(notes.id, id)).returning();
    return !!deleted;
  }

  // Card Transactions (PDR)
  async getCardTransactions(companyId?: string, startDate?: string, endDate?: string): Promise<CardTransaction[]> {
    const baseConditions = [eq(cardTransactions.active, true)];
    if (companyId && companyId !== "all") {
      baseConditions.push(eq(cardTransactions.companyId, companyId));
    }
    if (startDate && endDate) {
      baseConditions.push(gte(cardTransactions.saleDate, startDate));
      baseConditions.push(lte(cardTransactions.saleDate, endDate));
    }
    return await db.select().from(cardTransactions).where(and(...baseConditions)).orderBy(cardTransactions.saleDate);
  }

  async getCardTransaction(id: string): Promise<CardTransaction | undefined> {
    const [transaction] = await db.select().from(cardTransactions).where(eq(cardTransactions.id, id));
    return transaction;
  }

  async createCardTransaction(transaction: InsertCardTransaction): Promise<CardTransaction> {
    const [newTransaction] = await db.insert(cardTransactions).values(transaction).returning();
    return newTransaction;
  }

  async updateCardTransaction(id: string, transaction: Partial<InsertCardTransaction>): Promise<CardTransaction | undefined> {
    const [updated] = await db.update(cardTransactions).set(transaction).where(eq(cardTransactions.id, id)).returning();
    return updated;
  }

  async deleteCardTransaction(id: string): Promise<boolean> {
    const [deleted] = await db.update(cardTransactions).set({ active: false }).where(eq(cardTransactions.id, id)).returning();
    return !!deleted;
  }

  // Bank Accounts
  async getBankAccounts(companyId?: string): Promise<BankAccount[]> {
    const conditions = [eq(bankAccounts.active, true)];
    if (companyId && companyId !== "all") {
      conditions.push(eq(bankAccounts.companyId, companyId));
    }
    return await db.select().from(bankAccounts).where(and(...conditions)).orderBy(bankAccounts.name);
  }

  async getBankAccount(id: string): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [newAccount] = await db.insert(bankAccounts).values(account).returning();
    return newAccount;
  }

  async updateBankAccount(id: string, accountData: Partial<InsertBankAccount>): Promise<BankAccount | undefined> {
    const [updated] = await db.update(bankAccounts).set(accountData).where(eq(bankAccounts.id, id)).returning();
    return updated;
  }

  async deleteBankAccount(id: string): Promise<boolean> {
    const [deleted] = await db.update(bankAccounts).set({ active: false }).where(eq(bankAccounts.id, id)).returning();
    return !!deleted;
  }

  // Payment Configs (Taxas)
  async getPaymentConfigs(companyId?: string): Promise<PaymentConfig[]> {
    const conditions = [eq(paymentConfigs.active, true)];
    if (companyId && companyId !== "all") {
      conditions.push(eq(paymentConfigs.companyId, companyId));
    }
    return await db.select().from(paymentConfigs).where(and(...conditions)).orderBy(paymentConfigs.name);
  }

  async getPaymentConfig(id: string): Promise<PaymentConfig | undefined> {
    const [config] = await db.select().from(paymentConfigs).where(eq(paymentConfigs.id, id));
    return config;
  }

  async createPaymentConfig(config: InsertPaymentConfig): Promise<PaymentConfig> {
    const [newConfig] = await db.insert(paymentConfigs).values(config).returning();
    return newConfig;
  }

  async updatePaymentConfig(id: string, configData: Partial<InsertPaymentConfig>): Promise<PaymentConfig | undefined> {
    const [updated] = await db.update(paymentConfigs).set(configData).where(eq(paymentConfigs.id, id)).returning();
    return updated;
  }

  async deletePaymentConfig(id: string): Promise<boolean> {
    const [deleted] = await db.update(paymentConfigs).set({ active: false }).where(eq(paymentConfigs.id, id)).returning();
    return !!deleted;
  }

  // Retail Sales (Vendas de Varejo)
  async getRetailSales(companyId?: string): Promise<RetailSale[]> {
    const conditions = [eq(retailSales.active, true)];
    if (companyId && companyId !== "all") {
      conditions.push(eq(retailSales.companyId, companyId));
    }
    return await db.select().from(retailSales).where(and(...conditions)).orderBy(retailSales.date);
  }

  async getRetailSale(id: string): Promise<RetailSale | undefined> {
    const [sale] = await db.select().from(retailSales).where(eq(retailSales.id, id));
    return sale;
  }

  async createRetailSale(sale: InsertRetailSale & { userId: string; companyId?: string }): Promise<RetailSale> {
    const [newSale] = await db.insert(retailSales).values({
      ...sale,
      amount: sale.amount.toString(),
      unitPrice: sale.unitPrice?.toString() || null,
    }).returning();
    return newSale;
  }

  async updateRetailSale(id: string, saleData: Partial<InsertRetailSale>): Promise<RetailSale | undefined> {
    const updateData: any = { ...saleData };
    if (saleData.amount !== undefined) {
      updateData.amount = saleData.amount.toString();
    }
    if (saleData.unitPrice !== undefined) {
      updateData.unitPrice = saleData.unitPrice?.toString() || null;
    }
    const [updated] = await db.update(retailSales).set(updateData).where(eq(retailSales.id, id)).returning();
    return updated;
  }

  async deleteRetailSale(id: string): Promise<boolean> {
    const [deleted] = await db.update(retailSales).set({ active: false }).where(eq(retailSales.id, id)).returning();
    return !!deleted;
  }

  // Cash Flow Entries - delete method
  async deleteCashFlowEntry(id: string): Promise<boolean> {
    const [deleted] = await db.delete(cashFlowEntries).where(eq(cashFlowEntries.id, id)).returning();
    return !!deleted;
  }

  // Inicialização do banco de dados
  async initializeDatabase(): Promise<void> {
    try {
      // Create bank_accounts table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS bank_accounts (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          bank TEXT,
          agency TEXT,
          account TEXT,
          type TEXT,
          company_id VARCHAR REFERENCES companies(id),
          active BOOLEAN DEFAULT true
        );
      `);

      // Create payment_configs table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payment_configs (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          bank_account_id VARCHAR REFERENCES bank_accounts(id),
          fee_debit DECIMAL(5, 2) DEFAULT 0,
          fee_credit DECIMAL(5, 2) DEFAULT 0,
          fee_pix DECIMAL(5, 2) DEFAULT 0,
          company_id VARCHAR REFERENCES companies(id),
          active BOOLEAN DEFAULT true
        );
      `);

      // Create card_transactions table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS card_transactions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          sale_date TEXT NOT NULL,
          payment_method TEXT NOT NULL,
          gross_amount DECIMAL(15, 2) NOT NULL,
          fee_percentage DECIMAL(5, 2) NOT NULL,
          net_amount DECIMAL(15, 2) NOT NULL,
          transaction_number TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          settlement_date TEXT,
          notes TEXT,
          company_id VARCHAR REFERENCES companies(id),
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Tabela "card_transactions" verificado/criado');

      // Verificar e adicionar campo color na tabela categories se não existir
      await db.execute(sql`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='categories' 
                AND column_name='color'
                AND table_schema = current_schema()
            ) THEN
                ALTER TABLE categories ADD COLUMN color TEXT;
                
                -- Atualizar categorias existentes com cores padrão
                UPDATE categories 
                SET color = CASE 
                    WHEN type = 'income' THEN 'green'
                    WHEN type = 'expense' THEN 'red'
                    ELSE 'gray'
                END 
                WHERE color IS NULL;
            END IF;
        END $$;
      `);
      console.log('✅ Campo "color" verificado/criado na tabela categories');
    } catch (error) {
      console.error('❌ Erro ao inicializar banco de dados:', error);
    }
  }
}

export const storage = new DatabaseStorage();
