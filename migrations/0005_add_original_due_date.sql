-- Adicionar coluna original_due_date na tabela accounts_payable
-- Esta coluna guarda a data de vencimento original quando o pagamento ocorre em data diferente

ALTER TABLE accounts_payable 
ADD COLUMN IF NOT EXISTS original_due_date text;

-- Comentário na coluna (PostgreSQL)
COMMENT ON COLUMN accounts_payable.original_due_date IS 'Guarda a data de vencimento original quando o pagamento ocorre em data diferente da data prevista';
