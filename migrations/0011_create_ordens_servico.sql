-- Módulo de Ordens de Serviço

CREATE TABLE IF NOT EXISTS ordens_servico (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  orcamento_id VARCHAR REFERENCES orcamentos(id),
  client_id VARCHAR REFERENCES clients(id),
  vendedor_id VARCHAR REFERENCES users(id),
  company_id VARCHAR REFERENCES companies(id),
  data_abertura DATE NOT NULL,
  data_prevista_conclusao DATE,
  data_conclusao DATE,
  prioridade TEXT NOT NULL DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
  status TEXT NOT NULL DEFAULT 'aberta', -- 'aberta', 'em_andamento', 'aguardando_peca', 'aguardando_aprovacao', 'concluida', 'cancelada'
  descricao_problema TEXT NOT NULL,
  diagnostico TEXT,
  solucao TEXT,
  observacoes TEXT,
  valor_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_mao_obra DECIMAL(15, 2) DEFAULT 0,
  valor_pecas DECIMAL(15, 2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ordem_servico_itens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id VARCHAR NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  produto_codigo TEXT,
  produto_descricao TEXT NOT NULL,
  unidade TEXT DEFAULT 'UN',
  quantidade DECIMAL(10, 2) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  desconto_valor DECIMAL(15, 2) DEFAULT 0,
  subtotal DECIMAL(15, 2) NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'servico' -- 'servico', 'peca', 'acessorio'
);

CREATE TABLE IF NOT EXISTS historico_ordem_servico (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id VARCHAR NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  usuario_id VARCHAR REFERENCES users(id),
  acao TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ordem_servico_anexos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id VARCHAR NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  url_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT,
  descricao TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_company ON ordens_servico(company_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_client ON ordens_servico(client_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_orcamento ON ordens_servico(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_ordem_servico_itens_ordem ON ordem_servico_itens(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_historico_ordem_servico_ordem ON historico_ordem_servico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_ordem_servico_anexos_ordem ON ordem_servico_anexos(ordem_servico_id);
