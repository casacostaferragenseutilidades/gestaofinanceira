/**
 * Script para ajustar lançamentos já recebidos (Contas a Receber)
 * Atualiza dueDate e originalDueDate quando receivedDate for diferente de dueDate
 * 
 * Este script processa contas já recebidas e aplica a nova lógica de datas
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function adjustExistingReceivables() {
  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados\n');

    // Buscar todas as contas recebidas onde receivedDate é diferente de dueDate
    const findQuery = `
      SELECT id, description, due_date, received_date, status
      FROM accounts_receivable 
      WHERE status = 'received' 
      AND received_date IS NOT NULL 
      AND received_date != due_date
      AND (original_due_date IS NULL OR original_due_date = '')
    `;
    
    const result = await client.query(findQuery);
    
    console.log(`📊 Encontradas ${result.rows.length} contas para ajustar\n`);
    
    if (result.rows.length === 0) {
      console.log('✅ Nenhuma conta precisa ser ajustada');
      return;
    }

    // Mostrar as contas que serão ajustadas
    console.log('Contas que serão ajustadas:');
    console.log('─'.repeat(100));
    
    for (const row of result.rows) {
      console.log(`ID: ${row.id}`);
      console.log(`Descrição: ${row.description}`);
      console.log(`Data de Vencimento Atual: ${row.due_date}`);
      console.log(`Data de Recebimento: ${row.received_date}`);
      console.log(`Nova Data de Vencimento: ${row.received_date}`);
      console.log(`Data Original (será salva): ${row.due_date}`);
      console.log('─'.repeat(100));
    }

    console.log('\n⚠️  As alterações acima serão aplicadas ao banco de dados.\n');

    // Atualizar cada conta
    let updatedCount = 0;
    
    for (const row of result.rows) {
      const updateQuery = `
        UPDATE accounts_receivable 
        SET due_date = received_date,
            original_due_date = due_date
        WHERE id = $1
      `;
      
      await client.query(updateQuery, [row.id]);
      updatedCount++;
      console.log(`✓ Ajustada conta: ${row.description} (ID: ${row.id})`);
    }

    console.log(`\n✅ ${updatedCount} conta(s) ajustada(s) com sucesso!`);
    console.log('\nResumo das alterações:');
    console.log(`- dueDate atualizado para receivedDate`);
    console.log(`- originalDueDate guardado com a data de vencimento original`);
    
  } catch (error) {
    console.error('❌ Erro ao ajustar lançamentos:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

adjustExistingReceivables();
