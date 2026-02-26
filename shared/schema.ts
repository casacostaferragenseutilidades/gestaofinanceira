import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  email: text("email"),
  password: text("password"),
  name: text("name"),
  fullName: text("full_name"),
  role: text("role"),
  team: text("team"),
  status: text("status"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  fullName: true,
  role: true,
  team: true,
  status: true,
  active: true,
}).extend({
  id: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserRole = "admin" | "financial" | "viewer";

// Suppliers (Fornecedores)
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  document: text("document"),
  email: text("email"),
  phone: text("phone"),
  contact: text("contact"),
  address: text("address"),
  active: boolean("active").default(true),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Clients (Clientes)
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  document: text("document"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Categories (Categorias)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  dreCategory: text("dre_category"), // 'revenue' | 'deductions' | 'costs' | 'operational_expenses'
  color: text("color"), // 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'pink' | 'orange' | 'cyan' | 'indigo' | 'gray'
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Cost Centers (Centros de Custo)
export const costCenters = pgTable("cost_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertCostCenterSchema = createInsertSchema(costCenters).omit({ id: true });
export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;
export type CostCenter = typeof costCenters.$inferSelect;

// Accounts Payable (Contas a Pagar)
export const accountsPayable = pgTable("accounts_payable", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: text("due_date").notNull(),
  paymentDate: text("payment_date"),
  status: text("status").notNull().default("pending"), // 'pending' | 'paid' | 'overdue'
  supplierId: varchar("supplier_id"),
  categoryId: varchar("category_id"),
  costCenterId: varchar("cost_center_id"),
  paymentMethod: text("payment_method"), // 'boleto' | 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'pix'
  lateFees: decimal("late_fees", { precision: 15, scale: 2 }),
  discount: decimal("discount", { precision: 15, scale: 2 }),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  recurrence: text("recurrence"), // 'none' | 'monthly' | 'weekly'
  recurrenceEnd: text("recurrence_end"),
  companyId: varchar("company_id").references(() => companies.id),
  active: boolean("active").notNull().default(true),
});

export const insertAccountPayableSchema = createInsertSchema(accountsPayable).omit({ id: true });
export type InsertAccountPayable = z.infer<typeof insertAccountPayableSchema>;
export type AccountPayable = typeof accountsPayable.$inferSelect & { categoryName?: string; supplierName?: string };

// Accounts Receivable (Contas a Receber)
export const accountsReceivable = pgTable("accounts_receivable", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: text("due_date").notNull(),
  receivedDate: text("received_date"),
  status: text("status").notNull().default("pending"), // 'pending' | 'received' | 'overdue'
  clientId: varchar("client_id"),
  categoryId: varchar("category_id"),
  notes: text("notes"),
  mercadoPagoId: text("mercado_pago_id"),
  discount: decimal("discount", { precision: 15, scale: 2 }),
  recurrence: text("recurrence"), // 'none' | 'monthly' | 'weekly' | 'yearly'
  recurrencePeriod: text("recurrence_period"), // Date string or number of occurrences (stored as text)
  paymentMethod: text("payment_method"), // 'money', 'pix', 'credit_card', 'debit_card', 'boleto', 'transfer'
  companyId: varchar("company_id").references(() => companies.id),
  active: boolean("active").notNull().default(true),
});

export const insertAccountReceivableSchema = createInsertSchema(accountsReceivable).omit({ id: true });
export type InsertAccountReceivable = z.infer<typeof insertAccountReceivableSchema>;
export type AccountReceivable = typeof accountsReceivable.$inferSelect & { categoryName?: string; clientName?: string };

// Card Transactions (Controle de Recebimentos PDR)
export const cardTransactions = pgTable("card_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleDate: text("sale_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'credit_card', 'debit_card', 'pix'
  grossAmount: decimal("gross_amount", { precision: 15, scale: 2 }).notNull(),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).notNull(),
  transactionNumber: text("transaction_number"),
  status: text("status").notNull().default("pending"), // 'pending' | 'received' | 'cancelled'
  settlementDate: text("settlement_date"),
  notes: text("notes"),
  companyId: varchar("company_id").references(() => companies.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCardTransactionSchema = createInsertSchema(cardTransactions).omit({ id: true, createdAt: true });
export type InsertCardTransaction = z.infer<typeof insertCardTransactionSchema>;
export type CardTransaction = typeof cardTransactions.$inferSelect;

// Mercado Pago Transactions
export const mercadoPagoTransactions = pgTable("mercado_pago_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: text("external_id").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }),
  transactionDate: text("transaction_date").notNull(),
  status: text("status").notNull(),
  reconciled: boolean("reconciled").default(false),
  accountReceivableId: varchar("account_receivable_id"),
});

export const insertMercadoPagoTransactionSchema = createInsertSchema(mercadoPagoTransactions).omit({ id: true });
export type InsertMercadoPagoTransaction = z.infer<typeof insertMercadoPagoTransactionSchema>;
export type MercadoPagoTransaction = typeof mercadoPagoTransactions.$inferSelect;

// Extended types for frontend with relations
export type AccountPayableWithRelations = AccountPayable & {
  supplier?: Supplier;
  category?: Category;
  costCenter?: CostCenter;
};

export type AccountReceivableWithRelations = AccountReceivable & {
  client?: Client;
  category?: Category;
};

// Dashboard types
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  projectedBalance: number;
  overduePayables: number;
  overdueReceivables: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
  totalDiscounts: number;
  // Campos auxiliares para compatibilidade
  totalIncome?: number;
  totalExpense?: number;
  currentBalance?: number;
  initialBalance?: number;
  finalBalance?: number;
  totalIncomePending?: number;
  totalExpensePending?: number;
  totalIncomeConfirmed?: number;
  totalExpenseConfirmed?: number;
  netFlow?: number;
}

export interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  balance: number;
  projected: boolean;
  initialBalance: number;
  finalBalance: number;
}

