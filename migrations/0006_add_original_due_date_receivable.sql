-- Adicionar coluna original_due_date na tabela accounts_receivable
-- Esta coluna guarda a data de vencimento original quando o recebimento ocorre em data diferente

ALTER TABLE accounts_receivable
ADD COLUMN IF NOT EXISTS original_due_date text;

-- Comentário na coluna (PostgreSQL)
COMMENT ON COLUMN accounts_receivable.original_due_date IS 'Guarda a data de vencimento original quando o recebimento ocorre em data diferente da data prevista';
