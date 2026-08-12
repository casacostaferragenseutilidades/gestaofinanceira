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

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = {
  id?: string;
  username: string;
  email?: string | null;
  password?: string | null;
  name?: string | null;
  fullName?: string | null;
  role?: string | null;
  team?: string | null;
  status?: string | null;
  active?: boolean | null;
};
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

export const insertSupplierSchema = createInsertSchema(suppliers);
export type InsertSupplier = {
  id?: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  contact?: string | null;
  address?: string | null;
  active?: boolean | null;
};
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

export const insertClientSchema = createInsertSchema(clients);
export type InsertClient = {
  id?: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active?: boolean | null;
};
export type Client = typeof clients.$inferSelect;

// Categories (Categorias)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  dreCategory: text("dre_category"), // 'revenue' | 'deductions' | 'costs' | 'operational_expenses'
  color: text("color"), // 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'pink' | 'orange' | 'cyan' | 'indigo' | 'gray'
});

export const insertCategorySchema = createInsertSchema(categories);
export type InsertCategory = {
  id?: string;
  name: string;
  type: string;
  dreCategory?: string | null;
  color?: string | null;
};
export type Category = typeof categories.$inferSelect;

// Cost Centers (Centros de Custo)
export const costCenters = pgTable("cost_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertCostCenterSchema = createInsertSchema(costCenters);
export type InsertCostCenter = {
  id?: string;
  name: string;
  description?: string | null;
};
export type CostCenter = typeof costCenters.$inferSelect;

// Accounts Payable (Contas a Pagar)
export const accountsPayable = pgTable("accounts_payable", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: text("due_date").notNull(),
  originalDueDate: text("original_due_date"), // Guarda a data original quando o pagamento ocorre em data diferente
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

export const insertAccountPayableSchema = createInsertSchema(accountsPayable);
export type InsertAccountPayable = {
  id?: string;
  description: string;
  amount: string;
  dueDate: string;
  originalDueDate?: string | null;
  paymentDate?: string | null;
  status?: string;
  supplierId?: string | null;
  categoryId?: string | null;
  costCenterId?: string | null;
  paymentMethod?: string | null;
  lateFees?: string | null;
  discount?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
  recurrence?: string | null;
  recurrenceEnd?: string | null;
  companyId?: string | null;
  active?: boolean;
};
export type AccountPayable = typeof accountsPayable.$inferSelect & { categoryName?: string; supplierName?: string };

// Accounts Receivable (Contas a Receber)
export const accountsReceivable = pgTable("accounts_receivable", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  saleDate: text("sale_date"),
  dueDate: text("due_date").notNull(),
  originalDueDate: text("original_due_date"), // Guarda a data original quando o recebimento ocorre em data diferente
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

export const insertAccountReceivableSchema = createInsertSchema(accountsReceivable);
export type InsertAccountReceivable = {
  id?: string;
  description: string;
  amount: string;
  saleDate?: string | null;
  dueDate: string;
  originalDueDate?: string | null;
  receivedDate?: string | null;
  status?: string;
  clientId?: string | null;
  categoryId?: string | null;
  notes?: string | null;
  mercadoPagoId?: string | null;
  discount?: string | null;
  recurrence?: string | null;
  recurrencePeriod?: string | null;
  paymentMethod?: string | null;
  companyId?: string | null;
  active?: boolean;
};
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

export const insertCardTransactionSchema = createInsertSchema(cardTransactions);
export type InsertCardTransaction = {
  id?: string;
  saleDate: string;
  paymentMethod: string;
  grossAmount: string;
  feePercentage: string;
  netAmount: string;
  transactionNumber?: string | null;
  status?: string;
  settlementDate?: string | null;
  notes?: string | null;
  companyId?: string | null;
  active?: boolean;
};
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

export const insertMercadoPagoTransactionSchema = createInsertSchema(mercadoPagoTransactions);
export type InsertMercadoPagoTransaction = {
  id?: string;
  externalId: string;
  description?: string | null;
  amount: string;
  fee?: string | null;
  netAmount?: string | null;
  transactionDate: string;
  status: string;
  reconciled?: boolean;
  accountReceivableId?: string | null;
};
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

export const insertCashFlowEntrySchema = createInsertSchema(cashFlowEntries);
export type InsertCashFlowEntry = {
  id?: string;
  date: string;
  competenceDate?: string | null;
  type: string;
  movementType?: string;
  description: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  amount: string;
  grossAmount?: string | null;
  fees?: string | null;
  paymentMethod: string;
  account: string;
  status?: string;
  document?: string | null;
  costCenter?: string | null;
  recurrence?: string | null;
  dueDate?: string | null;
  actualDate?: string | null;
  userId?: string | null;
  companyId?: string | null;
};
export type CashFlowEntry = typeof cashFlowEntries.$inferSelect;

export const insertBalanceAdjustmentSchema = createInsertSchema(balanceAdjustments);
export type InsertBalanceAdjustment = {
  id?: string;
  date: string;
  balanceType: string;
  description: string;
  amount: string;
  account: string;
  userId?: string | null;
};
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

export const insertCompanySchema = createInsertSchema(companies);
export type InsertCompany = {
  id?: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  status?: string;
};
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

export const insertNoteSchema = createInsertSchema(notes);
export type InsertNote = {
  id?: string;
  title: string;
  content?: string | null;
  favorite?: boolean | null;
  color?: string | null;
};
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

export const insertFinancialGoalSchema = createInsertSchema(financialGoals);
export type InsertFinancialGoal = {
  id?: string;
  name: string;
  type: string;
  targetAmount: string;
  month: number;
  year: number;
  categoryId?: string | null;
  level?: string;
  active?: boolean;
};
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

export const insertBankAccountSchema = createInsertSchema(bankAccounts);
export type InsertBankAccount = {
  id?: string;
  name: string;
  bank?: string | null;
  agency?: string | null;
  account?: string | null;
  type?: string | null;
  companyId?: string | null;
  active?: boolean | null;
};
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

export const insertPaymentConfigSchema = createInsertSchema(paymentConfigs);
export type InsertPaymentConfig = {
  id?: string;
  name: string;
  type: string;
  bankAccountId?: string | null;
  feeDebit?: string | null;
  feeCredit?: string | null;
  feePix?: string | null;
  companyId?: string | null;
  active?: boolean | null;
};
export type PaymentConfig = typeof paymentConfigs.$inferSelect;

// Retail Sales (Vendas de Varejo)
export const retailSales = pgTable("retail_sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(), // Data da venda
  type: text("type").notNull().default("income"), // 'income' | 'expense'
  description: text("description").notNull(), // Descrição/Produto vendido
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Valor da venda
  quantity: integer("quantity").default(1), // Quantidade vendida
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }), // Preço unitário
  paymentMethod: text("payment_method").notNull(), // 'money', 'pix', 'credit_card', 'debit_card', 'transfer', 'other'
  account: text("account").notNull(), // Conta/Caixa onde entrou o dinheiro
  categoryId: varchar("category_id").references(() => categories.id), // Categoria da venda
  clientName: text("client_name"), // Nome do cliente (opcional)
  document: text("document"), // NF ou Cupom Fiscal
  costCenter: text("cost_center"), // Loja/PDV
  notes: text("notes"), // Observações
  status: text("status").notNull().default("confirmed"), // 'confirmed' | 'cancelled'
  cashFlowEntryId: varchar("cash_flow_entry_id"), // Referência ao lançamento no fluxo de caixa
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: varchar("user_id").references(() => users.id),
  companyId: varchar("company_id").references(() => companies.id),
  active: boolean("active").notNull().default(true),
});

