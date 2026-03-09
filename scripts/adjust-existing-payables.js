/**
 * Script para ajustar lançamentos já pagos
 * Atualiza dueDate e originalDueDate quando paymentDate for diferente de dueDate
 * 
 * Este script processa contas já pagas e aplica a nova lógica de datas
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function adjustExistingPayables() {
  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados\n');

    // Buscar todas as contas pagas onde paymentDate é diferente de dueDate
    const findQuery = `
      SELECT id, description, due_date, payment_date, status
      FROM accounts_payable 
      WHERE status = 'paid' 
      AND payment_date IS NOT NULL 
      AND payment_date != due_date
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
      console.log(`Data de Pagamento: ${row.payment_date}`);
      console.log(`Nova Data de Vencimento: ${row.payment_date}`);
      console.log(`Data Original (será salva): ${row.due_date}`);
      console.log('─'.repeat(100));
    }

    console.log('\n⚠️  As alterações acima serão aplicadas ao banco de dados.\n');

    // Atualizar cada conta
    let updatedCount = 0;
    
    for (const row of result.rows) {
      const updateQuery = `
        UPDATE accounts_payable 
        SET due_date = payment_date,
            original_due_date = due_date
        WHERE id = $1
      `;
      
      await client.query(updateQuery, [row.id]);
      updatedCount++;
      console.log(`✓ Ajustada conta: ${row.description} (ID: ${row.id})`);
    }

    console.log(`\n✅ ${updatedCount} conta(s) ajustada(s) com sucesso!`);
    console.log('\nResumo das alterações:');
    console.log(`- dueDate atualizado para paymentDate`);
    console.log(`- originalDueDate guardado com a data de vencimento original`);
    
  } catch (error) {
    console.error('❌ Erro ao ajustar lançamentos:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

adjustExistingPayables();
