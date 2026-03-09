-- Script SQL para adicionar a coluna original_due_date na tabela accounts_payable
-- Execute este script no PostgreSQL para aplicar a alteração

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'accounts_payable' 
        AND column_name = 'original_due_date'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE accounts_payable 
        ADD COLUMN original_due_date text;
        
        -- Adicionar comentário
        COMMENT ON COLUMN accounts_payable.original_due_date 
        IS 'Guarda a data de vencimento original quando o pagamento ocorre em data diferente da data prevista';
        
        RAISE NOTICE 'Coluna original_due_date adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna original_due_date já existe na tabela accounts_payable';
    END IF;
END $$;