export const insertRetailSaleSchema = createInsertSchema(retailSales);
export type InsertRetailSale = {
  id?: string;
  date: string;
  type?: string;
  description: string;
  amount: string;
  quantity?: number | null;
  unitPrice?: string | null;
  paymentMethod: string;
  account: string;
  categoryId?: string | null;
  clientName?: string | null;
  document?: string | null;
  costCenter?: string | null;
  notes?: string | null;
  status?: string;
  cashFlowEntryId?: string | null;
  userId?: string | null;
  companyId?: string | null;
  active?: boolean;
};
export type RetailSale = typeof retailSales.$inferSelect;

// Orçamentos (Budgets/Quotes)
export const orcamentos = pgTable("orcamentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numero: integer("numero").notNull(),
  clientId: varchar("client_id").references(() => clients.id),
  vendedorId: varchar("vendedor_id").references(() => users.id),
  companyId: varchar("company_id").references(() => companies.id),
  data: date("data").notNull(),
  validade: date("validade").notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
  desconto: decimal("desconto", { precision: 15, scale: 2 }).default("0"),
  frete: decimal("frete", { precision: 15, scale: 2 }).default("0"),
  impostos: decimal("impostos", { precision: 15, scale: 2 }).default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("editing"),
  observacoes: text("observacoes"),
  condicoesPagamento: text("condicoes_pagamento"),
  descontoPercentual: decimal("desconto_percentual", { precision: 5, scale: 2 }).default("0"),
  descontoAprovado: boolean("desconto_aprovado").default(false),
  descontoAprovadoPor: varchar("desconto_aprovado_por").references(() => users.id),
  descontoMotivo: text("desconto_motivo"),
  accountReceivableId: varchar("account_receivable_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orcamentoItens = pgTable("orcamento_itens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orcamentoId: varchar("orcamento_id").references(() => orcamentos.id).notNull(),
  produtoCodigo: text("produto_codigo"),
  produtoDescricao: text("produto_descricao").notNull(),
  unidade: text("unidade").default("UN"),
  quantidade: decimal("quantidade", { precision: 10, scale: 2 }).notNull().default("1"),
  valorUnitario: decimal("valor_unitario", { precision: 15, scale: 2 }).notNull(),
  descontoPercentual: decimal("desconto_percentual", { precision: 5, scale: 2 }).default("0"),
  descontoValor: decimal("desconto_valor", { precision: 15, scale: 2 }).default("0"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
});

export const historicoOrcamento = pgTable("historico_orcamento", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orcamentoId: varchar("orcamento_id").references(() => orcamentos.id).notNull(),
  usuarioId: varchar("usuario_id").references(() => users.id),
  acao: text("acao").notNull(),
  descricao: text("descricao"),
  dataHora: timestamp("data_hora").defaultNow(),
});