export interface DREData {
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  costs: number;
  grossProfit: number;
  operationalExpenses: number;
  operationalProfit: number;
  ebitda: number;
  netProfit: number;
  contributionMargin: number;
  // Brazilian fiscal specific fields
  irpj: number; // Imposto de Renda Pessoa Jurídica
  csll: number; // Contribuição Social sobre Lucro Líquido
  pis: number; // Programa de Integração Social
  cofins: number; // Contribuição para Financiamento da Seguridade Social
  icms: number; // Imposto sobre Circulação de Mercadorias e Serviços
  iss: number; // Imposto Sobre Serviços
  otherTaxes: number; // Outros tributos
  depreciation: number;
  amortization: number;
  financialResult: number;
  profitBeforeTax: number;
  taxExpense: number;
  netIncome: number;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

// Manual Cash Flow Entries (Movimentações Manuais do Fluxo de Caixa)
export const cashFlowEntries = pgTable("cash_flow_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(), // Data do lançamento (recebimento/pagamento)
  competenceDate: date("competence_date"), // Data de competência (quando foi gerado)
  type: text("type").notNull(), // 'income' | 'expense'
  movementType: text("movement_type").notNull().default("normal"), // 'normal' | 'balance_adjustment' | 'withdrawal' | 'initial_balance'
  description: text("description").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  subcategoryId: varchar("subcategory_id").references(() => categories.id), // Subcategoria
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }), // Valor bruto (para cartões)
  fees: decimal("fees", { precision: 10, scale: 2 }), // Taxas (cartão, etc.)
  paymentMethod: text("payment_method").notNull(), // 'money', 'pix', 'credit_card', 'debit_card', 'boleto', 'transfer'
  account: text("account").notNull(), // Conta bancária ou caixa
  status: text("status").notNull().default("confirmed"), // 'confirmed' | 'pending' | 'overdue'
  document: text("document"), // NF, recibo, contrato
  costCenter: text("cost_center"), // Centro de custo: obra, loja, projeto
  recurrence: text("recurrence"), // 'monthly', 'weekly', 'none'
  dueDate: date("due_date"), // Data de vencimento (para contas a pagar)
  actualDate: date("actual_date"), // Data real do pagamento/recebimento
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: varchar("user_id").references(() => users.id),
  companyId: varchar("company_id").references(() => companies.id),
});

// Balance Adjustments (Ajustes de Saldo)
export const balanceAdjustments = pgTable("balance_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  balanceType: text("balance_type").notNull(), // 'initial' | 'final'
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  account: text("account").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: varchar("user_id").references(() => users.id),
});

