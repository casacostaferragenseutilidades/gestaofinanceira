-- Módulo de Orçamentos

CREATE TABLE IF NOT EXISTS orcamentos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  client_id VARCHAR REFERENCES clients(id),
  vendedor_id VARCHAR REFERENCES users(id),
  company_id VARCHAR REFERENCES companies(id),
  data DATE NOT NULL,
  validade DATE NOT NULL,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  desconto DECIMAL(15, 2) DEFAULT 0,
  frete DECIMAL(15, 2) DEFAULT 0,
  impostos DECIMAL(15, 2) DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'editing',
  observacoes TEXT,
  condicoes_pagamento TEXT,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  desconto_aprovado BOOLEAN DEFAULT FALSE,
  desconto_aprovado_por VARCHAR REFERENCES users(id),
  desconto_motivo TEXT,
  account_receivable_id VARCHAR,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orcamento_itens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id VARCHAR NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  produto_codigo TEXT,
  produto_descricao TEXT NOT NULL,
  unidade TEXT DEFAULT 'UN',
  quantidade DECIMAL(10, 2) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  desconto_valor DECIMAL(15, 2) DEFAULT 0,
  subtotal DECIMAL(15, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS historico_orcamento (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id VARCHAR NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  usuario_id VARCHAR REFERENCES users(id),
  acao TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_company ON orcamentos(company_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_client ON orcamentos(client_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);