// Notifications System
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'orcamento_expirado', 'orcamento_visualizado', 'orcamento_aprovado', 'orcamento_recusado', 'desconto_aprovado', 'orcamento_convertido'
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // ID do orçamento relacionado
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications);
export type InsertNotification = {
  id?: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string | null;
  read?: boolean;
};
export type Notification = typeof notifications.$inferSelect;

// Ordens de Serviço (Service Orders)
export const ordensServico = pgTable("ordens_servico", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numero: integer("numero").notNull(),
  orcamentoId: varchar("orcamento_id").references(() => orcamentos.id),
  clientId: varchar("client_id").references(() => clients.id),
  vendedorId: varchar("vendedor_id").references(() => users.id),
  companyId: varchar("company_id").references(() => companies.id),
  dataAbertura: date("data_abertura").notNull(),
  dataPrevistaConclusao: date("data_prevista_conclusao"),
  dataConclusao: date("data_conclusao"),
  prioridade: text("prioridade").notNull().default("normal"),
  status: text("status").notNull().default("aberta"),
  descricaoProblema: text("descricao_problema").notNull(),
  diagnostico: text("diagnostico"),
  solucao: text("solucao"),
  observacoes: text("observacoes"),
  valorTotal: decimal("valor_total", { precision: 15, scale: 2 }).notNull().default("0"),
  valorMaoObra: decimal("valor_mao_obra", { precision: 15, scale: 2 }).default("0"),
  valorPecas: decimal("valor_pecas", { precision: 15, scale: 2 }).default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordemServicoItens = pgTable("ordem_servico_itens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ordemServicoId: varchar("ordem_servico_id").references(() => ordensServico.id).notNull(),
  produtoCodigo: text("produto_codigo"),
  produtoDescricao: text("produto_descricao").notNull(),
  unidade: text("unidade").default("UN"),
  quantidade: decimal("quantidade", { precision: 10, scale: 2 }).notNull().default("1"),
  valorUnitario: decimal("valor_unitario", { precision: 15, scale: 2 }).notNull(),
  descontoPercentual: decimal("desconto_percentual", { precision: 5, scale: 2 }).default("0"),
  descontoValor: decimal("desconto_valor", { precision: 15, scale: 2 }).default("0"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  tipo: text("tipo").notNull().default("servico"),
});

export const historicoOrdemServico = pgTable("historico_ordem_servico", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ordemServicoId: varchar("ordem_servico_id").references(() => ordensServico.id).notNull(),
  usuarioId: varchar("usuario_id").references(() => users.id),
  acao: text("acao").notNull(),
  descricao: text("descricao"),
  dataHora: timestamp("data_hora").defaultNow(),
});