export const insertCashFlowEntrySchema = createInsertSchema(cashFlowEntries).omit({ id: true, createdAt: true });
export type InsertCashFlowEntry = z.infer<typeof insertCashFlowEntrySchema>;
export type CashFlowEntry = typeof cashFlowEntries.$inferSelect;

export const insertBalanceAdjustmentSchema = createInsertSchema(balanceAdjustments).omit({ id: true, createdAt: true });
export type InsertBalanceAdjustment = z.infer<typeof insertBalanceAdjustmentSchema>;
export type BalanceAdjustment = typeof balanceAdjustments.$inferSelect;
export interface DailyMovement {
  id: string;
  date: string;
  competenceDate?: string; // Data de competência
  type: 'income' | 'expense';
  movementType: 'normal' | 'balance_adjustment' | 'withdrawal' | 'initial_balance';
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  amount: number;
  grossAmount?: number; // Valor bruto
  lateFees?: number; // Juros/Multa
  discount?: number; // Descontos
  fees?: number; // Taxas (cartão, etc.)
  paymentMethod: string;
  account: string;
  status: 'confirmed' | 'pending' | 'overdue';
  document?: string;
  costCenter?: string;
  recurrence?: string;
  dueDate?: string;
  actualDate?: string;
  createdAt: string;
}

export interface CashFlowKPIs {
  averageBalance: number;
  incomeVsExpense: number;
  delinquencyRate: number;
  immediateLiquidity: number;
  burnRate: number;
}

export interface CashFlowAlert {
  id: string;
  type: 'negative_balance' | 'overdue_account' | 'late_receipt';
  message: string;
  severity: 'low' | 'medium' | 'high';
  date: string;
  relatedId?: string;
}

// Companies (Empresas)
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(), // Nome fantasia
  razaoSocial: text("razao_social").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  telefone: text("telefone"),
  email: text("email"),
  endereco: text("endereco"),
  status: text("status").notNull().default("ativa"), // 'ativa' | 'inativa'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Notes (Anotações)
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"),
  favorite: boolean("favorite").default(false),
  color: text("color").default("default"), // 'default', 'red', 'green', 'blue', 'yellow', 'purple'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// Sessions
export const userSessions = pgTable("user_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(), // json stored as text/json
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// Financial Goals (Metas Financeiras)
export const financialGoals = pgTable("financial_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income_total' | 'expense_total' | 'category' | 'mrr' | 'churn' | 'cac' | 'ltv' | 'burn_rate'
  targetAmount: decimal("target_amount", { precision: 15, scale: 2 }).notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  level: text("level").notNull().default("basic"), // 'basic' | 'intermediate' | 'advanced'
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFinancialGoalSchema = createInsertSchema(financialGoals).omit({ id: true, createdAt: true });
export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;
export type FinancialGoal = typeof financialGoals.$inferSelect;

// Bank Accounts (Contas Bancárias)
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  bank: text("bank"),
  agency: text("agency"),
  account: text("account"),
  type: text("type"), // 'checking', 'savings', 'cash'
  companyId: varchar("company_id").references(() => companies.id),
  active: boolean("active").default(true),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true });
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

// Payment Configs (Taxas e Máquinas)
export const paymentConfigs = pgTable("payment_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'card_machine', 'pix_direct', 'gateway'
  bankAccountId: varchar("bank_account_id").references(() => bankAccounts.id),
  feeDebit: decimal("fee_debit", { precision: 5, scale: 2 }).default("0"),
  feeCredit: decimal("fee_credit", { precision: 5, scale: 2 }).default("0"),
  feePix: decimal("fee_pix", { precision: 5, scale: 2 }).default("0"),
  companyId: varchar("company_id").references(() => companies.id),
  active: boolean("active").default(true),
});

export const insertPaymentConfigSchema = createInsertSchema(paymentConfigs).omit({ id: true });
export type InsertPaymentConfig = z.infer<typeof insertPaymentConfigSchema>;
export type PaymentConfig = typeof paymentConfigs.$inferSelect;

export interface FinancialGoalProgress extends FinancialGoal {
  currentAmount: number;
  percentage: number;
}

export interface CashFlowSummary {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  projectedBalance: number;
}

