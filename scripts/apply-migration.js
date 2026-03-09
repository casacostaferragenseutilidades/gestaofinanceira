/**
 * Script para aplicar a alteração da coluna original_due_date
 * na tabela accounts_payable
 * 
 * Este script pode ser executado via Node.js para aplicar
 * a migração em qualquer ambiente
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'accounts_payable' 
      AND column_name = 'original_due_date';
    `;
    
    const result = await client.query(checkColumnQuery);
    
    if (result.rows.length > 0) {
      console.log('✓ Coluna original_due_date já existe na tabela accounts_payable');
    } else {
      // Adicionar a coluna
      const addColumnQuery = `
        ALTER TABLE accounts_payable 
        ADD COLUMN original_due_date text;
      `;
      
      await client.query(addColumnQuery);
      console.log('✓ Coluna original_due_date adicionada com sucesso');
      
      // Adicionar comentário
      const commentQuery = `
        COMMENT ON COLUMN accounts_payable.original_due_date 
        IS 'Guarda a data de vencimento original quando o pagamento ocorre em data diferente da data prevista';
      `;
      
      await client.query(commentQuery);
      console.log('✓ Comentário adicionado à coluna');
    }

    console.log('\n✅ Migração aplicada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