export const ordemServicoAnexos = pgTable("ordem_servico_anexos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ordemServicoId: varchar("ordem_servico_id").references(() => ordensServico.id).notNull(),
  nomeArquivo: text("nome_arquivo").notNull(),
  urlArquivo: text("url_arquivo").notNull(),
  tipoArquivo: text("tipo_arquivo"),
  descricao: text("descricao"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export type OrdemServicoStatus =
  | "aberta"
  | "em_andamento"
  | "aguardando_peca"
  | "aguardando_aprovacao"
  | "concluida"
  | "cancelada";

export type OrdemServicoPrioridade =
  | "baixa"
  | "normal"
  | "alta"
  | "urgente";

export type OrdemServicoItemTipo =
  | "servico"
  | "peca"
  | "acessorio";

export type OrdemServico = typeof ordensServico.$inferSelect;
export type InsertOrdemServico = {
  id?: string;
  numero?: number;
  orcamentoId?: string | null;
  clientId?: string | null;
  vendedorId?: string | null;
  companyId?: string | null;
  dataAbertura: string;
  dataPrevistaConclusao?: string | null;
  dataConclusao?: string | null;
  prioridade?: string;
  status?: string;
  descricaoProblema: string;
  diagnostico?: string | null;
  solucao?: string | null;
  observacoes?: string | null;
  valorTotal?: string;
  valorMaoObra?: string;
  valorPecas?: string;
  active?: boolean;
};

export type OrdemServicoItem = typeof ordemServicoItens.$inferSelect;
export type InsertOrdemServicoItem = {
  id?: string;
  ordemServicoId?: string;
  produtoCodigo?: string | null;
  produtoDescricao: string;
  unidade?: string;
  quantidade?: string;
  valorUnitario: string;
  descontoPercentual?: string;
  descontoValor?: string;
  subtotal?: string;
  tipo?: string;
};

export type HistoricoOrdemServico = typeof historicoOrdemServico.$inferSelect;
export type InsertHistoricoOrdemServico = {
  id?: string;
  ordemServicoId: string;
  usuarioId?: string | null;
  acao: string;
  descricao?: string | null;
};

export type OrdemServicoAnexo = typeof ordemServicoAnexos.$inferSelect;
export type InsertOrdemServicoAnexo = {
  id?: string;
  ordemServicoId: string;
  nomeArquivo: string;
  urlArquivo: string;
  tipoArquivo?: string | null;
  descricao?: string | null;
};

export type OrdemServicoWithRelations = OrdemServico & {
  clientName?: string;
  vendedorName?: string;
  companyName?: string;
  orcamentoNumero?: number;
  itens?: OrdemServicoItem[];
  historico?: HistoricoOrdemServico[];
  anexos?: OrdemServicoAnexo[];
};

export interface OrdemServicoDashboardStats {
  totalHoje: number;
  emAberto: number;
  emAndamento: number;
  aguardandoPeca: number;
  aguardandoAprovacao: number;
  concluidas: number;
  canceladas: number;
  valorTotal: number;
  rankingTecnicos: { tecnicoId: string; tecnicoName: string; total: number; count: number }[];
}

export const insertOrcamentoSchema = createInsertSchema(orcamentos);
export type InsertOrcamento = {
  id?: string;
  numero: number;
  clientId?: string | null;
  vendedorId?: string | null;
  companyId?: string | null;
  data: string;
  validade: string;
  subtotal?: string;
  desconto?: string | null;
  frete?: string | null;
  impostos?: string | null;
  total?: string;
  status?: string;
  observacoes?: string | null;
  condicoesPagamento?: string | null;
  descontoPercentual?: string | null;
  descontoAprovado?: boolean | null;
  descontoAprovadoPor?: string | null;
  descontoMotivo?: string | null;
  accountReceivableId?: string | null;
  active?: boolean;
};
export type Orcamento = typeof orcamentos.$inferSelect;

export const insertOrcamentoItemSchema = createInsertSchema(orcamentoItens);
export type InsertOrcamentoItem = {
  id?: string;
  orcamentoId?: string;
  produtoCodigo?: string | null;
  produtoDescricao: string;
  unidade?: string | null;
  quantidade?: string;
  valorUnitario: string;
  descontoPercentual?: string | null;
  descontoValor?: string | null;
  subtotal: string;
};
export type OrcamentoItem = typeof orcamentoItens.$inferSelect;

export const insertHistoricoOrcamentoSchema = createInsertSchema(historicoOrcamento);
export type InsertHistoricoOrcamento = {
  id?: string;
  orcamentoId: string;
  usuarioId?: string | null;
  acao: string;
  descricao?: string | null;
};
export type HistoricoOrcamento = typeof historicoOrcamento.$inferSelect;

export type OrcamentoStatus =
  | "editing"
  | "saved"
  | "sent"
  | "viewed"
  | "negotiating"
  | "approved"
  | "rejected"
  | "expired"
  | "converted";

export type OrcamentoWithRelations = Orcamento & {
  clientName?: string;
  vendedorName?: string;
  companyName?: string;
  itens?: OrcamentoItem[];
  historico?: HistoricoOrcamento[];
};

export interface OrcamentoDashboardStats {
  totalHoje: number;
  valorTotal: number;
  aprovados: number;
  recusados: number;
  pendentes: number;
  taxaConversao: number;
  rankingVendedores: { vendedorId: string; vendedorName: string; total: number; count: number }[];
}

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
