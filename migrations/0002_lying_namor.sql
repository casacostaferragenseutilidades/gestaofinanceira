CREATE TABLE "bank_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"bank" text,
	"agency" text,
	"account" text,
	"type" text,
	"company_id" varchar,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "card_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_date" text NOT NULL,
	"payment_method" text NOT NULL,
	"gross_amount" numeric(15, 2) NOT NULL,
	"fee_percentage" numeric(5, 2) NOT NULL,
	"net_amount" numeric(15, 2) NOT NULL,
	"transaction_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"settlement_date" text,
	"notes" text,
	"company_id" varchar,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"razao_social" text NOT NULL,
	"cnpj" text NOT NULL,
	"telefone" text,
	"email" text,
	"endereco" text,
	"status" text DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "historico_orcamento" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orcamento_id" varchar NOT NULL,
	"usuario_id" varchar,
	"acao" text NOT NULL,
	"descricao" text,
	"data_hora" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "historico_ordem_servico" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ordem_servico_id" varchar NOT NULL,
	"usuario_id" varchar,
	"acao" text NOT NULL,
	"descricao" text,
	"data_hora" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_id" varchar,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orcamento_itens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orcamento_id" varchar NOT NULL,
	"produto_codigo" text,
	"produto_descricao" text NOT NULL,
	"unidade" text DEFAULT 'UN',
	"quantidade" numeric(10, 2) DEFAULT '1' NOT NULL,
	"valor_unitario" numeric(15, 2) NOT NULL,
	"desconto_percentual" numeric(5, 2) DEFAULT '0',
	"desconto_valor" numeric(15, 2) DEFAULT '0',
	"subtotal" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orcamentos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer NOT NULL,
	"client_id" varchar,
	"vendedor_id" varchar,
	"company_id" varchar,
	"data" date NOT NULL,
	"validade" date NOT NULL,
	"subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"desconto" numeric(15, 2) DEFAULT '0',
	"frete" numeric(15, 2) DEFAULT '0',
	"impostos" numeric(15, 2) DEFAULT '0',
	"total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'editing' NOT NULL,
	"observacoes" text,
	"condicoes_pagamento" text,
	"desconto_percentual" numeric(5, 2) DEFAULT '0',
	"desconto_aprovado" boolean DEFAULT false,
	"desconto_aprovado_por" varchar,
	"desconto_motivo" text,
	"account_receivable_id" varchar,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ordem_servico_anexos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ordem_servico_id" varchar NOT NULL,
	"nome_arquivo" text NOT NULL,
	"url_arquivo" text NOT NULL,
	"tipo_arquivo" text,
	"descricao" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ordem_servico_itens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ordem_servico_id" varchar NOT NULL,
	"produto_codigo" text,
	"produto_descricao" text NOT NULL,
	"unidade" text DEFAULT 'UN',
	"quantidade" numeric(10, 2) DEFAULT '1' NOT NULL,
	"valor_unitario" numeric(15, 2) NOT NULL,
	"desconto_percentual" numeric(5, 2) DEFAULT '0',
	"desconto_valor" numeric(15, 2) DEFAULT '0',
	"subtotal" numeric(15, 2) NOT NULL,
	"tipo" text DEFAULT 'servico' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ordens_servico" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer NOT NULL,
	"orcamento_id" varchar,
	"client_id" varchar,
	"vendedor_id" varchar,
	"company_id" varchar,
	"data_abertura" date NOT NULL,
	"data_prevista_conclusao" date,
	"data_conclusao" date,
	"prioridade" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'aberta' NOT NULL,
	"descricao_problema" text NOT NULL,
	"diagnostico" text,
	"solucao" text,
	"observacoes" text,
	"valor_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"valor_mao_obra" numeric(15, 2) DEFAULT '0',
	"valor_pecas" numeric(15, 2) DEFAULT '0',
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"bank_account_id" varchar,
	"fee_debit" numeric(5, 2) DEFAULT '0',
	"fee_credit" numeric(5, 2) DEFAULT '0',
	"fee_pix" numeric(5, 2) DEFAULT '0',
	"company_id" varchar,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "retail_sales" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"type" text DEFAULT 'income' NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"quantity" integer DEFAULT 1,
	"unit_price" numeric(10, 2),
	"payment_method" text NOT NULL,
	"account" text NOT NULL,
	"category_id" varchar,
	"client_name" text,
	"document" text,
	"cost_center" text,
	"notes" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"cash_flow_entry_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar,
	"company_id" varchar,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD COLUMN "original_due_date" text;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD COLUMN "company_id" varchar;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD COLUMN "sale_date" text;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD COLUMN "original_due_date" text;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD COLUMN "company_id" varchar;--> statement-breakpoint
ALTER TABLE "cash_flow_entries" ADD COLUMN "company_id" varchar;--> statement-breakpoint
ALTER TABLE "financial_goals" ADD COLUMN "level" text DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_orcamento" ADD CONSTRAINT "historico_orcamento_orcamento_id_orcamentos_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_orcamento" ADD CONSTRAINT "historico_orcamento_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_ordem_servico" ADD CONSTRAINT "historico_ordem_servico_ordem_servico_id_ordens_servico_id_fk" FOREIGN KEY ("ordem_servico_id") REFERENCES "public"."ordens_servico"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_ordem_servico" ADD CONSTRAINT "historico_ordem_servico_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento_itens" ADD CONSTRAINT "orcamento_itens_orcamento_id_orcamentos_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_vendedor_id_users_id_fk" FOREIGN KEY ("vendedor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_desconto_aprovado_por_users_id_fk" FOREIGN KEY ("desconto_aprovado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordem_servico_anexos" ADD CONSTRAINT "ordem_servico_anexos_ordem_servico_id_ordens_servico_id_fk" FOREIGN KEY ("ordem_servico_id") REFERENCES "public"."ordens_servico"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordem_servico_itens" ADD CONSTRAINT "ordem_servico_itens_ordem_servico_id_ordens_servico_id_fk" FOREIGN KEY ("ordem_servico_id") REFERENCES "public"."ordens_servico"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_orcamento_id_orcamentos_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_vendedor_id_users_id_fk" FOREIGN KEY ("vendedor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_configs" ADD CONSTRAINT "payment_configs_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_configs" ADD CONSTRAINT "payment_configs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retail_sales" ADD CONSTRAINT "retail_sales_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retail_sales" ADD CONSTRAINT "retail_sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retail_sales" ADD CONSTRAINT "retail_sales_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;