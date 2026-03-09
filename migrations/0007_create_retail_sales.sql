-- Criar tabela de vendas de varejo (retail_sales)
-- Esta tabela armazena as vendas do dia que aparecem automaticamente no fluxo de caixa

CREATE TABLE IF NOT EXISTS retail_sales (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2),
  payment_method TEXT NOT NULL,
  account TEXT NOT NULL,
  category_id VARCHAR REFERENCES categories(id),
  client_name TEXT,
  document TEXT,
  cost_center TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  cash_flow_entry_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id VARCHAR REFERENCES users(id),
  company_id VARCHAR REFERENCES companies(id),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Comentários na tabela e colunas
COMMENT ON TABLE retail_sales IS 'Tabela para armazenar vendas de varejo do dia';
COMMENT ON COLUMN retail_sales.date IS 'Data da venda';
COMMENT ON COLUMN retail_sales.description IS 'Descrição ou produto vendido';
COMMENT ON COLUMN retail_sales.amount IS 'Valor total da venda';
COMMENT ON COLUMN retail_sales.payment_method IS 'Forma de pagamento: money, pix, credit_card, debit_card, transfer';
COMMENT ON COLUMN retail_sales.account IS 'Conta ou caixa onde o dinheiro foi registrado';
COMMENT ON COLUMN retail_sales.cash_flow_entry_id IS 'Referência ao lançamento no fluxo de caixa (criado automaticamente)';
