-- Adicionar campo type na tabela retail_sales para distinguir entrada/saída
ALTER TABLE retail_sales ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'income';

-- Adicionar comentário na coluna
COMMENT ON COLUMN retail_sales.type IS 'Tipo de movimentação: income (entrada) ou expense (saída)';

-- Atualizar registros existentes para income (padrão)
UPDATE retail_sales SET type = 'income' WHERE type IS NULL;
